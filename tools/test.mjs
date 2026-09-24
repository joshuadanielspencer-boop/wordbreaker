// Behavioural tests for the logic that decides what counts as evidence.
//   node tools/test.mjs
//
// check-content.mjs validates the CONTENT — that words decompose, that items
// are real, that the generated banks still hold. Nothing validated the code
// that reads that content and decides things: what counts as mastered, what
// gets retired, what a probe is allowed to serve, when a word is finished.
//
// Those decisions are the study. A regression in `wordStatus` or `soundsSame`
// produces no error, no visible symptom and no wrong pixel — it quietly writes
// the wrong thing into a record that is meant to answer a question about a
// child eight weeks from now. Three real bugs this month (a cancelled confirm
// that killed a probe, a sampler that could serve one nonsense word twice, and
// generated items whose answers did not say what the word says) were caught by
// luck or by driving the UI. That is not a repeatable way to find them.
//
// No framework on purpose: this project has no build step and no node_modules,
// and it is not going to grow either for a test runner.
//
// The browser globals are stubbed BEFORE anything is imported, which is why
// every import here is dynamic — static imports hoist above the stubs.

globalThis.speechSynthesis = {
  getVoices: () => [{ name: 'Samantha', lang: 'en-US', localService: true, default: true }],
  cancel() {}, speak() {},
};
globalThis.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };

// store.js survives without localStorage — it catches and warns — but the
// warnings then bury the only output that matters. A Map is enough.
const mem = new Map();
globalThis.localStorage = {
  getItem: k => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { mem.set(k, String(v)); },
  removeItem: k => { mem.delete(k); },
  clear: () => mem.clear(),
};

let passed = 0;
const failures = [];
let group = '';

const describe = name => { group = name; };
const ok = (cond, name, detail = '') => {
  if (cond) { passed++; return true; }
  failures.push(`${group} — ${name}${detail ? `\n      ${detail}` : ''}`);
  return false;
};
const eq = (actual, expected, name) =>
  ok(Object.is(actual, expected), name, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);

const store = await import('../js/core/store.js');
const speech = await import('../js/core/speech.js');
await speech.initSpeech();
ok(speech.speechAvailable(), 'harness: the speech stub is in place');

/** A clean profile per test, so nothing leaks between them. */
function profile() {
  const p = store.createProfile('Test');
  store.switchProfile(p.id);
  return p;
}
const DAY = 86400000;

// ---------------------------------------------------------------- phonics
{
  describe('phonics');
  const { soundsSame, pronunciations } = await import('../js/core/phonics.js');

  ok(soundsSame('frabe', 'fraib'), 'a different spelling that says the same thing is accepted');
  ok(!soundsSame('frabe', 'frab'), 'a spelling that says something else is rejected');

  // Both of these were wrong on the first pass and are documented as such.
  ok(soundsSame('thaice', 'thace'), 'a silent e after a vowel TEAM lengthens nothing');
  ok(!soundsSame('sperd', 'zperd'), 's is not /z/ before a consonant at the start');

  // The trap that produced false manipulation items: `chip` really can be read
  // /kip/, so answers must be matched on a word's primary reading only.
  ok([...pronunciations('chip')].includes('K.i.P'),
    'chip has a /kip/ reading — why generated answers match the primary only');
}

// ---------------------------------------------------------------- mastery
{
  describe('mastery');
  const { record, level, LEVEL, entry } = await import('../js/core/mastery.js');
  const id = 'port';

  profile();
  for (let i = 0; i < 20; i++) record(id, true, 1000);
  eq(level(id), LEVEL.SOLID, 'twenty right answers in one sitting reach SOLID');
  ok(level(id) !== LEVEL.BORING, 'cramming cannot reach BORING — spacing is a gate, not a bonus');

  // The same record, spread across three days, is allowed to retire.
  entry(id).days = ['2026-01-01', '2026-01-02', '2026-01-03'];
  eq(level(id), LEVEL.BORING, 'the same accuracy across three days does reach BORING');

  profile();
  for (let i = 0; i < 10; i++) record(id, i % 2 === 0, 1000);
  ok(level(id) < LEVEL.SOLID, 'half right does not count as solid');
}

