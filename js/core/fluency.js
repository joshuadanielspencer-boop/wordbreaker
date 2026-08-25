// FLUENCY — "make it boring".
//
// Accuracy is not the goal here; effortlessness is. A word he gets right after
// visible work is not finished, and nothing else in the app notices the
// difference. This does: it watches how long each item takes across days and
// retires it once it has stopped costing him anything.
//
// Retirement is measured against HIS OWN baseline for that item, never against
// an absolute number of seconds. An absolute threshold would punish a careful
// reader for being careful, and would tell you nothing about whether anything
// had changed.
//
// The timer is never shown. The visible goal is that words become boring,
// which is also the honest description of what automaticity is.

import { load } from './store.js';
import { BY_TEXT } from '../content/lexicon.js';

const MIN_ATTEMPTS = 4;
const MIN_DAYS = 3;          // spacing matters more than volume
const SPEEDUP = 0.65;        // must reach 65% of his own starting time
const FLOOR_MS = 3500;       // or simply be fast outright
const STREAK = 3;
const RECHECK_DAYS = 21;     // automaticity decays; retirement is not forever

const dayOf = t => new Date(t).toISOString().slice(0, 10);
const median = xs => {
  const s = xs.slice().sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};

/** Per-item history, for one activity so latencies compare like with like. */
export function itemStats(activity = 'autopsy') {
  const S = load();
  const out = new Map();
  if (!S) return out;

  for (const r of S.log) {
    if (r.activity !== activity) continue;
    const text = String(r.item).replace(/^[a-z]:/, '');
    if (!BY_TEXT[text]) continue;                 // cannot re-present it
    if (!out.has(text)) out.set(text, { text, word: BY_TEXT[text], attempts: [], days: new Set() });
    const it = out.get(text);
    it.attempts.push({ t: r.t, ok: !!r.correct, ms: r.ms || 0 });
    it.days.add(dayOf(r.t));
  }

  for (const it of out.values()) {
    const a = it.attempts;
    it.n = a.length;
    it.dayCount = it.days.size;
    it.baselineMs = median(a.slice(0, 3).map(x => x.ms));
    it.recentMs = median(a.slice(-3).map(x => x.ms));
    it.streak = a.slice(-STREAK).every(x => x.ok) && a.length >= STREAK;
    it.faster = it.baselineMs > 0 && it.recentMs <= it.baselineMs * SPEEDUP;
    it.boring = it.n >= MIN_ATTEMPTS && it.dayCount >= MIN_DAYS && it.streak
      && (it.faster || it.recentMs <= FLOOR_MS);

    // How close it is to retiring — drives ordering and the progress bar.
    const parts = [
      Math.min(1, it.n / MIN_ATTEMPTS),
      Math.min(1, it.dayCount / MIN_DAYS),
      it.streak ? 1 : 0,
      it.faster || it.recentMs <= FLOOR_MS ? 1
        : it.baselineMs ? Math.min(1, Math.max(0, (it.baselineMs - it.recentMs) / (it.baselineMs * (1 - SPEEDUP)))) : 0,
    ];
    it.progress = parts.reduce((x, y) => x + y, 0) / parts.length;
  }
  return out;
}

/**
 * Retired words that have not been touched in weeks. Automaticity decays, so a
 * shelf that only ever grows is a claim that stops being true.
 *
 * Un-retiring needs no special case: `boring` is recomputed from the whole
 * attempt history, so if he is slow on the recheck the median of his last
 * three rises and the word simply stops qualifying.
 */
export function dueForRecheck() {
  const now = Date.now();
  return [...itemStats().values()]
    .filter(i => i.boring && (now - i.attempts[i.attempts.length - 1].t) / 86400000 >= RECHECK_DAYS)
    .map(i => ({ ...i, recheck: true }))
    .sort((a, b) => a.attempts[a.attempts.length - 1].t - b.attempts[b.attempts.length - 1].t);
}

/** What a fluency round should actually contain: rechecks first, then the
 *  words closest to retiring. */
export function practiceQueue(limit = 12) {
  const rechecks = dueForRecheck();
  const near = nearlyBoring(limit);
  return [...rechecks, ...near].slice(0, limit);
}

export function boringItems() {
  return [...itemStats().values()].filter(i => i.boring)
    .sort((a, b) => a.text.localeCompare(b.text));
}

/**
 * Items worth another pass: seen before, not yet retired, closest first.
 * Retiring something is the reward, so put the nearly-done ones in front.
 */
export function nearlyBoring(limit = 12) {
  return [...itemStats().values()]
    .filter(i => !i.boring && i.n >= 1)
    .sort((a, b) => b.progress - a.progress || b.n - a.n)
    .slice(0, limit);
}

export function fluencySummary() {
  const all = [...itemStats().values()];
  const retired = all.filter(i => i.boring);
  const speedups = retired.map(i => i.baselineMs && i.recentMs ? i.recentMs / i.baselineMs : null).filter(Boolean);
  return {
    seen: all.length,
    retired: retired.length,
    ready: all.filter(i => !i.boring && i.n >= 1).length,
    recheck: dueForRecheck().length,
    medianSpeedup: speedups.length ? median(speedups) : null,
  };
}

/** His typical time for an activity, for judging whether an answer was fast. */
export function typicalMs(activity = 'autopsy') {
  const S = load();
  if (!S) return null;
  const xs = S.log.filter(r => r.activity === activity && r.correct && r.ms > 0).map(r => r.ms);
  return xs.length >= 5 ? median(xs) : null;
}
