// Response log. One record per answered item. This is the raw material for
// the error fingerprint, so it is tagged at write time and never inferred
// afterwards — you cannot retrofit tags you did not record.

import { load, save } from './store.js';

const LOG_CAP = 5000;

/**
 * @param {object} r
 * @param {string} r.activity   'autopsy' | 'equation' | ...
 * @param {string} r.item       item id, e.g. 'w:transportation'
 * @param {boolean} r.correct   overall pass/fail
 * @param {number} r.ms         time to answer
 * @param {object} r.credit     morphemeId -> boolean, per-morpheme outcome
 * @param {object} [r.detail]   activity-specific payload (what he actually did)
 */
export function push(r) {
  const s = load();
  if (!s) return;
  s.log.push({ t: Date.now(), ...r });
  if (s.log.length > LOG_CAP) s.log.splice(0, s.log.length - LOG_CAP);
  save();
}

export function recent(n = 100) {
  const s = load();
  return s ? s.log.slice(-n) : [];
}

/** Every distinct item id he has ever answered, with hit counts. */
export function itemHistory() {
  const s = load();
  const out = new Map();
  for (const r of (s?.log || [])) {
    const cur = out.get(r.item) || { n: 0, correct: 0, lastT: 0 };
    cur.n++; cur.correct += r.correct ? 1 : 0; cur.lastT = r.t;
    out.set(r.item, cur);
  }
  return out;
}
