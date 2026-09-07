// Grapheme-to-phoneme conversion, for scoring nonsense-word spelling.
//
// Kilpatrick's rule for nonsense-word spelling is that it is scored
// PHONETICALLY: `fraib` is a correct spelling of `frabe`, because both say the
// same thing, while `frab` is not. Marking only exact matches would be testing
// memory for an arbitrary string, which is the opposite of the point — the
// activity exists to isolate letter-sound knowledge from word knowledge.
//
// This is tractable ONLY because Appendix H words are phonically regular by
// construction. It is not a general English converter and must not be used as
// one: it would mangle `colonel`, `yacht` or `one` without hesitating.
//
// Ambiguity is handled by returning a SET of possible pronunciations rather
// than one. `ea` is /ee/ in bead and /e/ in bread; `ow` is /oh/ in snow and
// /ow/ in cow. Two spellings match if any pronunciation is shared, which errs
// toward accepting a defensible spelling — the right direction, since the
// alternative is telling a child their correct answer is wrong.

// Longest first: `igh` must beat `i`, `tch` must beat `ch`.
const RULES = [
  // --- three-letter ---
  ['igh', ['Y']],
  ['tch', ['CH']],
  ['dge', ['J']],
  ['air', ['AIR']], ['ear', ['EER', 'AIR', 'ER']], ['eer', ['EER']],
  ['ore', ['OR']], ['are', ['AIR']], ['ure', ['YOOR', 'ER']],

  // --- consonant digraphs ---
  ['ch', ['CH', 'K']],
  ['sh', ['SH']],
  ['th', ['TH']],
  ['ph', ['F']],
  ['wh', ['W']],
  ['ck', ['K']],
  ['ng', ['NG']],
  ['qu', ['KW']],
  ['wr', ['R']],
  ['kn', ['N']],

  // --- r-controlled ---
  ['ar', ['AR']],
  ['er', ['ER']], ['ir', ['ER']], ['ur', ['ER']],
  ['or', ['OR']],

  // --- vowel teams ---
  ['ai', ['AY']], ['ay', ['AY']],
  ['ea', ['EE', 'E']],
  ['ee', ['EE']],
  ['ie', ['EE', 'Y']],
  ['oa', ['OH']], ['oe', ['OH']],
  ['ow', ['OH', 'OW']],
  ['ou', ['OW', 'OO']],
  ['oo', ['OO', 'UU']],
  ['oi', ['OY']], ['oy', ['OY']],
  ['au', ['AW']], ['aw', ['AW']],
  ['ew', ['OO', 'YOO']],
  ['ue', ['OO', 'YOO']], ['ui', ['OO']],

  // --- single letters ---
  ['a', ['a']], ['e', ['e']], ['i', ['i']], ['o', ['o']], ['u', ['u']],
  ['b', ['B']], ['c', ['K']], ['d', ['D']], ['f', ['F']], ['g', ['G']],
  ['h', ['H']], ['j', ['J']], ['k', ['K']], ['l', ['L']], ['m', ['M']],
  ['n', ['N']], ['p', ['P']], ['r', ['R']], ['s', ['S', 'Z']], ['t', ['T']],
  ['v', ['V']], ['w', ['W']], ['x', ['KS']], ['y', ['Y', 'EE', 'i']], ['z', ['Z']],
];

const LONG = { a: 'AY', e: 'EE', i: 'Y', o: 'OH', u: 'YOO', y: 'Y' };
const VOWEL_LETTERS = 'aeiou';
const VOWEL_TEAMS = ['ai', 'ay', 'ea', 'ee', 'ie', 'oa', 'oe', 'ow', 'ou',
                     'oo', 'oi', 'oy', 'au', 'aw', 'ew', 'ue', 'ui'];

/**
 * Deal with a final silent `e`.
 *
 * Two cases, and missing the second one is easy: after a single vowel the `e`
 * lengthens it (`mipe` = /mYp/), but after a vowel TEAM the team already
 * carries the sound and the `e` is simply silent (`thaice` = /THAYs/, the same
 * as `thace`). Handling only the first case makes those two fail to match,
 * which is exactly the sort of correct spelling this must not reject.
 */
function applySilentE(w) {
  // vowel team + single consonant + e — drop the e, leave the team alone.
  const team = new RegExp(`^(.*)(${VOWEL_TEAMS.join('|')})([bcdfgklmnprstvz])e$`).exec(w);
  if (team) return team[1] + team[2] + team[3];

  // single vowel (or y) + single consonant + e — lengthen the vowel.
  const single = /^(.*)([aeiouy])([bcdfgklmnprstvz])e$/.exec(w);
  if (single) return single[1] + single[2].toUpperCase() + single[3];

  return w;
}

/** Every pronunciation this spelling could plausibly have. Capped, not exhaustive. */
export function pronunciations(raw) {
  const word = String(raw).toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return new Set();

  const marked = applySilentE(word);
  let out = [[]];

  for (let i = 0; i < marked.length;) {
    const ch = marked[i];

    // A vowel marked long by a silent e.
    if (/[AEIOUY]/.test(ch)) {
      const p = LONG[ch.toLowerCase()];
      out = out.map(s => [...s, p]);
      i += 1;
      continue;
    }

    const rule = RULES.find(([g]) => marked.startsWith(g, i));
    if (!rule) { i += 1; continue; }          // unknown character: skip it
    let [g, sounds] = rule;

    // c and g go soft only before e, i or y. Allowing /s/ everywhere let
    // `cload` read as /slohd/, which would accept spellings it should not.
    if (g === 'c' || g === 'g') {
      const nxt = (marked[i + 1] || '').toLowerCase();
      if ('eiy'.includes(nxt)) sounds = g === 'c' ? ['S', 'K'] : ['J', 'G'];
    }
    // s is /z/ between vowels or at the end, never before a consonant at the
    // start. Allowing it everywhere invented /zperd/ for `sperd`, and every
    // invented pronunciation is a chance to accept a spelling that is wrong.
    if (g === 's') {
      const prev = (marked[i - 1] || '').toLowerCase();
      const nxt = (marked[i + 1] || '').toLowerCase();
      const voiced = (VOWEL_LETTERS.includes(prev) || /[AEIOUY]/.test(marked[i - 1] || ''))
        && (nxt === '' || VOWEL_LETTERS.includes(nxt));
      sounds = voiced ? ['S', 'Z'] : ['S'];
    }

    // An open final vowel says its name: `mi` is /mY/, not /mi/.
    const atEnd = i + g.length === marked.length;
    const opts = (g.length === 1 && VOWEL_LETTERS.includes(g) && atEnd && marked.length > 1)
      ? [LONG[g], ...sounds]
      : sounds;

    const next = [];
    for (const s of out) for (const p of opts) next.push([...s, p]);
    // Keep the branching bounded; ambiguity multiplies fast.
    out = next.length > 240 ? next.slice(0, 240) : next;
    i += g.length;
  }

  return new Set(out.map(s => s.join('.')));
}

/** Do two spellings say the same thing? */
export function soundsSame(a, b) {
  if (!a || !b) return false;
  if (String(a).toLowerCase() === String(b).toLowerCase()) return true;
  const A = pronunciations(a), B = pronunciations(b);
  for (const p of A) if (B.has(p)) return true;
  return false;
}

/** The single most likely pronunciation, for display. */
export function primaryPronunciation(word) {
  return [...pronunciations(word)][0] || '';
}
