// THE NONSENSE LADDER — reading nonsense words aloud, scored by an adult.
//
// This is the PRIMARY outcome measure in docs/predictions.md, and it is the one
// thing in the project that software cannot do. The child reads the word out
// loud; an adult listens and taps how it came out.
//
// Do not be tempted to score this with speech recognition later. Every engine
// available is language-model driven, so it will hear `splonter` and helpfully
// write down `splinter` — turning the most diagnostic item in the battery into
// a false pass. The whole reason nonsense words measure anything is that they
// cannot be recognised, and an ASR is a recogniser.
//
// SCORING is Kilpatrick's three-way judgement, not right/wrong:
//
//   3  instant          read as a whole unit, no visible assembly
//   2  sounded out      assembled audibly, then blended — correct but effortful
//   1  letter by letter laboured through, whatever the outcome
//   ✗  wrong            did not arrive at the word
//
// The 3-vs-2 distinction is the entire measurement. predictions.md's Branch A
// says taught patterns will come to be "read as whole units rather than sounded
// out", and Branch B says he will still be sounding them out letter by letter.
// Plain accuracy cannot separate those — a child who laboriously decodes every
// word correctly scores 100% under both readings. The share scored 3 is what
// actually moves, so it is what gets recorded.
//
// Timing runs from the word appearing to the adult tapping, so it includes
// adult reaction time and is a RELATIVE measure only. Comparing this week's
// median to last week's is meaningful; comparing it to any published norm is
// not, and nothing in the app does.
//
// This screen deliberately has no voice lines, no rewards and no feedback. It
// is a measurement, and a measurement that congratulates you has changed the
// thing it is measuring. The child gets encouragement from the adult, which is
// better than anything a computer could say here anyway.

import { PATTERN_LABEL } from '../content/nonsense.js';

const SCORES = [
  { v: 3, key: 'instant', label: 'Instant', sub: 'read as one unit' },
  { v: 2, key: 'blended', label: 'Sounded out', sub: 'assembled, then blended' },
  { v: 1, key: 'laboured', label: 'Letter by letter', sub: 'laboured through' },
  { v: 0, key: 'wrong', label: 'Wrong', sub: 'did not get there' },
];

export function mount(el, item) {
  return new Promise(resolve => {
    const target = item.word.text;

    el.innerHTML = `
      <div class="act act-ladder">
        <p class="prompt teacher-prompt">Read it out loud.</p>
        <div class="casefile ladder-card">
          <div class="stamp">not a real word</div>
          <div class="suspect ladder-word">${target}</div>
        </div>
        <div class="teacher-panel">
          <p class="teacher-label">How did that come out?</p>
          <div class="score-row">
            ${SCORES.map(s => `
              <button class="btn score s${s.v}" data-v="${s.v}"
                      aria-label="${s.label} — ${s.sub}">
                <b>${s.label}</b><span>${s.sub}</span>
              </button>`).join('')}
          </div>
          <p class="teacher-note">${PATTERN_LABEL[item.pattern] || item.pattern}</p>
        </div>
      </div>`;

    // Started when the word is actually on screen, not when the step was queued.
    const started = performance.now();

    el.querySelectorAll('.score').forEach(b => b.onclick = () => {
      const v = Number(b.dataset.v);
      const ms = performance.now() - started;

      el.querySelectorAll('.score').forEach(x => {
        x.disabled = true;
        if (x !== b) x.classList.add('dimmed');
      });
      b.classList.add('picked');

      // No praise, no commiseration — just the way out.
      el.querySelector('.teacher-panel').insertAdjacentHTML('beforeend',
        `<div class="actions"><button class="btn primary" data-act="next">Next word</button></div>`);
      el.querySelector('[data-act="next"]').focus();

      resolve({
        correct: v > 0,
        ms,
        credit: {},
        // score 0 means wrong; 1-3 are the quality of a correct reading.
        detail: {
          target, score: v || null, correct: v > 0,
          pattern: item.pattern, probeId: item.probeId,
        },
      });
    });
  });
}
