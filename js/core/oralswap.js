// SOUND SWAP, ALOUD — the adult-administered half of phoneme manipulation.
//
// js/activities/manipulate.js is the solo version: he hears a word and TYPES
// what is left. That works without an adult and is honest about its cost — it
// adds a spelling step, and typing latency is his hands rather than his
// phonology, so it can never be compared with a two-second spoken window.
//
// This is the other half. The adult reads the item, the child SAYS the answer,
// and the adult judges it inside about two seconds — which is the form
// Kilpatrick's One Minute Activities actually take, and the only form in which
// automaticity means anything.
//
// It is still INTERVENTION rather than measurement, so it stays out of the
// evidence view. The PAST remains the instrument; this is the exercise.
//
// The rungs below are this app's own — syllables, first sound, last sound,
// first-sound swap, vowel swap. They are NOT Kilpatrick's lettered levels and
// must never be labelled as such: a made-up level reading like a real one is
// the same error as inventing PAST items, and his sequencing advice is keyed
// to his levels, not to these.

import { load } from './store.js';
import { push as logPush } from './log.js';
import { manipulationItems, ORAL_ACTIVITY, itemId } from './manipdrills.js';
import { MANIP_ORDER, MANIP_LABEL } from '../content/manipulation.js';

export { MANIP_ORDER, MANIP_LABEL, ORAL_ACTIVITY };

/** A minute's worth. Kilpatrick's block is a minute; the name is not decorative. */
export const RUN_SECONDS = 60;

/**
 * Items for one run, at a chosen rung. Drawn from the shared bank and never
 * repeated in either mode.
 */
export function oralItems(level, n = 20) {
  const all = manipulationItems(n * 3, { requireSpeech: false });
  const wanted = all.filter(i => i.level === level);
  const rest = all.filter(i => i.level !== level);
  // Prefer the chosen rung, then anything else rather than running dry
  // mid-minute, which would end the block for the wrong reason.
  return [...wanted, ...rest].slice(0, n);
}

/** Record one item as the adult judged it. */
export function recordOral(item, verdict, ms) {
  logPush({
    activity: ORAL_ACTIVITY,
    item: 'mn:' + item.id,
    correct: verdict !== 'wrong',
    ms: Math.round(ms || 0),
    credit: {},
    detail: {
      item: item.id,
      level: item.level,
      word: item.target,
      answer: item.answer,
      automatic: verdict === 'auto',
      verdict,
    },
  });
}

export function oralHistory() {
  const S = load();
  const rows = (S?.log || []).filter(r => r.activity === ORAL_ACTIVITY && r.detail);
  // Runs are a minute apart at most; group anything within five minutes.
  const runs = [];
  for (const r of rows.sort((a, b) => a.t - b.t)) {
    const last = runs[runs.length - 1];
    if (last && r.t - last.end < 5 * 60000) {
      last.rows.push(r); last.end = r.t;
    } else {
      runs.push({ t: r.t, end: r.t, rows: [r] });
    }
  }
  return runs.map(run => {
    const n = run.rows.length;
    const auto = run.rows.filter(r => r.detail.automatic).length;
    const right = run.rows.filter(r => r.correct).length;
    return {
      t: run.t,
      level: run.rows[run.rows.length - 1].detail.level,
      items: n,
      correct: right,
      automatic: auto,
      automaticShare: n ? auto / n : 0,
    };
  });
}

/**
 * Kilpatrick advances after three or four consecutive automatic days. This
 * reports whether that has happened rather than advancing on its own — the
 * judgement is the adult's, and an app that silently moved the goalposts
 * would be deciding something it cannot hear.
 */
export function readyToAdvance(level, need = 3) {
  const runs = oralHistory().filter(r => r.level === level);
  if (runs.length < need) return false;
  return runs.slice(-need).every(r => r.items >= 5 && r.automaticShare >= 0.8);
}

export function suggestedLevel() {
  const runs = oralHistory();
  if (!runs.length) return MANIP_ORDER[0];
  const last = runs[runs.length - 1].level;
  const at = MANIP_ORDER.indexOf(last);
  if (at < 0) return MANIP_ORDER[0];
  return readyToAdvance(last) ? MANIP_ORDER[Math.min(at + 1, MANIP_ORDER.length - 1)] : last;
}
