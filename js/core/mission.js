// SPELLING SLAUGHTER — progress over a curriculum list.
//
// A word counts as slaughtered when it has been produced COLD — from the
// definition alone, with no hints and on the first attempt — on two SEPARATE
// days.
//
// It used to count look-cover-write, which was wrong. That activity hides the
// word for about three seconds, so passing it demonstrates working memory, not
// spelling. Cold recall never shows the word at all, which is the only one of
// the three that is actually evidence. Look-cover-write remains in the drill
// as practice; it just no longer certifies anything.

import { load } from './store.js';
import { MISSION_LIST, missionById } from '../content/lexicon.js';

const CLEAN_NEEDED = 2;
const dayOf = t => new Date(t).toISOString().slice(0, 10);

/** Per-word history across every activity, plus the clean-spell record. */
export function wordStatus(text) {
  const S = load();
  const out = {
    seen: 0, spelled: 0, recalled: 0, peeks: 0, hints: 0, lastT: 0,
    practisedDays: new Set(),   // clean look-cover-write: practice, not proof
    cleanDays: new Set(),       // clean cold recall: the thing that counts
    slaughtered: false,
  };
  if (!S) return out;

  for (const r of S.log) {
    if (r.item !== 'm:' + text) continue;
    out.seen++;
    out.lastT = Math.max(out.lastT, r.t);
    if (r.activity === 'spell') {
      out.spelled++;
      out.peeks += r.detail?.peeks || 0;
      if (r.detail?.clean) out.practisedDays.add(dayOf(r.t));
    }
    if (r.activity === 'recall') {
      out.recalled++;
      out.hints += r.detail?.hints || 0;
      if (r.detail?.clean) out.cleanDays.add(dayOf(r.t));
    }
  }
  out.slaughtered = out.cleanDays.size >= CLEAN_NEEDED;
  return out;
}

export function missionProgress(mission) {
  const words = mission.words.map(w => ({ word: w, status: wordStatus(w.text) }));
  const done = words.filter(x => x.status.slaughtered).length;
  return { words, done, total: words.length, pct: Math.round((done / words.length) * 100) };
}

export function allMissions() {
  return MISSION_LIST.map(m => ({ mission: m, ...missionProgress(m) }));
}

/**
 * What to drill next. A word he has never seen gets taken apart first — the
 * point of running a spelling list through the slicer is that he sees the
 * structure before he tries to memorise the letters.
 */
export function drillQueue(missionId, n = 10) {
  const mission = missionById(missionId);
  if (!mission) return [];

  const ranked = mission.words
    .map(w => ({ w, s: wordStatus(w.text) }))
    .filter(x => !x.s.slaughtered)
    .sort((a, b) => {
      if (a.s.seen !== b.s.seen) return a.s.seen - b.s.seen;    // unseen first
      return a.s.lastT - b.s.lastT;                             // then stalest
    });

  const queue = [];
  for (const { w, s } of ranked) {
    if (queue.length >= n) break;
    if (s.seen === 0) {
      // Structure before spelling, always.
      queue.push({ word: w, activity: 'autopsy', phase: 'slaughter' });
      if (queue.length < n) queue.push({ word: w, activity: 'spell', phase: 'slaughter' });
    } else if (s.spelled === 0) {
      // Seen the structure but never written it: practise before testing.
      queue.push({ word: w, activity: 'spell', phase: 'slaughter' });
    } else {
      // It has been practised, so test it cold. This is the only activity
      // that can move a word toward slaughtered.
      queue.push({ word: w, activity: 'recall', phase: 'slaughter' });
    }
  }
  return queue.slice(0, n);
}
