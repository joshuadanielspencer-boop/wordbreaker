// THE TEACHER AREA — everything that needs an adult, plus the evidence view.
//
// Kept deliberately apart from the rest of the app, in look as well as in
// routing. Nothing in here is a game and none of it is addressed to the child:
// it is an instrument panel for the person running the intervention.
//
// The organising idea is GATE 0. docs/predictions.md pre-registers two rival
// readings of the same child and fixes the thresholds that would tell them
// apart, and every one of those thresholds is a CHANGE FROM BASELINE. Until a
// baseline exists, none of the branch logic in the build plan means anything —
// it is a decision procedure with no input. So the first thing this screen does
// is say, plainly, which baselines have been taken and which have not.
//
// It reports what was measured and refuses to editorialise. Interpreting a
// flat line or a fast gain is a conversation with an evaluator, not something
// an app should be doing on its own, and predictions.md says so explicitly.

import { load } from '../core/store.js';
import {
  DECODING, SPELLING, PROBE_LABEL, runs, lastRun, due, baseline, movement, remaining,
} from '../core/probe.js';
import { PAST_LEVELS, pastHistory, lastPast, summarise, hasBaseline } from '../core/past.js';
import { parseForm, promptFor, saveForm, currentForm, clearForm, itemSequence, toLevels } from '../core/pastform.js';
import { allMissions, wordStatus } from '../core/mission.js';
import { MORPH, drillableMorphemes, originLabel } from '../content/lexicon.js';
import { voiceQuality } from '../core/speech.js';
import { level, LEVEL_NAME, weakest, entry as mastEntry } from '../core/mastery.js';
import { SKILLS, LADDER } from '../content/math.js';

const esc = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const fmtDay = t => new Date(t).toLocaleDateString();
const pct = x => Math.round(x * 100) + '%';
const signed = n => (n > 0 ? '+' : '') + n;

function topbar(label, backLabel = 'Back') {
  return `
    <div class="topbar teacher-bar">
      <button class="btn ghost" data-act="back">${backLabel}</button>
      <div class="spacer"></div>
      <span class="pill teacher-pill">${label}</span>
    </div>`;
}

