// HARD WORD RADAR
//
// Paste a page of whatever he is actually reading. The app finds the words
// worth taking apart before he starts, so the decoding work happens up front
// instead of in the middle of a paragraph he cares about.
//
// This is the bridge between the intervention and his real reading life, and
// it is the only part of the app that touches a book he chose himself.

import { MORPH, originLabel } from '../content/lexicon.js';
import { level } from '../core/mastery.js';
import { radar } from '../core/analyze.js';

export function renderRadar(app, { onBack, onPractice }) {
  window.scrollTo(0, 0);
  app.innerHTML = `
    <div class="topbar">
      <button class="btn ghost" data-act="back">Back</button>
      <div class="spacer"></div>
      <span class="pill">Hard Word Radar</span>
    </div>
    <div class="hero" style="padding:8px 0 18px">
      <h1 style="font-size:32px">What are you reading?</h1>
      <p>Paste a page. I'll find the words worth taking apart first.</p>
    </div>
    <textarea class="passage" rows="7" placeholder="Paste a paragraph or two here…"></textarea>
    <div class="homegrid" style="margin-top:12px">
      <button class="btn primary big" data-act="scan">Scan it</button>
    </div>
    <div id="results"></div>`;

  const ta = app.querySelector('.passage');
  ta.focus();
  app.querySelector('[data-act="back"]').onclick = onBack;
  app.querySelector('[data-act="scan"]').onclick = scan;

  function scan() {
    const text = ta.value.trim();
    const box = app.querySelector('#results');
    if (!text) { box.innerHTML = ''; return; }

    const { found, unparsed } = radar(text, id => level(id), 12);

    if (!found.length && !unparsed.length) {
      box.innerHTML = `<p class="msg plainmsg">Nothing in there needs taking apart. Go and read it.</p>`;
      return;
    }

    box.innerHTML = `
      ${found.length ? `
        <div class="section-title">coming up — ${found.length} word${found.length === 1 ? '' : 's'}</div>
        <div class="radar-list">${found.map(f => `
          <div class="radar-row">
            <b>${f.text}</b>
            <span class="radar-parts">${f.parts.map(p => {
              const m = MORPH[p.m];
              return `<span class="link ${m.type}">${p.surface}</span>`;
            }).join('<span class="linkjoin">+</span>')}</span>
            <span class="radar-gloss">${f.parts.map(p => MORPH[p.m].gloss).join(' · ')}</span>
          </div>`).join('')}</div>
        <div class="homegrid" style="margin-top:14px">
          <button class="btn primary big" data-act="practice">Take these apart — ${found.length} words</button>
        </div>` : ''}
      ${unparsed.length ? `
        <div class="section-title">long, but I don't know the pieces</div>
        <p class="msg plainmsg" style="text-align:left">These are worth a look before you start, but they are not built
        from anything in the Codex yet, so I am not going to pretend I can take them apart.</p>
        <div class="family">${unparsed.map(w => `<span>${w}</span>`).join('')}</div>` : ''}`;

    box.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const btn = box.querySelector('[data-act="practice"]');
    if (btn) btn.onclick = () => onPractice(found.map(f => ({
      id: 'r:' + f.text,
      text: f.text,
      parts: f.parts,
      morphemes: f.parts.map(p => p.m),
      level: f.parts.length,
      cuts: f.parts.slice(0, -1).reduce((acc, p) => {
        acc.push((acc[acc.length - 1] || 0) + p.surface.length);
        return acc;
      }, []),
      fromRadar: true,
    })));
  }
}
