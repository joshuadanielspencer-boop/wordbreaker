// Generates js/content/notes-derived.js.
//
//   node tools/gen-notes.mjs
//
// Word Detective needs a literal meaning for a word AND for its decoys, so an
// unannotated word costs twice: it cannot be an item, and it cannot be a decoy
// for anything else. Measuring what the scheduler actually reaches for showed
// the demand is overwhelmingly DERIVED forms — rejection, instructor, formal —
// whose bases are already annotated by hand.
//
// Those do not want hand-writing. `reject` means "to throw back", so
// `rejection` means "the act of throwing back", mechanically. This derives
// them, leaving the hand-written notes in notes.js for the words that deserve
// an actual story.
//
// Bases are matched on MORPHEME IDS, not spelling: `reduction` is [re, duct,
// tion] and its base is [re, duct], which is `reduce` — the spelling never
// lines up because of the allomorph.

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MORPH, WORD_LIST } from '../js/content/lexicon.js';
import { NOTES } from '../js/content/notes.js';

const ROOT = resolve(import.meta.dirname, '..');

const firstSense = s => s.split(',')[0].trim();
const stripTo = s => firstSense(s).replace(/^to\s+/, '');

/** carry -> carrying, place -> placing, throw back -> throwing back */
function gerund(phrase) {
  const [head, ...rest] = stripTo(phrase).split(' ');
  let g = head;
  if (/e$/.test(g) && !/ee$/.test(g)) g = g.slice(0, -1) + 'ing';
  else if (/(^|[^aeiou])[aeiou][bdgmnpt]$/.test(g)) g = g + g.slice(-1) + 'ing';
  else g = g + 'ing';
  return [g, ...rest].join(' ');
}

/** carry -> carries, throw back -> throws back */
function thirdPerson(phrase) {
  const [head, ...rest] = stripTo(phrase).split(' ');
  let v = head;
  if (/[^aeiou]y$/.test(v)) v = v.slice(0, -1) + 'ies';
  else if (/(s|ch|sh|x|z)$/.test(v)) v = v + 'es';
  else v = v + 's';
  return [v, ...rest].join(' ');
}

const isVerb = s => /^to\s/.test(s);

/** A single plain word once "to " is off the front — `help`, `care`, `bend`.
 *  Not `be afraid`, and not `go toward`. */
const nounish = s => /^[a-z]+$/.test(stripTo(firstSense(s)));

// Count nouns need an article; mass nouns do not. "to do with a tooth" reads;
// "to do with tooth" does not, and "to do with a death" does not either.
const COUNT_NOUNS = new Set([
  'tooth', 'ship', 'star', 'foot', 'hand', 'name', 'angle', 'circle', 'wheel',
  'mind', 'friend', 'god', 'place', 'part', 'body', 'sign', 'mark', 'ruler',
  'chief', 'sailor', 'companion', 'end', 'limit', 'shape', 'sound',
]);

const IRREGULAR_PLURAL = { tooth: 'teeth', foot: 'feet', person: 'people' };
function plural(noun) {
  const parts = noun.split(' ');
  const head = parts[0];
  parts[0] = IRREGULAR_PLURAL[head]
    || (/[^aeiou]y$/.test(head) ? head.slice(0, -1) + 'ies'
      : /(s|ch|sh|x|z)$/.test(head) ? head + 'es'
      : head + 's');
  return parts.join(' ');
}
function article(noun) {
  const head = noun.split(' ')[0];
  if (!COUNT_NOUNS.has(head)) return noun;
  return (/^[aeiou]/.test(head) ? 'an ' : 'a ') + noun;
}

/**
 * seen, heard, believed, bent. `-able` means "able to be VERBED", which needs
 * a past participle, and that is why this suffix was left out originally. The
 * irregular list is short because the corpus is: only verbs that actually
 * appear as roots are here.
 */