// ----------------------------------------------------------------- the index
export function renderTeacher(app, opts) {
  const { onBack } = opts;
  window.scrollTo(0, 0);
  const S = load();
  const form = currentForm();

  // Gate 0 is three separate baselines, and it is not "run" until all three
  // are. Listing them individually stops a half-taken baseline reading as a
  // whole one, which is the failure that would quietly invalidate everything
  // built on top of it.
  const gates = [
    { key: 'past', name: 'The PAST', done: hasBaseline(),
      why: 'Decides whether phonemic automaticity is the gap at all.' },
    { key: DECODING, name: 'Nonsense reading', done: !!baseline(DECODING),
      why: 'The primary outcome. Nothing else measures it.' },
    { key: SPELLING, name: 'Nonsense spelling', done: !!baseline(SPELLING),
      why: 'Secondary outcome, and the one that runs solo.' },
  ];
  const open = gates.filter(g => !g.done);

  app.innerHTML = `
    ${topbar('teacher')}
    <div class="hero teacher-hero">
      <h1 style="font-size:30px">Teacher</h1>
      <p>${esc(S?.name || 'This player')} — the parts that need an adult, and the record.</p>
    </div>

    <div class="section-title">gate 0 — the baseline</div>
    ${open.length ? `
      <p class="msg plainmsg teacher-warn">
        ${open.length} of 3 baselines not yet taken. Until they are, the
        predictions in <b>docs/predictions.md</b> have nothing to be measured
        against and the branch logic cannot be run.
      </p>` : `
      <p class="msg good">Gate 0 complete. Every measure has a baseline to move from.</p>`}
    <div class="gate-list">
      ${gates.map(g => `
        <div class="gate-row ${g.done ? 'done' : 'open'}">
          <span class="gate-mark">${g.done ? '✓' : '○'}</span>
          <span class="gate-name"><b>${g.name}</b><span>${g.why}</span></span>
          <span class="gate-state">${g.done ? 'baseline taken' : 'not taken'}</span>
        </div>`).join('')}
    </div>

    <div class="section-title">run something</div>
    <div class="homegrid">
      ${form ? `
        <button class="btn primary big" data-act="past-run">
          Run the PAST &nbsp;·&nbsp; ${esc(form.name)}
        </button>` : `
        <button class="btn primary big" data-act="past-load">
          Load a PAST form &nbsp;·&nbsp; free from thepasttest.com
        </button>`}
      <button class="btn big" data-act="past">
        Record a PAST done on paper${hasBaseline() ? ` &nbsp;·&nbsp; last ${fmtDay(lastPast().t)}` : ''}
      </button>
      <button class="btn big" data-act="probe-decoding">
        Nonsense Ladder — read aloud${due(DECODING) ? ' &nbsp;·&nbsp; due' : ''}
      </button>
      <button class="btn big" data-act="probe-spelling">
        Nonsense spelling probe${due(SPELLING) ? ' &nbsp;·&nbsp; due' : ''}
      </button>
    </div>

    <div class="section-title">the record</div>
    <div class="homegrid">
      <button class="btn big" data-act="evidence">Evidence — does word-level skill move?</button>
      <button class="btn big" data-act="spelling">Spelling report</button>
      <button class="btn big" data-act="progress">What keeps going wrong</button>
      ${form ? `<button class="btn big" data-act="past-load">Change the PAST form</button>` : ''}
    </div>`;

  app.querySelector('[data-act="back"]').onclick = onBack;
  app.querySelector('[data-act="past"]').onclick = () => renderPastForm(app, opts);
  const pr = app.querySelector('[data-act="past-run"]');
  if (pr) pr.onclick = () => renderPastRun(app, opts);
  const pl = app.querySelector('[data-act="past-load"]');
  if (pl) pl.onclick = () => renderLoadForm(app, opts);
  app.querySelector('[data-act="probe-decoding"]').onclick = () => opts.onRunProbe(DECODING);
  app.querySelector('[data-act="probe-spelling"]').onclick = () => opts.onRunProbe(SPELLING);
  app.querySelector('[data-act="evidence"]').onclick = () => renderEvidence(app, opts);
  app.querySelector('[data-act="spelling"]').onclick = () => renderSpellingReport(app, opts);
  app.querySelector('[data-act="progress"]').onclick = () => renderProgress(app, opts);
}

// -------------------------------------------------------------- evidence view
function probeBlock(kind) {
  const list = runs(kind);
  const base = baseline(kind);
  const mv = movement(kind);
  const left = remaining(kind);

  if (!list.length) {
    return `
      <div class="section-title">${PROBE_LABEL[kind]}</div>
      <p class="msg plainmsg">No baseline yet. This measure has never been run.</p>`;
  }

  // predictions.md fixed these thresholds in advance, so they are printed as
  // given rather than recomputed to fit — that is the entire point of having
  // written them down before the data arrived.
  const thresholds = kind === DECODING
    ? `A predicts accuracy <b>+15 points or more</b> and median time <b>down 30%</b> by week 8.
       B predicts <b>under +5 points</b> and roughly flat time.`
    : `A predicts <b>+20 points or more</b>. B predicts little movement.`;

  return `
    <div class="section-title">${PROBE_LABEL[kind]}${kind === DECODING ? ' — primary outcome' : ''}</div>
    <table class="evidence-table">
      <tr><th>when</th><th>items</th><th>accuracy</th><th>median</th>${
        kind === DECODING ? '<th>read as whole units</th>' : ''}</tr>
      ${list.map((r, i) => `
        <tr class="${i === 0 ? 'baseline-row' : ''}">
          <td>${fmtDay(r.t)}${i === 0 ? ' <span class="tag">baseline</span>' : ''}</td>
          <td>${r.correct}/${r.n}</td>
          <td>${pct(r.accuracy)}</td>
          <td>${r.medianMs ? (r.medianMs / 1000).toFixed(1) + 's' : '—'}</td>
          ${kind === DECODING ? `<td>${r.instant === null ? '—' : pct(r.instant)}</td>` : ''}
        </tr>`).join('')}
    </table>
    ${mv ? `
      <p class="msg plainmsg movement">
        Since baseline (${mv.weeks} week${mv.weeks === 1 ? '' : 's'}):
        accuracy <b>${signed(mv.accuracyPoints)} points</b>${
          mv.timePercent !== null ? `, median time <b>${signed(mv.timePercent)}%</b>` : ''}${
          mv.instantPoints !== null ? `, whole-unit reading <b>${signed(mv.instantPoints)} points</b>` : ''}.
      </p>` : `
      <p class="msg plainmsg">Baseline only. One run is not a trend.</p>`}
    <p class="msg plainmsg fineprint">${thresholds}</p>
    <p class="msg plainmsg fineprint">
      ${left.probesLeft} more probe${left.probesLeft === 1 ? '' : 's'} available from the
      held-out pool${left.probesLeft <= 2 ? ' — running low.' : '.'}
    </p>`;
}