// ---------------------------------------------------------------- fluency
{
  describe('fluency');
  const { WORD_LIST } = await import('../js/content/lexicon.js');
  const { boringItems } = await import('../js/core/fluency.js');
  const text = WORD_LIST[0].text;
  const attempt = (dayBack, ms, ok = true) =>
    ({ activity: 'autopsy', item: 'w:' + text, correct: ok, ms, t: Date.now() - dayBack * DAY });

  let p = profile();
  p.log = [attempt(4, 9000), attempt(3, 8000), attempt(2, 2000), attempt(1, 1800)];
  ok(boringItems().some(i => i.text === text), 'four spaced attempts, last three right and much faster, retires');

  // The entire point of the fluency layer.
  p = profile();
  p.log = [attempt(4, 9000), attempt(3, 8500), attempt(2, 8200), attempt(1, 8000)];
  ok(!boringItems().some(i => i.text === text), 'accurate but still slow does NOT retire');

  p = profile();
  p.log = [attempt(0, 1200), attempt(0, 1100), attempt(0, 1000), attempt(0, 900)];
  ok(!boringItems().some(i => i.text === text), 'four fast attempts in one day do not retire — cramming again');

  p = profile();
  p.log = [attempt(4, 9000), attempt(3, 2000, false), attempt(2, 1900), attempt(1, 1800)];
  ok(!boringItems().some(i => i.text === text), 'a recent miss blocks retirement');
}

// ------------------------------------------------------------------ probe
{
  describe('probe');
  const probe = await import('../js/core/probe.js');
  const { PATTERN_ORDER } = await import('../js/content/nonsense.js');

  const dec = new Set(PATTERN_ORDER.flatMap(p => probe.reserved(probe.DECODING, p)));
  const spl = new Set(PATTERN_ORDER.flatMap(p => probe.reserved(probe.SPELLING, p)));
  ok([...dec].every(w => !spl.has(w)),
    'the two probe pools are disjoint — a word read aloud must never come back to be spelled');
  eq(probe.heldOut().size, dec.size + spl.size, 'held-out is exactly the union of the two pools');

  profile();
  const run = probe.probeItems(probe.DECODING);
  eq(run.length, PATTERN_ORDER.length * 2, 'a probe is two items per pattern, every time');
  eq(new Set(run.map(i => i.word.text)).size, run.length, 'no word appears twice in one probe');
  ok(run.every(i => probe.heldOut().has(i.word.text)), 'every probe item comes from the held-out pool');
  eq(run.map(i => i.pattern).join(','), PATTERN_ORDER.flatMap(p => [p, p]).join(','),
    'the composition is fixed and in ladder order — difficulty never adapts');

  // A spent item is never served again: predictions.md requires fresh items.
  const spent = run[0].word.text;
  store.load().log = run.map(i => ({
    activity: probe.DECODING, item: i.word.id, correct: true, ms: 1000,
    t: Date.now(), detail: { target: i.word.text, probeId: 'x' },
  }));
  ok(!probe.probeItems(probe.DECODING).some(i => i.word.text === spent),
    'a word used in one probe never appears in the next');
}

