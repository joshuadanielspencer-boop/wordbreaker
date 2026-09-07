// Choosing Nonsense Dictation and Sound Hunt items — PRACTICE, not measurement.
//
// Dictation is nonsense-word SPELLING, which docs/predictions.md lists as a
// secondary outcome. The primary outcome is nonsense-word DECODING — reading
// them aloud — which needs an ear and lives in the teacher area. This file
// used to claim dictation was the primary outcome variable; it is not, and
// building on that claim would have measured the wrong thing.
//
// Nothing here is a measurement, because the pattern ladder below is adaptive:
// it climbs on success and drops back on failure, which holds accuracy inside
// a band by construction. An accuracy trend out of THIS selection is therefore
// uninterpretable — it would be roughly flat whichever way the learner is
// actually going. Growth shows up here as the rung reached, not as the score.
//
// Measurement happens in js/core/probe.js, on a reserved slice of items at
// fixed difficulty that practice may never touch.
//
// Items are still never repeated: a re-used nonsense word stops being a
// nonsense word the second time he meets it.

import { NONSENSE, NONSENSE_MULTI, PATTERN_ORDER } from '../content/nonsense.js';
import { load } from './store.js';
import { speechAvailable } from './speech.js';
import { heldOut } from './probe.js';
import { FAMILIES, graphemeIn } from '../activities/soundhunt.js';

/** Draw up to n distinct items. Sampling WITH replacement used to be possible
 *  here, which could serve the same nonsense word twice in one session — the
 *  one thing a nonsense word must never be. */
function sample(pool, n) {
  const a = pool.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/** Everything already used, by activity. A repeat is no longer a novel word. */
function usedWords(activity) {
  const S = load();
  const out = new Set();
  for (const r of (S?.log || [])) {
    if (r.activity === activity && r.detail?.target) out.add(r.detail.target);
    if (r.activity === activity && r.detail?.word) out.add(r.detail.word);
  }
  return out;
}

/** Accuracy on the most recent items of an activity. */
function recentAccuracy(activity, n = 12) {
  const S = load();
  if (!S) return null;
  const rows = S.log.filter(r => r.activity === activity).slice(-n);
  if (rows.length < 6) return null;
  return rows.filter(r => r.correct).length / rows.length;
}

/**
 * Which pattern to work on. Climbs the ladder only on sustained accuracy, and
 * drops back a rung on a bad run — a wall of items he cannot spell is the
 * fastest way to make him stop.
 */
export function currentPattern(activity = 'dictation') {
  const S = load();
  if (!S) return PATTERN_ORDER[0];
  const seen = new Set(S.log.filter(r => r.activity === activity).map(r => r.detail?.pattern).filter(Boolean));
  const acc = recentAccuracy(activity);
  let idx = Math.max(0, ...[...seen].map(p => PATTERN_ORDER.indexOf(p)).filter(i => i >= 0));
  if (acc !== null && acc >= 0.8) idx = Math.min(idx + 1, PATTERN_ORDER.length - 1);
  else if (acc !== null && acc < 0.5) idx = Math.max(idx - 1, 0);
  return PATTERN_ORDER[idx];
}

export function dictationItems(n = 2) {
  if (!speechAvailable()) return [];
  const pattern = currentPattern('dictation');
  const used = usedWords('dictation');
  const held = heldOut();

  // Never a probe item, never one he has met. If this rung is exhausted, fall
  // to a NEIGHBOURING rung rather than re-serving a spent word — the old code
  // fell back to the full list including used items, which quietly broke the
  // never-repeat guarantee first and hardest on the patterns he had drilled
  // most, which are exactly the ones that matter.
  const freeAt = p => (NONSENSE[p] || []).filter(w => !used.has(w) && !held.has(w));
  const at = PATTERN_ORDER.indexOf(pattern);
  const order = [pattern, ...PATTERN_ORDER.filter((_, i) => i !== at)
    .sort((a, b) => Math.abs(PATTERN_ORDER.indexOf(a) - at) - Math.abs(PATTERN_ORDER.indexOf(b) - at))];

  const out = [];
  for (const p of order) {
    if (out.length >= n) break;
    for (const text of sample(freeAt(p), n - out.length)) {
      out.push({
        word: { id: 'nw:' + text, text, morphemes: [] },
        pattern: p,
        activity: 'dictation',
        phase: 'dictation',
      });
    }
  }
  return out;
}

export function soundHuntItems(n = 1) {
  if (!speechAvailable()) return [];
  const families = Object.keys(FAMILIES);
  const family = families[Math.floor(Math.random() * families.length)];
  const used = usedWords('soundhunt');

  // Mostly words that DO contain a member of the family, with an occasional
  // one that does not — otherwise "none of these" is never the answer and the
  // tiles give the game away.
  const held = heldOut();
  const all = Object.values(NONSENSE).flat().filter(w => !used.has(w) && !held.has(w));
  const withIt = all.filter(w => graphemeIn(w, family));
  const without = all.filter(w => !graphemeIn(w, family));

  return Array.from({ length: n }, () => {
    const wantNone = Math.random() < 0.2 && without.length;
    const from = wantNone ? without : (withIt.length ? withIt : all);
    const text = from[Math.floor(Math.random() * from.length)];
    return {
      word: { id: 'sh:' + text, text, morphemes: [] },
      family,
      grapheme: graphemeIn(text, family),
      activity: 'soundhunt',
      phase: 'soundhunt',
    };
  });
}