export function renderEvidence(app, opts) {
  window.scrollTo(0, 0);
  const S = load();
  const past = lastPast();
  const ps = summarise(past);
  const history = pastHistory();

  // Compliance is a confound predictions.md names explicitly: a flat result at
  // three sessions a week means something, at three a fortnight it means
  // nothing. So the session count is shown NEXT TO the outcome, not buried in
  // another screen where it can be forgotten when the result is interpreted.
  const eightWeeksAgo = Date.now() - 56 * 86400000;
  const recentSessions = (S?.sessions || []).filter(s => s.started >= eightWeeksAgo);
  const perWeek = recentSessions.length / 8;

  app.innerHTML = `
    ${topbar('evidence')}
    <div class="hero teacher-hero">
      <h1 style="font-size:28px">Does word-level skill move?</h1>
      <p>Measured against thresholds fixed before any data arrived.</p>
    </div>

    <div class="section-title">compliance</div>
    <p class="msg plainmsg ${perWeek >= 3 ? '' : 'teacher-warn'}">
      ${recentSessions.length} session${recentSessions.length === 1 ? '' : 's'} in the last
      8 weeks — about <b>${perWeek.toFixed(1)} a week</b>.
      ${perWeek >= 3
        ? 'At or above the three-a-week the predictions assume.'
        : 'The predictions assume at least three a week. Below that, a flat result means nothing and must not be read as evidence for either branch.'}
    </p>

    ${probeBlock(DECODING)}
    ${probeBlock(SPELLING)}

    <div class="section-title">the PAST</div>
    ${!ps ? `<p class="msg plainmsg">Never administered.</p>` : `
      <p class="msg plainmsg">
        ${fmtDay(ps.t)} — highest correct <b>${ps.highestCorrect || '—'}</b>,
        highest automatic <b>${ps.highestAutomatic || '—'}</b>,
        ${ps.automatic}/${ps.tested} levels automatic.
      </p>
      ${ps.allAutomatic ? `
        <p class="msg plainmsg teacher-flag">
          Every level tested came out automatic. predictions.md lists this as the
          result that removes the phonemic-automaticity explanation entirely, and
          Branch B's core with it. If nonsense-word decoding then stays flat, that
          points at rapid naming or working memory rather than phoneme awareness,
          and argues for a CTOPP-2.
        </p>` : ps.gap > 0 ? `
        <p class="msg plainmsg">
          Correct ${ps.gap} level${ps.gap === 1 ? '' : 's'} above automatic — the
          skill is there and is not yet automatic, which is the gap Kilpatrick's
          method is built to close.
        </p>` : ''}
      ${history.length > 1 ? `
        <table class="evidence-table">
          <tr><th>when</th><th>highest correct</th><th>highest automatic</th><th>automatic</th></tr>
          ${history.map(h => { const x = summarise(h); return `
            <tr><td>${fmtDay(x.t)}</td><td>${x.highestCorrect || '—'}</td>
                <td>${x.highestAutomatic || '—'}</td><td>${x.automatic}/${x.tested}</td></tr>`;
          }).join('')}
        </table>` : ''}
      ${ps.note ? `<p class="msg plainmsg fineprint">Note: ${esc(ps.note)}</p>` : ''}`}

    <p class="msg plainmsg fineprint" style="margin-top:22px">
      Nothing here decides anything on its own. These are inputs to a
      conversation with the evaluator, not a diagnosis.
    </p>`;

  app.querySelector('[data-act="back"]').onclick = () => renderTeacher(app, opts);
}

