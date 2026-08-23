// Generates js/content/pseudo.js — legal English words that do not exist.
//
//   node tools/gen-pseudo.mjs
//
// Built from real morphemes in combinations English never happened to make.
// The point is transfer: a word he cannot possibly have memorised. If he can
// take apart `unspectable` and say it would mean "not able to be looked at",
// he owns the pieces. If he can only do it for words in the corpus, he has
// memorised 519 words and the teaching has not transferred.
//
// Generated offline, not at runtime, so every candidate can be checked against
// the system dictionary. A generator that invents a real word by accident —
// or something unrepeatable — is not something to discover in front of a
// ten-year-old.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { MORPH, drillableMorphemes, BY_TEXT } from '../js/content/lexicon.js';

const ROOT = resolve(import.meta.dirname, '..');
const DICT = '/usr/share/dict/words';
if (!existsSync(DICT)) {
  console.error(`no dictionary at ${DICT} — cannot verify these are non-words. Aborting.`);
  process.exit(1);
}
const real = new Set(readFileSync(DICT, 'utf8').split('\n').map(w => w.toLowerCase()));

// Substrings that must never appear in a generated word, however innocent the
// pieces were. Cheap insurance; the cost of getting this wrong is high.
const BLOCK = [
  'ass', 'butt', 'crap', 'damn', 'fart', 'hell', 'piss', 'poo', 'sex', 'shi',
  'suck', 'turd', 'wee', 'anal', 'anus', 'bum', 'cok', 'coc', 'dik', 'dic',
  'fuk', 'fuc', 'kunt', 'cunt', 'nig', 'tit', 'penis', 'vag', 'rape', 'nazi',
];

// Deterministic ordering so regenerating gives the same file.
const byId = ids => ids.slice().sort();

// Only PRODUCTIVE affixes — the ones English still attaches to new words, and
// therefore the ones that stay recognisable inside an unfamiliar one. `ad-`
// and `ob-` are excluded because real English only ever attaches them in
// assimilated form (ac-, af-, oc-, op-), so "adactal" is not a word English
// would ever have built.
const PRODUCTIVE_PREFIXES = [
  'un', 're', 'dis', 'mis', 'pre', 'post', 'sub', 'super', 'trans', 'inter',
  'ex', 'de', 'pro', 'circum', 'anti', 'auto', 'tele', 'micro',
  'mono', 'bi', 'tri', 'poly', 'semi', 'multi', 'non', 'over', 'hyper',
];
// Suffixes are split by what they can grammatically attach to. English will
// not build "mispeltion" or "debioly": -tion needs its own allomorph and -ly
// needs an adjective. The root glosses already encode the distinction — a verb
// root reads "to carry", a noun root reads "life" — so match on that.
const VERB_SUFFIXES = ['able', 'er', 'ive', 'ment'];   // attach to "to ..." roots
const NOUN_SUFFIXES = ['less', 'ful', 'ous', 'ic', 'al', 'ist'];  // attach to the rest
const PRODUCTIVE_SUFFIXES = [...VERB_SUFFIXES, ...NOUN_SUFFIXES];

const pool = drillableMorphemes();
const drillable = new Set(pool.map(m => m.id));
const prefixes = PRODUCTIVE_PREFIXES.filter(id => drillable.has(id)).map(id => MORPH[id]);
const suffixes = PRODUCTIVE_SUFFIXES.filter(id => drillable.has(id)).map(id => MORPH[id]);
// Latin and Greek roots only. Bolting an affix onto an everyday English base
// usually produces a real word, or an obviously silly one.
const roots = pool.filter(m => m.type === 'root' && m.origin !== 'old english');

/** Reject joins that produce something unpronounceable or ugly. */
function joinOk(a, b) {
  if (!a || !b) return false;
  const seam = a.slice(-2) + b.slice(0, 2);
  if (/(.)\1\1/.test(seam)) return false;                 // three of the same letter
  if (/[bcdfghjklmnpqrstvwxz]{4}/.test(seam)) return false; // four-consonant pileup
  if (a.slice(-1) === b[0] && !'aeiou'.includes(b[0])) return false; // doubled consonant at the seam
  return true;
}

