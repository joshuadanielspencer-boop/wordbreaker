// Generates js/content/nonsense.js from Kilpatrick's Appendix H.
//
//   node tools/gen-nonsense.mjs
//
// The appendix holds 3,000+ nonsense words, but the transcription is OCR of a
// multi-column page, so the token stream carries real debris (`bdloar`, `aoe`,
// `aan`). Everything here is therefore validated structurally rather than
// trusted: a token survives only if it parses as a legal English syllable.
//
// Real words are rejected outright. Kilpatrick deliberately excluded them, and
// a nonsense-word task containing a real word stops measuring what it claims
// to. Over-rejecting is safe — there are thousands of candidates — so anything
// the dictionary recognises goes, even where the dictionary is being odd.
//
// Multisyllabic items are NOT scraped. The OCR is least reliable there, and
// Kilpatrick tells teachers to build them by adding endings to short ones
// instead, which gives clean material and full control over the pattern.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SRC = '/Users/joshuaspencer/Dropbox/Miscellaneous/Equipped for Reading Success by David Kilpatrick/Equipped for Reading Success - markdown/appendix-H.md';
const DICT = '/usr/share/dict/words';

if (!existsSync(SRC)) { console.error('appendix-H.md not found at ' + SRC); process.exit(1); }
if (!existsSync(DICT)) { console.error('no dictionary; cannot verify these are non-words'); process.exit(1); }

const real = new Set(readFileSync(DICT, 'utf8').split('\n').map(w => w.trim().toLowerCase()));

// Legal English syllable onsets. Anything outside this is OCR damage.
const ONSETS = new Set(['', 'b','c','d','f','g','h','j','k','l','m','n','p','q','r','s','t','v','w','x','y','z',
  'bl','br','ch','cl','cr','dr','dw','fl','fr','gl','gr','kn','pl','pr','qu','sc','sh','sk','sl','sm','sn',
  'sp','st','sw','th','tr','tw','wh','wr','ph','gn','scr','shr','spl','spr','squ','str','thr','sch','phr','chr']);

const CODAS = new Set(['', 'b','c','d','f','g','k','l','m','n','p','r','s','t','v','x','z',
  'ch','ck','sh','th','ng','nk','nd','nt','mp','st','sp','sk','ft','pt','ct','lt','ld','lk','lp','lf','lm',
  'rt','rd','rk','rp','rm','rn','rb','rl','rf','rs','ss','ll','ff','zz','tch','dge','nch','lch','rch','nge',
  'sts','nts','mps','x']);

const NUCLEI = new Set(['a','e','i','o','u','y',
  'ai','ay','ea','ee','ie','oa','oe','ow','ou','oo','oi','oy','au','aw','ew','ue','ui','igh']);

const BLOCK = ['ass','butt','crap','damn','fart','hell','piss','poo','sex','shi','suck','turd',
  'anal','anus','bum','cok','coc','dik','dic','fuk','fuc','kunt','cunt','nig','tit','vag','rape','nazi','wee'];

/** Split a monosyllable into onset / nucleus / coda, or return null. */
function parseSyllable(w) {
  // Longest nucleus first so `oo` beats `o`.
  const nuclei = [...NUCLEI].sort((a, b) => b.length - a.length);
  for (let i = 0; i < w.length; i++) {
    for (const n of nuclei) {
      if (!w.startsWith(n, i)) continue;
      let onset = w.slice(0, i);
      let coda = w.slice(i + n.length);
      // A trailing silent e belongs to the nucleus, not the coda.
      let silentE = false;
      if (coda.length >= 2 && coda.endsWith('e')) { coda = coda.slice(0, -1); silentE = true; }
      if (!ONSETS.has(onset) || !CODAS.has(coda)) continue;
      if (coda === '' && !silentE && n.length === 1 && 'aeiou'.includes(n) && w.length > 2) continue;
      return { onset, nucleus: n, coda, silentE };
    }
  }
  return null;
}

