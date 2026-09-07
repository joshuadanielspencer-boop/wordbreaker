// IMPOSTOR ROW — look-alike discrimination. Kilpatrick, Chapter 6 §5.
//
// A row of words sharing a first letter and a length, differing by one or two
// graphemes. One of them is named — spoken aloud, or described — and the
// learner picks it.
//
// This is the one activity where multiple choice is not just acceptable but is
// the entire mechanism. Every compensating strategy returns the wrong answer:
// the first letter is shared, the shape is shared, there is no context, and
// the length is shared. Nothing except reading all the letters gets you there,
// which is exactly the habit under attack.
//
// The row order is shuffled every time so position is never a cue, and a set
// that has been met before is merged with a neighbouring set so the shared
// first letter stops narrowing anything.

import { say } from '../voice/voice.js';
import { say as speak, speechAvailable } from '../core/speech.js';
import { setWords } from '../content/lookalikes.js';

function shuffle(a) {
  const o = a.slice();
  for (let i = o.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [o[i], o[j]] = [o[j], o[i]];
  }
  return o;
}

export function mount(el, item, opts = {}) {
  return new Promise(resolve => {
    const started = performance.now();
    const { set, target } = item;
    const members = shuffle(setWords(set));
    const byMeaning = set.prompt === 'meaning' || !speechAvailable();
    let plays = 0;
    let attempts = 0;

    // With no audio a sound-prompted set is unanswerable, so fall back to the
    // definition — and if there is no definition either, skip rather than
    // present something that cannot be answered.
    const targetDef = target.def;
    if (byMeaning && !targetDef) {
      resolve({ correct: true, ms: 0, credit: {}, detail: { skipped: 'no prompt available' } });
      return;
    }

    el.innerHTML = `
      <div class="act act-impostor">
        <p class="prompt">Only one of these is the word. Read all of them.</p>
        <div class="casefile impostor-prompt">
          ${byMeaning
            ? `<p class="definition">${targetDef}</p>`
            : `<button class="btn speak-big" data-act="play">Play the word again</button>`}
        </div>
        <div class="impostor-row">${members.map((m, i) =>
          `<button class="opt impostor" data-i="${i}">${m.w}</button>`).join('')}</div>
        <div class="feedback" aria-live="polite"></div>
        <div class="actions"></div>
      </div>`;

    if (!byMeaning) {
      const play = () => { plays++; speak(target.w); };
      el.querySelector('[data-act="play"]').onclick = play;
      setTimeout(play, 300);
    }

    el.querySelectorAll('.impostor').forEach(b =>
      b.addEventListener('click', () => choose(Number(b.dataset.i))));

    function choose(i) {
      const picked = members[i];
      const ok = picked.w === target.w;
      attempts++;

      // One free retry: the point is to send him back to the letters, not to
      // close the item the instant he mis-reads one.
      if (!ok && attempts === 1) {
        el.querySelectorAll('.impostor')[i].classList.add('chosen-wrong');
        el.querySelector('.feedback').innerHTML =
          `<p class="msg gentle">${say('impostorWrong', {}, opts.personality)}</p>`;
        if (!byMeaning) speak(target.w);
        return;
      }

      const ms = performance.now() - started;
      el.querySelectorAll('.impostor').forEach((b, k) => {
        b.disabled = true;
        if (members[k].w === target.w) b.classList.add('right');
        else if (k === i) b.classList.add('chosen-wrong');
        else b.classList.add('dimmed');
      });

      // Name the difference. On a look-alike set the whole lesson is *where*
      // the two words stop agreeing.
      let why = '';
      if (!ok) {
        const a = picked.w, b = target.w;
        const at = [...b].findIndex((c, k) => c !== a[k]);
        const mark = w => [...w].map((c, k) =>
          `<b class="${k === at ? 'bad' : ''}">${c}</b>`).join('');
        why = `<div class="compare">
          <div class="cmp-row wrong"><span class="cmp-label">you picked</span>
            <span class="cmp-word">${mark(a)}</span></div>
          <div class="cmp-row right"><span class="cmp-label">the word</span>
            <span class="cmp-word">${mark(b)}</span></div>
        </div>`;
      }

      const clean = ok && attempts === 1;
      el.querySelector('.feedback').innerHTML = why +
        `<p class="msg ${ok ? 'good' : 'gentle'}">${
          say(ok ? 'impostorRight' : 'impostorWrong', { word: target.w }, opts.personality)}</p>`;
      el.querySelector('.actions').innerHTML =
        `<button class="btn primary" data-act="next">Next</button>`;
      el.querySelector('[data-act="next"]').focus();

      resolve({
        correct: ok,
        ms,
        credit: {},                       // discrimination is not a morpheme skill
        detail: { set: set.id, target: target.w, picked: picked.w, clean, attempts, plays, byMeaning },
      });
    }
  });
}
