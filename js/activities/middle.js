// SHOW THE MIDDLE
//
// The same move as Word Autopsy, in the domain he actually likes: break the
// thing into pieces, deal with the pieces, put it back together.
//
// The total field is DISABLED until every partial is right. That is the whole
// activity. He can very likely see the answer already — the point is not the
// answer, and a design that merely *asks* him to show the working would be
// ignored by someone who has spent four years not showing it.

import { makeProblem, SKILLS } from '../content/math.js';
import { say } from '../voice/voice.js';

export function mount(el, problem, opts = {}) {
  return new Promise(resolve => {
    const started = performance.now();
    let stepIndex = 0;
    let slips = 0;

    el.innerHTML = `
      <div class="act act-middle">
        <p class="prompt">Break it up. I don't want the answer yet.</p>
        <div class="sum">
          <div class="sum-head">${problem.prompt}</div>
          <div class="sum-steps">
            ${problem.steps.map((s, i) => `
              <div class="sum-row" data-i="${i}">
                <span class="sum-label part root"><span class="part-text">${s.label}</span></span>
                <span class="eq">=</span>
                <input class="sum-in" inputmode="numeric" autocomplete="off"
                       aria-label="${s.label}" ${i === 0 ? '' : 'disabled'}>
              </div>`).join('')}
            <div class="sum-rule"></div>
            <div class="sum-row total" data-total>
              <span class="sum-label part suffix"><span class="part-text">total</span></span>
              <span class="eq">=</span>
              <input class="sum-in" inputmode="numeric" autocomplete="off"
                     aria-label="total" disabled>
            </div>
          </div>
        </div>
        <div class="feedback" aria-live="polite"></div>
        <div class="actions"></div>
      </div>`;

    const rows = [...el.querySelectorAll('.sum-row:not(.total)')];
    const totalRow = el.querySelector('.sum-row.total');
    const totalIn = totalRow.querySelector('.sum-in');
    const feedback = el.querySelector('.feedback');
    const inputs = rows.map(r => r.querySelector('.sum-in'));

    inputs[0].focus();
    inputs.forEach((inp, i) => inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); checkStep(i); }
    }));
    totalIn.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); checkTotal(); }
    });

    function checkStep(i) {
      if (i !== stepIndex) return;
      const val = Number(inputs[i].value.trim());
      if (!inputs[i].value.trim()) return;

      if (val !== problem.steps[i].answer) {
        slips++;
        rows[i].classList.add('wrong');
        feedback.innerHTML = `<p class="msg gentle">${say('middleWrong', {
          label: problem.steps[i].label }, opts.personality)}</p>`;
        inputs[i].select();
        return;
      }

      rows[i].classList.remove('wrong');
      rows[i].classList.add('done');
      inputs[i].disabled = true;
      stepIndex++;

      if (stepIndex < inputs.length) {
        inputs[stepIndex].disabled = false;
        inputs[stepIndex].focus();
        feedback.innerHTML = '';
      } else {
        // Only now does the answer become available.
        totalRow.classList.add('open');
        totalIn.disabled = false;
        totalIn.focus();
        feedback.innerHTML = `<p class="msg plainmsg">${say('middleOpen', {}, opts.personality)}</p>`;
      }
    }

    function checkTotal() {
      const val = Number(totalIn.value.trim());
      if (!totalIn.value.trim()) return;
      const ms = performance.now() - started;

      if (val !== problem.total) {
        slips++;
        totalRow.classList.add('wrong');
        feedback.innerHTML = `<p class="msg gentle">${say('middleAddUp', {}, opts.personality)}</p>`;
        totalIn.select();
        return;
      }

      totalRow.classList.remove('wrong');
      totalRow.classList.add('done');
      totalIn.disabled = true;
      const clean = slips === 0;
      feedback.innerHTML = `<p class="msg ${clean ? 'good' : 'gentle'}">${
        say(clean ? 'middleRight' : 'middleDone', { total: problem.total }, opts.personality)}</p>`;
      el.querySelector('.actions').innerHTML =
        `<button class="btn primary" data-act="next">Next</button>`;
      el.querySelector('[data-act="next"]').focus();

      resolve({
        correct: clean,
        ms,
        credit: { [problem.skill]: clean },
        detail: { prompt: problem.prompt, slips },
      });
    }
  });
}

export { makeProblem, SKILLS };
