// The runtime content model: everything the app actually queries.
//
// Allomorph lists and morpheme families are DERIVED from the corpus, never
// hand-maintained, so they cannot drift out of sync with words.js.

import { MORPHEMES, ORIGIN_LABEL } from './morphemes.js';
import { WORDS, parseSpec } from './words.js';
import { NOTES } from './notes.js';
import { DERIVED_LITS } from './notes-derived.js';
import { PSEUDO_SPECS } from './pseudo.js';
import { MISSIONS, missionEntries } from './missions.js';

const M = {};
for (const [id, def] of Object.entries(MORPHEMES)) {
  // `canonical` is the hand-authored headword and is what the Codex shows.
  // `forms` grows from observed usage and is sorted longest-first for
  // matching, which is exactly the wrong order for display — hence both.
  M[id] = { id, ...def, canonical: def.forms[0], forms: new Set(def.forms), family: [] };
}

for (const w of WORDS) {
  w.id = 'w:' + w.text;
  w.level = w.parts.length;              // 2 parts = easy, 5 = monstrous
  w.morphemes = w.parts.map(p => p.m);
  for (const p of w.parts) {
    M[p.m].forms.add(p.surface);
    M[p.m].family.push(w.text);
  }
}

for (const m of Object.values(M)) {
  m.forms = [...m.forms].sort((a, b) => b.length - a.length);
  m.family.sort((a, b) => a.length - b.length);
}

export const MORPH = M;
export const WORD_LIST = WORDS;
export const BY_TEXT = Object.fromEntries(WORDS.map(w => [w.text, w]));

/**
 * How many words a morpheme needs behind it before it is worth DRILLING.
 * Fewer than this and there is no way to show the piece behaving consistently
 * across contexts, which is the thing that actually builds recognition — you
 * would just be teaching the words.
 */
export const DRILL_MIN = 4;

/** Morphemes with at least `min` words behind them. */
export function teachableMorphemes(min = 2) {
  return Object.values(M).filter(m => m.family.length >= min);
}

/** The set the scheduler is allowed to build sessions around. */
export function drillableMorphemes() {
  return Object.values(M).filter(m => m.family.length >= DRILL_MIN);
}

/** Everything with at least one word — what the Codex displays. */
export function collectableMorphemes() {
  return Object.values(M).filter(m => m.family.length >= 1);
}

export function originLabel(o) { return ORIGIN_LABEL[o] || o; }

/** Words that use every morpheme in `ids` and nothing outside `allowed`. */
export function wordsUsing(ids, { maxLevel = 9, minLevel = 2 } = {}) {
  const want = new Set(ids);
  return WORDS.filter(w =>
    w.level >= minLevel && w.level <= maxLevel &&
    w.morphemes.some(id => want.has(id)));
}

export const PART_TYPE = { prefix: 'prefix', root: 'root', suffix: 'suffix' };
export function partType(morphemeId) { return M[morphemeId].type; }

// ------------------------------------------------------------ Word Detective
// Hand-written notes always win — they carry a story, which is the point of
// the mode. Derived meanings are true but not interesting, so they are marked
// as such and the UI does not promise a story for them.
for (const w of WORDS) {
  w.note = NOTES[w.text]
    || (DERIVED_LITS[w.text] ? { lit: DERIVED_LITS[w.text], derived: true } : null);
}

/** Words with a hand-authored literal reading — the Detective pool. */
export const DETECTIVE = WORDS.filter(w => w.note);

/**
 * Wrong answers for `word`, drawn from words that share its ROOT wherever
 * possible. "to carry in / to carry out / to carry from underneath" makes the
 * prefix the only thing that can decide it, which is the point.
 */
export function distractorsFor(word, n = 3) {
  const root = word.morphemes.find(id => M[id].type === 'root');
  const lit = word.note.lit;
  const seen = new Set([lit]);

  const rank = w => {
    if (w.text === word.text) return -1;
    if (seen.has(w.note.lit)) return -1;
    const shared = w.morphemes.filter(id => word.morphemes.includes(id));
    if (!shared.length) return 0.1;
    if (root && w.morphemes.includes(root)) return 10 + shared.length;
    return 1 + shared.length;
  };

  const pool = DETECTIVE
    .map(w => ({ w, r: rank(w) }))
    .filter(x => x.r > 0)
    .sort((a, b) => b.r - a.r || (Math.random() - 0.5));

  // A decoy that merely adds or drops a suffix phrase ("to carry across" vs
  // "the act of carrying across") reads as a trick rather than a test.
  const tooClose = (a, b) => {
    const norm = t => t.replace(/^(to|the act of|a|one who)\s+/, '').replace(/ing\b/g, '');
    const [x, y] = [norm(a), norm(b)];
    return x.includes(y) || y.includes(x);
  };

  const out = [];
  for (const { w } of pool) {
    if (out.length >= n) break;
    const cand = w.note.lit;
    if (seen.has(cand)) continue;
    if (tooClose(cand, lit)) continue;
    seen.add(cand);
    out.push({ lit: cand, from: w.text });
  }
  return out;
}

// ------------------------------------------------- words that do not exist
// Same shape as a real word so every activity can consume them unchanged.
export const PSEUDO = PSEUDO_SPECS.map(spec => {
  const w = parseSpec(spec);
  w.id = 'p:' + w.text;
  w.level = w.parts.length;
  w.morphemes = w.parts.map(p => p.m);
  w.pseudo = true;
  return w;
});

// ------------------------------------------------------ spelling slaughter
// Curriculum words. Parsed exactly like corpus words so every activity can
// consume them, but kept out of WORD_LIST so the morphology scheduler is not
// quietly steered by whatever the school is teaching this week.
export const MISSION_WORDS = {};
export const MISSION_LIST = MISSIONS.map(m => {
  const words = missionEntries(m).map(rec => {
    const w = parseSpec(rec.spec);
    w.id = 'm:' + w.text;
    w.level = w.parts.length;
    w.morphemes = w.parts.map(p => p.m);
    w.display = rec.display || w.text;
    w.def = rec.def;
    w.mission = m.id;
    w.group = rec.group;
    w.groupLabel = rec.groupLabel;
    if (rec.note) w.note = { lit: rec.note, curriculum: true };
    MISSION_WORDS[w.text] = w;
    return w;
  });
  return { ...m, words };
});

export function missionById(id) { return MISSION_LIST.find(m => m.id === id); }
