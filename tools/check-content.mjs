// Validates the hand-authored corpus. Run after ANY edit to words.js.
//   node tools/check-content.mjs
import { MORPHEMES } from '../js/content/morphemes.js';
import { WORD_SPECS, parseSpec } from '../js/content/words.js';
import { NOTES } from '../js/content/notes.js';
import { CHAPTERS } from '../js/content/story.js';
import { MISSIONS, missionEntries } from '../js/content/missions.js';
import { LOOKALIKE_SETS, setWords } from '../js/content/lookalikes.js';
import { DERIVED_LITS } from '../js/content/notes-derived.js';
import { readFileSync, existsSync } from 'node:fs';

const DICT = '/usr/share/dict/words';
// Real words the 1934 Webster's-derived system list simply predates or omits.
const ALLOWLIST = new Set(['propel', 'overreact', 'uncoordinated']);

const lexicon = existsSync(DICT)
  ? new Set(readFileSync(DICT, 'utf8').split('\n').map(w => w.toLowerCase()))
  : null;

/** Levenshtein, for judging whether look-alike members are actually alike. */
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1,
                         d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

const errors = [], warnings = [];
const seen = new Map();
const observedForms = new Map();   // morphemeId -> Set(surface)

for (const spec of WORD_SPECS) {
  const item = parseSpec(spec);

  for (const p of item.parts) {
    if (!MORPHEMES[p.m]) {
      errors.push(`${item.text}: unknown morpheme id "${p.m}" (in "${spec}")`);
      continue;
    }
    if (!observedForms.has(p.m)) observedForms.set(p.m, new Set());
    observedForms.get(p.m).add(p.surface);
  }

  if (item.cuts.length !== item.parts.length - 1)
    errors.push(`${item.text}: cut count mismatch`);

  if (lexicon && !lexicon.has(item.text) && !ALLOWLIST.has(item.text))
    errors.push(`NOT A WORD: "${item.text}"  <-  ${spec}`);

  if (seen.has(item.text))
    warnings.push(`duplicate headword "${item.text}": ${seen.get(item.text)} / ${spec}`);
  seen.set(item.text, spec);
}

// Every note must attach to a real headword, or Word Detective silently
// loses items.
for (const key of Object.keys(DERIVED_LITS)) {
  if (!seen.has(key)) errors.push(`DERIVED_LITS key "${key}" is not a headword — regenerate with tools/gen-notes.mjs`);
  if (NOTES[key]) warnings.push(`"${key}" has both a hand-written and a derived note; the hand-written one wins`);
}

for (const key of Object.keys(NOTES)) {
  if (!seen.has(key)) errors.push(`NOTES key "${key}" is not a headword in words.js`);
  if (!NOTES[key].lit) errors.push(`NOTES "${key}" has no lit phrase`);
}

// Spelling Slaughter words are curriculum content and get the same treatment:
// they must decompose exactly, resolve to real morphemes, and be real words.
let missionWords = 0;
const missionSeen = new Map();
for (const m of MISSIONS) {
  for (const rec of missionEntries(m)) {
    missionWords++;
    const item = parseSpec(rec.spec);
    for (const p of item.parts) {
      if (!MORPHEMES[p.m]) { errors.push(`${m.id} "${item.text}": unknown morpheme id "${p.m}"`); continue; }
      if (!observedForms.has(p.m)) observedForms.set(p.m, new Set());
      observedForms.get(p.m).add(p.surface);
    }
    if (lexicon && !lexicon.has(item.text) && !ALLOWLIST.has(item.text))
      errors.push(`${m.id}: NOT A WORD: "${item.text}"  <-  ${rec.spec}`);
    if (!rec.def)
      errors.push(`${m.id} "${item.text}": no definition — cold recall has nothing to prompt with`);
    if (rec.def && rec.def.toLowerCase().includes(item.text))
      errors.push(`${m.id} "${item.text}": the definition contains the word itself`);
    if (rec.display && rec.display.toLowerCase() !== item.text)
      errors.push(`${m.id} "${item.text}": display "${rec.display}" does not match the spelling`);
    if (missionSeen.has(item.text))
      warnings.push(`${m.id}: "${item.text}" appears twice in the mission list`);
    missionSeen.set(item.text, m.id);
  }
}

