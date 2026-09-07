// Choosing Impostor Row items.
//
// Kilpatrick wants look-alike work as a DAILY drill, so these are scheduled
// into the ordinary session rather than parked behind a button that has to be
// chosen. Two per session is enough to keep it a habit without it becoming the
// session.

import { LOOKALIKE_SETS, setWords } from '../content/lookalikes.js';
import { load } from './store.js';
import { speechAvailable } from './speech.js';

/** Per-set history, straight from the log. */
export function setHistory() {
  const S = load();
  const out = new Map();
  for (const s of LOOKALIKE_SETS) out.set(s.id, { n: 0, clean: 0, lastT: 0, msTotal: 0 });
  if (!S) return out;
  for (const r of S.log) {
    if (r.activity !== 'impostor' || !r.detail?.set) continue;
    const h = out.get(r.detail.set);
    if (!h) continue;
    h.n++;
    if (r.detail.clean) h.clean++;
    h.lastT = Math.max(h.lastT, r.t);
    h.msTotal += r.ms || 0;
  }
  return out;
}

/** Recent accuracy on this drill, used to decide when tier 2 is reasonable. */
function recentAccuracy() {
  const S = load();
  if (!S) return 0;
  const rows = S.log.filter(r => r.activity === 'impostor').slice(-20);
  if (rows.length < 6) return 0;
  return rows.filter(r => r.correct).length / rows.length;
}

export function impostorItems(n = 2) {
  const hist = setHistory();
  const tier = recentAccuracy() >= 0.8 ? 2 : 1;

  const usable = LOOKALIKE_SETS.filter(s => {
    // A sound-prompted set is unanswerable with no audio unless its members
    // carry definitions, which only the homophone sets do.
    if (s.prompt === 'sound' && !speechAvailable()) return false;
    return true;
  });

  const pool = usable
    .map(s => {
      const h = hist.get(s.id);
      const staleness = h.lastT ? Math.min(1, (Date.now() - h.lastT) / (1000 * 60 * 60 * 48)) : 1;
      const unseen = h.n === 0 ? 0.8 : 0;
      const missRate = h.n ? 1 - h.clean / h.n : 0;
      const tierFit = s.tier <= tier ? 0.5 : -0.4;      // never far above his level
      return { s, score: staleness + unseen + missRate + tierFit + Math.random() * 0.3 };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return pool.slice(0, n).map(({ s }) => {
    const words = setWords(s);
    const target = words[Math.floor(Math.random() * words.length)];
    return { word: { id: 'lk:' + s.id + ':' + target.w, text: target.w, morphemes: [] },
             set: s, target, activity: 'impostor', phase: 'impostor' };
  });
}
