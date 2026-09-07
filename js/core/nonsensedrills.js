// Choosing Nonsense Dictation and Sound Hunt items.
//
// Dictation is the primary outcome variable for the whole project, so its
// selection is deliberately boring and repeatable: work up the pattern ladder,
// and never repeat an item, because a re-used nonsense word stops being a
// nonsense word the second time he meets it.

import { NONSENSE, NONSENSE_MULTI, PATTERN_ORDER } from '../content/nonsense.js';
import { load } from './store.js';
import { speechAvailable } from './speech.js';
import { FAMILIES, graphemeIn } from '../activities/soundhunt.js';

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
  const pool = (NONSENSE[pattern] || []).filter(w => !used.has(w));
  const from = pool.length >= n ? pool : (NONSENSE[pattern] || []);
  if (!from.length) return [];

  return Array.from({ length: n }, () => {
    const text = from[Math.floor(Math.random() * from.length)];
    return {
      word: { id: 'nw:' + text, text, morphemes: [] },
      pattern,
      activity: 'dictation',
      phase: 'dictation',
    };
  });
}

export function soundHuntItems(n = 1) {
  if (!speechAvailable()) return [];
  const families = Object.keys(FAMILIES);
  const family = families[Math.floor(Math.random() * families.length)];
  const used = usedWords('soundhunt');

  // Mostly words that DO contain a member of the family, with an occasional
  // one that does not — otherwise "none of these" is never the answer and the
  // tiles give the game away.
  const all = Object.values(NONSENSE).flat().filter(w => !used.has(w));
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
