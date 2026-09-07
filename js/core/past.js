// THE PAST — Phonological Awareness Screening Test. Record only.
//
// The app does NOT administer this and must not try to. Every judgement in it
// is about a sound the child says out loud, and the only reliable instrument
// for that is an adult's ear. Speech recognition is not a substitute here and
// is worse than useless: it is language-model driven, so it will "correct" the
// nonsense response into a real word and fail hardest on exactly the items
// that discriminate.
//
// So the adult runs the test from the book and types what happened. Two things
// are recorded per level, and the second is the one people forget:
//
//   CORRECT     did he get it right at all
//   AUTOMATIC   did he get it right within about two seconds
//
// Kilpatrick's whole argument rests on the gap between those two. A child who
// is correct-but-slow at a level has the skill and has not automatised it, and
// that is a completely different finding from not having the skill — different
// prediction, different intervention, different next test. Recording only
// accuracy throws away the distinction the test exists to make.
//
// This matters directly to docs/predictions.md: "PAST all automatic at
// baseline" is listed there as the result that would remove Kilpatrick's
// phonemic-automaticity explanation entirely and point instead at rapid naming
// or working memory. It is the single most decisive number in the project, and
// it cannot be collected without an adult sitting down with him.
//
// ---------------------------------------------------------------------------
// LEVELS: the letters and the order are Kilpatrick's, but the descriptions
// below are written from memory of the test's structure and HAVE NOT been
// checked against the book. Verify them against your copy before reading
// anything into a level label — the recorded data is keyed on the LETTER, so
// correcting a description here is safe and changes no stored result.
// ---------------------------------------------------------------------------

import { load, save } from './store.js';

export const PAST_LEVELS = [
  { id: 'A', label: 'Syllables — deletion' },
  { id: 'B', label: 'Syllables — deletion, harder' },
  { id: 'C', label: 'Onset-rime — deletion' },
  { id: 'D', label: 'Phonemes — initial deletion' },
  { id: 'E', label: 'Phonemes — final deletion' },
  { id: 'F', label: 'Phonemes — initial blend deletion' },
  { id: 'G', label: 'Phonemes — final blend deletion' },
  { id: 'H', label: 'Phonemes — initial substitution' },
  { id: 'I', label: 'Phonemes — final substitution' },
  { id: 'J', label: 'Phonemes — vowel substitution' },
  { id: 'K', label: 'Phonemes — blend substitution' },
  { id: 'L', label: 'Phonemes — substitution, advanced' },
  { id: 'M', label: 'Phonemes — substitution, advanced' },
];

const store = () => {
  const S = load();
  if (!S) return null;
  if (!S.past) S.past = [];
  return S;
};

/**
 * Record one administration. `levels` is { A: {correct, automatic}, ... },
 * with levels the adult skipped simply absent rather than guessed at.
 */
export function recordPast(levels, note = '') {
  const S = store();
  if (!S) return null;
  const entry = { t: Date.now(), levels, note };
  S.past.push(entry);
  save();
  return entry;
}

export function pastHistory() {
  const S = store();
  return S ? S.past.slice().sort((a, b) => a.t - b.t) : [];
}

export function lastPast() {
  const h = pastHistory();
  return h.length ? h[h.length - 1] : null;
}

/** Gate 0 for this measure: has it ever been administered at all? */
export function hasBaseline() {
  return pastHistory().length > 0;
}

/**
 * The two numbers that matter, for one administration: the highest level
 * reached correctly, and the highest reached AUTOMATICALLY. Where those two
 * diverge is the finding.
 */
export function summarise(entry) {
  if (!entry) return null;
  const order = PAST_LEVELS.map(l => l.id);
  const idx = id => order.indexOf(id);
  let hiCorrect = null, hiAuto = null;
  for (const [id, v] of Object.entries(entry.levels || {})) {
    if (idx(id) < 0) continue;
    if (v.correct && (hiCorrect === null || idx(id) > idx(hiCorrect))) hiCorrect = id;
    if (v.automatic && (hiAuto === null || idx(id) > idx(hiAuto))) hiAuto = id;
  }
  const tested = Object.keys(entry.levels || {}).length;
  const auto = Object.values(entry.levels || {}).filter(v => v.automatic).length;
  return {
    t: entry.t,
    highestCorrect: hiCorrect,
    highestAutomatic: hiAuto,
    tested,
    automatic: auto,
    // The finding predictions.md hangs on: correct everywhere, automatic
    // everywhere too. If this is true at baseline, Branch B's core is gone.
    allAutomatic: tested > 0 && auto === tested,
    // The gap that IS Kilpatrick's explanation, when it is there.
    gap: hiCorrect && hiAuto ? idx(hiCorrect) - idx(hiAuto) : null,
    note: entry.note || '',
  };
}
