// SOUND SWAP — take a sound out of a word, or swap one for another.
//
// Kilpatrick's One Minute Activities, in the only form that works without an
// adult in the room. He hears a word, is told which sound to drop or change,
// and types what is left. Nothing on screen ever spells the word.
//
// That last part is the whole design. Show the word and the task collapses:
// "feet without /f/" becomes crossing out a letter you can see, which is a
// cheaper path than the intended one, and cheaper paths get found. Unseen, the
// word has to be held in his head and taken apart there, which is the skill.
//
// Scored PHONETICALLY, like nonsense dictation: `eet` for `eat` is correct,
// because the manipulation was right and the spelling is defensible. Marking
// only the dictionary spelling would turn a phonology item into a spelling
// item and fail him for the wrong thing.
//
// It is TRAINING and never evidence. Typing takes seconds, so the time here
// measures his hands, not his phonology, and must never be compared with the
// PAST's two-second spoken window. The evidence view leaves it alone.

import { say } from '../voice/voice.js';
import { sayTwice, say as speak, speechAvailable, RATE } from '../core/speech.js';
import { soundsSame } from '../core/phonics.js';
import { MANIP_LABEL } from '../content/manipulation.js';

export function mount(el, item, opts = {}) {
  return new Promise(resolve => {
    const started = performance.now();
    const { target: word, op, cue, to, answer, level } = item;
    let plays = 0, attempts = 0, slow = false;

    if (!speechAvailable()) {
      resolve({ correct: true, ms: 0, credit: {}, detail: { skipped: 'no speech' } });
      return;
    }

    const instruction = op === 'delete'
      ? `Now say it <b>without ${cue}</b>.`
      : `Now <b>change ${cue} to ${to}</b>.`;

    el.innerHTML = `
      <div class="act act-manipulate">
        <p class="prompt">Listen. Then change it in your head.</p>
        <div class="casefile manip-card">
          <div class="stamp">${MANIP_LABEL[level] || 'sound swap'}</div>
          <button class="btn speak-big" data-act="play">Say the word again</button>
          <button class="btn ghost slow-toggle" data-act="slow" aria-pressed="false">Slower</button>
          <p class="manip-instruction">${instruction}</p>
        </div>
        <input class="answer" type="text" inputmode="text" autocapitalize="off"
               autocomplete="off" autocorrect="off" spellcheck="false"
               aria-label="type what is left" placeholder="type what is left">
        <div class="feedback" aria-live="polite"></div>
        <div class="actions">
          <button class="btn primary" data-act="go">That's what's left</button>
        </div>
      </div>`;

    const input = el.querySelector('.answer');
    const feedback = el.querySelector('.feedback');
    input.focus();
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    el.querySelector('[data-act="go"]').onclick = check;

    // The word is the prompt, so replaying it is free. Read twice, like a
    // teacher would, because catching it is not what is being tested.
    const play = () => { plays++; sayTwice(word, { rate: RATE.word, slow }); input.focus(); };
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

      const exact = given === answer;
      const phonetic = !exact && soundsSame(given, answer);
      const ok = exact || phonetic;

      if (!ok && attempts === 1) {
        feedback.innerHTML = `<p class="msg gentle">${say('dictationWrong', {}, opts.personality)}</p>`;
        input.select();
        play();
        return;
      }

      const ms = performance.now() - started;
      input.disabled = true;

      let why = '';
      if (phonetic) {
        why = `<p class="msg good">That is a different spelling from mine and it says
               exactly the same thing, so it is right.</p>`;
      } else if (!ok) {
        // Show the whole move, not just the answer. The useful thing is seeing
        // where the sound came out of, which a bare correction does not teach.
        why = `<div class="compare">
          <div class="cmp-row wrong"><span class="cmp-label">you said</span>
            <span class="cmp-word">${given}</span></div>
          <div class="cmp-row right"><span class="cmp-label">the move</span>
            <span class="cmp-word">${word} ${op === 'delete' ? `− ${cue}` : `${cue}→${to}`} = <b>${answer}</b></span></div>
        </div>`;
      }

      // Only now is the word itself safe to show, and hearing the answer next
      // to it is the moment the sounds and the letters line up.
      el.querySelector('.manip-card').insertAdjacentHTML('beforeend',
        `<p class="recall-answer">${word} → ${answer}</p>`);

      const clean = ok && attempts === 1 && plays <= 1;
      feedback.innerHTML = why + `<p class="msg ${ok ? 'good' : 'gentle'}">${
        say(ok ? (clean ? 'dictationClean' : 'dictationRight') : 'dictationWrong',
            { word: answer, plays }, opts.personality)}</p>`;
      el.querySelector('.actions').innerHTML =
        `<button class="btn ghost speak" data-act="hear" aria-label="hear the answer">🔊</button>
         <button class="btn primary" data-act="next">Next</button>`;
      el.querySelector('[data-act="hear"]').onclick = () => speak(answer, { rate: RATE.word });
      el.querySelector('[data-act="next"]').focus();

      resolve({
        correct: ok,
        ms,
        credit: {},
        detail: { item: item.id, word, level, cue, to: to || null, answer, given, exact, phonetic, plays, attempts, clean },
      });
    }
  });
}
