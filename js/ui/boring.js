// MAKE IT BORING — the fluency screen.
//
// Words he has already met, run again until they stop costing him anything.
// The promise is unusual for a learning app and it is the honest one: the
// reward for working on a word is that the word becomes dull and goes away.

import { MORPH } from '../content/lexicon.js';
import { boringItems, nearlyBoring, fluencySummary } from '../core/fluency.js';

export function renderBoring(app, { onBack, onStart }) {
  window.scrollTo(0, 0);
  const stats = fluencySummary();
  const retired = boringItems();
  const ready = nearlyBoring(12);

  app.innerHTML = `
    <div class="topbar">
      <button class="btn ghost" data-act="back">Back</button>
      <div class="spacer"></div>
      <span class="pill">${retired.length} retired</span>
    </div>
    <div class="hero" style="padding:8px 0 18px">
      <h1 style="font-size:32px">Make it boring</h1>
      <p>${stats.seen === 0
        ? 'Play a normal session first. I need words you have already met before I can wear them out.'
        : 'These are words you have met before. Do them until they stop being interesting. That is the whole goal.'}</p>
    </div>

    ${ready.length ? `
      <div class="section-title">closest to boring</div>
      <div class="boring-list">${ready.slice(0, 8).map(i => `
        <div class="boring-row">
          <b>${i.text}</b>
          <span class="boring-meta">seen ${i.n}× over ${i.dayCount} day${i.dayCount === 1 ? '' : 's'}</span>
          <span class="boring-bar"><i style="width:${Math.round(i.progress * 100)}%"></i></span>
        </div>`).join('')}</div>
      <div class="homegrid" style="margin-top:16px">
        <button class="btn primary big" data-act="start">Wear down ${ready.length} word${ready.length === 1 ? '' : 's'}</button>
      </div>` : ''}

    ${retired.length ? `
      <div class="section-title">officially boring — ${retired.length}</div>
      <p class="msg plainmsg" style="text-align:left">These no longer cost you anything.
      ${stats.medianSpeedup ? `You do them in about ${Math.round(stats.medianSpeedup * 100)}% of the time you first took.` : ''}</p>
      <div class="family">${retired.map(i => `<span class="dull">${i.text}</span>`).join('')}</div>` : ''}`;

  app.querySelector('[data-act="back"]').onclick = onBack;
  const go = app.querySelector('[data-act="start"]');
  if (go) go.onclick = () => onStart(ready);
}
