// Decomposes words the corpus has never seen.
//
// words.js decompositions are hand-authored and exact. This is the opposite:
// a best-effort matcher for arbitrary text, so a page of whatever he is
// actually reading can be scanned for the words worth taking apart first.
//
// Deliberately conservative. It claims a decomposition only when the middle
// exactly matches a known root form; anything else is reported as "long and
// unfamiliar" without a false structure attached. A wrong decomposition would
// teach him something untrue, which is worse than teaching him nothing.

import { MORPH, BY_TEXT } from '../content/lexicon.js';

const byType = t => Object.values(MORPH).filter(m => m.type === t);

// Longest surface forms first, so `trans` wins over `tra` and `ation` over `al`.
function formIndex(type) {
  const out = [];
  for (const m of byType(type)) for (const f of m.forms) out.push({ f, id: m.id });
  return out.sort((a, b) => b.f.length - a.f.length);
}
const PREFIXES = formIndex('prefix');
const SUFFIXES = formIndex('suffix');
const ROOTS = new Map();
for (const m of byType('root')) for (const f of m.forms) if (!ROOTS.has(f)) ROOTS.set(f, m.id);

const MIN_ROOT = 3;

/**
 * @returns {null | {text, parts, known:boolean, exact:boolean}}
 *   `exact` — the hand-authored decomposition from the corpus.
 *   otherwise a matched decomposition, or null if nothing convincing was found.
 */
export function analyze(raw) {
  const text = String(raw).toLowerCase().replace(/[^a-z]/g, '');
  if (text.length < 5) return null;

  const exact = BY_TEXT[text];
  if (exact) return { text, parts: exact.parts, known: true, exact: true };

  let best = null;

  // Try every combination of up to two leading prefixes and two trailing
  // suffixes, keeping whichever leaves a middle that is a real root.
  const prefixRuns = [[]];
  for (const p1 of PREFIXES) {
    if (!text.startsWith(p1.f)) continue;
    prefixRuns.push([p1]);
    const rest = text.slice(p1.f.length);
    for (const p2 of PREFIXES) {
      if (p2.f.length < 2 || !rest.startsWith(p2.f)) continue;
      prefixRuns.push([p1, p2]);
    }
  }

  for (const pre of prefixRuns) {
    const preLen = pre.reduce((n, p) => n + p.f.length, 0);
    const afterPre = text.slice(preLen);

    const suffixRuns = [[]];
    for (const s1 of SUFFIXES) {
      if (!afterPre.endsWith(s1.f)) continue;
      suffixRuns.push([s1]);
      const head = afterPre.slice(0, -s1.f.length);
      for (const s2 of SUFFIXES) {
        if (s2.f.length < 2 || !head.endsWith(s2.f)) continue;
        suffixRuns.push([s2, s1]);
      }
    }

    for (const suf of suffixRuns) {
      const sufLen = suf.reduce((n, s) => n + s.f.length, 0);
      const middle = afterPre.slice(0, afterPre.length - sufLen);
      if (middle.length < MIN_ROOT) continue;
      if (!ROOTS.has(middle)) continue;
      if (!pre.length && !suf.length) continue;      // a bare root is not a find

      const parts = [
        ...pre.map(p => ({ surface: p.f, m: p.id })),
        { surface: middle, m: ROOTS.get(middle) },
        ...suf.map(s => ({ surface: s.f, m: s.id })),
      ];
      // Prefer more pieces, then a longer root — both signal a real parse
      // rather than a coincidence of letters.
      const score = parts.length * 10 + middle.length;
      if (!best || score > best.score) best = { score, parts };
    }
  }

  if (!best) return null;
  return { text, parts: best.parts, known: false, exact: false };
}

const STOP = new Set(('the a an and or but if then than that this these those of to in on at by for with from as is are was were be been being it its he she they them his her their you your i we our not no so such can will would could should may might must do does did have has had there here what which who whom whose when where why how all any both each few more most other some only own same too very just now over under again further once about into out off down up'.split(' ')));

/**
 * Scan a passage and rank the words worth taking apart before he reads it.
 * @param {string} passage
 * @param {(morphemeId:string)=>number} levelOf  mastery level lookup
 */
export function radar(passage, levelOf = () => 0, limit = 12) {
  const tokens = String(passage).toLowerCase().match(/[a-z][a-z'-]*/g) || [];
  const seen = new Map();

  for (const t of tokens) {
    const w = t.replace(/[^a-z]/g, '');
    if (w.length < 7 || STOP.has(w)) continue;
    if (seen.has(w)) { seen.get(w).count++; continue; }
    const a = analyze(w);
    if (!a || a.parts.length < 2) continue;
    // Words built on pieces he has not mastered are the ones worth 90 seconds
    // before he starts reading.
    const unknown = a.parts.filter(p => levelOf(p.m) < 3).length;
    seen.set(w, { ...a, count: 1, unknown, score: unknown * 10 + a.parts.length * 3 + w.length });
  }

  const found = [...seen.values()]
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, limit);

  // Long words it could not parse. Reporting these honestly matters: silently
  // dropping them would make the Radar look like it had covered the passage.
  const parsed = new Set(found.map(f => f.text));
  const unparsed = [];
  const seenLong = new Set();
  for (const t of tokens) {
    const w = t.replace(/[^a-z]/g, '');
    if (w.length < 10 || STOP.has(w) || parsed.has(w) || seenLong.has(w)) continue;
    if (seen.has(w)) continue;
    seenLong.add(w);
    unparsed.push(w);
  }

  return { found, unparsed: unparsed.slice(0, 10) };
}
