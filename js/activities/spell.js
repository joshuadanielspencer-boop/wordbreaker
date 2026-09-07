// SPELLING SLAUGHTER — look, cover, write, check.
//
// The one activity in the app that is about spelling for its own sake, because
// the school list demands it. It is still built on the slicer: the word is
// studied as coloured pieces, not as fourteen loose letters, so what gets
// memorised has a structure rather than being a sequence to be got through.
//
// Peeks are counted and never punished. How much support a word still needs is
// the useful measurement — a word spelled correctly after three peeks is not
// the same as one spelled correctly cold, and only the peek count knows.
//
// The DEFINITION is shown here, during study. That is not decoration: cold
// recall later prompts with the definition alone and asks him to produce the
// word, and for a long time this was the only screen in the app where that
// definition appeared — meaning he was asked to produce a word from a sentence
// nobody had ever shown him. Meeting the definition while the word is still on
// screen is what makes the later test a spelling test instead of a guess.
// mission.js will not schedule meaning-mode recall until this has happened.
//
// Audio stays available AFTER the cover. Look-cover-write is practice and
// certifies nothing — mission.js only counts cold recall — so hearing the word
// here costs no evidence, and being unable to re-hear a word you are trying to
// write is just an obstacle with no teaching in it.

import { MORPH } from '../content/lexicon.js';
import { say } from '../voice/voice.js';
import { say as speak, speechAvailable } from '../core/speech.js';

export function mount(el, word, opts = {}) {
  return new Promise(resolve => {
    const started = performance.now();
    let peeks = 0;
    let attempts = 0;
    let plays = 0;
    const canSpeak = speechAvailable();
    const defShown = !!word.def;

    const chips = word.parts.map(p => {
      const m = MORPH[p.m];
      return `<span class="part ${m.type}"><span class="part-text">${p.surface}</span>
                <span class="part-gloss">${m.gloss}</span></span>`;
    }).join('<span class="joiner">+</span>');

    el.innerHTML = `
      <div class="act act-spell">
        <p class="prompt">Study it. You are going to have to write it from memory.</p>
        <div class="wordstage revealed spellstage">
          <div class="cmp-chips built">${chips}</div>
        </div>
        ${word.def ? `<p class="definition studydef">${word.def}</p>` : ''}
        <div class="feedback" aria-live="polite"></div>
        <div class="actions">
          ${canSpeak ? `<button class="btn ghost speak" data-act="speak" aria-label="hear the word">🔊</button>` : ''}
          <button class="btn primary" data-act="cover">Cover it</button>
        </div>
      </div>`;

    const stage = el.querySelector('.spellstage');
    const feedback = el.querySelector('.feedback');
    el.querySelector('[data-act="cover"]').onclick = cover;

    const play = () => { plays++; speak(word.text); el.querySelector('.answer')?.focus(); };
    const wireSpeak = () => {
      const b = el.querySelector('[data-act="speak"]');
      if (b) b.onclick = play;
    };
    wireSpeak();

    function cover() {
      stage.classList.add('covered');
      // NEVER put the word in the prompt. It was there once, which left the
      // answer on screen for the whole of the phase that is supposed to hide it.
      el.querySelector('.prompt').textContent = 'Now write it from memory.';
      // The definition stays up. It does not spell anything, and it is the
      // prompt he will face in cold recall, so pairing it with the effort of
      // writing the word is the whole point of showing it.
      el.querySelector('.actions').innerHTML = `
        ${canSpeak ? `<button class="btn ghost speak" data-act="speak" aria-label="hear the word again">🔊</button>` : ''}
        <button class="btn ghost" data-act="peek">Peek</button>
        <button class="btn primary" data-act="go">Check it</button>`;
      wireSpeak();
      stage.insertAdjacentHTML('afterend',
        `<input class="answer" type="text" inputmode="text" autocapitalize="off"
                autocomplete="off" autocorrect="off" spellcheck="false"
                aria-label="spell the word" placeholder="spell it">`);
      const input = el.querySelector('.answer');
      input.focus();
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      el.querySelector('[data-act="peek"]').onclick = peek;
      el.querySelector('[data-act="go"]').onclick = check;
    }

    function peek() {
      peeks++;
      stage.classList.remove('covered');
      feedback.innerHTML = '';
      setTimeout(() => stage.classList.add('covered'), 1600);
      el.querySelector('.answer')?.focus();
    }

    function check() {
      const input = el.querySelector('.answer');
      const given = input.value.trim().toLowerCase();
      if (!given) return;
      attempts++;
      const ok = given === word.text;

      if (!ok && attempts === 1) {
        feedback.innerHTML = `<p class="msg gentle">${say('spellWrong', {}, opts.personality)}</p>`;
        input.select();
        return;
      }

      const ms = performance.now() - started;
      stage.classList.remove('covered');
      input.disabled = true;

      let why = '';
      if (!ok) {
        const n = Math.max(given.length, word.text.length);
        const yours = [], real = [];
        for (let k = 0; k < n; k++) {
          const a = given[k], b = word.text[k];
          if (a !== undefined) yours.push(`<b class="${a === b ? '' : 'bad'}">${a}</b>`);
          else yours.push('<b class="bad missing">·</b>');
          if (b !== undefined) real.push(`<b class="${a === b ? '' : 'bad'}">${b}</b>`);
        }
        why = `<div class="compare">
          <div class="cmp-row wrong"><span class="cmp-label">you wrote</span>
            <span class="cmp-word">${yours.join('')}</span></div>
          <div class="cmp-row right"><span class="cmp-label">the word</span>
            <span class="cmp-word">${real.join('')}</span></div>
        </div>`;
      }

      // "Clean" is the evidence that gates mission progress, so it has to mean
      // exactly what it says: right, first go, without looking. Getting there
      // on the second attempt is fine and still counts as correct — it is just
      // not evidence that he can spell the word cold.
      const clean = ok && peeks === 0 && attempts === 1;
      const credit = {};
      for (const p of word.parts) credit[p.m] = ok;

      feedback.innerHTML = why + `<p class="msg ${ok ? 'good' : 'gentle'}">${
        say(ok ? (clean ? 'spellClean' : 'spellRight') : 'spellWrong',
            { word: word.display || word.text, peeks }, opts.personality)}</p>`;
      el.querySelector('.actions').innerHTML =
        `${canSpeak ? `<button class="btn ghost speak" data-act="speak" aria-label="hear the word">🔊</button>` : ''}
         <button class="btn primary" data-act="next">Next</button>`;
      wireSpeak();
      el.querySelector('[data-act="next"]').focus();
      resolve({ correct: ok, ms, credit, detail: { given, peeks, attempts, clean, plays, defShown } });
    }
  });
}
