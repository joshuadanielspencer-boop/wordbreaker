// Message selection.
//
// Two jobs: keep the frequency budget honest (most feedback is terse, the
// jokes are rare enough to still land), and guarantee that gentle contexts
// stay gentle no matter what the caller asks for.

import { BANKS, GENTLE_CONTEXTS } from './banks.js';
import { REWARDS, REWARD_RATE } from './rewards.js';

// plain / flavor / joke / absurd
const BUDGET = {
  normal:       [0.88, 0.12, 0.00, 0.00],
  funny:        [0.70, 0.20, 0.08, 0.02],
  ridiculous:   [0.40, 0.30, 0.22, 0.08],
  unsupervised: [0.10, 0.24, 0.40, 0.26],
};

const TIERS = ['plain', 'flavor', 'joke', 'absurd'];
const recentlyUsed = [];
const NO_REPEAT = 14;

function rollTier(personality) {
  const w = BUDGET[personality] || BUDGET.funny;
  let r = Math.random();
  for (let i = 0; i < w.length; i++) {
    if ((r -= w[i]) < 0) return TIERS[i];
  }
  return 'plain';
}

function fill(tpl, vars) {
  return tpl
    // {n,s} -> the plural ending for however many {n} is: "1 word", "3 words".
    .replace(/\{(\w+),([a-z]*):([a-z]+)\}/g, (m, k, many, one) =>
      vars[k] === undefined ? m : (Number(vars[k]) === 1 ? one : many))
    .replace(/\{(\w+),([a-z]*)\}/g, (m, k, suffix) =>
      vars[k] === undefined ? m : (Number(vars[k]) === 1 ? '' : suffix))
    .replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}

/**
 * @param {string} context  key into BANKS
 * @param {object} vars     template substitutions
 * @param {string} personality  normal | funny | ridiculous | unsupervised
 */
export function say(context, vars = {}, personality = 'funny') {
  const bank = BANKS[context];
  if (!bank) return '';

  let tier = rollTier(personality);

  // Hard floor: nothing above `flavor` may fire after a mistake, whatever
  // the personality setting says.
  if (GENTLE_CONTEXTS.has(context) && (tier === 'joke' || tier === 'absurd')) {
    tier = 'flavor';
  }

  // Fall back down the tiers until we find one with content.
  let idx = TIERS.indexOf(tier);
  let pool = [];
  while (idx >= 0 && !(pool = bank[TIERS[idx]] || []).length) idx--;
  if (!pool.length) return '';

  // Avoid repeating anything from the last NO_REPEAT lines.
  const fresh = pool.filter(t => !recentlyUsed.includes(t));
  const choices = fresh.length ? fresh : pool;
  const tpl = choices[Math.floor(Math.random() * choices.length)];

  recentlyUsed.push(tpl);
  if (recentlyUsed.length > NO_REPEAT) recentlyUsed.shift();

  return fill(tpl, vars);
}

/**
 * A rare reward line, or null. Fires only after a correct answer — callers
 * must not invoke this on an error path. Each line is shown at most once until
 * the list is exhausted, so repeat sessions stay fresh.
 *
 * @param {object} profile  mutated: `profile.rewards` records what was shown
 * @param {string} personality
 * @param {boolean} force   skip the dice roll (used for previews)
 */
export function reward(profile, personality = 'funny', force = false) {
  const rate = REWARD_RATE[personality] ?? REWARD_RATE.funny;
  if (!force && Math.random() > rate) return null;

  const shown = new Set(profile?.rewards || []);
  let pool = REWARDS.filter(r => !shown.has(r));
  if (!pool.length) {                       // exhausted — start the cycle over
    if (profile) profile.rewards = [];
    pool = REWARDS;
  }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  if (profile) (profile.rewards ||= []).push(pick);
  return pick;
}

/** Test hook: assert no gentle context can ever reach the joke tiers. */
export function auditGentleBanks() {
  const bad = [];
  for (const c of GENTLE_CONTEXTS) {
    for (const t of ['joke', 'absurd']) {
      if ((BANKS[c] || {})[t]?.length) bad.push(`${c}.${t}`);
    }
  }
  return bad;
}