// ---------------------------------------------------------------- mission
{
  describe('mission');
  const mission = await import('../js/core/mission.js');
  const { missionList } = await import('../js/content/lexicon.js');
  const m = missionList()[0];
  const w = m.words[0];
  const clean = (dayBack, mode) => ({
    activity: 'recall', item: 'm:' + w.text, correct: true, ms: 3000,
    t: Date.now() - dayBack * DAY, detail: { clean: true, mode, given: w.text },
  });

  let p = profile();
  ok(!mission.wordStatus(w.text).slaughtered, 'an untouched word is not finished');

  p = profile();
  p.log = [clean(2, 'sound'), clean(1, 'sound')];
  ok(!mission.wordStatus(w.text).slaughtered,
    'two clean days by SOUND alone is not finished — a speller who can only go from sound has memorised a noise');

  p = profile();
  p.log = [clean(2, 'sound'), clean(1, 'meaning')];
  ok(mission.wordStatus(w.text).slaughtered, 'two clean days by both routes finishes it');

  p = profile();
  p.log = [clean(1, 'sound'), clean(1, 'meaning')];
  ok(!mission.wordStatus(w.text).slaughtered, 'both routes on the SAME day is not two days');

  // Meaning mode must never be scheduled before the definition has been shown.
  p = profile();
  p.log = [
    { activity: 'autopsy', item: 'm:' + w.text, correct: true, ms: 2000, t: Date.now() - 2 * DAY, detail: { defShown: false } },
    { activity: 'spell', item: 'm:' + w.text, correct: true, ms: 2000, t: Date.now() - DAY, detail: { clean: true, defShown: false } },
  ];
  const modes = new Set();
  for (let i = 0; i < 30; i++) {
    const step = mission.drillQueue(m.id, 60).find(s => s.word.text === w.text && s.activity === 'recall');
    if (step) modes.add(step.mode);
  }
  ok(!modes.has('meaning'),
    'meaning mode is never offered before the definition was taught',
    `saw modes: ${[...modes].join(', ') || 'none'}`);

  p.log.push({ activity: 'spell', item: 'm:' + w.text, correct: true, ms: 2000, t: Date.now(), detail: { clean: true, defShown: true } });
  eq(mission.wordStatus(w.text).defSeen, 1, 'a stage that showed the definition is counted');

  // Review is only the words that actually went wrong.
  p = profile();
  p.log = [{ activity: 'spell', item: 'm:' + w.text, correct: false, ms: 5000, t: Date.now() - DAY, detail: { given: 'wrong', clean: false } }];
  const review = mission.reviewQueue(m.id, 10);
  ok(review.length > 0 && review.every(s => s.word.text === w.text),
    'review drills only the missed word');
  ok(review[0].activity === 'spell', 'review re-teaches before it re-tests');
  eq(mission.missedCount(m.id), 1, 'one word is counted as missed');
}

// ------------------------------------------------------- the nonsense drills
{
  describe('nonsense drills');
  const { dictationItems } = await import('../js/core/nonsensedrills.js');
  const probe = await import('../js/core/probe.js');

  profile();
  const items = dictationItems(2);
  eq(items.length, 2, 'two dictation items are offered');
  eq(new Set(items.map(i => i.word.text)).size, 2,
    'the same nonsense word is never served twice in one session');
  ok(items.every(i => !probe.heldOut().has(i.word.text)),
    'practice never touches a measurement item');
}

// ----------------------------------------------------------- sound swap
{
  describe('sound swap');
  const drills = await import('../js/core/manipdrills.js');
  const { MANIP_ORDER } = await import('../js/content/manipulation.js');

  profile();
  const picked = drills.manipulationItems(2);
  eq(picked.length, 2, 'two items are offered');
  eq(picked[0].level, MANIP_ORDER[0], 'a new learner starts on the easiest rung');
  ok(picked.every(i => typeof i.target === 'string' && i.target.length > 0),
    'each item carries the spoken word as a plain string');
  ok(picked.every(i => i.word && i.word.text === i.target),
    'and a word-shaped object for the session loop');

  store.load().log = picked.map(i => ({
    activity: 'manipulate', item: i.word.id, correct: true, ms: 3000,
    t: Date.now(), detail: { item: i.id, level: i.level },
  }));
  const next = drills.manipulationItems(2);
  ok(next.every(i => !picked.some(q => q.id === i.id)),
    'a used item never comes back — he would remember the answer');
}

// -------------------------------------------------------------- backups
{
  describe('backups');
  const p = profile();
  ok(store.backupStatus().never, 'a new profile has never been backed up');
  ok(!store.backupStatus().stale, 'and is not nagged about it on day one');

  p.sessions = [{}, {}, {}];
  ok(store.backupStatus().stale, 'three sessions with no backup at all is stale');

  store.markBackedUp();
  ok(!store.backupStatus().stale, 'saving a copy clears it');
  eq(store.backupStatus().sessions, 0, 'and resets the session count');

  // The case counting sessions alone could never catch.
  p.lastBackupTime = Date.now() - 20 * DAY;
  ok(store.backupStatus().stale, 'twenty days without a backup is stale even with no new sessions');
}

