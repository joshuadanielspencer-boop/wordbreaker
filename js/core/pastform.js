// A PAST form, loaded by the adult rather than shipped with the app.
//
// WHY THE ITEMS ARE NOT IN THIS REPO
//
// The PAST is David Kilpatrick's, and he gives it away free at
// https://thepasttest.com — four alternate forms (A, B, C, D), same test,
// different words, meant for exactly the repeated administration this project
// needs. Free to download is not the same as free to republish, and this app
// is deployed to a public GitHub Pages site. So the app ships the *machinery* —
// the levels, the two-second rule, the scoring, the administration flow — and
// you paste the words in from your own copy. They are then stored on the
// device with everything else and travel in the profile export.
//
// The other reason is honesty. Inventing PAST-like items and calling the
// result a PAST level would produce numbers that look like the real thing and
// are not comparable to anything — and docs/predictions.md hangs the entire
// falsification of Branch B on "PAST all automatic at baseline". A made-up
// test producing a made-up automaticity profile would be worse than no test,
// because it would look like evidence.
//
// FORMAT — one item per line, level headers begin with `=`:
//
//   = A | Syllables
//   bookcase | book | case
//   cowboy | cow | boy
//
//   = D | First sound
//   feet | /f/ | eat
//
//   = H | Change the first sound
//   guide | /g/ to /r/ | ride
//
// Read as: say the FIRST word; remove or change the MIDDLE thing; the answer
// is the LAST word. Blank lines and lines starting with # are ignored.

import { load, save } from './store.js';

/** Parse a pasted form. Returns { levels, errors } — never throws on bad input. */
export function parseForm(text) {
  const levels = [];
  const errors = [];
  let current = null;

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;

    if (line.startsWith('=')) {
      const [id, ...rest] = line.slice(1).split('|').map(s => s.trim());
      if (!id) { errors.push(`Line ${i + 1}: a level needs a letter, like "= A | Syllables".`); return; }
      current = { id, label: rest.join(' | ') || `Level ${id}`, items: [] };
      levels.push(current);
      return;
    }

    const parts = line.split('|').map(s => s.trim());
    if (parts.length < 3 || parts.some(p => !p)) {
      errors.push(`Line ${i + 1}: expected "word | what changes | answer" — got "${line}".`);
      return;
    }
    if (!current) {
      errors.push(`Line ${i + 1}: this item comes before any level header.`);
      return;
    }
    const [word, change, answer] = parts;
    current.items.push({ word, change, answer });
  });

  for (const l of levels) {
    if (!l.items.length) errors.push(`Level ${l.id} has no items.`);
  }
  if (!levels.length) errors.push('No levels found. Every form needs at least one "= A | ..." header.');

  return { levels, errors };
}

/** The wording the adult actually reads out. Kept in one place so the
 *  administration screen and the preview can never drift apart. */
export function promptFor(item) {
  const change = item.change.trim();
  // "/g/ to /r/" is a substitution; anything else is a deletion.
  const sub = /\bto\b|→|->/.test(change);
  if (sub) {
    const [from, to] = change.split(/\s*(?:to|→|->)\s*/);
    return { say: item.word, instruction: `Now change ${from} to ${to}.`, answer: item.answer };
  }
  return { say: item.word, instruction: `Now say it without ${change}.`, answer: item.answer };
}

export function saveForm(name, levels) {
  const S = load();
  if (!S) return null;
  S.pastForm = { name, levels, loaded: Date.now() };
  save();
  return S.pastForm;
}

export function currentForm() {
  return load()?.pastForm || null;
}

export function clearForm() {
  const S = load();
  if (!S) return;
  delete S.pastForm;
  save();
}

/** Every item, flattened, with its level attached — the administration order. */
export function itemSequence(form) {
  if (!form) return [];
  return form.levels.flatMap(l =>
    l.items.map((item, i) => ({ ...item, levelId: l.id, levelLabel: l.label, index: i })));
}

/**
 * Collapse per-item results into the per-level shape the rest of the app
 * already stores. A level counts as correct only if EVERY item in it was
 * correct, and automatic only if every item was automatic — the PAST is scored
 * on the level, not on a part-mark, and a generous rule here would inflate the
 * one number predictions.md leans on hardest.
 */
export function toLevels(results) {
  const byLevel = {};
  for (const r of results) {
    if (!byLevel[r.levelId]) byLevel[r.levelId] = [];
    byLevel[r.levelId].push(r);
  }
  const out = {};
  for (const [id, rows] of Object.entries(byLevel)) {
    out[id] = {
      correct: rows.every(r => r.correct),
      automatic: rows.every(r => r.correct && r.automatic),
    };
  }
  return out;
}