function classify(p, word) {
  if (/ar|er|ir|or|ur/.test(word) && !p.silentE) return 'r_controlled';
  if (p.silentE) return 'silent_e';
  if (p.nucleus.length > 1) return 'vowel_team';
  if (/ch|sh|th|ph|wh|ck/.test(word)) return 'digraph';
  if (p.onset.length > 1 || p.coda.length > 1) return 'blend';
  return 'cvc';
}

const txt = readFileSync(SRC, 'utf8');
const body = txt.slice(txt.indexOf('### List Of Nonsense Words'));
const tokens = [...new Set(body.match(/\b[a-z]{3,8}\b/g) || [])];

const kept = new Map();
const rejected = { real: 0, unparsable: 0, blocked: 0 };

for (const t of tokens) {
  if (real.has(t)) { rejected.real++; continue; }
  if (BLOCK.some(b => t.includes(b))) { rejected.blocked++; continue; }
  const p = parseSyllable(t);
  if (!p) { rejected.unparsable++; continue; }
  // Onsetless fragments (`ent`, `est`, `ane`) read as suffixes rather than as
  // words, and Kilpatrick's own lists are built as onset + rime.
  if (!p.onset) { rejected.onsetless = (rejected.onsetless || 0) + 1; continue; }
  kept.set(t, classify(p, t));
}

// Multisyllabic items, built rather than scraped — Kilpatrick's own advice.
const ENDINGS = [
  { suffix: 'ing', double: true }, { suffix: 'ed', double: true },
  { suffix: 'er', double: true }, { suffix: 'ful' }, { suffix: 'less' },
];
const multi = [];
const bases = [...kept].filter(([w, k]) => k === 'cvc' || k === 'blend').slice(0, 60);
for (const [w] of bases) {
  const e = ENDINGS[multi.length % ENDINGS.length];
  const last = w.at(-1), prev = w.at(-2);
  // Short vowel + single final consonant doubles before a vowel ending.
  const doubles = e.double && 'aeiou'.includes(prev) && !'aeiouwxy'.includes(last);
  const built = w + (doubles ? last : '') + e.suffix;
  if (real.has(built) || BLOCK.some(b => built.includes(b))) continue;
  multi.push(built);
  if (multi.length >= 40) break;
}

const byPattern = {};
for (const [w, k] of kept) (byPattern[k] ||= []).push(w);
for (const k of Object.keys(byPattern)) byPattern[k].sort();

const file = `// GENERATED by tools/gen-nonsense.mjs — do not edit by hand.
//
// Nonsense words from Kilpatrick's Appendix H, grouped by the spelling pattern
// they exercise. Every one has been checked NOT to be a real word and to parse
// as a legal English syllable, which is what removes the OCR debris the
// multi-column source leaves behind.
//
// MULTISYLLABIC items are built from the short ones by adding endings rather
// than scraped, because the OCR is least reliable on those pages and because
// building them is what Kilpatrick tells teachers to do.

export const NONSENSE = ${JSON.stringify(byPattern, null, 2)};

export const NONSENSE_MULTI = ${JSON.stringify(multi, null, 2)};

/** Difficulty order, easiest first. */
export const PATTERN_ORDER = ['cvc', 'blend', 'digraph', 'silent_e', 'vowel_team', 'r_controlled'];

export const PATTERN_LABEL = {
  cvc: 'three sounds',
  blend: 'consonant blends',
  digraph: 'two letters, one sound',
  silent_e: 'silent e',
  vowel_team: 'vowel teams',
  r_controlled: 'r-controlled vowels',
};
`;
writeFileSync(resolve(ROOT, 'js/content/nonsense.js'), file);

const total = [...kept].length;
console.log(`js/content/nonsense.js — ${total} nonsense words + ${multi.length} multisyllabic`);
console.log('by pattern:', Object.fromEntries(Object.entries(byPattern).map(([k, v]) => [k, v.length])));
console.log('rejected:', rejected);
console.log('\nsamples:');
for (const k of ['cvc', 'blend', 'digraph', 'silent_e', 'vowel_team', 'r_controlled'])
  console.log(`  ${k.padEnd(13)} ${(byPattern[k] || []).slice(0, 10).join(' ')}`);
console.log(`  multisyllabic ${multi.slice(0, 8).join(' ')}`);