// ------------------------------------------------------------ spelling report
export function renderSpellingReport(app, opts) {
  window.scrollTo(0, 0);
  const missions = allMissions();

  app.innerHTML = `
    ${topbar('spelling')}
    <div class="hero teacher-hero">
      <h1 style="font-size:28px">Spelling report</h1>
      <p>Every curriculum word, what it cost, and what he actually wrote.</p>
    </div>
    ${missions.map(({ mission, done, total }) => {
      const rows = mission.words.map(w => ({ w, s: wordStatus(w.text) }));
      const attempted = rows.filter(x => x.s.seen > 0);
      const missed = rows.filter(x => x.s.misses > 0);
      return `
        <div class="section-title">${esc(mission.name)} — ${done}/${total} slaughtered</div>
        ${!attempted.length ? '<p class="msg plainmsg">Not started.</p>' : `
        <table class="evidence-table report-table">
          <tr><th>word</th><th>state</th><th>cold, clean</th><th>support</th><th>wrote instead</th></tr>
          ${rows.filter(x => x.s.seen > 0).map(({ w, s }) => `
            <tr class="${s.slaughtered ? 'done-row' : s.misses ? 'miss-row' : ''}">
              <td><b>${esc(w.display)}</b></td>
              <td>${s.slaughtered ? 'slaughtered'
                  : s.cleanDays.size ? `${s.cleanDays.size} clean day${s.cleanDays.size === 1 ? '' : 's'}`
                  : s.spelled ? 'practised' : 'seen'}</td>
              <td>${[...s.cleanModes].join(' + ') || '—'}</td>
              <td>${s.peeks ? `${s.peeks} peek${s.peeks === 1 ? '' : 's'}` : ''}${
                   s.peeks && s.hints ? ', ' : ''}${
                   s.hints ? `${s.hints} hint${s.hints === 1 ? '' : 's'}` : ''}${
                   !s.peeks && !s.hints ? 'none' : ''}</td>
              <td class="wrote">${s.wrongSpellings.length
                  ? s.wrongSpellings.slice(-4).map(x => `<i>${esc(x.given)}</i>`).join(', ')
                  : '—'}</td>
            </tr>`).join('')}
        </table>
        ${missed.length ? `
          <p class="msg plainmsg fineprint">
            ${missed.length} word${missed.length === 1 ? '' : 's'} with a miss against
            ${missed.length === 1 ? 'it' : 'them'}. The misspellings are kept because the
            PATTERN in them is the useful thing — the same vowel going wrong in six
            words is a lesson, six separate wrong words are a list.
          </p>` : ''}`}`;
    }).join('')}
    <p class="msg plainmsg fineprint" style="margin-top:20px">
      Only <b>cold, clean</b> counts as evidence he can spell a word: right, first
      attempt, no hints, with nothing on screen that spells it. Look-cover-write
      hides the word for about three seconds, so passing it shows working memory.
      A word is finished when it survives cold on two separate days by both
      routes — from the meaning and from the sound.
    </p>`;

  app.querySelector('[data-act="back"]').onclick = () => renderTeacher(app, opts);
}

