// WORD EQUATION — build the word from its meanings.
//
// He sees the pieces and what they mean, and has to type the finished word.
// Typing is the point: it is the one response he cannot get right by
// recognising a shape, and it puts the awkward joins (sub+port = support,
// in+mortal = immortal) exactly where the effort belongs.

import { MORPH } from '../content/lexicon.js';
import { say } from '../voice/voice.js';

export function mount(el, word, opts = {}) {
  return new Promise(resolve => {
    const started = performance.now();
    let attempts = 0;

    const eq = word.parts.map(p => {
      const m = MORPH[p.m];
      return `<span class="eq-term ${m.type}">
                <span class="eq-surface">${p.surface}</span>
                <span class="eq-gloss">${m.gloss}</span>
              </span>`;
    }).join('<span class="joiner">+</span>');

    el.innerHTML = `
      <div class="act act-equation">
        <p class="prompt">Solve the equation.</p>
        <div class="equation">${eq}<span class="joiner">=</span>
          <span class="eq-term unknown"><span class="eq-surface">?</span></span></div>
        <input class="answer" type="text" inputmode="text" autocapitalize="off"
               autocomplete="off" autocorrect="off" spellcheck="false"
               aria-label="type the word" placeholder="type the word">
        <div class="feedback" aria-live="polite"></div>
        <div class="actions">
          <button class="btn primary" data-act="go">Solve</button>
        </div>
      </div>`;

    const input = el.querySelector('.answer');
    const feedback = el.querySelector('.feedback');
    input.focus();
    input.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
    el.querySelector('[data-act="go"]').addEventListener('click', check);

    function check() {
      attempts++;
      const given = input.value.trim().toLowerCase();
      if (!given) return;
      const ms = performance.now() - started;
      const ok = given === word.text;

      if (!ok && attempts === 1) {
        feedback.innerHTML = `<p class="msg gentle">${say('errorEquation', {}, opts.personality)}</p>`;
        // Show how close: correct prefix length is a real, useful signal.
        const shared = [...given].findIndex((c, i) => c !== word.text[i]);
        if (shared > 1) feedback.innerHTML +=
          `<p class="msg gentle">The first ${shared} letters are right.</p>`;
        input.select();
        return;
      }

      const credit = {};
      for (const p of word.parts) credit[p.m] = ok;

      el.querySelector('.equation .unknown .eq-surface').textContent = word.text;
      el.querySelector('.equation .unknown').classList.add(ok ? 'solved' : 'shown');
      input.disabled = true;

      // Show his spelling against the real one, letter by letter, so the
      // divergence point is visible rather than described.
      let why = '';
      if (!ok) {
        const n = Math.max(given.length, word.text.length);
        const yours = [], real = [];
        for (let k = 0; k < n; k++) {
          const a = given[k], b = word.text[k];
          const cls = a === b ? '' : ' bad';
          if (a !== undefined) yours.push(`<b class="${cls}">${a}</b>`);
          else yours.push(`<b class="bad missing">·</b>`);
          if (b !== undefined) real.push(`<b class="${a === b ? '' : 'bad'}">${b}</b>`);
        }
        why = `<div class="compare">
          <div class="cmp-row wrong"><span class="cmp-label">you wrote</span>
            <span class="cmp-word">${yours.join('')}</span></div>
          <div class="cmp-row right"><span class="cmp-label">the word</span>
            <span class="cmp-word">${real.join('')}</span></div>
        </div>`;
      }

      feedback.innerHTML = why + `<p class="msg ${ok ? 'good' : 'gentle'}">${
        say(ok ? 'correct' : 'errorEquation', { word: word.text }, opts.personality)}</p>`;
      el.querySelector('.actions').innerHTML =
        `<button class="btn primary" data-act="next">Next</button>`;
      el.querySelector('[data-act="next"]').focus();
      resolve({ correct: ok, ms, credit, detail: { given, attempts } });
    }
  });
}
