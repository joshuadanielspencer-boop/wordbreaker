// SPELL IT OUT — oral decoding. Kilpatrick, Chapter 6 #11.
//
// The app spells a word aloud, one letter at a time, using letter NAMES rather
// than sounds — Kilpatrick is explicit about that. The learner has to hold the
// sequence and recognise what it spells.
//
// Nothing is on screen. There is no shape to recognise, no first letter to
// guess from, no context, and no word to look at — which makes it the purest
// test in the app of whether a spelling is actually stored in memory rather
// than merely recognised when seen. It is also the exact inverse of Spelling
// Slaughter's cold recall, and the two together cover both directions.
//
// Replays are counted but never punished. Needing three replays for a word he
// will later get in one is the measurement working.

import { say } from '../voice/voice.js';
import { spellAloud, speechAvailable } from '../core/speech.js';

export function mount(el, word, opts = {}) {
  return new Promise(resolve => {
    const started = performance.now();
    // A missing word would take the whole session down; hand the item back.
    if (!(word.text)) {
      resolve({ correct: true, ms: 0, credit: {}, detail: { skipped: 'no word' } });
      return;
    }
    const target = word.text;
    let plays = 0;
    let attempts = 0;
    let cancel = () => {};

    // With no speech there is nothing to hear and no fallback that preserves
    // the point, so hand the item back rather than present a broken one.
    if (!speechAvailable()) {
      resolve({ correct: true, ms: 0, credit: {}, detail: { skipped: 'no speech' } });
      return;
    }

    el.innerHTML = `
      <div class="act act-spellout">
        <p class="prompt">Listen to the letters. What word is being spelled?</p>
        <div class="casefile spellout-card">
          <button class="btn speak-big" data-act="play">Spell it again</button>
          <p class="shape"><span>${target.length} letters</span></p>
        </div>
        <input class="answer" type="text" inputmode="text" autocapitalize="off"
               autocomplete="off" autocorrect="off" spellcheck="false"
               aria-label="what word is it" placeholder="what word is it?">
        <div class="feedback" aria-live="polite"></div>
        <div class="actions">
          <button class="btn primary" data-act="go">That's the word</button>
        </div>
      </div>`;

    const input = el.querySelector('.answer');
    input.focus();
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    el.querySelector('[data-act="go"]').onclick = check;

    const play = () => { plays++; cancel(); cancel = spellAloud(target); input.focus(); };
    el.querySelector('[data-act="play"]').onclick = play;
    setTimeout(play, 400);

    function check() {
      const given = input.value.trim().toLowerCase();
      if (!given) return;
      attempts++;
      const ok = given === target;

      if (!ok && attempts === 1) {
        el.querySelector('.feedback').innerHTML =
          `<p class="msg gentle">${say('spelloutWrong', {}, opts.personality)}</p>`;
        input.select();
        play();
        return;
      }

      cancel();
      const ms = performance.now() - started;
      input.disabled = true;
      el.querySelector('.spellout-card').insertAdjacentHTML('beforeend',
        `<p class="recall-answer">${word.display || target}</p>`);

      const clean = ok && attempts === 1 && plays <= 1;
      el.querySelector('.feedback').innerHTML = `<p class="msg ${ok ? 'good' : 'gentle'}">${
        say(ok ? 'spelloutRight' : 'spelloutWrong', { word: target, plays }, opts.personality)}</p>`;
      el.querySelector('.actions').innerHTML =
        `<button class="btn primary" data-act="next">Next</button>`;
      el.querySelector('[data-act="next"]').focus();

      resolve({ correct: ok, ms, credit: {}, detail: { given, plays, attempts, clean } });
    }
  });
}
