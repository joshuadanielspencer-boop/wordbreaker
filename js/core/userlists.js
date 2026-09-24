// Spelling lists typed in by an adult.
//
// School produces one of these most weeks, and until now each one needed the
// repo edited by hand. These live in the profile instead, travel with a profile
// export, and are parsed exactly like the compiled-in lists — same specs, same
// activities, same mastery store, same Codex.
//
// The one thing that cannot come along is the build-time check. A compiled list
// is validated by tools/check.mjs before it can ship; a typed one has to be
// validated here, at the moment of saving, against the same rules: the pieces
// must concatenate back to the word exactly, and every morpheme id must resolve.
//
// A word that does not break into pieces the app knows is stored WHOLE rather
// than cut somewhere plausible. Hand-authored decompositions are exact; this is
// a guess, and a wrong seam teaches something untrue — which is worse than
// teaching no structure at all. mission.js skips the autopsy for those words,
// so he is never asked to find a seam that is not there.

import { load, save } from './store.js';
import { MORPH, missionWord } from '../content/lexicon.js';
import { analyze } from './analyze.js';
import { parseSpec } from '../content/words.js';

/** Letters as they must end up in the spec — case and spaces removed. */
const normalise = w => String(w).trim().toLowerCase().replace(/\s+/g, '');

/**
 * One word per line. A definition may ride along on the same line after `=`
 * or an em dash, because that is how a school list is usually already written
 * and retyping twenty definitions is the part that stops this being used.
 */
export function parseWordList(text) {
  const out = [];
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const split = line.split(/\s*(?:=|—)\s*/);
    const typed = (split[0] || '').trim().replace(/^\d+[.)]\s*/, '');   // drop "1. "
    const def = split.slice(1).join(' — ').trim();
    if (!typed) continue;
    out.push({
      typed,
      word: normalise(typed),
      display: /[A-Z]/.test(typed) ? typed.trim() : null,
      def,
    });
  }
  return out;
}

/** A spec token: bare surface when it doubles as the morpheme id. */
const token = p => (p.surface === p.m ? p.surface : `${p.surface}:${p.m}`);

/**
 * The app's best guess at how a word comes apart, as an editable spec string.
 * analyze() is deliberately conservative and returns nothing unless the middle
 * is exactly a known root, so "no proposal" is common and is the honest answer.
 */
export function proposeSpec(word) {
  const w = normalise(word);

  // A word already on a list — built-in or one typed in earlier — keeps the
  // decomposition it already has. School repeats words across terms, and the
  // matcher cannot see multi-root words like `un|trust|worth|y` at all, so
  // re-deriving would be a downgrade on exactly the words we already know.
  const known = missionWord(w);
  if (known) return { spec: known.parts.map(token).join('|'), source: 'known' };

  const found = analyze(w);
  if (found && found.parts.map(p => p.surface).join('') === w) {
    return { spec: found.parts.map(token).join('|'), source: found.exact ? 'corpus' : 'matched' };
  }
  return { spec: `${w}:whole`, source: 'whole' };
}

/** The same rules tools/check.mjs applies to a compiled list. */
export function validateEntry({ word, spec, def }) {
  const errors = [];
  const w = normalise(word);
  if (!w) errors.push('no word');
  if (!spec || !spec.trim()) {
    errors.push('no pieces');
    return { ok: false, errors, parts: [] };
  }

  let item;
  try { item = parseSpec(spec.trim()); }
  catch { return { ok: false, errors: [...errors, 'the pieces could not be read'], parts: [] }; }

  if (item.text !== w)
    errors.push(`the pieces spell "${item.text}", not "${w}"`);
  const unknown = item.parts.filter(p => !MORPH[p.m]).map(p => p.m);
  if (unknown.length)
    errors.push(`unknown piece${unknown.length === 1 ? '' : 's'}: ${[...new Set(unknown)].join(', ')}`);
  if (def && def.toLowerCase().includes(w))
    errors.push('the definition contains the word it is defining');

  return { ok: errors.length === 0, errors, parts: item.parts };
}

export function userLists() {
  const S = load();
  return S?.missions || [];
}

function bump(S) {
  S.missionsRev = (S.missionsRev || 0) + 1;
  save();
}

/**
 * Save a list. Entries that do not validate are refused outright rather than
 * stored broken — a list that half-loaded would be worse than one that did not.
 */
export function saveList(name, entries) {
  const S = load();
  if (!S) return { ok: false, errors: ['no player is signed in'] };
  if (!entries.length) return { ok: false, errors: ['no words'] };

  const errors = [];
  for (const e of entries) {
    const v = validateEntry(e);
    if (!v.ok) errors.push(`${e.typed || e.word}: ${v.errors.join('; ')}`);
  }
  if (errors.length) return { ok: false, errors };

  if (!S.missions) S.missions = [];
  const id = 'u' + Date.now().toString(36);
  S.missions.push({
    id,
    name: name.trim() || 'Spelling list',
    subtitle: `typed in ${new Date().toLocaleDateString()}`,
    source: 'typed in on this device',
    user: true,
    groups: [{
      label: 'the list',
      words: entries.map(e => ({
        spec: e.spec.trim(),
        def: e.def?.trim() || undefined,
        display: e.display || undefined,
      })),
    }],
  });
  bump(S);
  return { ok: true, id };
}

export function deleteList(id) {
  const S = load();
  if (!S?.missions) return;
  S.missions = S.missions.filter(m => m.id !== id);
  bump(S);
}

/**
 * Fill in a definition after the fact. A word with none can still be practised
 * and tested by sound, but cold recall from the meaning has nothing to prompt
 * with, so it can never be finished — both routes are required.
 */
export function setDefinition(listId, wordText, def) {
  const S = load();
  const m = S?.missions?.find(x => x.id === listId);
  if (!m) return false;
  const w = normalise(wordText);
  for (const g of m.groups) {
    for (const rec of g.words) {
      if (parseSpec(rec.spec).text !== w) continue;
      rec.def = def.trim() || undefined;
      bump(S);
      return true;
    }
  }
  return false;
}

/** Words on a user list still missing a definition. */
export function needingDefinitions(listId) {
  const m = userLists().find(x => x.id === listId);
  if (!m) return [];
  return m.groups.flatMap(g => g.words).filter(rec => !rec.def)
    .map(rec => parseSpec(rec.spec).text);
}
