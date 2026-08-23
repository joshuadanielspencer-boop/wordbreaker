// WORD DETECTIVE — work out what a word means from the pieces it is built of.
//
// The one activity where multiple choice is legitimate: reasoning IS the
// target skill here, not decoding. The wrong answers are the literal meanings
// of words sharing the same root, so they can only be eliminated by reading
// the piece that actually differs — never by plausibility.

import { MORPH, distractorsFor, originLabel } from '../content/lexicon.js';
import { say } from '../voice/voice.js';

function shuffle(a) {
  const o = a.slice();
  for (let i = o.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [o[i], o[j]] = [o[j], o[i]];
  }
  return o;
}

export function mount(el, word, opts = {}) {
  return new Promise(resolve => {
    const started = performance.now();
    const answer = { lit: word.note.lit, from: null, correct: true };
    const options = shuffle([answer, ...distractorsFor(word, 3)]);

    const evidence = word.parts.map(p => {
      const m = MORPH[p.m];
      return `<span class="part ${m.type}">
                <span class="part-text">${p.surface}</span>
                <span class="part-gloss">${m.gloss}</span>
              </span>`;
    }).join('<span class="joiner">+</span>');

    el.innerHTML = `
      <div class="act act-detective">
        <p class="prompt">What does this word mean? Work it out from the pieces.</p>
        <div class="casefile">
          <div class="suspect">${word.text}</div>
          <div class="evidence">${evidence}</div>
        </div>
        <div class="options">${options.map((o, i) =>
          `<button class="opt" data-i="${i}">${o.lit}</button>`).join('')}</div>
        <div class="feedback" aria-live="polite"></div>
        <div class="actions"></div>
      </div>`;

    el.querySelectorAll('.opt').forEach(b =>
      b.addEventListener('click', () => choose(Number(b.dataset.i), b)));

    function choose(i, btn) {
      const picked = options[i];
      const ok = !!picked.correct;
      const ms = performance.now() - started;

      el.querySelectorAll('.opt').forEach((b, k) => {
        b.disabled = true;
        if (options[k].correct) b.classList.add('right');
        else if (k === i) b.classList.add('chosen-wrong');
        else b.classList.add('dimmed');
      });

      const credit = {};
      for (const p of word.parts) credit[p.m] = ok;

      // A wrong pick is not noise — it is the literal meaning of a real word.
      // Naming that word turns the mistake into a second thing learned.
      const why = !ok && picked.from
        ? `<p class="msg gentle">“${picked.lit}” is <b>${picked.from}</b>.</p>`
        : '';

      el.querySelector('.feedback').innerHTML = `
        ${why}
        <p class="msg ${ok ? 'good' : 'gentle'}">${
          say(ok ? 'detectiveRight' : 'detectiveWrong', { word: word.text }, opts.personality)}</p>
        <p class="litline"><b>${word.text}</b> — ${word.note.lit}</p>
        ${word.note.note ? `<p class="story">${word.note.note}</p>` : ''}`;

      el.querySelector('.actions').innerHTML =
        `<button class="btn primary" data-act="next">Next</button>`;
      el.querySelector('[data-act="next"]').focus();
      resolve({ correct: ok, ms, credit, detail: { picked: picked.lit, from: picked.from } });
    }
  });
}
