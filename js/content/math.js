// SHOW THE MIDDLE — problem generation.
//
// The reading half of this app attacks a habit: skip the effortful middle
// step, jump to the answer. That habit is not really about reading. It is the
// same move as doing arithmetic in your head and refusing to write the
// working, and it holds up fine until the problem outgrows working memory.
//
// So the maths here is deliberately sized to outgrow it, and the app never
// asks for the answer. It asks for the middle. Breaking 47 into 40 and 7 is
// the same operation as breaking `transportation` into trans + port + ation,
// and it is presented the same way on purpose.

const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

/**
 * A number with a zero in it splits into fewer pieces — 40 is just [40] — and
 * a one-step problem is exactly the thing this activity exists to prevent.
 */
const splittable = n => placeParts(n).length >= 2;
function pickSplittable(lo, hi) {
  for (let i = 0; i < 50; i++) {
    const n = rnd(lo, hi);
    if (splittable(n)) return n;
  }
  return lo + 11;                       // unreachable in practice
}

/** Split a number into its place-value parts: 238 -> [200, 30, 8]. */
export function placeParts(n) {
  const out = [];
  const digits = String(n).split('');
  digits.forEach((d, i) => {
    const v = Number(d) * 10 ** (digits.length - 1 - i);
    if (v) out.push(v);
  });
  return out;
}

export const SKILLS = {
  'math:mult2x1': {
    name: 'two digits × one',
    make() {
      return build(pickSplittable(13, 99), rnd(3, 9));
    },
  },
  'math:mult3x1': {
    name: 'three digits × one',
    make() {
      return build(pickSplittable(112, 989), rnd(3, 9));
    },
  },
  'math:mult2x2': {
    name: 'two digits × two',
    make() {
      return build(pickSplittable(13, 99), rnd(12, 49));
    },
  },
};

function build(a, b) {
  const parts = placeParts(a);
  return {
    a, b,
    prompt: `${a} × ${b}`,
    // Each step is one piece of the split, multiplied out on its own.
    steps: parts.map(p => ({ label: `${p} × ${b}`, answer: p * b, piece: p })),
    total: a * b,
  };
}

export const LADDER = ['math:mult2x1', 'math:mult3x1', 'math:mult2x2'];

/**
 * Which skill to practise. Moves up only on sustained accuracy, and drops back
 * a rung on a bad run — a wall of problems he cannot do is the fastest way to
 * make him stop opening this.
 */
export function pickSkill(levelOf) {
  let chosen = LADDER[0];
  for (const id of LADDER) {
    if (levelOf(id) >= 3) chosen = LADDER[Math.min(LADDER.indexOf(id) + 1, LADDER.length - 1)];
    else break;
  }
  return chosen;
}

export function makeProblem(skillId) {
  return { skill: skillId, ...SKILLS[skillId].make() };
}
