// Choosing Sound Swap items — PRACTICE, on an adaptive ladder.
//
// Same shape as the nonsense drills and the same warning applies: the rung
// moves with his accuracy, so accuracy here stays inside a band whichever way
// he is actually going. Growth shows up as the RUNG REACHED, never as the
// score, and nothing in this file feeds the evidence view.
//
// The ladder is Kilpatrick's order, easiest first: whole syllables before
// single sounds, deletion before substitution, consonants before vowels.

import { MANIPULATION, MANIP_ORDER } from '../content/manipulation.js';
import { load } from './store.js';
import { speechAvailable } from './speech.js';

const ACTIVITY = 'manipulate';

/** A stable id per item, so one is never served twice. */
export const itemId = i => `${i.level}|${i.word}|${i.cue}|${i.to || ''}`;

function used() {
  const S = load();
  const out = new Set();
  for (const r of (S?.log || [])) {
    if (r.activity === ACTIVITY && r.detail?.item) out.add(r.detail.item);
  }
  return out;
}

function recentAccuracy(n = 12) {
  const S = load();
  if (!S) return null;
  const rows = S.log.filter(r => r.activity === ACTIVITY).slice(-n);
  if (rows.length < 6) return null;
  return rows.filter(r => r.correct).length / rows.length;
}

/** Which rung to work on. Climbs on sustained accuracy, drops back on a bad
 *  run — a wall of items he cannot do is the fastest way to make him stop. */
export function currentLevel() {
  const S = load();
  if (!S) return MANIP_ORDER[0];
  const seen = new Set(S.log.filter(r => r.activity === ACTIVITY)
    .map(r => r.detail?.level).filter(Boolean));
  const acc = recentAccuracy();
  let idx = Math.max(0, ...[...seen].map(l => MANIP_ORDER.indexOf(l)).filter(i => i >= 0));
  if (acc !== null && acc >= 0.8) idx = Math.min(idx + 1, MANIP_ORDER.length - 1);
  else if (acc !== null && acc < 0.5) idx = Math.max(idx - 1, 0);
  return MANIP_ORDER[idx];
}

function sample(pool, n) {
  const a = pool.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export function manipulationItems(n = 2) {
  if (!speechAvailable()) return [];          // the word is spoken or not at all
  const spent = used();
  const level = currentLevel();
  const at = MANIP_ORDER.indexOf(level);

  // If this rung is used up, fall to a NEIGHBOURING one rather than repeating
  // an item. A repeated item is no longer a manipulation — he remembers the
  // answer, which is exactly the recall the task exists to rule out.
  const order = [level, ...MANIP_ORDER.filter((_, i) => i !== at)
    .sort((a, b) => Math.abs(MANIP_ORDER.indexOf(a) - at) - Math.abs(MANIP_ORDER.indexOf(b) - at))];

  const out = [];
  for (const l of order) {
    if (out.length >= n) break;
    const free = (MANIPULATION[l] || [])
      .map(i => ({ ...i, level: l }))
      .map(i => ({ ...i, id: itemId(i) }))
      .filter(i => !spent.has(i.id));

    for (const it of sample(free, n - out.length)) {
      // The session loop wants step.word to be a word-shaped object; the
      // activity wants the plain string. Keep them in separate fields rather
      // than having either one guess.
      out.push({
        ...it,
        target: it.word,
        word: { id: 'mn:' + it.id, text: it.word, morphemes: [] },
        activity: 'manipulate',
        phase: 'manipulate',
      });
    }
  }
  return out;
}

/** How far up the ladder he has actually got — the useful progress number. */
export function manipulationProgress() {
  const S = load();
  const rows = (S?.log || []).filter(r => r.activity === ACTIVITY);
  const reached = new Set(rows.map(r => r.detail?.level).filter(Boolean));
  const total = MANIP_ORDER.reduce((a, l) => a + (MANIPULATION[l] || []).length, 0);
  return {
    done: rows.length,
    correct: rows.filter(r => r.correct).length,
    level: currentLevel(),
    rungsReached: MANIP_ORDER.filter(l => reached.has(l)),
    remaining: total - new Set(rows.map(r => r.detail?.item).filter(Boolean)).size,
  };
}