// Look-alike sets: every member must be a real word, members must be distinct,
// and a set prompted by MEANING must define every member — otherwise the item
// is unanswerable, since sound cannot separate homophones.
let lookalikeWords = 0;
for (const s of LOOKALIKE_SETS) {
  const ws = setWords(s);
  lookalikeWords += ws.length;
  if (ws.length < 2) errors.push(`look-alike set "${s.id}": needs at least two members`);
  const texts = ws.map(x => x.w);
  if (new Set(texts).size !== texts.length)
    errors.push(`look-alike set "${s.id}": duplicate member`);
  for (const x of ws) {
    if (lexicon && !lexicon.has(x.w.replace(/'/g, '')) && !ALLOWLIST.has(x.w))
      errors.push(`look-alike set "${s.id}": "${x.w}" is not a word`);
    if (s.prompt === 'meaning' && !x.def)
      errors.push(`look-alike set "${s.id}": "${x.w}" has no definition, but the set is prompted by meaning`);
  }
  // What actually makes a look-alike set work is not a shared first letter or
  // a shared ending — `precede/proceed` differ on exactly the ending, which is
  // the point of that set. It is that every member sits close enough to
  // another member that telling them apart requires reading the letters.
  for (const x of ws) {
    const nearest = Math.min(...texts.filter(t => t !== x.w).map(t => editDistance(x.w, t)));
    // Scaled by length: four edits apart is a lot in `cat`, and very little in
    // `conscience`.
    const limit = Math.max(2, Math.ceil(x.w.length * 0.4));
    if (nearest > limit)
      warnings.push(`look-alike set "${s.id}": "${x.w}" is ${nearest} edits from its nearest neighbour (limit ${limit} at ${x.w.length} letters) — too far to be confusable`);
  }
}

// A chapter gate must be a real, genuinely long word — the lock is the point.
for (const c of CHAPTERS) {
  const spec = seen.get(c.gate);
  if (!spec) errors.push(`chapter "${c.title}": gate word "${c.gate}" is not in the corpus`);
  else if (parseSpec(spec).parts.length < 3)
    errors.push(`chapter "${c.title}": gate word "${c.gate}" has fewer than 3 pieces`);
}
const gates = CHAPTERS.map(c => c.gate);
if (new Set(gates).size !== gates.length) errors.push('two chapters share a gate word');

// Morphemes that no word exercises are dead weight in the Codex.
const unused = Object.keys(MORPHEMES).filter(id => !observedForms.has(id));

const withStory = Object.values(NOTES).filter(n => n.note).length;
const totalNotes = new Set([...Object.keys(NOTES), ...Object.keys(DERIVED_LITS)]).size;
console.log(`words: ${WORD_SPECS.length}   morphemes: ${Object.keys(MORPHEMES).length}`);
console.log(`story: ${CHAPTERS.length} chapters, all gates verified`);
console.log(`spelling slaughter: ${MISSIONS.length} mission(s), ${missionWords} words`);
console.log(`look-alikes: ${LOOKALIKE_SETS.length} sets, ${lookalikeWords} words`);
console.log(`notes: ${totalNotes}/${WORD_SPECS.length} (${Object.keys(NOTES).length} hand-written, ${withStory} with stories, ${Object.keys(DERIVED_LITS).length} derived)`);
if (lexicon) console.log(`lexicon: ${DICT} (${lexicon.size} entries)`);
else console.log('lexicon: NOT FOUND — real-word check skipped');

if (unused.length) console.log(`\nunused morphemes (${unused.length}): ${unused.join(', ')}`);
const multi = [...observedForms].filter(([, s]) => s.size > 2)
  .map(([id, s]) => `${id}: ${[...s].join(' ')}`);
if (multi.length) console.log(`\nmorphemes with 3+ surface forms (${multi.length}):\n  ` + multi.join('\n  '));

if (warnings.length) {
  console.log(`\nwarnings (${warnings.length}):`);
  for (const w of warnings.slice(0, 40)) console.log('  ' + w);
  if (warnings.length > 40) console.log(`  ... ${warnings.length - 40} more`);
}
if (errors.length) {
  console.log(`\nERRORS (${errors.length}):`);
  for (const e of errors) console.log('  ' + e);
  process.exit(1);
}
console.log('\nOK — every word decomposes exactly and every morpheme id resolves.');
