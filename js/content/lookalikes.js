// LOOK-ALIKE WORD SETS — Kilpatrick, Chapter 6 §5.
//
// Sets of words that share a first letter and a length and differ by one or
// two graphemes. With no context and no shape cue, every compensating strategy
// fails at once: first-letter guessing, word-shape recognition and
// context-guessing all return the wrong answer, so the only way through is to
// read every letter. Kilpatrick calls this possibly the most powerful tool in
// the chapter, and it is the closest thing in the book to a direct attack on a
// recognise-and-guess habit.
//
// Appendix G's own sets are printed as samples ("you can create your own") and
// its OCR is wrecked by a two-column layout, so these are authored rather than
// transcribed — which also lets the harder tiers sit at an older reader's
// level instead of at `black / block / brick`.
//
// prompt: 'sound'   — the voice says one, he picks it. Members MUST be
//                     phonetically distinct or the item is unanswerable.
//                     Near-homophones count: the voice cannot separate
//                     eminent/imminent or elicit/illicit either.
// prompt: 'meaning' — a definition names one. Required for homophones and
//                     near-homophones, where sound settles nothing.
//
// What makes a set work is not a shared first letter — `precede/proceed`
// differ on exactly the ending, which is that set's whole point. It is that
// every member sits within a couple of edits of another member, so telling
// them apart requires reading the letters. tools/check.mjs enforces that.

export const LOOKALIKE_SETS = [
  // ---- tier 1: the pattern, on short words ----
  { id: 'bl', tier: 1, prompt: 'sound', words: ['black', 'block', 'blank', 'blink', 'bland', 'blend', 'blind'] },
  { id: 'br', tier: 1, prompt: 'sound', words: ['brick', 'brink', 'brisk', 'brand', 'bread', 'break', 'brace'] },
  { id: 'tr', tier: 1, prompt: 'sound', words: ['trade', 'train', 'trail', 'trial', 'tribe', 'trace', 'track'] },
  { id: 'th', tier: 1, prompt: 'sound', words: ['think', 'thick', 'thing', 'third', 'thirst', 'thumb', 'thump'] },
  { id: 'st', tier: 1, prompt: 'sound', words: ['stare', 'stale', 'stage', 'stake', 'state', 'stove', 'stone'] },
  { id: 'cr', tier: 1, prompt: 'sound', words: ['crane', 'crate', 'crave', 'craze', 'creak', 'cream', 'creep'] },
  { id: 'fl', tier: 1, prompt: 'sound', words: ['flight', 'fright', 'freight', 'flint', 'flick', 'flock', 'flank'] },
  { id: 'qu', tier: 1, prompt: 'sound', words: ['quiet', 'quite', 'quilt', 'quill', 'quest', 'queen'] },
  { id: 'sc', tier: 1, prompt: 'sound', words: ['scare', 'scarce', 'score', 'scorn', 'scout', 'scour', 'scale'] },
  { id: 'ang', tier: 1, prompt: 'sound', words: ['angel', 'angle', 'ankle', 'anger', 'amble', 'agile'] },

  // ---- tier 2: the same trick at an older reader's level ----
  { id: 'adopt', tier: 2, prompt: 'sound', words: ['adapt', 'adopt', 'adept', 'admit', 'adorn'] },
  { id: 'accept', tier: 2, prompt: 'sound', words: ['accept', 'except', 'expect', 'aspect', 'exempt'] },
  { id: 'cede', tier: 2, prompt: 'sound', words: ['precede', 'proceed', 'recede', 'concede', 'secede'] },
  { id: 'spective', tier: 2, prompt: 'sound', words: ['perspective', 'prospective', 'respective', 'protective'] },
  { id: 'conserve', tier: 2, prompt: 'sound', words: ['conserve', 'converse', 'converge', 'convert', 'conversion'] },
  { id: 'moral', tier: 2, prompt: 'sound', words: ['moral', 'morale', 'mortal', 'mural', 'model'] },
  { id: 'casual', tier: 2, prompt: 'sound', words: ['casual', 'causal', 'castle', 'cattle', 'capital', 'capitol'] },
  { id: 'diary', tier: 2, prompt: 'sound', words: ['diary', 'dairy', 'daily', 'dearly', 'dryly'] },
  { id: 'eminent', tier: 2, prompt: 'meaning', words: [
    { w: 'eminent', def: 'famous and respected in their field' },
    { w: 'imminent', def: 'about to happen at any moment' },
    { w: 'element', def: 'one of the basic parts something is made of' },
  ] },
  { id: 'elicit', tier: 2, prompt: 'meaning', words: [
    { w: 'elicit', def: 'to draw a reaction or answer out of someone' },
    { w: 'illicit', def: 'not allowed by law' },
    { w: 'explicit', def: 'stated fully and clearly, leaving nothing out' },
    { w: 'implicit', def: 'suggested without being said outright' },
  ] },
  { id: 'envelop', tier: 2, prompt: 'sound', words: ['envelop', 'envelope', 'develop', 'enclose', 'endorse'] },
  { id: 'later', tier: 2, prompt: 'sound', words: ['later', 'latter', 'ladder', 'litter', 'letter', 'lighter'] },
  { id: 'device', tier: 2, prompt: 'sound', words: ['device', 'devise', 'advice', 'advise', 'divide'] },
  { id: 'loose', tier: 2, prompt: 'sound', words: ['loose', 'lose', 'louse', 'noose', 'goose', 'choose'] },
  { id: 'conscious', tier: 2, prompt: 'sound', words: ['conscious', 'conscience', 'conscript', 'construct', 'consist'] },
  { id: 'personal', tier: 2, prompt: 'sound', words: ['personal', 'personnel', 'perennial', 'perpetual', 'peripheral'] },

  // ---- homophone sets: sound cannot separate these, so meaning must ----
  { id: 'there', tier: 2, prompt: 'meaning', words: [
    { w: 'their', def: 'belonging to them' },
    { w: 'there', def: 'in that place' },
    { w: "they're", def: 'the short way of writing "they are"' },
  ] },
  { id: 'weather', tier: 2, prompt: 'meaning', words: [
    { w: 'weather', def: 'rain, sun, wind — what it is doing outside' },
    { w: 'whether', def: 'the word for choosing between two possibilities' },
  ] },
  { id: 'principal', tier: 2, prompt: 'meaning', words: [
    { w: 'principal', def: 'the person in charge of a school; or the most important one' },
    { w: 'principle', def: 'a rule or a belief you hold to' },
  ] },
  { id: 'stationary', tier: 2, prompt: 'meaning', words: [
    { w: 'stationary', def: 'not moving' },
    { w: 'stationery', def: 'paper, envelopes and pens' },
  ] },
  { id: 'complement', tier: 2, prompt: 'meaning', words: [
    { w: 'complement', def: 'something that completes or goes well with another thing' },
    { w: 'compliment', def: 'something nice you say about someone' },
  ] },
  { id: 'allusion', tier: 2, prompt: 'meaning', words: [
    { w: 'allusion', def: 'an indirect mention of something' },
    { w: 'illusion', def: 'something that is not really there' },
  ] },
];

/** Normalise a set's members to {w, def} regardless of how it was written. */
export function setWords(s) {
  return s.words.map(x => (typeof x === 'string' ? { w: x } : x));
}
