import {
  load, loadRoot, save, flush, today, profiles, createProfile, switchProfile,
  signOut, deleteProfile, renameProfile, exportProfile, importProfile,
  resetProfile, requestPersistence, sessionsSinceBackup, markBackedUp, AVATARS,
} from './core/store.js';
import { planSession, recoveryItem, itemsForMorpheme, encoreItems } from './core/scheduler.js';
import { record, level, LEVEL, LEVEL_NAME, weakest, entry as mastEntry } from './core/mastery.js';
import { push as logPush } from './core/log.js';
import { MORPH, collectableMorphemes, drillableMorphemes, originLabel } from './content/lexicon.js';
import { say, reward } from './voice/voice.js';
import { mount as autopsy } from './activities/autopsy.js';
import { mount as equation } from './activities/equation.js';
import { mount as detective } from './activities/detective.js';
import { mount as invent } from './activities/invent.js';
import { mount as middle } from './activities/middle.js';
import { makeProblem, pickSkill, SKILLS, LADDER } from './content/math.js';
import { renderCodex } from './ui/codex.js';
import { renderRadar } from './ui/radar.js';
import { renderBoring } from './ui/boring.js';
import { boringItems, fluencySummary, typicalMs } from './core/fluency.js';

const ACTIVITIES = { autopsy, equation, detective, invent, middle };
const PERSONALITIES = ['normal', 'funny', 'ridiculous', 'unsupervised'];
const app = document.getElementById('app');

const esc = s => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function toTop() { window.scrollTo(0, 0); }
function daysSince(ts) { return ts ? Math.floor((Date.now() - ts) / 86400000) : null; }

// ------------------------------------------------------------ profile picker
function picker() {
  toTop();
  const list = profiles();
  app.innerHTML = `
    <div class="topbar"><span class="brand">WORDBREAKER</span></div>
    <div class="hero">
      <h1>Who's playing?</h1>
      <p>Everyone gets their own words, their own Codex and their own record.</p>
    </div>
    <div class="profile-grid">
      ${list.map(p => `
        <button class="profile" data-id="${p.id}">
          <span class="pface">${p.avatar}</span>
          <b>${esc(p.name)}</b>
          <span class="psub">${p.sessions.length} session${p.sessions.length === 1 ? '' : 's'}</span>
        </button>`).join('')}
      <button class="profile add" data-act="new"><span class="pface">＋</span><b>New player</b></button>
    </div>
    ${list.length ? `<div class="stats" style="margin-top:20px">
      <button class="btn ghost" data-act="manage">Manage players</button>
      <button class="btn ghost" data-act="import">Import a save</button>
    </div>` : ''}
    <input type="file" id="importfile" accept="application/json" style="display:none">`;

  app.querySelectorAll('.profile[data-id]').forEach(b =>
    b.onclick = () => { switchProfile(b.dataset.id); home(); });
  app.querySelector('[data-act="new"]').onclick = newProfile;
  const manage = app.querySelector('[data-act="manage"]');
  if (manage) manage.onclick = manageProfiles;
  const imp = app.querySelector('[data-act="import"]');
  if (imp) {
    imp.onclick = () => app.querySelector('#importfile').click();
    app.querySelector('#importfile').onchange = doImport;
  }
}

function newProfile() {
  toTop();
  let avatar = AVATARS[0];
  app.innerHTML = `
    <div class="topbar"><button class="btn ghost" data-act="back">Back</button></div>
    <div class="hero"><h1 style="font-size:34px">New player</h1></div>
    <input class="answer" id="pname" maxlength="16" placeholder="name" autocomplete="off">
    <div class="section-title">pick a face</div>
    <div class="avatars">${AVATARS.map((a, i) =>
      `<button class="av ${i === 0 ? 'on' : ''}" data-a="${a}">${a}</button>`).join('')}</div>
    <div class="homegrid" style="margin-top:22px">
      <button class="btn primary big" data-act="create">Create</button>
    </div>`;
  const name = app.querySelector('#pname');
  name.focus();
  app.querySelectorAll('.av').forEach(b => b.onclick = () => {
    avatar = b.dataset.a;
    app.querySelectorAll('.av').forEach(x => x.classList.toggle('on', x === b));
  });
  const go = () => { createProfile(name.value, avatar); home(); };
  app.querySelector('[data-act="create"]').onclick = go;
  name.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  app.querySelector('[data-act="back"]').onclick = picker;
}

