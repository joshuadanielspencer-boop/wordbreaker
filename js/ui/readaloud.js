// READING ALOUD — the screen an adult keeps while he reads out loud.
//
// It has to be usable without looking at it. The adult is listening to a child
// read, not operating software, so a miscue is one large tap and nothing else:
// no dialog, no category picker, no confirmation. The keyboard shortcuts exist
// for the same reason — 1 to 7 and space, so it can be done while watching him
// rather than the screen.
//
// There IS a clock on this screen, which the rest of the app forbids. The rule
// is that a timer must never appear in front of the LEARNER while he works;
// this is the adult's screen, and a reading rate needs a duration.

import { MISCUE_TYPES, SELF_CORRECTED, recordReading } from '../core/readaloud.js';

const esc = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function renderReadAloud(app, { onBack, onDone }) {
  window.scrollTo(0, 0);
  app.innerHTML = `
    <div class="topbar teacher-bar">
      <button class="btn ghost" data-act="back">Back</button>
      <div class="spacer"></div>
      <span class="pill teacher-pill">reading aloud</span>
    </div>
    <div class="hero teacher-hero">
      <h1 style="font-size:28px">Reading aloud</h1>
      <p>He reads from his own book. You tap what you hear.</p>
    </div>

    <p class="msg plainmsg fineprint">
      The useful number is not how many mistakes he makes, it is what KIND. The
      two predictions in <b>docs/predictions.md</b> differ on exactly that: if
      decoding is taking over, first-letter and context guesses should fall away
      while ordinary slips stay. A running total cannot show that, so every
      miscue gets a type.
    </p>
    <p class="msg plainmsg fineprint">
      Correct every error, not only the ones that change the meaning — that is
      Kilpatrick's finding and it is the opposite of the usual advice.
    </p>

    <div class="section-title">what is he reading</div>
    <input class="answer" id="ralabel" maxlength="60" autocomplete="off"
           placeholder="e.g. Skulduggery Pleasant, p.40">
    <div class="section-title">roughly how many words</div>
    <p class="msg plainmsg fineprint">
      Optional, and a rough count is fine — a line count times the words in a
      line. Without it there is still a miscue MIX, just no rate per hundred
      words to compare passages of different lengths.
    </p>
    <input class="answer" id="rawords" type="number" min="0" step="10"
           inputmode="numeric" placeholder="e.g. 250">

    <div class="homegrid" style="margin-top:16px">
      <button class="btn primary big" data-act="start">Start listening</button>
    </div>`;

  app.querySelector('[data-act="back"]').onclick = onBack;
  app.querySelector('[data-act="start"]').onclick = () => {
    const label = app.querySelector('#ralabel').value.trim();
    const words = Number(app.querySelector('#rawords').value) || null;
    runSession(app, { label, words, onBack, onDone });
  };
}