// --------------------------------------------------- loading a PAST form
export function renderLoadForm(app, opts) {
  window.scrollTo(0, 0);
  const existing = currentForm();

  app.innerHTML = `
    ${topbar('past form')}
    <div class="hero teacher-hero">
      <h1 style="font-size:28px">Load a PAST form</h1>
      <p>Type the words in once. After that the app runs the test for you.</p>
    </div>

    <p class="msg plainmsg teacher-warn">
      The PAST is David Kilpatrick's and he gives it away free at
      <b>thepasttest.com</b> — forms A, B, C and D, the same test with different
      words, meant for repeat administration. Download it there. The words are
      not shipped inside this app: free to download is not the same as free to
      republish, and this app sits on a public web address.
    </p>

    ${existing ? `
      <p class="msg good">
        <b>${esc(existing.name)}</b> is loaded — ${existing.levels.length} levels,
        ${itemSequence(existing).length} items.
      </p>` : ''}

    <div class="section-title">the format</div>
    <p class="msg plainmsg fineprint">
      One item per line: <b>the word | what changes | the answer</b>. Start each
      level with <b>=</b> and its letter. Anything after <b>#</b> is ignored.
    </p>
    <pre class="format-sample">= A | Syllables
bookcase | book | case
cowboy | cow | boy

= D | First sound
feet | /f/ | eat

= H | Change the first sound
guide | /g/ to /r/ | ride</pre>
    <p class="msg plainmsg fineprint">
      Deletion items read “now say it without <i>book</i>”. Anything written
      with <b>to</b> — like <b>/g/ to /r/</b> — is read as a change instead.
    </p>

    <div class="section-title">which form</div>
    <input class="answer" id="formname" maxlength="40" placeholder="e.g. PAST Form A"
           value="${esc(existing?.name || '')}" autocomplete="off">

    <div class="section-title">paste it here</div>
    <textarea class="answer form-paste" rows="12" spellcheck="false"
      placeholder="= A | Syllables&#10;bookcase | book | case"></textarea>

    <div class="feedback" aria-live="polite"></div>
    <div class="homegrid" style="margin-top:16px">
      <button class="btn primary big" data-act="save">Check it and save</button>
      ${existing ? `<button class="btn big danger" data-act="clear">Remove the loaded form</button>` : ''}
    </div>`;

  app.querySelector('[data-act="back"]').onclick = () => renderTeacher(app, opts);

  const fb = app.querySelector('.feedback');
  app.querySelector('[data-act="save"]').onclick = () => {
    const text = app.querySelector('.form-paste').value;
    const name = app.querySelector('#formname').value.trim() || 'PAST form';
    const { levels, errors } = parseForm(text);

    // Show every problem at once. Fixing one line, resubmitting and being told
    // about the next one is how a twenty-line paste becomes twenty round trips.
    if (errors.length) {
      fb.innerHTML = `<p class="msg gentle">Nothing saved yet — ${errors.length}
        ${errors.length === 1 ? 'line needs' : 'lines need'} a look:</p>
        <ul class="errlist">${errors.slice(0, 12).map(e => `<li>${esc(e)}</li>`).join('')}</ul>
        ${errors.length > 12 ? `<p class="msg plainmsg fineprint">…and ${errors.length - 12} more.</p>` : ''}`;
      return;
    }
    saveForm(name, levels);
    fb.innerHTML = `<p class="msg good">Saved — ${levels.length} levels,
      ${levels.reduce((a, l) => a + l.items.length, 0)} items.</p>`;
    setTimeout(() => renderTeacher(app, opts), 700);
  };

  const cl = app.querySelector('[data-act="clear"]');
  if (cl) cl.onclick = () => {
    if (confirm('Remove the loaded PAST form? Results already recorded are kept.')) {
      clearForm();
      renderLoadForm(app, opts);
    }
  };
}

