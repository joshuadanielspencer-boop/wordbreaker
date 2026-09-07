// Choosing items for the anti-compensation drills.
//
// Both draw on words he has already MET. The point of these activities is the
// distortion or the channel, not the vocabulary — an unfamiliar word would
// confound the measurement, and a low score would no longer tell you anything
// about the habit.

import { WORD_LIST, BY_TEXT, MISSION_WORDS } from '../content/lexicon.js';
import { load } from './store.js';
import { speechAvailable } from './speech.js';
import { DISTORTION_KEYS } from '../activities/ransom.js';

/** Words with any history, newest-seen last. Falls back to easy corpus words. */
function metWords() {
  const S = load();
  const seen = new Map();
  for (const r of (S?.log || [])) {
    const text = String(r.item).replace(/^[a-z]:/, '');
    const w = BY_TEXT[text] || MISSION_WORDS[text];
    if (w) seen.set(text, w);
  }
  if (seen.size >= 8) return [...seen.values()];
  // Cold start: short, plainly-built words so the drill is about the drill.
  return WORD_LIST.filter(w => w.level === 2 && w.text.length <= 9).slice(0, 40);
}

/** How recently each distortion type was used, so they rotate rather than stick. */
function distortionRecency() {
  const S = load();
  const last = Object.fromEntries(DISTORTION_KEYS.map(k => [k, 0]));
  for (const r of (S?.log || [])) {
    if (r.activity === 'ransom' && r.detail?.distortion) {
      last[r.detail.distortion] = Math.max(last[r.detail.distortion] || 0, r.t);
    }
  }
  return last;
}

export function ransomItems(n = 1) {
  const pool = metWords();
  if (!pool.length) return [];
  const recency = distortionRecency();
  // Least-recently-seen distortion first: adapting to one type is the failure
  // mode this activity exists to prevent.
  const kinds = DISTORTION_KEYS.slice().sort((a, b) => recency[a] - recency[b]);

  // A stacked word grows straight down the screen, so long words go to the
  // other distortions rather than becoming a scrolling column.
  const MAX_VERTICAL = 9;

  return Array.from({ length: n }, (_, i) => {
    const distortion = kinds[i % kinds.length];
    const eligible = distortion === 'vertical'
      ? pool.filter(w => w.text.length <= MAX_VERTICAL)
      : pool;
    const from = eligible.length ? eligible : pool;
    return {
      word: from[Math.floor(Math.random() * from.length)],
      distortion: eligible.length ? distortion : 'caps',
      activity: 'ransom',
      phase: 'ransom',
    };
  });
}

export function spelloutItems(n = 1) {
  if (!speechAvailable()) return [];
  // Long words become a memory-span task rather than a decoding one, so cap it.
  const pool = metWords().filter(w => w.text.length <= 11);
  if (!pool.length) return [];
  return Array.from({ length: n }, () => ({
    word: pool[Math.floor(Math.random() * pool.length)],
    activity: 'spellout',
    phase: 'spellout',
  }));
}

/**
 * One extra anti-compensation item per session, alternating between the two so
 * neither becomes the thing he learns to do rather than the thing it trains.
 */
export function antiCompensationExtra() {
  const S = load();
  const lastOf = act => {
    let t = 0;
    for (const r of (S?.log || [])) if (r.activity === act) t = Math.max(t, r.t);
    return t;
  };
  const wantSpellout = speechAvailable() && lastOf('spellout') < lastOf('ransom');
  const picked = wantSpellout ? spelloutItems(1) : ransomItems(1);
  return picked.length ? picked : ransomItems(1);
}
