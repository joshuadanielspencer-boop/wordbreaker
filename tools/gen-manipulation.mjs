// GENERATOR — phoneme manipulation items.  node tools/gen-manipulation.mjs
//
// This is the solo half of Kilpatrick's One Minute Activities. His version is
// oral: an adult says a word, the child says it back with a sound removed or
// swapped, and the adult judges the answer inside about two seconds. Two
// things in that need a human — the spoken response and the two-second window
// measured on speech — and neither can be handed to speech recognition, which
// is language-model driven and will quietly "correct" the answer.
//
// So the response mode changes instead: he HEARS the word and TYPES what is
// left. That is scorable, and js/core/phonics.js scores it phonetically, so
// `eet` for `eat` is accepted — the manipulation was right and the spelling is
// defensible. Three consequences, all deliberate:
//
//   * It is TRAINING, never measurement. Typing takes seconds, so latency here
//     is his hands, not his phonology, and cannot be compared to the PAST's
//     two-second window. The evidence view does not touch it.
//   * It adds a spelling step, so a child who can manipulate the sound but not
//     spell the result loses the item. Phonetic scoring softens this; it does
//     not remove it.
//   * It is phoneme manipulation THROUGH PRINT, which is a hybrid of the
//     deliberately oral task. The real PAST, adult-administered, stays the
//     measure of the underlying skill.
//
// The word is never shown, only spoken. Shown, the task collapses: "feet
// without /f/" becomes deleting a letter you can see, which is a cheaper path
// than the intended one, and he will find it within minutes.
//
// ITEMS ARE ARITHMETIC OVER PRONUNCIATIONS, never guessed. An item exists only
// when the phoneme sequence of the prompt word, minus or with one phoneme
// swapped, is exactly the phoneme sequence of another word on the curated
// list. Both ends are therefore known-real and known-regular, which is what
// keeps the phonics model — explicitly not a general English converter —
// inside the range where it is right.

import { writeFileSync } from 'node:fs';
import { pronunciations } from '../js/core/phonics.js';

// Hand-curated and plainly regular. Anything the model reads wrongly (`guide`
// comes out /good/) must never appear here, so this list is short and dull by
// design rather than scraped from a dictionary.
const SEEDS = `
cat cap can cab cot cop cob cod cup cub cut cast cost
bat bad bag ban bed beg bet big bin bit bug bun bus but bent best
dad dam den dig dim dip dog dot desk dust
fan fat fed fig fin fit fog fun fast fist
gas get got gum gun gift
ham hat hem hen hid hit hop hot hug hum hut hand
jam jet job jog jug just
kid kit kept
lad lap led leg let lid lip lit log lot lamp land last lost
mad man map mat men met mop mud mug mask mist must
nap net nod not nut nest
pan pat peg pen pet pig pin pit pot pup past pest
ram ran rat red rib rid rig rim rip rob rod rot rub rug run rest rust
sad sat set sit sob sun sand send sunk
tab tan tap ten tin tip top tub tug tent test
van vet
wag web wet wig win wind west
yes yet zip
chat chin chip chop shed ship shop shot shut thin
stop spot step spin skip snap slip swim trip trap grin grab flag flat plan
cart part dart card hard bark dark mark park farm harm barn corn born fork
feet meet seat heat beat neat feed need seed deed deep keep beep peep
`.trim().split(/\s+/);

// Short real words that show up as ANSWERS once a sound is taken off the
// front or the back. They are never used as prompts.
const ANSWERS = `
at it an in up us am on if ox ask add and ant arm art egg end elf
eat see sea me my no so go he we be tea key bee
ate age ice ear air are our out owl oil ill inn odd off
car par far bar tar star
ear near hear
`.trim().split(/\s+/);

// Compound words for the syllable level — the easiest rung, and the only one
// that needs no phoneme model at all. Both halves are ordinary words.
const COMPOUNDS = [
  ['bookcase', 'book', 'case'], ['cowboy', 'cow', 'boy'], ['sunset', 'sun', 'set'],
  ['bedroom', 'bed', 'room'], ['baseball', 'base', 'ball'], ['football', 'foot', 'ball'],
  ['cupcake', 'cup', 'cake'], ['pancake', 'pan', 'cake'], ['raincoat', 'rain', 'coat'],
  ['rainbow', 'rain', 'bow'], ['sunshine', 'sun', 'shine'], ['snowman', 'snow', 'man'],
  ['popcorn', 'pop', 'corn'], ['toothbrush', 'tooth', 'brush'], ['backpack', 'back', 'pack'],
  ['notebook', 'note', 'book'], ['doorbell', 'door', 'bell'], ['fireplace', 'fire', 'place'],
  ['flashlight', 'flash', 'light'], ['seashell', 'sea', 'shell'], ['starfish', 'star', 'fish'],
  ['sidewalk', 'side', 'walk'], ['suitcase', 'suit', 'case'], ['treehouse', 'tree', 'house'],
  ['windmill', 'wind', 'mill'], ['farmhouse', 'farm', 'house'], ['haircut', 'hair', 'cut'],
  ['lighthouse', 'light', 'house'], ['mailbox', 'mail', 'box'], ['moonlight', 'moon', 'light'],
  ['sandbox', 'sand', 'box'], ['railroad', 'rail', 'road'], ['bedtime', 'bed', 'time'],
  ['daylight', 'day', 'light'], ['handbag', 'hand', 'bag'], ['teapot', 'tea', 'pot'],
];