// ------------------------------------------- administering a loaded PAST form
export function renderPastRun(app, opts) {
  const form = currentForm();
  if (!form) return renderLoadForm(app, opts);
  const seq = itemSequence(form);
  const results = [];
  let i = 0;

  function step() {
    window.scrollTo(0, 0);
    if (i >= seq.length) return done();

    const item = seq[i];
    const p = promptFor(item);
    app.innerHTML = `
      ${topbar(`${form.name} · ${i + 1} / ${seq.length}`, 'Stop')}
      <div class="past-run">
        <p class="teacher-label">level ${esc(item.levelId)} — ${esc(item.levelLabel)}</p>
        <div class="casefile past-item">
          <p class="past-say">Say <b>${esc(p.say)}</b></p>
          <p class="past-instruction">${esc(p.instruction)}</p>
          <p class="past-answer">answer: <b>${esc(p.answer)}</b></p>
        </div>

        <div class="timer-box">
          <button class="btn" data-act="time">Start the two seconds</button>
          <div class="timer-bar"><i></i></div>
          <span class="timer-state">ready</span>
        </div>

        <div class="teacher-panel">
          <p class="teacher-label">what happened?</p>
          <div class="score-row">
            <button class="btn score s3" data-v="auto" aria-label="Right, and within two seconds">
              <b>Right, quickly</b><span>inside the two seconds</span></button>
            <button class="btn score s2" data-v="slow" aria-label="Right, but took longer than two seconds">
              <b>Right, slowly</b><span>got there, past two seconds</span></button>
            <button class="btn score s0" data-v="wrong" aria-label="Wrong">
              <b>Wrong</b><span>did not get there</span></button>
            <button class="btn score" data-v="skip" aria-label="Skip this item">
              <b>Skip</b><span>not administered</span></button>
          </div>
        </div>
      </div>`;

    app.querySelector('[data-act="back"]').onclick = () => {
      if (confirm('Stop the test? Nothing will be recorded.')) renderTeacher(app, opts);
    };

    const bar = app.querySelector('.timer-bar i');
    const state = app.querySelector('.timer-state');
    app.querySelector('[data-act="time"]').onclick = () => {
      bar.style.transition = 'none'; bar.style.width = '0%';
      state.textContent = 'timing';
      requestAnimationFrame(() => {
        bar.style.transition = 'width 2s linear';
        bar.style.width = '100%';
      });
      setTimeout(() => { state.textContent = 'two seconds'; }, 2000);
    };

    app.querySelectorAll('.score').forEach(b => b.onclick = () => {
      const v = b.dataset.v;
      if (v !== 'skip') {
        results.push({
          levelId: item.levelId, word: item.word, answer: item.answer,
          correct: v !== 'wrong', automatic: v === 'auto',
        });
      }
      i++;
      step();
    });
  }

  function done() {
    if (!results.length) return renderTeacher(app, opts);
    opts.onSavePast(toLevels(results), `${form.name} — administered in app`);
  }

  step();
}

// ------------------------------------------------- the PAST quick recorder
export function renderPastForm(app, opts) {
  window.scrollTo(0, 0);
  const picks = {};                   // levelId -> 'auto' | 'slow' | 'wrong'

  app.innerHTML = `
    ${topbar('the PAST')}
    <div class="hero teacher-hero">
      <h1 style="font-size:28px">The PAST</h1>
      <p>Administer from the book. This screen only records what you heard.</p>
    </div>

    <p class="msg plainmsg teacher-warn">
      Automatic means the correct answer arrived in about <b>two seconds</b>.
      The difference between correct and automatic is the whole point of the
      test: correct-but-slow is a skill that is not yet automatic, which is a
      different finding from not having the skill.
    </p>

    <div class="timer-box">
      <button class="btn" data-act="time">Time two seconds</button>
      <div class="timer-bar"><i></i></div>
      <span class="timer-state">ready</span>
    </div>

    <div class="section-title">levels</div>
    <p class="msg plainmsg fineprint">
      Leave a level untouched if you did not administer it — a skipped level is
      recorded as skipped, never as a failure.
    </p>
    <div class="past-list">
      ${PAST_LEVELS.map(l => `
        <div class="past-row" data-level="${l.id}">
          <span class="past-id">${l.id}</span>
          <span class="past-label">${esc(l.label)}</span>
          <span class="past-btns">
            <button class="btn ghost tiny" data-v="auto">Automatic</button>
            <button class="btn ghost tiny" data-v="slow">Correct, slow</button>
            <button class="btn ghost tiny" data-v="wrong">Wrong</button>
          </span>
        </div>`).join('')}
    </div>

    <div class="section-title">notes</div>
    <textarea class="answer past-note" rows="3"
      placeholder="anything the numbers will not carry"></textarea>

    <div class="homegrid" style="margin-top:18px">
      <button class="btn primary big" data-act="save">Save this administration</button>
    </div>
    <div class="feedback" aria-live="polite"></div>`;

  app.querySelector('[data-act="back"]').onclick = () => renderTeacher(app, opts);

  // A two-second window is hard to judge by feel and easy to judge against a
  // bar. This is the one timer in the app that is allowed on screen, because
  // it is on the ADULT's screen and times the adult's judgement — the rule it
  // looks like it breaks ("never a timer on screen") is about not putting a
  // clock in front of the child while he works.
  const bar = app.querySelector('.timer-bar i');
  const state = app.querySelector('.timer-state');
  app.querySelector('[data-act="time"]').onclick = () => {
    bar.style.transition = 'none';
    bar.style.width = '0%';
    state.textContent = 'timing';
    requestAnimationFrame(() => {
      bar.style.transition = 'width 2s linear';
      bar.style.width = '100%';
    });
    setTimeout(() => { state.textContent = 'two seconds'; }, 2000);
  };

  app.querySelectorAll('.past-row').forEach(row => {
    row.querySelectorAll('[data-v]').forEach(b => b.onclick = () => {
      const id = row.dataset.level;
      if (picks[id] === b.dataset.v) {
        delete picks[id];                         // tapping again un-records it
        row.querySelectorAll('[data-v]').forEach(x => x.classList.remove('on'));
        row.classList.remove('set');
        return;
      }
      picks[id] = b.dataset.v;
      row.querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x === b));
      row.classList.add('set');
    });
  });

  app.querySelector('[data-act="save"]').onclick = () => {
    const levels = {};
    for (const [id, v] of Object.entries(picks)) {
      levels[id] = { correct: v !== 'wrong', automatic: v === 'auto' };
    }
    if (!Object.keys(levels).length) {
      app.querySelector('.feedback').innerHTML =
        `<p class="msg gentle">Nothing recorded yet — mark at least one level.</p>`;
      return;
    }
    opts.onSavePast(levels, app.querySelector('.past-note').value.trim());
  };
}

