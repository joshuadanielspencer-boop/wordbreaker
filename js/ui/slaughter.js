// SPELLING SLAUGHTER — mission list and word board.

import { allMissions, missionProgress, wordStatus } from '../core/mission.js';
import { missionById } from '../content/lexicon.js';

export function renderSlaughter(app, { onBack, onDrill }) {
  window.scrollTo(0, 0);
  const missions = allMissions();

  app.innerHTML = `
    <div class="topbar">
      <button class="btn ghost" data-act="back">Back</button>
      <div class="spacer"></div>
      <span class="pill">${missions.reduce((a, m) => a + m.done, 0)} slaughtered</span>
    </div>
    <div class="hero" style="padding:8px 0 18px">
      <h1 style="font-size:32px">Spelling Slaughter</h1>
      <p>School's spelling list, run through the slicer. A word is finished when
      you can spell it cold, twice, on different days.</p>
    </div>
    ${missions.map(({ mission, done, total, pct }) => `
      <button class="mission-card" data-id="${mission.id}">
        <div class="mission-head">
          <b>${mission.name}</b>
          <span class="mission-sub">${mission.subtitle}</span>
          <span class="mission-count">${done}/${total}</span>
        </div>
        <span class="boring-bar"><i style="width:${pct}%"></i></span>
      </button>`).join('')}`;

  app.querySelector('[data-act="back"]').onclick = onBack;
  app.querySelectorAll('.mission-card').forEach(b =>
    b.onclick = () => renderMission(app, b.dataset.id, { onBack: () => renderSlaughter(app, { onBack, onDrill }), onDrill }));
}

export function renderMission(app, id, { onBack, onDrill }) {
  window.scrollTo(0, 0);
  const mission = missionById(id);
  const { done, total, pct } = missionProgress(mission);

  const groups = mission.groups.map((g, gi) => ({
    label: g.label,
    words: mission.words.filter(w => w.group === gi),
  }));

  app.innerHTML = `
    <div class="topbar">
      <button class="btn ghost" data-act="back">Back</button>
      <div class="spacer"></div>
      <span class="pill">${done}/${total}</span>
    </div>
    <div class="hero" style="padding:8px 0 14px">
      <h1 style="font-size:30px">${mission.name}</h1>
      <p>${mission.subtitle}</p>
    </div>
    ${groups.map(g => `
      <div class="section-title">${g.label}</div>
      <div class="slaughter-grid">${g.words.map(w => {
        const s = wordStatus(w.text);
        const state = s.slaughtered ? 'done' : s.cleanDays.size ? 'close' : s.seen ? 'started' : '';
        return `<div class="slaughter-word ${state}">
          <b>${w.display}</b>
          <span class="sw-parts">${w.parts.map(p => p.surface).join('·')}</span>
          <span class="sw-state">${s.slaughtered ? 'slaughtered'
            : s.cleanDays.size ? 'one clean spell' : s.seen ? `seen ${s.seen}×` : 'untouched'}</span>
        </div>`;
      }).join('')}</div>`).join('')}
    <div class="homegrid" style="margin-top:20px">
      ${done < total
        ? `<button class="btn primary big" data-act="drill">Start the slaughter</button>`
        : `<p class="msg good">Every word in this mission is finished.</p>`}
    </div>`;

  app.querySelector('[data-act="back"]').onclick = onBack;
  const d = app.querySelector('[data-act="drill"]');
  if (d) d.onclick = () => onDrill(mission.id);
}