// -------------------------------------------------------- typed-in lists
{
  describe('spelling lists typed in by an adult');
  const ul = await import('../js/core/userlists.js');
  const lex = await import('../js/content/lexicon.js');
  const mission = await import('../js/core/mission.js');

  profile();

  eq(ul.proposeSpec('transportation').spec, 'trans|port|ation:tion',
    'a word the corpus already knows keeps its exact decomposition');
  eq(ul.proposeSpec('yacht').spec, 'yacht:whole',
    'a word with no seams the app knows is kept whole, not cut somewhere plausible');

  ok(!ul.validateEntry({ word: 'adaptable', spec: 'ad|apt|abel' }).ok,
    'pieces that do not spell the word are refused');
  ok(!ul.validateEntry({ word: 'zzz', spec: 'zzz:nosuch' }).ok,
    'an unknown morpheme id is refused');
  ok(!ul.validateEntry({ word: 'cat', spec: 'cat:whole', def: 'a cat is small' }).ok,
    'a definition containing its own word is refused — it would give the answer away');
  ok(ul.validateEntry({ word: 'yacht', spec: 'yacht:whole', def: 'a sailing boat' }).ok,
    'a whole word with a clean definition is accepted');

  const before = lex.missionList().length;
  const bad = ul.saveList('Bad list', [
    { typed: 'yacht', word: 'yacht', spec: 'yacht:whole', def: 'a sailing boat' },
    { typed: 'adaptable', word: 'adaptable', spec: 'ad|apt|abel' },
  ]);
  ok(!bad.ok, 'a list with one bad word is refused');
  eq(lex.missionList().length, before, 'and nothing is stored — half a list is worse than none');

  const good = ul.saveList('Spelling List 9', [
    { typed: 'yacht', word: 'yacht', spec: 'yacht:whole', def: 'a sailing boat' },
    { typed: 'adaptable', word: 'adaptable', spec: 'ad|apt|able', def: 'able to change to fit' },
    { typed: 'beautiful', word: 'beautiful', spec: 'beautiful:whole' },
  ]);
  ok(good.ok, 'a clean list saves');
  eq(lex.missionList().length, before + 1, 'and becomes a mission like any other');

  const mine = lex.missionList().find(m => m.id === good.id);
  eq(mine.words.length, 3, 'every word came through');
  eq(mine.words.find(w => w.text === 'adaptable').def, 'able to change to fit',
    'definitions typed on the same line are carried');
  eq(ul.needingDefinitions(good.id).join(','), 'beautiful',
    'a word with no meaning is reported, not silently finished-proof');

  // A word with no seams must never be sent to the autopsy.
  const q = mission.drillQueue(good.id, 12);
  ok(!q.some(x => x.word.text === 'yacht' && x.activity === 'autopsy'),
    'a whole word is never sent to the autopsy — there is no seam to find');
  ok(q.some(x => x.word.text === 'adaptable' && x.activity === 'autopsy'),
    'a word that does come apart still gets one');

  // Corrupt data must not take an activity down mid-session. The warning it
  // prints is the point, so it is silenced here rather than left to look like
  // a failure in the build log.
  const warn = console.warn; console.warn = () => {};
  store.load().missions.push({
    id: 'broken', name: 'Broken', subtitle: '', groups: [{ label: 'x', words: [{ spec: 'zz:nosuch', def: 'x' }] }],
  });
  store.load().missionsRev++;
  const broken = lex.missionList().find(m => m.id === 'broken');
  eq(broken.words.length, 0, 'a word with an unknown morpheme is dropped rather than crashing an activity');
  console.warn = warn;
}

// ------------------------------------------------------------------ report
console.log(`tests: ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log('\nFAILED:');
  for (const f of failures) console.log('  ' + f);
  process.exit(1);
}
