// COLD RECALL — the actual spelling test.
//
// The word is never shown. It runs in one of two prompt modes:
//
//   'meaning' — the definition, which tests spelling AND vocabulary
//   'sound'   — the word read aloud, which is what a real spelling test is
//
// Both are cold: nothing on screen spells anything. The two modes test
// different routes into the same word, so a word has to survive both before it
// counts as finished, and neither route can be used to dodge the other.
//
// Replaying the audio is free — it is the prompt, not a hint. What each mode
// offers as its FIRST hint is the other mode's prompt, which keeps the ladder
// symmetrical.
//
// This exists because the other two activities cannot test spelling, however
// they are dressed up. Look-cover-write hides the word for about three seconds,
// which measures working memory. Word Equation lays out `un + trust + worth +
// y`, which is every letter in the right order. Both are useful practice and
// neither is evidence.
//
// A classroom spelling test says the word aloud. With no audio the closest
// honest substitute is the definition, so that is the prompt — which also
// means he cannot produce the spelling without knowing what the word means.
//
// Hints are a ladder, and each rung is counted but never scolded. What matters
// is not whether he needed one today; it is that he needs fewer over time.

import { MORPH } from '../content/lexicon.js';
import { say } from '../voice/voice.js';
import { say as speak, speechAvailable } from '../core/speech.js';

export function mount(el, word, opts = {}) {
  return new Promise(resolve => {
    const started = performance.now();
    let hints = 0;
    let attempts = 0;
    const target = word.text;
    const shown = word.display || word.text;
    const mode = opts.mode === 'sound' && speechAvailable() ? 'sound' : 'meaning';
    let plays = 0;

    el.innerHTML = `
      <div class="act act-recall">
        <p class="prompt">${mode === 'sound'
          ? 'Listen, then spell it.'
          : 'Spell it. No looking — there is nothing to look at.'}</p>
        <div class="casefile recall-card">
          ${mode === 'sound'
            ? `<button class="btn speak-big" data-act="play">Play the word again</button>`
            : `<p class="definition">${word.def}</p>`}
          <p class="shape">
            <span>${word.parts.length} pieces</span>
            <span>${target.length} letters</span>
          </p>
        </div>
        <input class="answer" type="text" inputmode="text" autocapitalize="off"
               autocomplete="off" autocorrect="off" spellcheck="false"
               aria-label="spell the word" placeholder="spell it">
        <div class="feedback" aria-live="polite"></div>
        <div class="actions">
          <button class="btn ghost" data-act="hint">Hint</button>
          <button class="btn primary" data-act="go">Check it</button>
        </div>
      </div>`;

    const input = el.querySelector('.answer');
    const feedback = el.querySelector('.feedback');
    input.focus();
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    el.querySelector('[data-act="hint"]').onclick = hint;
    el.querySelector('[data-act="go"]').onclick = check;

    if (mode === 'sound') {
      const play = () => { plays++; speak(target); input.focus(); };
      el.querySelector('[data-act="play"]').onclick = play;
      setTimeout(play, 350);            // read it once on arrival
    }

    /** Each rung gives away a little more, and never the spelling outright. */
    function hint() {
      hints++;
      const card = el.querySelector('.recall-card');
      if (hints === 1) {
        // Each mode's first hint is the other mode's prompt.
        card.insertAdjacentHTML('beforeend', mode === 'sound'
          ? `<p class="hint-line"><span class="definition">${word.def}</span></p>`
          : `<p class="hint-line">${word.parts.map(p =>
              `<span class="link ${MORPH[p.m].type}">${MORPH[p.m].gloss}</span>`)
              .join('<span class="linkjoin">+</span>')}</p>`);
      } else if (hints === 2) {
        // The shape of the word, with only the first letter of each piece.
        card.insertAdjacentHTML('beforeend',
          `<p class="hint-line skeleton">${word.parts.map(p =>
            `<span class="link ${MORPH[p.m].type}">${p.surface[0]}${'·'.repeat(p.surface.length - 1)}</span>`)
            .join('<span class="linkjoin">+</span>')}</p>`);
      } else {
        el.querySelector('[data-act="hint"]').disabled = true;
        feedback.innerHTML = `<p class="msg gentle">That is everything I can give you without simply telling you.</p>`;
      }
      input.focus();
    }

    function check() {
      const given = input.value.trim().toLowerCase();
      if (!given) return;
      attempts++;
      const ok = given === target;

      if (!ok && attempts === 1) {
        const shared = [...given].findIndex((c, i) => c !== target[i]);
        feedback.innerHTML = `<p class="msg gentle">${say('recallWrong', {}, opts.personality)}</p>` +
          (shared > 1 ? `<p class="msg gentle">The first ${shared} letters are right.</p>` : '');
        input.select();
        return;
      }

      const ms = performance.now() - started;
      input.disabled = true;

      let why = '';
      if (!ok) {
        const n = Math.max(given.length, target.length);
        const yours = [], real = [];
        for (let k = 0; k < n; k++) {
          const a = given[k], b = target[k];
          yours.push(a !== undefined ? `<b class="${a === b ? '' : 'bad'}">${a}</b>` : '<b class="bad missing">·</b>');
          if (b !== undefined) real.push(`<b class="${a === b ? '' : 'bad'}">${b}</b>`);
        }
        why = `<div class="compare">
          <div class="cmp-row wrong"><span class="cmp-label">you wrote</span>
            <span class="cmp-word">${yours.join('')}</span></div>
          <div class="cmp-row right"><span class="cmp-label">the word</span>
            <span class="cmp-word">${real.join('')}</span></div>
        </div>`;
      }

      // Only an unaided, first-attempt answer is evidence he can spell it.
      const clean = ok && hints === 0 && attempts === 1;
      const credit = {};
      for (const p of word.parts) credit[p.m] = ok;

      el.querySelector('.recall-card').insertAdjacentHTML('beforeend',
        `<p class="recall-answer">${shown}</p>`);

      feedback.innerHTML = why + `<p class="msg ${ok ? 'good' : 'gentle'}">${
        say(ok ? (clean ? 'recallClean' : 'recallRight') : 'recallWrong',
            { word: shown, hints }, opts.personality)}</p>`;
      el.querySelector('.actions').innerHTML =
        `<button class="btn primary" data-act="next">Next</button>`;
      el.querySelector('[data-act="next"]').focus();
      resolve({ correct: ok, ms, credit, detail: { given, hints, attempts, clean, mode, plays } });
    }
  });
}