const IRREGULAR_PARTICIPLE = {
  see: 'seen', hear: 'heard', hold: 'held', bend: 'bent', send: 'sent',
  build: 'built', break: 'broken', take: 'taken', throw: 'thrown',
  write: 'written', speak: 'spoken', choose: 'chosen', do: 'done',
  lead: 'led', feel: 'felt', read: 'read', stand: 'stood', run: 'run',
  come: 'come', go: 'gone', give: 'given', make: 'made', put: 'put',
  drive: 'driven', tear: 'torn', bring: 'brought', teach: 'taught',
  think: 'thought', know: 'known', say: 'said', eat: 'eaten',
};
function participle(phrase) {
  const [head, ...rest] = stripTo(phrase).split(' ');
  const irr = IRREGULAR_PARTICIPLE[head];
  let v = irr;
  if (!v) {
    if (/e$/.test(head)) v = head + 'd';
    else if (/[^aeiou]y$/.test(head)) v = head.slice(0, -1) + 'ied';
    else if (/(^|[^aeiou])[aeiou][bdgmnpt]$/.test(head)) v = head + head.slice(-1) + 'ed';
    else v = head + 'ed';
  }
  return [v, ...rest].join(' ');
}

/**
 * What a prefix does to the verb in front of it, in one word a child would
 * use. This is the composition the whole app is about — `ex` + `press` is "to
 * press out" — and it unlocks far more than the suffix frames do, because
 * these words are then bases for -tion, -ive and -ment in turn.
 *
 * Only prefixes whose direction is plain are listed. `dis` is missing on
 * purpose: it negates in `disagree` and reverses in `discover`, and guessing
 * between them would produce a meaning that is simply false.
 */
const DIRECTION = {
  ex: 'out', in_into: 'in', re: 'back', con: 'together', sub: 'under',
  trans: 'across', pro: 'forward', de: 'down', inter: 'between',
  per: 'through', ob: 'against', circum: 'around', pre: 'before',
  post: 'after', super: 'above', ad: 'toward', se: 'apart', over: 'too much',
  mis: 'wrongly', tele: 'far off', intra: 'inside', contra: 'against',
};

// Prefixes that mean "not", and only ever mean "not". `un` reverses in front
// of a verb (`uncover` is not "not cover"), so the wrapper below applies it
// only to adjectives.
const NEGATORS = new Set(['un', 'in_not', 'non']);
const ADJ_SUFFIX = new Set(['able', 'ful', 'less', 'ous', 'ive', 'al', 'ic', 'ant', 'ed']);

// Frames, keyed by the trailing suffix morpheme. Only suffixes that compose
// reliably are here. `-ly` and `-ity` are deliberately absent: both want the
// base WORD rather than its literal reading, and "in a full of care way" is
// not English.
const FRAMES = {
  tion: { needs: 'verb', build: b => `the act of ${gerund(b)}` },
  ure:  { needs: 'verb', build: b => `the act of ${gerund(b)}` },
  // "one who" is wrong half the time — a container and a motor are not people.
  // "the one that" covers agents and instruments alike.
  er:   { needs: 'verb', build: b => `the one that ${thirdPerson(b)}` },
  ive:  { needs: 'verb', build: b => `tending to ${stripTo(b)}` },
  ment: { needs: 'verb', build: b => `the result of ${gerund(b)}` },
  // `able to be gone toward` is not English. A participle is only safe on a
  // one-word verb, so a base carrying a direction is refused.
  able: { needs: 'verb', ok: nounish, build: b => `able to be ${participle(b)}` },
  al:   { needs: 'noun', build: b => `to do with ${article(firstSense(b))}` },
  ic:   { needs: 'noun', build: b => `to do with ${article(firstSense(b))}` },
  ous:  { needs: 'noun', build: b => `full of ${firstSense(b)}` },
  // -ful and -less want a noun. Many roots are glossed as verbs whose bare
  // stem is also the noun ("to help" -> help), which reads fine. "to be
  // afraid" has no such stem, and produced "full of be afraid" — so anything
  // that is not a single plain word is refused rather than mangled.
  ful:  { needs: 'any', ok: nounish, build: b => `full of ${stripTo(firstSense(b))}` },
  less: { needs: 'any', ok: nounish, build: b => `without ${stripTo(firstSense(b))}` },
  ness: { needs: 'noun', build: b => `the state of being ${firstSense(b)}` },
  ist:  { needs: 'noun', build: b => `one who works with ${plural(firstSense(b))}` },
  ism:  { needs: 'noun', build: b => `a belief about ${firstSense(b)}` },
  ary:  { needs: 'noun', build: b => `a place for ${plural(firstSense(b))}` },
};

// Index annotated words by their morpheme signature so a base can be found
// through its allomorph.
const bySignature = new Map();
for (const w of WORD_LIST) {
  const note = NOTES[w.text];
  if (!note) continue;
  bySignature.set(w.morphemes.join('+'), note.lit);
}

const lits = new Map(bySignature);          // signature -> literal reading
const derived = new Map();                  // text -> lit