function manageProfiles() {
  toTop();
  app.innerHTML = `
    <div class="topbar"><button class="btn ghost" data-act="back">Back</button></div>
    <div class="section-title">players</div>
    ${profiles().map(p => `
      <div class="manage-row">
        <span class="pface small">${p.avatar}</span>
        <b>${esc(p.name)}</b>
        <span class="psub">${p.sessions.length} sessions</span>
        <span class="spacer"></span>
        <button class="btn ghost" data-export="${p.id}">Export</button>
        <button class="btn ghost danger" data-del="${p.id}">Delete</button>
      </div>`).join('')}`;
  app.querySelector('[data-act="back"]').onclick = picker;
  app.querySelectorAll('[data-export]').forEach(b =>
    b.onclick = () => download(exportProfile(b.dataset.export), b.dataset.export));
  app.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    const p = profiles().find(x => x.id === b.dataset.del);
    if (confirm(`Delete ${p.name} and all their progress? This cannot be undone.`)) {
      deleteProfile(b.dataset.del);
      manageProfiles();
    }
  });
}

// Saving a file works differently depending on where this is running. A
// plain <a download> is right for a local file or an ordinary web host, but
// embedded viewers block it outright — the click silently does nothing. Ask
// the host for a save channel first and only fall back to the anchor.
async function download(text, tag) {
  markBackedUp();
  const filename = `wordbreaker-${tag}-${today()}.json`;

  const host = globalThis.claude;
  if (host && typeof host.use === 'function') {
    try {
      const downloads = await host.use('downloads');
      if (downloads) {
        await downloads.save({ filename, data: text });
        return true;
      }
    } catch (err) {
      if (err?.code === 'declined') return false;      // viewer said no; not an error
      console.warn('host save failed, falling back', err);
    }
  }

  const blob = new Blob([text], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  return true;
}

async function doImport(e) {
  const f = e.target.files[0];
  if (!f) return;
  try { importProfile(await f.text()); home(); }
  catch (err) { alert('Could not read that file: ' + err.message); }
}

// -------------------------------------------------------------------- home
function home() {
  const S = load();
  if (!S) return picker();
  toTop();

  const teach = collectableMorphemes();
  const met = teach.filter(m => level(m.id) !== LEVEL.UNSEEN).length;
  const boring = teach.filter(m => level(m.id) === LEVEL.BORING).length;
  const last = S.sessions[S.sessions.length - 1];
  const gap = last ? daysSince(last.ended) : null;

  const greeting = S.sessions.length === 0
    ? 'Words are built out of parts. We are going to take them apart.'
    : (gap !== null && gap >= 2)
      ? say('return', { days: gap }, S.settings.personality)
      : say('open', { n: S.sessions.length + 1, days: gap ?? 0 }, S.settings.personality);

  app.innerHTML = `
    <div class="topbar">
      <button class="btn ghost who" data-act="switch">
        <span class="pface small">${S.avatar}</span> ${esc(S.name)}
      </button>
      <div class="spacer"></div>
      <span class="pill">${S.streak.count} day streak</span>
    </div>
    <div class="hero">
      <h1>Wordbreaker</h1>
      <p class="msg plainmsg">${esc(greeting)}</p>
    </div>
    <div class="homegrid">
      <button class="btn primary big" data-act="start">Start — 10 minutes</button>
      <button class="btn big" data-act="codex">Codex &nbsp;·&nbsp; ${met}/${teach.length}</button>
      <button class="btn big" data-act="radar">Hard Word Radar</button>
      <button class="btn big" data-act="boring">Make it Boring &nbsp;·&nbsp; ${fluencySummary().retired} retired</button>
      <button class="btn big" data-act="math">Show the Middle &nbsp;·&nbsp; numbers</button>
    </div>
    <div class="stats">
      <div class="stat"><b>${S.sessions.length}</b><span>sessions</span></div>
      <div class="stat"><b>${met}</b><span>pieces met</span></div>
      <div class="stat"><b>${boring}</b><span>now boring</span></div>
    </div>
    <div class="stats" style="margin-top:10px">
      <button class="btn ghost" data-act="personality">Computer: ${S.settings.personality}</button>
      <button class="btn ghost" data-act="parent">Progress</button>
    </div>
    ${sessionsSinceBackup() >= 10 ? `
      <p class="msg plainmsg backup-nudge">${S.sessions.length} sessions and no backup.
      Browsers do throw this kind of data away.
      <button class="btn ghost" data-act="backup">Save a copy</button></p>` : ''}`;

  app.querySelector('[data-act="start"]').onclick = () => runSession();
  app.querySelector('[data-act="codex"]').onclick = () => renderCodex(app, { onBack: home });
  app.querySelector('[data-act="parent"]').onclick = parentView;
  const backup = app.querySelector('[data-act="backup"]');
  if (backup) backup.onclick = () => download(exportProfile(), S.name).then(home);
  app.querySelector('[data-act="math"]').onclick = runMath;
  app.querySelector('[data-act="boring"]').onclick = () => renderBoring(app, {
    onBack: home,
    onStart: items => runSession({
      mode: 'boring',
      before: boringItems().map(i => i.text),
      opener: 'boringOpen',
      targets: [...new Set(items.flatMap(i => i.word.morphemes))],
      seq: items.map(i => ({ word: i.word, activity: 'autopsy', phase: 'boring' })),
    }),
  });
  app.querySelector('[data-act="radar"]').onclick = () => renderRadar(app, {
    onBack: home,
    onPractice: words => runSession({
      targets: [...new Set(words.flatMap(w => w.morphemes))],
      seq: words.map(w => ({ word: w, activity: 'autopsy', phase: 'radar' })),
    }),
  });
  app.querySelector('[data-act="switch"]').onclick = () => { signOut(); picker(); };
  app.querySelector('[data-act="personality"]').onclick = () => {
    const i = PERSONALITIES.indexOf(S.settings.personality);
    S.settings.personality = PERSONALITIES[(i + 1) % PERSONALITIES.length];
    save();
    if (S.settings.personality === 'unsupervised') {
      home();
      const p = app.querySelector('.hero p');
      p.textContent = 'UNSUPERVISED MODE\nThis setting was apparently approved by an adult.\nI have questions.';
      p.classList.add('shout');
    } else home();
  };
}

// ----------------------------------------------------------------- session
async function runSession(customPlan) {
  const S = load();
  // Guard against being wired directly as an event handler, which would pass
  // an Event here and quietly produce a plan with no `seq`.
  const plan = (customPlan && Array.isArray(customPlan.seq))
    ? customPlan
    : planSession({ items: 14 });
  const startedAt = Date.now();
  let correct = 0;
  const results = [];
  const newlyMet = [];
  let aborted = false;

  // The plan adapts as it runs, so the queue is mutable and the fixed-length
  // loop is not.
  const queue = [...plan.seq];
  const seenText = new Set(queue.map(s => s.word.text));
  const morphemeMisses = {};      // this session only
  const nemesisFired = new Set();
  let recoveriesAdded = 0;
  let woundDown = false;
  let extended = false;
  const fastThreshold = (typicalMs('autopsy') || 0) * 0.6;

  for (let i = 0; i < queue.length; i++) {
    const step = queue[i];
    if (!step.word.pseudo) {
      for (const id of step.word.morphemes) {
        if (level(id) === LEVEL.UNSEEN && !newlyMet.includes(id)) newlyMet.push(id);
      }
    }

    app.innerHTML = `
      <div class="topbar">
        <button class="btn ghost" data-act="quit">Stop</button>
        <div class="spacer"></div>
        <span class="pill">${i + 1} / ${queue.length}</span>
      </div>
      <div class="progress">${queue.map((_, k) =>
        `<i class="${k < i ? (results[k] ? 'done' : 'miss') : k === i ? 'now' : ''}"></i>`).join('')}</div>
      <div id="stage"></div>`;
    app.querySelector('[data-act="quit"]').onclick = () => { aborted = true; finish(true); home(); };

    const res = await ACTIVITIES[step.activity](
      document.getElementById('stage'), step.word,
      { personality: S.settings.personality });
    if (aborted) return;

    results.push(res.correct);
    if (res.correct) correct++;
    for (const [mid, ok] of Object.entries(res.credit)) record(mid, ok, res.ms);
    logPush({
      activity: step.activity, item: step.word.id, correct: res.correct,
      ms: Math.round(res.ms), credit: res.credit, detail: res.detail, phase: step.phase,
    });

    const note = line => {
      const fb = app.querySelector('.feedback');
      if (fb && line) fb.insertAdjacentHTML('beforeend', `<p class="msg plainmsg">${esc(line)}</p>`);
    };

    if (res.correct) {
      if (fastThreshold && res.ms < fastThreshold) note(say('correctFast', {}, S.settings.personality));
      const r = reward(S, S.settings.personality);   // success only, never an error path
      if (r) {
        save();
        const fb = app.querySelector('.feedback');
        if (fb) fb.insertAdjacentHTML('beforeend', `<div class="reward">${esc(r)}</div>`);
      }
    } else {
      // A morpheme missed repeatedly is worth naming — and worth acting on.
      // Saying "we have found your nemesis" and then carrying on with the
      // original plan would make the line a lie.
      for (const [mid, ok] of Object.entries(res.credit)) {
        if (ok) continue;
        morphemeMisses[mid] = (morphemeMisses[mid] || 0) + 1;
        if (morphemeMisses[mid] >= 2 && !nemesisFired.has(mid)) {
          nemesisFired.add(mid);
          note(say('errorRepeat', { morph: MORPH[mid].canonical }, S.settings.personality));
          const extra = itemsForMorpheme(mid, 2, seenText);
          extra.forEach(x => seenText.add(x.word.text));
          queue.splice(i + 1, 0, ...extra);
        }
      }
    }

    if (i === 0 && plan.opener) note(say(plan.opener, {}, S.settings.personality));

    // End of the warm-up block.
    if (step.phase === 'warmup' && queue[i + 1] && queue[i + 1].phase !== 'warmup') {
      note(say('blockEnd', { correct, total: i + 1 }, S.settings.personality));
    }

    // A bad run should shorten the session, not grind through it. Stopping
    // early costs a few items; making it aversive costs the whole project.
    const recent = results.slice(-4);
    if (!woundDown && recent.length === 4 && recent.filter(Boolean).length <= 1) {
      woundDown = true;
      const rec = recoveryItem(seenText);
      queue.length = i + 1;
      if (rec) { seenText.add(rec.word.text); queue.push(rec); }
    }

    await new Promise(r => {
      const b = app.querySelector('[data-act="next"]');
      if (b) b.addEventListener('click', r, { once: true });
      else setTimeout(r, 400);
    });
    if (aborted) return;

    const last = i === queue.length - 1;

    // Never finish on a miss.
    if (last && !res.correct && recoveriesAdded < 2) {
      const rec = recoveryItem(seenText);
      if (rec) { seenText.add(rec.word.text); queue.push(rec); recoveriesAdded++; }
    }

    // Going well? Offer more — never impose it. Forcing extra work on a good
    // run is a punishment for succeeding.
    if (last && !woundDown && !extended && !customPlan
        && results.length >= 8 && correct / results.length >= 0.85) {
      extended = true;
      const more = await offerEncore(S);
      if (more) {
        const extra = encoreItems(plan.targets, 4, seenText);
        extra.forEach(x => seenText.add(x.word.text));
        queue.push(...extra);
      }
    }
  }

  finish(false);

  function finish(early) {
    const d = today();
    if (S.streak.lastDay !== d) {
      const y = new Date(Date.now() - 86400000);
      S.streak.count = S.streak.lastDay === today(y) ? S.streak.count + 1 : 1;
      S.streak.lastDay = d;
    }
    S.sessions.push({ started: startedAt, ended: Date.now(), items: plan.seq.length, correct });
    flush();
    if (!early) summary(plan, correct, newlyMet);
  }
}

function summary(plan, correct, newlyMet) {
  const S = load();
  toTop();
  const total = plan.seq.length;
  const ctx = correct === total ? 'perfect' : 'sessionEnd';
  const nowBoring = plan.targets.filter(id => level(id) === LEVEL.BORING);

  // Retiring a word is the point of the fluency mode, so it gets its own
  // moment rather than a line in a list.
  const wasBoring = new Set(plan.before || []);
  const retired = boringItems().map(i => i.text).filter(t => !wasBoring.has(t));

  app.innerHTML = `
    <div class="topbar"><span class="brand">WORDBREAKER</span></div>
    <div class="hero">
      <h1 style="font-size:44px">${correct} / ${total}</h1>
      <p class="msg plainmsg">${esc(say(ctx, { correct, total }, S.settings.personality))}</p>
    </div>
    ${retired.length ? `
      <div class="section-title">now officially boring</div>
      <div class="family">${retired.map(t => `<span class="dull">${t}</span>`).join('')}</div>
      <p class="msg plainmsg">${esc(say('retired', { n: retired.length, word: retired[0] }, S.settings.personality))}</p>` : ''}
    ${newlyMet.length ? `
      <div class="section-title">new to the codex</div>
      <p class="msg plainmsg">${esc(say('newMorpheme', {
        morph: MORPH[newlyMet[0]].canonical,
        gloss: MORPH[newlyMet[0]].gloss,
        origin: originLabel(MORPH[newlyMet[0]].origin),
      }, S.settings.personality))}</p>
      <div class="codex-grid">${newlyMet.map(id => {
        const m = MORPH[id];
        return `<div class="card ${m.type}"><b>${m.canonical}</b>
          <span class="gloss">${m.gloss} · ${originLabel(m.origin)}</span></div>`;
      }).join('')}</div>` : ''}
    ${nowBoring.length ? `
      <div class="section-title">now boring</div>
      <p class="msg plainmsg">${nowBoring.map(id =>
        esc(say('boring', { morph: MORPH[id].canonical }, S.settings.personality))).join('\n')}</p>` : ''}
    <div class="homegrid" style="margin-top:26px">
      <button class="btn primary big" data-act="home">Done</button>
    </div>`;
  app.querySelector('[data-act="home"]').onclick = home;
}

/**
 * The maths strand. Kept as its own session rather than mixed into the word
 * sessions: different domain, different data, and mixing would muddle both.
 * The connection is made in the voice instead — same trick, different subject.
 */
function runMath() {
  const skill = pickSkill(id => level(id));
  const seq = Array.from({ length: 8 }, () => {
    const p = makeProblem(skill);
    // Shaped like a word item so the session loop needs no special case.
    p.id = 'm:' + p.prompt;
    p.text = p.prompt;
    p.morphemes = [];
    p.level = p.steps.length;
    return { word: p, activity: 'middle', phase: 'math' };
  });
  return runSession({ targets: [skill], seq, opener: 'mathOpen', math: true });
}

/** A yes/no interstitial. Resolves false if he just wants to be done. */
function offerEncore(S) {
  return new Promise(resolve => {
    const stage = document.getElementById('stage');
    if (!stage) return resolve(false);
    stage.innerHTML = `
      <div class="act">
        <p class="prompt">You are on a run.</p>
        <div class="casefile"><div class="suspect" style="font-size:26px">Four more?</div></div>
        <div class="actions">
          <button class="btn primary" data-act="more">Four more</button>
          <button class="btn ghost" data-act="stop">That's enough</button>
        </div>
      </div>`;
    stage.querySelector('[data-act="more"]').onclick = () => resolve(true);
    stage.querySelector('[data-act="stop"]').onclick = () => resolve(false);
  });
}

// ------------------------------------------------------------- parent view
function parentView() {
  const S = load();
  toTop();
  const teach = drillableMorphemes().map(m => m.id);
  const worst = weakest(teach, 12);
  const sessions = S.sessions.slice(-10).reverse();

  app.innerHTML = `
    <div class="topbar">
      <button class="btn ghost" data-act="back">Back</button>
      <div class="spacer"></div>
      <button class="btn ghost" data-act="export">Export</button>
      <button class="btn ghost danger" data-act="reset">Reset</button>
    </div>
    <div class="section-title">${esc(S.name)} — error fingerprint, weakest pieces</div>
    ${worst.length ? `<div class="family">${worst.map(w =>
      `<span>${MORPH[w.id].canonical} · ${Math.round(w.s * 100)}% · n=${w.n}</span>`).join('')}</div>`
      : '<p class="msg plainmsg">No data yet.</p>'}
    <div class="section-title">recent sessions</div>
    ${sessions.length ? sessions.map(s =>
      `<p class="msg plainmsg" style="text-align:left">${new Date(s.started).toLocaleDateString()} — ${s.correct}/${s.items} · ${Math.round((s.ended - s.started) / 60000)} min</p>`).join('')
      : '<p class="msg plainmsg">No sessions yet.</p>'}
    <div class="section-title">show the middle</div>
    <div class="family">${LADDER.map(id => {
      const e = mastEntry(id);
      return `<span>${SKILLS[id].name}: ${e.n ? LEVEL_NAME[level(id)] + ` (n=${e.n})` : 'not tried'}</span>`;
    }).join('')}</div>
    <div class="section-title">mastery spread</div>
    <div class="family">${[0, 1, 2, 3, 4].map(l =>
      `<span>${LEVEL_NAME[l]}: ${teach.filter(id => level(id) === l).length}</span>`).join('')}</div>`;

  app.querySelector('[data-act="back"]').onclick = home;
  app.querySelector('[data-act="export"]').onclick = () => download(exportProfile(), S.name);
  app.querySelector('[data-act="reset"]').onclick = () => {
    if (confirm(`Wipe all of ${S.name}'s progress? This cannot be undone.`)) {
      resetProfile(); home();
    }
  };
}

loadRoot();
requestPersistence();
load() ? home() : picker();
