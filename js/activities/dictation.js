// NONSENSE DICTATION — Kilpatrick §2.3, Chapter 6 #12/#14.
//
// The voice says a word that does not exist; he writes it down.
//
// This is the cleanest measure in the whole app. There is no word to remember,
// no shape to recognise, no context to lean on and nothing to have memorised —
// only the sounds, and what he knows about which letters make them. It is also
// the outcome variable the branch decision turns on, so it is instrumented
// carefully: pattern, response time, attempts and replays all recorded.
//
// It is scored PHONETICALLY. `fraib` is a correct spelling of `frabe` and is
// marked correct; `frab` is not. Marking only exact matches would be testing
// memory for an arbitrary string, which is the opposite of the point.

import { say } from '../voice/voice.js';
import { sayTwice as speak, speechAvailable, RATE } from '../core/speech.js';
import { soundsSame } from '../core/phonics.js';
import { PATTERN_LABEL } from '../content/nonsense.js';

export function mount(el, item, opts = {}) {
  return new Promise(resolve => {
    const started = performance.now();
    const target = item.word.text;
    const pattern = item.pattern;
    let plays = 0;
    let attempts = 0;

    if (!speechAvailable()) {
      resolve({ correct: true, ms: 0, credit: {}, detail: { skipped: 'no speech' } });
      return;
    }

    el.innerHTML = `
      <div class="act act-dictation">
        <p class="prompt">This is not a word. Write it down anyway.</p>
        <div class="casefile dictation-card">
          <div class="stamp">not a real word</div>
          <button class="btn speak-big" data-act="play">Say it again</button>
          <button class="btn ghost slow-toggle" data-act="slow" aria-pressed="false">Slower</button>
          <p class="shape"><span>${PATTERN_LABEL[pattern] || pattern}</span></p>
        </div>
        <input class="answer" type="text" inputmode="text" autocapitalize="off"
               autocomplete="off" autocorrect="off" spellcheck="false"
               aria-label="spell what you hear" placeholder="spell what you hear">
        <div class="feedback" aria-live="polite"></div>
        <div class="actions">
          <button class="btn primary" data-act="go">That's how it's spelled</button>
        </div>
      </div>`;

    const input = el.querySelector('.answer');
    input.focus();
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    el.querySelector('[data-act="go"]').onclick = check;

    // Nonsense words get the slowest rate in the app and are read twice. There
    // is no word knowledge to fall back on when the word does not exist, so a
    // single quick reading tests hearing, not spelling. "Slower" is there
    // because no fixed rate suits every word, and replaying is free anyway —
    // it is the prompt, not a hint.
    let slow = false;
    const play = () => { plays++; speak(target, { rate: RATE.nonsense, slow }); input.focus(); };
    el.querySelector('[data-act="play"]').onclick = play;
    const slowBtn = el.querySelector('[data-act="slow"]');
    slowBtn.onclick = () => {
      slow = !slow;
      slowBtn.classList.toggle('on', slow);
      slowBtn.setAttribute('aria-pressed', String(slow));
      slowBtn.textContent = slow ? 'Slower ✓' : 'Slower';
      play();
    };
    setTimeout(play, 400);

    function check() {
      const given = input.value.trim().toLowerCase();
      if (!given) return;
      attempts++;

      const exact = given === target;
      const phonetic = !exact && soundsSame(given, target);
      const ok = exact || phonetic;

      if (!ok && attempts === 1) {
        el.querySelector('.feedback').innerHTML =
          `<p class="msg gentle">${say('dictationWrong', {}, opts.personality)}</p>`;
        input.select();
        play();
        return;
      }

      const ms = performance.now() - started;
      input.disabled = true;

      // A different spelling that says the same thing is right, and saying so
      // plainly is the whole lesson: the sounds are the thing, not the letters.
      let why = '';
      if (phonetic) {
        why = `<p class="msg good">That is a different spelling from mine, and it says exactly
               the same thing — so it is correct.</p>`;
      } else if (!ok) {
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
          <div class="cmp-row right"><span class="cmp-label">one way</span>
            <span class="cmp-word">${real.join('')}</span></div>
        </div>`;
      }

      el.querySelector('.dictation-card').insertAdjacentHTML('beforeend',
        `<p class="recall-answer">${target}</p>`);

      const clean = ok && attempts === 1 && plays <= 1;
      el.querySelector('.feedback').innerHTML = why + `<p class="msg ${ok ? 'good' : 'gentle'}">${
        say(ok ? (clean ? 'dictationClean' : 'dictationRight') : 'dictationWrong',
            { word: target, plays }, opts.personality)}</p>`;
      el.querySelector('.actions').innerHTML =
        `<button class="btn primary" data-act="next">Next</button>`;
      el.querySelector('[data-act="next"]').focus();

      resolve({
        correct: ok,
        ms,
        credit: {},
        detail: { given, target, pattern, exact, phonetic, plays, attempts, clean },
      });
    }
  });
}