function runSession(app, { label, words, onBack, onDone }) {
  const marks = [];
  const started = Date.now();

  app.innerHTML = `
    <div class="topbar teacher-bar">
      <button class="btn ghost" data-act="stop">Finish</button>
      <div class="spacer"></div>
      <span class="pill teacher-pill" id="raclock">0:00</span>
    </div>
    <div class="ra-head">
      <b>${esc(label || 'Reading aloud')}</b>
      <span id="racount">no miscues yet</span>
    </div>
    <div class="ra-grid">
      ${MISCUE_TYPES.map((t, i) => `
        <button class="btn ra-key" data-type="${t.id}">
          <span class="ra-num">${i + 1}</span>
          <b>${t.label}</b>
          <span>${t.hint}</span>
        </button>`).join('')}
    </div>
    <div class="ra-grid ra-extra">
      <button class="btn ra-key good" data-type="${SELF_CORRECTED}">
        <span class="ra-num">space</span>
        <b>Self-corrected</b>
        <span>got it wrong, then fixed it — not a miscue</span>
      </button>
      <button class="btn ra-key" data-act="undo">
        <span class="ra-num">⌫</span>
        <b>Undo</b>
        <span>take back the last tap</span>
      </button>
    </div>
    <div class="ra-tape" id="ratape"></div>`;

  const clock = app.querySelector('#raclock');
  const count = app.querySelector('#racount');
  const tape = app.querySelector('#ratape');

  const tick = setInterval(() => {
    const s = Math.floor((Date.now() - started) / 1000);
    clock.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }, 1000);

  const refresh = () => {
    const miscues = marks.filter(m => m.type !== SELF_CORRECTED).length;
    const fixed = marks.length - miscues;
    count.textContent = miscues === 0 && !fixed
      ? 'no miscues yet'
      : `${miscues} miscue${miscues === 1 ? '' : 's'}${fixed ? ` · ${fixed} self-corrected` : ''}`;
    // Newest first, so the last thing tapped is the thing you can see and undo.
    tape.innerHTML = marks.slice(-12).reverse().map(m => {
      const t = MISCUE_TYPES.find(x => x.id === m.type);
      return `<span class="ra-chip ${m.type === SELF_CORRECTED ? 'good' : ''}">${
        t ? esc(t.label) : 'Self-corrected'}</span>`;
    }).join('');
  };

  const add = type => { marks.push({ t: Date.now() - started, type }); refresh(); };
  const undo = () => { marks.pop(); refresh(); };

  app.querySelectorAll('[data-type]').forEach(b => b.onclick = () => add(b.dataset.type));
  app.querySelector('[data-act="undo"]').onclick = undo;

  // Tapping without looking is the point; so is not needing to aim.
  const onKey = e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === ' ') { add(SELF_CORRECTED); e.preventDefault(); return; }
    if (e.key === 'Backspace') { undo(); e.preventDefault(); return; }
    const n = Number(e.key);
    if (n >= 1 && n <= MISCUE_TYPES.length) { add(MISCUE_TYPES[n - 1].id); e.preventDefault(); }
  };
  window.addEventListener('keydown', onKey);

  const finish = () => {
    clearInterval(tick);
    window.removeEventListener('keydown', onKey);
    const seconds = (Date.now() - started) / 1000;
    if (!marks.length && seconds < 20) return onBack();      // opened by mistake
    recordReading({ label, words, seconds, marks });
    summary(app, { label, words, seconds, marks, onDone });
  };
  app.querySelector('[data-act="stop"]').onclick = finish;

  refresh();
}

function summary(app, { label, words, seconds, marks, onDone }) {
  window.scrollTo(0, 0);
  const miscues = marks.filter(m => m.type !== SELF_CORRECTED).length;
  const fixed = marks.length - miscues;
  const counts = {};
  for (const m of marks) counts[m.type] = (counts[m.type] || 0) + 1;
  const guesses = MISCUE_TYPES.filter(t => t.guess)
    .reduce((a, t) => a + (counts[t.id] || 0), 0);
  const mins = Math.max(1, Math.round(seconds / 60));

  app.innerHTML = `
    <div class="topbar teacher-bar"><span class="pill teacher-pill">recorded</span></div>
    <div class="hero teacher-hero">
      <h1 style="font-size:40px">${miscues}</h1>
      <p>miscue${miscues === 1 ? '' : 's'} in ${mins} minute${mins === 1 ? '' : 's'}${
        words ? ` over about ${words} words` : ''}${esc(label ? ` — ${label}` : '')}</p>
    </div>
    ${miscues ? `
      <div class="section-title">what kind</div>
      <div class="spread">
        ${MISCUE_TYPES.filter(t => counts[t.id]).map(t => `
          <div class="spread-row">
            <span class="spread-n">${counts[t.id]}</span>
            <span class="spread-name"><b>${t.label}</b><span>${t.hint}</span></span>
          </div>`).join('')}
      </div>
      <p class="msg plainmsg">
        <b>${Math.round((guesses / miscues) * 100)}%</b> of them were guesses rather
        than decoding slips. That share is the number the two predictions differ
        on — not the total.
      </p>` : `<p class="msg good">No miscues at all. Worth noting how hard the passage was.</p>`}
    ${fixed ? `<p class="msg plainmsg">${fixed} self-correction${fixed === 1 ? '' : 's'},
      which is the skill arriving and is not counted against him.</p>` : ''}
    <div class="homegrid" style="margin-top:22px">
      <button class="btn primary big" data-act="done">Done</button>
    </div>`;
  app.querySelector('[data-act="done"]').onclick = onDone;
}