// Only phonemes a ten-year-old can be shown in slashes without the notation
// itself becoming the puzzle. `Y` is the long-i sound and would read as the
// letter y; the long vowels have no unambiguous spelling between slashes. So
// items turning on anything outside this map are simply not generated.
const SOUND = {
  B:'b', D:'d', F:'f', G:'g', H:'h', J:'j', K:'k', L:'l', M:'m', N:'n',
  P:'p', R:'r', S:'s', T:'t', V:'v', W:'w', Z:'z',
  CH:'ch', SH:'sh', TH:'th', NG:'ng',
  a:'a', e:'e', i:'i', o:'o', u:'u', EE:'ee',
};
const CONSONANTS = Object.keys(SOUND).filter(k => !'aeiouEE'.includes(k) || k.length > 2);
const VOWELS = ['a', 'e', 'i', 'o', 'u'];
const say = ph => `/${SOUND[ph]}/`;

const P = w => [...pronunciations(w)];
const primary = w => P(w)[0].split('.');

/** Answers are indexed under their PRIMARY reading only.
 *
 *  Indexing every possible reading looked harmless and produced two kinds of
 *  wrong item. `chip` can also be read /kip/, so "change the /sh/ in ship to
 *  /k/" came out as `chip`. And `be` can also be read with a short e, so
 *  "bed without the /d/" came out as `be`, which is /bɛ/ against /biː/. An
 *  answer is only an answer if it is what the word actually says. */
const index = new Map();
for (const w of [...ANSWERS, ...SEEDS]) {
  const p = primary(w).join('.');
  if (!index.has(p)) index.set(p, w);
}

/** An item may only turn on a position every reading of the word agrees about.
 *  `sit` is S.i.T or Z.i.T, so its first sound is not safe to ask about. */
const agreesAt = (w, i) => new Set(P(w).map(p => p.split('.')[i])).size === 1;

const out = { syllable: [], first: [], last: [], sub_first: [], sub_vowel: [] };
const seen = new Set();
const add = (level, item) => {
  const key = `${level}|${item.word}|${item.cue}|${item.to || ''}`;
  if (seen.has(key)) return;
  seen.add(key);
  out[level].push(item);
};

for (const [word, a, b] of COMPOUNDS) {
  add('syllable', { word, op: 'delete', cue: a, answer: b });
  add('syllable', { word, op: 'delete', cue: b, answer: a });
}

for (const word of SEEDS) {
  const p = primary(word);
  if (p.length < 2) continue;

  if (agreesAt(word, 0) && SOUND[p[0]]) {
    const rest = index.get(p.slice(1).join('.'));
    if (rest && rest !== word) add('first', { word, op: 'delete', cue: say(p[0]), answer: rest });

    for (const x of CONSONANTS) {
      if (x === p[0]) continue;
      const hit = index.get([x, ...p.slice(1)].join('.'));
      if (hit && hit !== word) add('sub_first', { word, op: 'sub', cue: say(p[0]), to: say(x), answer: hit });
    }
  }

  const lastAt = p.length - 1;
  if (agreesAt(word, lastAt) && SOUND[p[lastAt]]) {
    const rest = index.get(p.slice(0, lastAt).join('.'));
    if (rest && rest !== word) add('last', { word, op: 'delete', cue: say(p[lastAt]), answer: rest });
  }

  // Vowel swaps only where there is exactly one vowel to be confused about.
  const vowelAt = p.map((ph, i) => (VOWELS.includes(ph) ? i : -1)).filter(i => i >= 0);
  if (vowelAt.length === 1 && agreesAt(word, vowelAt[0])) {
    const vi = vowelAt[0];
    for (const v of VOWELS) {
      if (v === p[vi]) continue;
      const swapped = [...p]; swapped[vi] = v;
      const hit = index.get(swapped.join('.'));
      if (hit && hit !== word) add('sub_vowel', { word, op: 'sub', cue: say(p[vi]), to: say(v), answer: hit });
    }
  }
}

const LEVELS = ['syllable', 'first', 'last', 'sub_first', 'sub_vowel'];
const body = LEVELS.map(l =>
  `  ${l}: [\n` + out[l].map(i => '    ' + JSON.stringify(i)).join(',\n') + '\n  ],').join('\n');

writeFileSync(new URL('../js/content/manipulation.js', import.meta.url), `\
// GENERATED by tools/gen-manipulation.mjs — do not edit by hand.
//
// Phoneme manipulation items for the solo drill. He hears the word and types
// what is left; the answer is scored phonetically, so a defensible spelling
// counts. See the generator for why this is training and never measurement.

export const MANIPULATION = {
${body}
};

export const MANIP_ORDER = ${JSON.stringify(LEVELS)};

export const MANIP_LABEL = {
  syllable:   'take away a word',
  first:      'take away the first sound',
  last:       'take away the last sound',
  sub_first:  'change the first sound',
  sub_vowel:  'change the middle sound',
};
`);

for (const l of LEVELS) console.log(`${l.padEnd(11)} ${out[l].length}`);
console.log('total', LEVELS.reduce((a, l) => a + out[l].length, 0));
