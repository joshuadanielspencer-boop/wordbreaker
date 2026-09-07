// SOUND HUNT — phoneme-to-grapheme mapping. Kilpatrick, Chapter 6 #2.
//
// A nonsense word is spoken. He picks which spelling made one of the sounds in
// it — `ch` rather than `sh`, `oa` rather than `ee`.
//
// The word is never shown, so this cannot be done by looking. It has to go
// sound → letters, which is the direction spelling actually runs and the
// direction that is weakest in a reader who has learned to work backwards from
// print. Nonsense words are used so no memory of a real word can substitute
// for hearing it.
//
// Kilpatrick asks for a "none of these" option, so one is always present and
// is sometimes the answer — otherwise the tiles themselves become the clue.

import { say } from '../voice/voice.js';
import { say as speak, speechAvailable } from '../core/speech.js';

// Contrast sets: each family holds spellings that must be told apart by ear.
export const FAMILIES = {
  digraph:      ['ch', 'sh', 'th', 'ph', 'wh'],
  vowel_team:   ['ai', 'ea', 'ee', 'oa', 'oo', 'ou', 'oi', 'aw'],
  r_controlled: ['ar', 'er', 'or', 'ur', 'ir'],
  blend:        ['bl', 'br', 'cl', 'cr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr',
                 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw'],
};

const NONE = '— none of these —';

function shuffle(a) {
  const o = a.slice();
  for (let i = o.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [o[i], o[j]] = [o[j], o[i]];
  }
  return o;
}

/** Which spelling from `family` this word actually contains, if any. */
export function graphemeIn(word, family) {
  const found = FAMILIES[family].filter(g => word.includes(g));
  // Longest wins, so `sh` inside `shr` is not reported as something else.
  return found.sort((a, b) => b.length - a.length)[0] || null;
}

export function mount(el, item, opts = {}) {
  return new Promise(resolve => {
    const started = performance.now();
    const target = item.word.text;
    const family = item.family;
    const answer = item.grapheme;            // null means "none of these"
    let plays = 0;
    let attempts = 0;

    if (!speechAvailable()) {
      resolve({ correct: true, ms: 0, credit: {}, detail: { skipped: 'no speech' } });
      return;
    }

    const decoys = shuffle(FAMILIES[family].filter(g => g !== answer)).slice(0, answer ? 3 : 4);
    const tiles = shuffle([...(answer ? [answer] : []), ...decoys]);
    tiles.push(NONE);                        // always last, always available

    el.innerHTML = `
      <div class="act act-soundhunt">
        <p class="prompt">Listen. Which of these spellings is in the word?</p>
        <div class="casefile dictation-card">
          <div class="stamp">not a real word</div>
          <button class="btn speak-big" data-act="play">Say it again</button>
        </div>
        <div class="tile-row">${tiles.map((g, i) =>
          `<button class="opt tile${g === NONE ? ' none' : ''}" data-i="${i}">${g}</button>`).join('')}</div>
        <div class="feedback" aria-live="polite"></div>
        <div class="actions"></div>
      </div>`;

    const play = () => { plays++; speak(target); };
    el.querySelector('[data-act="play"]').onclick = play;
    setTimeout(play, 400);

    el.querySelectorAll('.tile').forEach(b =>
      b.addEventListener('click', () => choose(tiles[Number(b.dataset.i)], Number(b.dataset.i))));

    function choose(picked, i) {
      const correctPick = answer ? picked === answer : picked === NONE;
      attempts++;

      if (!correctPick && attempts === 1) {
        el.querySelectorAll('.tile')[i].classList.add('chosen-wrong');
        el.querySelector('.feedback').innerHTML =
          `<p class="msg gentle">${say('soundHuntWrong', {}, opts.personality)}</p>`;
        play();
        return;
      }

      const ms = performance.now() - started;
      el.querySelectorAll('.tile').forEach((b, k) => {
        b.disabled = true;
        const isAnswer = answer ? tiles[k] === answer : tiles[k] === NONE;
        if (isAnswer) b.classList.add('right');
        else if (k === i) b.classList.add('chosen-wrong');
        else b.classList.add('dimmed');
      });

      el.querySelector('.dictation-card').insertAdjacentHTML('beforeend',
        `<p class="recall-answer">${target}</p>`);

      const clean = correctPick && attempts === 1;
      el.querySelector('.feedback').innerHTML = `<p class="msg ${correctPick ? 'good' : 'gentle'}">${
        say(correctPick ? 'soundHuntRight' : 'soundHuntWrong',
            { word: target, grapheme: answer || 'none of them' }, opts.personality)}</p>`;
      el.querySelector('.actions').innerHTML =
        `<button class="btn primary" data-act="next">Next</button>`;
      el.querySelector('[data-act="next"]').focus();

      resolve({
        correct: correctPick,
        ms,
        credit: {},
        detail: { word: target, family, answer: answer || 'none', picked, clean, attempts, plays },
      });
    }
  });
}
