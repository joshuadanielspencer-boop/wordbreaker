// THE EXPEDITION — reading view and unlock flow.
//
// A chapter becomes available after a completed session, but availability is
// not the same as access: the chapter is locked behind a long word, and
// breaking that word is how it opens. The story is the reward for the work and
// is also made of the work.

import { CHAPTERS } from '../content/story.js';
import { BY_TEXT } from '../content/lexicon.js';
import { load, save } from '../core/store.js';

export function unlockedCount() { return load()?.story?.unlocked || 0; }
export function nextChapter() {
  const n = unlockedCount();
  return n < CHAPTERS.length ? { index: n, ...CHAPTERS[n] } : null;
}
export function gateWordFor(chapter) { return BY_TEXT[chapter.gate]; }

export function markUnlocked(index) {
  const p = load();
  if (!p) return;
  p.story = p.story || { unlocked: 0 };
  p.story.unlocked = Math.max(p.story.unlocked, index + 1);
  save();
}

/** Whether a chapter is owed: one per completed session, capped by the book. */
export function chapterOwed() {
  const p = load();
  if (!p) return null;
  return p.sessions.length > unlockedCount() ? nextChapter() : null;
}

export function renderChapter(app, chapter, { onDone }) {
  window.scrollTo(0, 0);
  app.innerHTML = `
    <div class="topbar"><span class="brand">THE EXPEDITION</span></div>
    <article class="chapter">
      <p class="chapter-no">Chapter ${chapter.index + 1}</p>
      <h1>${chapter.title}</h1>
      <div class="chapter-body">${chapter.text.split('\n\n')
        .map(p => `<p>${p.replace(/\n/g, ' ')}</p>`).join('')}</div>
    </article>
    <div class="homegrid" style="margin-top:24px">
      <button class="btn primary big" data-act="done">Close the book</button>
    </div>`;
  app.querySelector('[data-act="done"]').onclick = onDone;
}

export function renderLibrary(app, { onBack, onRead }) {
  window.scrollTo(0, 0);
  const n = unlockedCount();
  app.innerHTML = `
    <div class="topbar">
      <button class="btn ghost" data-act="back">Back</button>
      <div class="spacer"></div>
      <span class="pill">${n} of ${CHAPTERS.length}</span>
    </div>
    <div class="hero" style="padding:8px 0 18px">
      <h1 style="font-size:32px">The Expedition</h1>
      <p>${n === 0
        ? 'Nothing yet. Finish a session and the first chapter turns up.'
        : 'One chapter per session. Each one is locked behind a word.'}</p>
    </div>
    <div class="chapter-list">
      ${CHAPTERS.map((c, i) => i < n
        ? `<button class="chapter-row" data-i="${i}">
             <span class="chapter-no">${i + 1}</span>
             <b>${c.title}</b>
             <span class="chapter-gate">${c.gate}</span>
           </button>`
        : `<div class="chapter-row locked">
             <span class="chapter-no">${i + 1}</span>
             <b>${i === n ? 'Not opened yet' : '—'}</b>
             <span class="chapter-gate">${i === n ? c.gate.replace(/./g, '·') : ''}</span>
           </div>`).join('')}
    </div>`;
  app.querySelector('[data-act="back"]').onclick = onBack;
  app.querySelectorAll('.chapter-row[data-i]').forEach(b =>
    b.onclick = () => onRead({ index: Number(b.dataset.i), ...CHAPTERS[Number(b.dataset.i)] }));
}