/**
 * ONE prefix + a verb root, e.g. ex + press -> "to press out".
 *
 * Two prefixes were tried and declined. Stacking directions reads badly at the
 * end of a phrase — `re` means both "again" and "back", and whichever is
 * chosen, one of "the act of building together back" or "to lead again"
 * is wrong. It bought two words and cost the grammar of both.
 */
function fromPrefixes(ids) {
  if (ids.length !== 2) return null;
  const rootId = ids[ids.length - 1];
  const root = MORPH[rootId];
  if (!root || root.type !== 'root' || !isVerb(root.gloss)) return null;

  // `view` is glossed "to look at", and a direction on the end of that gives
  // "to look at back". Only single-word verbs take one cleanly.
  if (!nounish(root.gloss)) return null;

  const prefixes = ids.slice(0, -1);
  if (!prefixes.every(id => MORPH[id]?.type === 'prefix' && DIRECTION[id])) return null;

  return `to ${stripTo(root.gloss)} ${DIRECTION[prefixes[0]]}`;
}

/** not + an adjective, e.g. in + visible -> "not able to be seen". */
function fromNegation(w) {
  const ids = w.morphemes;
  if (ids.length < 2 || !NEGATORS.has(ids[0])) return null;
  if (!ADJ_SUFFIX.has(ids[ids.length - 1])) return null;
  const inner = lits.get(ids.slice(1).join('+'));
  return inner ? `not ${inner}` : null;
}

/**
 * The literal reading of a run of morphemes, whether or not English happens to
 * have a word for it.
 *
 * `reconstruction` is re + con + struct + tion, and its base is re + con +
 * struct — which is not a corpus word, so chaining through real words alone
 * never reached it. But the pieces compose perfectly well on their own: "to
 * build together again". The base only has to exist as a MEANING for the word
 * built on top of it to be derivable.
 */
function litForIds(ids) {
  const known = lits.get(ids.join('+'));
  if (known) return known;
  // A bare root falls back to the root's own gloss: `formal` is form + al, and
  // `form` is not a corpus word, but the root means "shape".
  if (ids.length === 1 && MORPH[ids[0]]?.type === 'root') return MORPH[ids[0]].gloss;
  return fromPrefixes(ids);
}

function fromSuffix(w) {
  const last = w.morphemes[w.morphemes.length - 1];
  const frame = FRAMES[last];
  if (!frame) return null;

  const baseLit = litForIds(w.morphemes.slice(0, -1));
  if (!baseLit) return null;
  if (frame.needs !== 'any' && (frame.needs === 'verb') !== isVerb(baseLit)) return null;
  if (frame.ok && !frame.ok(baseLit)) return null;
  return frame.build(baseLit);
}

// Derivation CHAINS, so it runs to a fixed point. `reconstruct` has to exist
// before `reconstruction` can, and neither was reachable before: the first
// needs the prefix frame, the second needs the first. Each pass can only add.
let pass = 0;
for (;;) {
  let added = 0;
  pass++;
  for (const w of WORD_LIST) {
    if (NOTES[w.text] || derived.has(w.text)) continue;
    if (w.parts.length < 2) continue;

    const lit = fromSuffix(w) || fromNegation(w) || fromPrefixes(w.morphemes);
    if (!lit) continue;

    derived.set(w.text, lit);
    const sig = w.morphemes.join('+');
    if (!lits.has(sig)) lits.set(sig, lit);
    added++;
  }
  if (!added) break;
}

const rows = [...derived.entries()].map(([text, lit]) => ({ text, lit }))
  .sort((a, b) => a.text.localeCompare(b.text));

const body = rows.map(d => `  ${JSON.stringify(d.text)}: ${JSON.stringify(d.lit)},`).join('\n');
writeFileSync(resolve(ROOT, 'js/content/notes-derived.js'), `// GENERATED by tools/gen-notes.mjs — do not edit by hand.
//
// Literal meanings composed mechanically from a hand-written base note plus
// the trailing suffix: \`reject\` is "to throw back", so \`rejection\` is "the act
// of throwing back". Hand-written notes in notes.js always win, and only these
// carry no story — a derived meaning is true but not interesting.

export const DERIVED_LITS = {
${body}
};
`);

console.log(`js/content/notes-derived.js — ${rows.length} derived in ${pass} passes`);

console.log('\nsample:');
for (const d of rows.slice(0, 14)) console.log(`  ${d.text.padEnd(18)} ${d.lit}`);
