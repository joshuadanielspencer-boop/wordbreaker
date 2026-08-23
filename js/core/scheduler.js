// Session planner.
//
// Picks what the learner sees, in what order. Bias is toward morphemes that are
// shaky or developing, with spaced review of solid ones and a slow trickle of
// new material. Sessions are short by design: the failure mode to avoid is
// not "too little practice", it is "he stops opening it".

import { MORPH, WORD_LIST, DETECTIVE, PSEUDO, drillableMorphemes } from '../content/lexicon.js';
import { level, LEVEL, entry } from './mastery.js';
import { itemHistory } from './log.js';

const MIX = { weak: 0.55, review: 0.25, fresh: 0.20 };

// Repeating shape of the main block. Autopsy is the workhorse; the other two
// break up the rhythm and hit different things.
const MAIN_CYCLE = ['autopsy', 'equation', 'autopsy', 'detective'];

function shuffle(a, rand = Math.random) {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Split the teachable set by mastery level. */
export function buckets() {
  const t = drillableMorphemes();
  const b = { weak: [], review: [], fresh: [] };
  for (const m of t) {
    const l = level(m.id);
    if (l === LEVEL.UNSEEN) b.fresh.push(m);
    else if (l <= LEVEL.DEVELOPING) b.weak.push(m);
    else b.review.push(m);
  }
  return b;
}

/** Choose the morphemes this session is actually about. */
export function targetMorphemes(count = 6) {
  const b = buckets();
  const pick = [];
  const take = (arr, n) => {
    for (const m of arr.slice(0, n)) pick.push(m.id);
  };

  // Weakest first, then longest-unseen review, then new material in
  // family-size order so the highest-yield roots arrive earliest.
  const weak = b.weak.sort((x, y) =>
    (entry(x.id).recent.reduce((a, c) => a + c, 0) / (entry(x.id).n || 1)) -
    (entry(y.id).recent.reduce((a, c) => a + c, 0) / (entry(y.id).n || 1)));
  const review = b.review.sort((x, y) => entry(x.id).lastSeen - entry(y.id).lastSeen);
  const fresh = b.fresh.sort((x, y) => y.family.length - x.family.length);

  take(weak, Math.round(count * MIX.weak));
  take(review, Math.round(count * MIX.review));
  take(fresh, Math.max(1, Math.round(count * MIX.fresh)));

  // Backfill if a bucket was thin.
  for (const arr of [fresh, weak, review]) {
    for (const m of arr) {
      if (pick.length >= count) break;
      if (!pick.includes(m.id)) pick.push(m.id);
    }
  }
  return pick.slice(0, count);
}

/** Score a word for how well it serves the target set right now. */
function scoreWord(w, targets, history, maxLevel) {
  if (w.level > maxLevel) return -1;
  const hits = w.morphemes.filter(id => targets.includes(id)).length;
  if (!hits) return -1;
  const h = history.get(w.id);
  // Recently seen items are deprioritised but never permanently excluded —
  // repeated exposure is the whole point of fluency work.
  const staleness = h ? Math.min(1, (Date.now() - h.lastT) / (1000 * 60 * 60 * 36)) : 1;
  const unseenBonus = h ? 0 : 0.6;
  const missBonus = h && h.n ? (1 - h.correct / h.n) * 0.8 : 0;
  return hits + unseenBonus + missBonus + staleness * 0.5;
}

/**
 * Build a session: a short warm-up, a main block on the target morphemes,
 * and one or two deliberately oversized words at the end.
 */
export function planSession({ items = 14, maxLevel = 5 } = {}) {
  const targets = targetMorphemes(6);
  const history = itemHistory();

  const scored = WORD_LIST
    .map(w => ({ w, s: scoreWord(w, targets, history, maxLevel) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s);

  const warmup = shuffle(scored.filter(x => x.w.level === 2).slice(0, 8)).slice(0, 3);
  const used = new Set(warmup.map(x => x.w.id));

  const mid = scored.filter(x => !used.has(x.w.id) && x.w.level >= 2 && x.w.level <= 3)
    .slice(0, 14);
  const main = shuffle(mid).slice(0, items - 5);
  main.forEach(x => used.add(x.w.id));

  const bigPool = WORD_LIST.filter(w => w.level >= 4 && !used.has(w.id));
  const stretch = shuffle(bigPool).slice(0, 2);

  const seq = [
    ...warmup.map(x => ({ word: x.w, activity: 'autopsy', phase: 'warmup' })),
    ...main.map((x, i) => ({
      word: x.w,
      activity: MAIN_CYCLE[i % MAIN_CYCLE.length],
      phase: 'main',
    })),
    ...stretch.map(w => ({ word: w, activity: 'autopsy', phase: 'stretch' })),
  ];

  // Detective needs a word with a hand-written note, and the main block tends
  // to favour -tion derivatives which mostly do not have one. Rather than
  // degrade the slot to another equation, swap in the best-scoring annotated
  // word that shares a target morpheme.
  const usedText = new Set(seq.map(s => s.word.text));
  const detPool = DETECTIVE
    .filter(w => !usedText.has(w.text))
    .map(w => ({ w, s: scoreWord(w, targets, history, maxLevel) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s);
  let di = 0;
  for (const step of seq) {
    if (step.activity !== 'detective') continue;
    if (step.word.note) continue;
    const sub = detPool[di++];
    if (sub) { step.word = sub.w; usedText.add(sub.w.text); }
    else step.activity = 'equation';        // genuinely nothing left to use
  }

  // One invented word per session, at the end of the main block. It is the
  // transfer check: a word he cannot have memorised, built only from pieces he
  // has already collected. Skipped until he has actually met those pieces.
  const known = new Set(targets);
  for (const m of drillableMorphemes()) if (level(m.id) >= LEVEL.DEVELOPING) known.add(m.id);
  const invented = PSEUDO.filter(w => w.morphemes.every(id => known.has(id)));
  if (invented.length) {
    const pick = invented[Math.floor(Math.random() * invented.length)];
    const at = seq.findLastIndex(s => s.phase === 'main');
    seq.splice(at + 1, 0, { word: pick, activity: 'invent', phase: 'main' });
  }

  return { targets, seq };
}
