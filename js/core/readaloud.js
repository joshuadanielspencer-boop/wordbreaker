// READING ALOUD — a miscue log, kept by an adult while he reads.
//
// The last measure in docs/predictions.md that could not be collected at all.
//
// What makes it worth the trouble is the MIX, not the volume. The two readings
// make opposite predictions about the same child: under A, first-letter and
// context guesses fall sharply as decoding takes over; under B the error mix
// is unchanged and only the volume shifts. A running total of "mistakes" can
// never separate those, so every miscue is typed, and the evidence view
// reports the SHARE that are guesses alongside the rate.
//
// Kilpatrick's finding is that correcting EVERY error beats correcting only
// the ones that change the meaning, which is the opposite of what most reading
// advice says. So there is no "minor error" category to park things in.
//
// The app does not supply the passage. He reads from whatever book he is
// actually reading, which is the only way the number means anything about
// reading rather than about this app.

import { load } from './store.js';
import { push as logPush } from './log.js';

export const ACTIVITY = 'readaloud';

/**
 * `guess` marks the two types the pre-registered prediction turns on. They are
 * the compensations this whole project exists to replace, so they are counted
 * apart from ordinary decoding slips.
 */
export const MISCUE_TYPES = [
  { id: 'first',   label: 'First-letter guess', hint: 'house for horse — starts right, then invented', guess: true },
  { id: 'context', label: 'Context guess',      hint: 'fits the sentence, does not match the print',   guess: true },
  { id: 'ending',  label: 'Wrong ending',       hint: 'walked for walking' },
  { id: 'middle',  label: 'Wrong middle',       hint: 'right at both ends, vowel wrong' },
  { id: 'skipped', label: 'Skipped a word',     hint: 'left it out and carried on' },
  { id: 'added',   label: 'Added a word',       hint: 'said one that is not there' },
  { id: 'stuck',   label: 'Stuck',              hint: 'could not get it and had to be told' },
];

/** Not a miscue. Catching your own error is the skill arriving, so it is
 *  recorded separately and never counted against him. */
export const SELF_CORRECTED = 'selfcorrected';

export const TYPE_LABEL = Object.fromEntries(
  [...MISCUE_TYPES.map(t => [t.id, t.label]), [SELF_CORRECTED, 'Self-corrected']]);

const GUESS_TYPES = new Set(MISCUE_TYPES.filter(t => t.guess).map(t => t.id));

export function recordReading({ label, words, seconds, marks }) {
  const counts = {};
  for (const m of marks) counts[m.type] = (counts[m.type] || 0) + 1;
  const miscues = marks.filter(m => m.type !== SELF_CORRECTED).length;

  logPush({
    activity: ACTIVITY,
    item: 'read:' + (label || 'passage'),
    correct: true,                 // not a scored item; it is an observation
    ms: Math.round((seconds || 0) * 1000),
    credit: {},
    detail: {
      label: label || '',
      words: words || null,
      seconds: Math.round(seconds || 0),
      counts,
      miscues,
      selfCorrected: counts[SELF_CORRECTED] || 0,
    },
  });
  return { miscues, counts };
}

/** Every reading, oldest first, with the two numbers that matter derived. */
export function readings() {
  const S = load();
  return (S?.log || [])
    .filter(r => r.activity === ACTIVITY && r.detail)
    .map(r => {
      const d = r.detail;
      const guesses = [...GUESS_TYPES].reduce((a, t) => a + (d.counts?.[t] || 0), 0);
      return {
        t: r.t,
        label: d.label,
        words: d.words,
        seconds: d.seconds,
        miscues: d.miscues,
        counts: d.counts || {},
        selfCorrected: d.selfCorrected || 0,
        guesses,
        // Per hundred words, so passages of different lengths compare.
        per100: d.words ? Math.round((d.miscues / d.words) * 1000) / 10 : null,
        // The discriminating number: of the errors he made, how many were
        // guesses rather than decoding slips.
        guessShare: d.miscues ? guesses / d.miscues : null,
        wordsPerMinute: d.words && d.seconds ? Math.round(d.words / (d.seconds / 60)) : null,
      };
    })
    .sort((a, b) => a.t - b.t);
}

/**
 * Movement from the first reading to the latest, in the terms predictions.md
 * pre-registered. Returns null rather than a shrug when there is nothing to
 * compare — one reading is a point, not a trend.
 */
export function miscueMovement() {
  const r = readings();
  if (r.length < 2) return null;
  const a = r[0], b = r[r.length - 1];
  return {
    from: a,
    to: b,
    weeks: Math.round((b.t - a.t) / (7 * 86400000)),
    ratePoints: a.per100 !== null && b.per100 !== null
      ? Math.round((b.per100 - a.per100) * 10) / 10 : null,
    guessSharePoints: a.guessShare !== null && b.guessShare !== null
      ? Math.round((b.guessShare - a.guessShare) * 100) : null,
  };
}