function surfaceOf(m) {
  // The canonical form is the one he collected in the Codex, so it is the one
  // he stands the best chance of recognising in an unfamiliar word.
  return m.canonical;
}

/** How pleasant the whole thing is to say. Lower is better. */
function clunk(text, parts) {
  let score = text.length;
  for (let i = 0; i < parts.length - 1; i++) {
    const a = parts[i].s, b = parts[i + 1].s;
    const av = 'aeiou'.includes(a.slice(-1));
    const bv = 'aeiou'.includes(b[0]);
    if (av && bv) score += 4;              // vowel running straight into vowel
    if (!av && !bv) score += 1;            // consonant cluster at the seam
  }
  return score;
}

const out = [];
const seen = new Set();

function consider(parts) {
  // Single-letter pieces are invisible inside an unfamiliar word — "a+act+able"
  // is not a puzzle, it is a typo.
  if (parts.some(p => p.s.length < 2)) return;
  const text = parts.map(p => p.s).join('');
  if (text.length < 7 || text.length > 14) return;
  if (seen.has(text)) return;
  if (real.has(text)) return;                    // it turned out to be a real word
  if (BY_TEXT[text]) return;                     // already in the corpus
  if (BLOCK.some(b => text.includes(b))) return;
  for (let i = 0; i < parts.length - 1; i++)
    if (!joinOk(parts[i].s, parts[i + 1].s)) return;
  seen.add(text);
  out.push({
    text,
    root: parts.find(p => MORPH[p.m].type === 'root').m,
    clunk: clunk(text, parts),
    parts: parts.map(p => `${p.s}:${p.m}`),
  });
}

const isVerbRoot = m => /^to /.test(m.gloss);

for (const p of prefixes)
  for (const r of roots)
    for (const s of suffixes) {
      const ok = isVerbRoot(r) ? VERB_SUFFIXES.includes(s.id) : NOUN_SUFFIXES.includes(s.id);
      if (!ok) continue;
      consider([
        { s: surfaceOf(p), m: p.id },
        { s: surfaceOf(r), m: r.id },
        { s: surfaceOf(s), m: s.id },
      ]);
    }

// Take the two smoothest words per root, then cap how often any prefix or
// suffix repeats. Sorting the whole pool alphabetically and capping produced
// forty near-identical words all built on the same root.
const byRoot = new Map();
for (const c of out) {
  if (!byRoot.has(c.root)) byRoot.set(c.root, []);
  byRoot.get(c.root).push(c);
}

const AFFIX_CAP = 9;
const used = {};
const picked = [];
for (const [, cands] of [...byRoot].sort((a, b) => a[0].localeCompare(b[0]))) {
  cands.sort((a, b) => a.clunk - b.clunk || a.text.localeCompare(b.text));
  let taken = 0;
  for (const c of cands) {
    if (taken >= 4) break;
    const affixes = c.parts.map(p => p.split(':')[1]).filter(id => MORPH[id].type !== 'root');
    if (affixes.some(id => (used[id] || 0) >= AFFIX_CAP)) continue;
    affixes.forEach(id => used[id] = (used[id] || 0) + 1);
    picked.push(c);
    taken++;
  }
}
picked.sort((a, b) => a.text.localeCompare(b.text));

const body = picked.map(p => `  '${p.parts.join('|')}',`).join('\n');
const file = `// GENERATED by tools/gen-pseudo.mjs — do not edit by hand.
//
// Legal English words that do not exist, assembled from real morphemes. Every
// one has been checked against ${DICT} and is confirmed NOT to be a real word,
// and against the corpus so it is not a word he has already met.
//
// Same notation as words.js: surface:morphemeId, parts joined by "|".

export const PSEUDO_SPECS = [
${body}
];
`;

writeFileSync(resolve(ROOT, 'js/content/pseudo.js'), file);
console.log(`js/content/pseudo.js — ${picked.length} non-words from ${out.length} candidates`);
console.log('sample: ' + picked.slice(0, 12).map(p => p.text).join(', '));