// ---------------------------------------------- error fingerprint & sessions
//
// The fingerprint used to read `tion · 45% · n=11`, which is precise and tells
// a parent nothing they can act on. What a teacher needs from it is: which
// piece, what it means, how badly, and what to do about it — in sentences.

const PIECE_KIND = {
  prefix: 'a beginning',
  root: 'a root — the part carrying the meaning',
  suffix: 'an ending',
};

/**
 * Right about N times in ten, said the way a person would say it.
 *
 * Below four attempts it deliberately refuses to characterise him at all. One
 * wrong answer is not "he almost never gets this right", and a screen that
 * says so invites exactly the over-reading of thin data this whole project is
 * organised against.
 */
function howOften(s, tries) {
  if (tries < 4) return null;
  const n = Math.round(s * 10);
  if (n <= 1) return 'almost never gets this right';
  if (n <= 3) return `gets this right about ${n} times in 10`;
  if (n <= 6) return `gets this right about ${n} times in 10 — a coin toss`;
  if (n <= 8) return `gets this right about ${n} times in 10`;
  return 'nearly has this, but not reliably';
}

function fingerprintRow(w) {
  const m = MORPH[w.id];
  const days = mastEntry(w.id).days.length;
  // Short words first (family is sorted by length), which are the ones worth
  // showing a child as the example.
  const examples = m.family.slice(0, 3);
  return `
    <div class="fp-row">
      <div class="fp-head">
        <span class="part ${m.type}"><span class="part-text">${m.canonical}</span></span>
        <span class="fp-gloss">${esc(m.gloss)}</span>
      </div>
      <p class="fp-line">
        ${howOften(w.s, w.n)
          ? `He <b>${howOften(w.s, w.n)}</b> — ${w.n} tries${
              days ? ` across ${days} ${days === 1 ? 'day' : 'days'}` : ''}.`
          : `<span class="fp-thin">Only ${w.n} ${w.n === 1 ? 'try' : 'tries'} so far${
              w.s < 0.5 ? ', and it went wrong' : ''} — too early to call this a pattern.</span>`}
        It is ${PIECE_KIND[m.type] || 'a piece'} meaning “${esc(m.gloss)}”${
          m.origin ? `, from ${esc(originLabel(m.origin))}` : ''}.
      </p>
      ${examples.length ? `<p class="fp-line fp-examples">
        Turns up in ${examples.map(e => `<i>${esc(e)}</i>`).join(', ')}${
          m.family.length > 3 ? ` and ${m.family.length - 3} more` : ''}.
      </p>` : ''}
    </div>`;
}

