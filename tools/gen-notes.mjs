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
  else if (/^[a-z]*[aeiou][bdgmnpt]$/.test(g)) g = g + g.slice(-1) + 'ing';
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

// Frames, keyed by the trailing suffix morpheme. Only suffixes that compose
// reliably are here. `-able` is deliberately absent: it needs a past
// participle ("able to be seen"), which cannot be produced mechanically from
// "to see" without an irregular-verb table. Those stay hand-written.
const FRAMES = {
  tion: { needs: 'verb', build: b => `the act of ${gerund(b)}` },
  ure:  { needs: 'verb', build: b => `the act of ${gerund(b)}` },
  // "one who" is wrong half the time — a container and a motor are not people.
  // "the one that" covers agents and instruments alike.
  er:   { needs: 'verb', build: b => `the one that ${thirdPerson(b)}` },
  ive:  { needs: 'verb', build: b => `tending to ${stripTo(b)}` },
  ment: { needs: 'verb', build: b => `the result of ${gerund(b)}` },
  al:   { needs: 'noun', build: b => `to do with ${article(firstSense(b))}` },
  ic:   { needs: 'noun', build: b => `to do with ${article(firstSense(b))}` },
  ous:  { needs: 'noun', build: b => `full of ${firstSense(b)}` },
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

const derived = [];
const skipped = { noFrame: 0, noBase: 0, wrongType: 0 };

for (const w of WORD_LIST) {
  if (NOTES[w.text]) continue;
  if (w.parts.length < 2) continue;

  const last = w.morphemes[w.morphemes.length - 1];
  const frame = FRAMES[last];
  if (!frame) { skipped.noFrame++; continue; }

  const baseIds = w.morphemes.slice(0, -1);
  let baseLit = bySignature.get(baseIds.join('+'));

  // A bare root falls back to the root's own gloss: `formal` is form + al, and
  // `form` is not a corpus word, but the root means "shape".
  if (!baseLit && baseIds.length === 1 && MORPH[baseIds[0]].type === 'root') {
    baseLit = MORPH[baseIds[0]].gloss;
  }
  if (!baseLit) { skipped.noBase++; continue; }

  const verb = isVerb(baseLit);
  if ((frame.needs === 'verb') !== verb) { skipped.wrongType++; continue; }

  derived.push({ text: w.text, lit: frame.build(baseLit), from: baseIds.join('+') });
}

derived.sort((a, b) => a.text.localeCompare(b.text));

const body = derived.map(d => `  ${JSON.stringify(d.text)}: ${JSON.stringify(d.lit)},`).join('\n');
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

console.log(`js/content/notes-derived.js — ${derived.length} derived`);
console.log(`skipped: ${skipped.noFrame} no frame, ${skipped.noBase} no annotated base, ${skipped.wrongType} verb/noun mismatch`);
console.log('\nsample:');
for (const d of derived.slice(0, 14)) console.log(`  ${d.text.padEnd(18)} ${d.lit}`);
