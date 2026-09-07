// MEASUREMENT — held-out probe items, at fixed difficulty.
//
// This file exists because practice cannot measure itself. The nonsense drills
// in nonsensedrills.js climb a ladder that adapts to how he is doing: up a rung
// at 80% accuracy, down one below 50%. That is good teaching and a useless
// instrument, because it regulates accuracy into a band no matter which way he
// is actually moving. docs/predictions.md asks for a 15-20 point accuracy
// change at eight weeks, and an adaptive ladder cannot show one.
//
// So measurement gets its own pool and its own rules:
//
//   FIXED COMPOSITION   the same two items from each of the six patterns every
//                       time, easiest first. Difficulty never adapts, so a
//                       change in the score is a change in him.
//   RESERVED ITEMS      practice may never touch a probe item, and the two
//                       probe kinds may never touch each other's. Reading a
//                       word aloud in week 2 and being asked to spell it in
//                       week 5 would make the week 5 number a memory test.
//   NEVER REUSED        docs/predictions.md requires fresh items every time.
//
// The reservation is by INDEX, not by random draw, so it is stable across
// devices, reloads and profile imports without anything being stored. Items at
// index % 5 === 0 belong to the decoding probe, === 1 to the spelling probe,
// and the remaining 60% are practice. That leaves ~17 held-out items per
// pattern in the smallest pattern (r_controlled, 88 items), which is 8 weekly
// probes — enough for the pre-registered eight-week window, and the teacher
// view reports how many are left so running dry is visible before it happens.

import { NONSENSE, PATTERN_ORDER, PATTERN_LABEL } from '../content/nonsense.js';
import { load } from './store.js';

/** Two probe kinds, deliberately disjoint. */
export const DECODING = 'probeDecoding';   // read aloud — the PRIMARY outcome
export const SPELLING = 'probeSpelling';   // written from dictation — secondary

export const PROBE_LABEL = {
  [DECODING]: 'Nonsense reading',
  [SPELLING]: 'Nonsense spelling',
};

const SLOT = { [DECODING]: 0, [SPELLING]: 1 };
const STRIDE = 5;

/** Items per pattern in every probe. Fixed — this is what makes it a measure. */
const PER_PATTERN = 2;

const DAY = 86400000;
const dayOf = t => new Date(t).toISOString().slice(0, 10);

/** The held-out slice of one pattern for one probe kind. Index-stable. */
export function reserved(kind, pattern) {
  const all = NONSENSE[pattern] || [];
  const slot = SLOT[kind];
  return all.filter((_, i) => i % STRIDE === slot);
}

/**
 * Every word reserved for any probe. nonsensedrills.js subtracts this so that
 * ordinary practice can never burn a measurement item.
 */
let _held = null;
export function heldOut() {
  if (_held) return _held;
  _held = new Set();
  for (const kind of [DECODING, SPELLING])
    for (const p of PATTERN_ORDER)
      for (const w of reserved(kind, p)) _held.add(w);
  return _held;
}

/** Probe words already spent, by kind. A repeat is no longer a fresh item. */
function spent(kind) {
  const S = load();
  const out = new Set();
  for (const r of (S?.log || []))
    if (r.activity === kind && r.detail?.target) out.add(r.detail.target);
  return out;
}

/**
 * Build one probe. Same shape every time; only the specific words change.
 * Returns fewer items than usual only when a pattern's held-out slice has run
 * out, which the teacher view warns about in advance.
 */
export function probeItems(kind) {
  const used = spent(kind);
  const probeId = new Date().toISOString();
  const out = [];

  for (const pattern of PATTERN_ORDER) {              // easiest rung first
    const pool = reserved(kind, pattern).filter(w => !used.has(w));
    for (const text of pool.slice(0, PER_PATTERN)) {
      out.push({
        word: { id: 'probe:' + text, text, morphemes: [] },
        pattern, probeId, kind,
        activity: kind === DECODING ? 'ladder' : 'dictation',
        phase: 'probe',
      });
    }
  }
  return out;
}

/** How many probes are still fundable, per pattern — the limiting number. */
export function remaining(kind) {
  const used = spent(kind);
  const per = PATTERN_ORDER.map(p => ({
    pattern: p,
    label: PATTERN_LABEL[p] || p,
    left: reserved(kind, p).filter(w => !used.has(w)).length,
  }));
  return { per, probesLeft: Math.min(...per.map(x => Math.floor(x.left / PER_PATTERN))) };
}

/**
 * Past probes, grouped into runs, newest last. This is the evidence view's
 * raw material: one accuracy and one median time per run.
 */
export function runs(kind) {
  const S = load();
  const byId = new Map();
  for (const r of (S?.log || [])) {
    if (r.activity !== kind) continue;
    const id = r.detail?.probeId || dayOf(r.t);
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id).push(r);
  }
  return [...byId.entries()]
    .map(([id, rows]) => {
      const times = rows.map(r => r.ms).filter(Boolean).sort((a, b) => a - b);
      const correct = rows.filter(r => r.correct).length;
      // Decoding is scored 1 (letter-by-letter) / 2 (sounded then blended) /
      // 3 (instant). The share read as whole units is the thing predictions.md
      // actually asks about, so it is carried alongside plain accuracy.
      const scored = rows.map(r => r.detail?.score).filter(Boolean);
      return {
        id,
        t: Math.min(...rows.map(r => r.t)),
        day: dayOf(Math.min(...rows.map(r => r.t))),
        n: rows.length,
        correct,
        accuracy: rows.length ? correct / rows.length : 0,
        medianMs: times.length ? times[Math.floor(times.length / 2)] : null,
        instant: scored.length ? scored.filter(s => s === 3).length / scored.length : null,
        rows,
      };
    })
    .sort((a, b) => a.t - b.t);
}

export function lastRun(kind) {
  const r = runs(kind);
  return r.length ? r[r.length - 1] : null;
}

/** Weekly, per predictions.md. Never nags — the teacher area just says so. */
export function due(kind) {
  const last = lastRun(kind);
  return !last || (Date.now() - last.t) >= 7 * DAY;
}

/** The baseline run is Gate 0 for this measure. Null until it has been taken. */
export function baseline(kind) {
  const r = runs(kind);
  return r.length ? r[0] : null;
}

/**
 * Movement from baseline, in the terms predictions.md pre-registered:
 * accuracy in PERCENTAGE POINTS, median time as a percentage change.
 * Returns null rather than a shrug when there is nothing to compare.
 */
export function movement(kind) {
  const r = runs(kind);
  if (r.length < 2) return null;
  const a = r[0], b = r[r.length - 1];
  return {
    weeks: Math.round((b.t - a.t) / (7 * DAY)),
    accuracyPoints: Math.round((b.accuracy - a.accuracy) * 100),
    timePercent: a.medianMs && b.medianMs
      ? Math.round(((b.medianMs - a.medianMs) / a.medianMs) * 100) : null,
    instantPoints: a.instant !== null && b.instant !== null
      ? Math.round((b.instant - a.instant) * 100) : null,
    from: a, to: b,
  };
}
