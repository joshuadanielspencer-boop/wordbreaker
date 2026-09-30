// SOUND SWAP, ALOUD — the run screen.
//
// Built like the PAST administration screen, because it is the same job: the
// adult reads the item, the child answers out loud, the adult judges it inside
// about two seconds. The app shows the answer so the adult does not have to
// work it out while listening.
//
// It runs for a minute. Kilpatrick's block is a minute and the name is not
// decorative — the point of a short block is that it is short.

import { RUN_SECONDS, oralItems, recordOral, suggestedLevel,
         MANIP_ORDER, MANIP_LABEL, readyToAdvance, oralHistory } from '../core/oralswap.js';

const esc = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function renderOralSwap(app, { onBack, onDone }) {
  window.scrollTo(0, 0);
  const level = suggestedLevel();
  const runs = oralHistory();

  app.innerHTML = `
    <div class="topbar teacher-bar">
      <button class="btn ghost" data-act="back">Back</button>
      <div class="spacer"></div>
      <span class="pill teacher-pill">sound swap aloud</span>
    </div>
    <div class="hero teacher-hero">
      <h1 style="font-size:28px">Sound Swap, aloud</h1>
      <p>One minute. You read it, he says it, you judge it.</p>
    </div>

    <p class="msg plainmsg fineprint">
      The solo version has him type the answer, which works without you but adds
      a spelling step and measures his hands as much as his phonology. Said out
      loud and judged inside two seconds is the form that means something — and
      the only form in which "automatic" is a real word.
    </p>
    <p class="msg plainmsg fineprint">
      This is exercise, not measurement: it stays out of the evidence view. The
      PAST is the instrument. These rungs are this app's own and are <b>not</b>
      Kilpatrick's lettered levels.
    </p>

    <div class="section-title">which rung</div>
    <div class="modal-list">
      ${MANIP_ORDER.map(l => `
        <button class="btn opt-row ${l === level ? 'on' : ''}" data-level="${l}">
          <b>${MANIP_LABEL[l]}</b>
          <span>${l === level ? 'suggested — carry on here' : ''}${
            readyToAdvance(l) ? ' · three automatic runs, ready to move up' : ''}</span>
        </button>`).join('')}
    </div>

    ${runs.length ? `
      <div class="section-title">recent runs</div>
      ${runs.slice(-5).reverse().map(r => `
        <p class="msg plainmsg" style="text-align:left">
          <b>${new Date(r.t).toLocaleDateString()}</b> — ${MANIP_LABEL[r.level] || r.level}:
          ${r.items} items, ${r.automatic} automatic.</p>`).join('')}` : ''}`;

  app.querySelector('[data-act="back"]').onclick = onBack;
  app.querySelectorAll('[data-level]').forEach(b =>
    b.onclick = () => run(app, b.dataset.level, { onBack, onDone }));
}

function run(app, level, { onBack, onDone }) {
  const items = oralItems(level, 25);
  if (!items.length) {
    app.innerHTML = `<p class="msg gentle">No items left on that rung.</p>`;
    return;
  }

  const started = Date.now();
  const done = [];
  let i = 0;

  const finish = () => {
    if (!done.length) return onBack();
    summary(app, { level, done, onDone });
  };

  function step() {
    window.scrollTo(0, 0);
    const elapsed = Math.floor((Date.now() - started) / 1000);
    if (i >= items.length || elapsed >= RUN_SECONDS) return finish();

    const item = items[i];
    const shown = Date.now();
    const instruction = item.op === 'delete'
      ? `Now say it <b>without ${esc(item.cue)}</b>.`
      : `Now <b>change ${esc(item.cue)} to ${esc(item.to)}</b>.`;

    app.innerHTML = `
      <div class="topbar teacher-bar">
        <button class="btn ghost" data-act="stop">Finish</button>
        <div class="spacer"></div>
        <span class="pill teacher-pill" id="osclock">${RUN_SECONDS - elapsed}s · ${done.length} done</span>
      </div>
      <div class="past-run">
        <p class="teacher-label">${MANIP_LABEL[item.level] || item.level}</p>
        <div class="casefile past-item">
          <p class="past-say">Say <b>${esc(item.target)}</b></p>
          <p class="past-instruction">${instruction}</p>
          <p class="past-answer">answer: <b>${esc(item.answer)}</b></p>
        </div>
        <div class="teacher-panel">
          <p class="teacher-label">what happened?</p>
          <div class="score-row">
            <button class="btn score s3" data-v="auto" aria-label="Right, and within two seconds">
              <b>Right, quickly</b><span>inside two seconds</span></button>
            <button class="btn score s2" data-v="slow" aria-label="Right, but slower than two seconds">
              <b>Right, slowly</b><span>got there, past two seconds</span></button>
            <button class="btn score s0" data-v="wrong" aria-label="Wrong">
              <b>Wrong</b><span>did not get there</span></button>
            <button class="btn score" data-v="skip" aria-label="Skip this item">
              <b>Skip</b><span>move on</span></button>
          </div>
        </div>
      </div>`;

    const clock = app.querySelector('#osclock');
    const tick = setInterval(() => {
      const left = RUN_SECONDS - Math.floor((Date.now() - started) / 1000);
      clock.textContent = `${Math.max(0, left)}s · ${done.length} done`;
      if (left <= 0) { clearInterval(tick); finish(); }
    }, 500);

    app.querySelector('[data-act="stop"]').onclick = () => { clearInterval(tick); finish(); };

    app.querySelectorAll('.score').forEach(b => b.onclick = () => {
      clearInterval(tick);
      const v = b.dataset.v;
      if (v !== 'skip') {
        recordOral(item, v, Date.now() - shown);
        done.push({ item, v });
      }
      i++;
      step();
    });
  }

  step();
}

function summary(app, { level, done, onDone }) {
  window.scrollTo(0, 0);
  const auto = done.filter(d => d.v === 'auto').length;
  const right = done.filter(d => d.v !== 'wrong').length;

  app.innerHTML = `
    <div class="topbar teacher-bar"><span class="pill teacher-pill">recorded</span></div>
    <div class="hero teacher-hero">
      <h1 style="font-size:40px">${auto} / ${done.length}</h1>
      <p>automatic, on ${MANIP_LABEL[level] || level}${
        right !== done.length ? ` · ${right} right in all` : ''}</p>
    </div>
    <p class="msg plainmsg fineprint">
      Kilpatrick advances after three or four consecutive automatic days. The
      app reports when that has happened and leaves the decision to you — it
      cannot hear him, so it should not be moving the goalposts on its own.
    </p>
    ${readyToAdvance(level)
      ? `<p class="msg good">Three runs at this rung have come out mostly automatic. Worth trying the next one.</p>`
      : ''}
    <div class="homegrid" style="margin-top:22px">
      <button class="btn primary big" data-act="done">Done</button>
    </div>`;
  app.querySelector('[data-act="done"]').onclick = onDone;
}