export function renderProgress(app, opts) {
  window.scrollTo(0, 0);
  const S = load();
  const teach = drillableMorphemes().map(m => m.id);
  const worst = weakest(teach, 12);
  const sessions = S.sessions.slice(-10).reverse();
  const vq = voiceQuality();

  app.innerHTML = `
    ${topbar('progress')}
    <div class="section-title">${esc(S.name)} — what keeps going wrong</div>
    ${!worst.length ? '<p class="msg plainmsg">No data yet — he needs a few sessions first.</p>' : `
      <p class="msg plainmsg fineprint">
        Words are built out of pieces, and these are the pieces he is getting
        wrong most often. They are worth pre-teaching before he reads something
        hard, because one shaky piece breaks every long word that contains it.
        Ordered worst first.
      </p>
      <div class="fingerprint">
        ${worst.map(w => fingerprintRow(w)).join('')}
      </div>`}
    <div class="section-title">how the pieces are spread</div>
    <p class="msg plainmsg fineprint">
      Of the ${teach.length} word-pieces the app teaches, this is how far along
      he is with each. <b>Boring</b> is the goal, not <b>solid</b> — it means the
      piece has stopped costing him any effort, which is what fluency actually is.
    </p>
    <div class="spread">
      ${[
        [4, 'boring', 'automatic — costs him nothing'],
        [3, 'solid', 'reliable, still takes a moment'],
        [2, 'developing', 'right more often than not'],
        [1, 'shaky', 'getting it wrong more than half the time'],
        [0, 'not met yet', 'has not come up'],
      ].map(([l, name, why]) => {
        const n = teach.filter(id => level(id) === l).length;
        return `<div class="spread-row">
          <span class="spread-n">${n}</span>
          <span class="spread-name"><b>${name}</b><span>${why}</span></span>
        </div>`;
      }).join('')}
    </div>

    <div class="section-title">recent sessions</div>
    ${sessions.length ? sessions.map(s => {
      const mins = Math.round((s.ended - s.started) / 60000);
      return `<p class="msg plainmsg" style="text-align:left">
        <b>${fmtDay(s.started)}</b> — ${s.correct} right out of ${s.items},
        ${mins} minute${mins === 1 ? '' : 's'}.</p>`;
    }).join('') : '<p class="msg plainmsg">No sessions yet.</p>'}

    <div class="section-title">maths — show the middle</div>
    <div class="spread">${LADDER.map(id => {
      const e = mastEntry(id);
      return `<div class="spread-row">
        <span class="spread-name"><b>${SKILLS[id].name}</b><span>${
          e.n ? `${LEVEL_NAME[level(id)]} — ${e.n} ${e.n === 1 ? 'try' : 'tries'}` : 'not tried yet'
        }</span></span>
      </div>`;
    }).join('')}</div>

    <div class="section-title">the computer's voice</div>
    <p class="msg plainmsg ${vq.good ? '' : 'teacher-warn'}">
      ${vq.name ? `Currently using <b>${esc(vq.name)}</b>. ` : 'No speech voice available. '}
      ${vq.good
        ? 'That is one of the high-quality voices — good.'
        : `That is one of macOS's old built-in voices, which sound robotic and are
           hard to make out on a nonsense word. The fix is not in this app: open
           <b>System Settings → Accessibility → Spoken Content → System Voice →
           Manage Voices</b> and download an <b>Enhanced</b> or <b>Premium</b>
           English voice. Wordbreaker will pick it up automatically on reload, and
           the difference is large.`}
    </p>
    <div class="stats" style="margin-top:18px">
      <button class="btn ghost" data-act="export">Export a save</button>
      <button class="btn ghost danger" data-act="reset">Reset ${esc(S.name)}</button>
    </div>`;

  app.querySelector('[data-act="back"]').onclick = () => renderTeacher(app, opts);
  app.querySelector('[data-act="export"]').onclick = opts.onExport;
  app.querySelector('[data-act="reset"]').onclick = opts.onReset;
}
