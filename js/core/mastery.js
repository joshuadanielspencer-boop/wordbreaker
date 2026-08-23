// Per-morpheme mastery.
//
// Deliberately simple and swappable: a decayed accuracy over recent
// encounters, gated by exposure count and by how many separate DAYS the
// morpheme has been seen on. Spacing matters more than volume, so a morpheme
// crammed twenty times in one sitting cannot reach the top level.

import { load, save, today } from './store.js';

export const LEVEL = { UNSEEN: 0, SHAKY: 1, DEVELOPING: 2, SOLID: 3, BORING: 4 };
export const LEVEL_NAME = ['unseen', 'shaky', 'developing', 'solid', 'boring'];

const RECENT_CAP = 16;
const DECAY = 0.85;      // each older result counts 85% of the next-newer one

function blank() { return { n: 0, recent: [], lastSeen: 0, msTotal: 0, days: [] }; }

// Reads must not mutate. Rendering the home screen asks for the level of
// every teachable morpheme; if that materialised a record each time, a profile
// that has never played would still be carrying 120 empty ones.
const EMPTY = Object.freeze({ n: 0, recent: Object.freeze([]), lastSeen: 0, msTotal: 0, days: Object.freeze([]) });

export function entry(id) {
  return load()?.mastery?.[id] || EMPTY;
}

/** Read-write access. Only `record()` should need this. */
function mutableEntry(id) {
  const s = load();
  if (!s) return null;
  if (!s.mastery[id]) s.mastery[id] = blank();
  return s.mastery[id];
}

/** Decayed accuracy in [0,1]. Returns null with no data. */
export function strength(id) {
  const e = entry(id);
  if (!e.recent.length) return null;
  let num = 0, den = 0, w = 1;
  for (let i = e.recent.length - 1; i >= 0; i--) {
    num += w * e.recent[i];
    den += w;
    w *= DECAY;
  }
  return num / den;
}

export function level(id) {
  const e = entry(id);
  const s = strength(id);
  if (s === null) return LEVEL.UNSEEN;
  if (s >= 0.95 && e.n >= 12 && e.days.length >= 3) return LEVEL.BORING;
  if (s >= 0.85 && e.n >= 6) return LEVEL.SOLID;
  if (s >= 0.6) return LEVEL.DEVELOPING;
  return LEVEL.SHAKY;
}

export function meanLatency(id) {
  const e = entry(id);
  return e.n ? Math.round(e.msTotal / e.n) : null;
}

/** Record one encounter with a morpheme. */
export function record(id, correct, ms = 0) {
  const e = mutableEntry(id);
  if (!e) return;                      // nothing signed in: do not fabricate history
  e.n += 1;
  e.recent.push(correct ? 1 : 0);
  if (e.recent.length > RECENT_CAP) e.recent.shift();
  e.lastSeen = Date.now();
  e.msTotal += ms;
  const d = today();
  if (!e.days.includes(d)) e.days.push(d);
  save();
}

/** Morphemes ranked worst-first — the error fingerprint. */
export function weakest(ids, limit = 12) {
  return ids
    .map(id => ({ id, lvl: level(id), s: strength(id), n: entry(id).n }))
    .filter(x => x.lvl !== LEVEL.UNSEEN)
    .sort((a, b) => a.s - b.s || b.n - a.n)
    .slice(0, limit);
}

export function levelCounts(ids) {
  const out = [0, 0, 0, 0, 0];
  for (const id of ids) out[level(id)]++;
  return out;
}
