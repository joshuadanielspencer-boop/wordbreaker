// SPELLING SLAUGHTER — mission list and word board.

import { allMissions, missionProgress, wordStatus, missedCount } from '../core/mission.js';
import { missionById } from '../content/lexicon.js';

export function renderSlaughter(app, { onBack, onDrill, onReview, onTest }) {
  window.scrollTo(0, 0);
  const missions = allMissions();

  // With one mission the list is a screen containing a single card that you
  // have to tap to get anywhere — an extra step that looks like a dead end,
  // and the reason the spelling test was hard to find. Go straight in.
  if (missions.length === 1) {
    return renderMission(app, missions[0].mission.id, { onBack, onDrill, onReview, onTest });
  }

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
    ${[...missions].reverse().map(({ mission, done, total, pct }) => `
      <div class="mission-block">
        <button class="mission-card" data-id="${mission.id}">
          <div class="mission-head">
            <b>${mission.name}</b>
            <span class="mission-sub">${mission.subtitle}</span>
            <span class="mission-count">${done}/${total}</span>
          </div>
          <span class="boring-bar"><i style="width:${pct}%"></i></span>
        </button>
        ${done < total ? `
          <div class="mission-actions">
            <button class="btn primary" data-test="${mission.id}">Take the test</button>
            <button class="btn" data-drill="${mission.id}">Practise</button>
            <button class="btn ghost" data-id="${mission.id}">See the words</button>
          </div>` : `<p class="msg good">Every word finished.</p>`}
      </div>`).join('')}`;
  // Newest list first: the one at the top is the one school is testing now.
  // And the test sits ON each card, not behind it. A card that reads as a
  // progress bar is exactly how the test got lost the first time.

  const back = () => renderSlaughter(app, { onBack, onDrill, onReview, onTest });
  app.querySelector('[data-act="back"]').onclick = onBack;
  app.querySelectorAll('[data-id]').forEach(b =>
    b.onclick = () => renderMission(app, b.dataset.id, { onBack: back, onDrill, onReview, onTest }));
  app.querySelectorAll('[data-test]').forEach(b => b.onclick = () => onTest(b.dataset.test, 'sound'));
  app.querySelectorAll('[data-drill]').forEach(b => b.onclick = () => onDrill(b.dataset.drill));
}

export function renderMission(app, id, { onBack, onDrill, onReview, onTest }) {
  window.scrollTo(0, 0);
  const mission = missionById(id);
  const { done, total, pct } = missionProgress(mission);
  const missed = missedCount(id);

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
    <div class="homegrid">
      ${done < total ? `
        <button class="btn primary big" data-act="test">
          <b>Take the spelling test</b>
          <span>${total - done} word${total - done === 1 ? '' : 's'} · read aloud, no hints, one go each</span>
        </button>` : ''}
      ${done < total ? `
        <button class="btn door wide" data-act="drill">
          <b>Practise</b><span>take them apart, then write them</span>
        </button>` : `<p class="msg good">Every word in this mission is finished.</p>`}
      ${missed ? `
        <button class="btn door wide" data-act="review">
          <b>Fix the misses</b><span>${missed === 1 ? '1 word that keeps' : `${missed} words that keep`} going wrong</span>
        </button>` : ''}
    </div>

    <div class="section-title">the words</div>
    ${groups.map(g => `
      <div class="group-label">${g.label}</div>
      <div class="slaughter-grid">${g.words.map(w => {
        const s = wordStatus(w.text);
        const state = s.slaughtered ? 'done' : s.cleanDays.size ? 'close' : s.seen ? 'started' : '';
        return `<div class="slaughter-word ${state}${s.misses ? ' missed' : ''}">
          <b>${w.display}</b>
          <span class="sw-parts">${w.parts.map(p => p.surface).join('·')}</span>
          <span class="sw-state">${s.slaughtered ? 'slaughtered'
            : s.cleanDays.size ? 'one clean spell' : s.seen ? `seen ${s.seen}×` : 'untouched'}${
            s.misses ? ` · ${s.misses} miss${s.misses === 1 ? '' : 'es'}` : ''}</span>
        </div>`;
      }).join('')}</div>`).join('')}`;

  app.querySelector('[data-act="back"]').onclick = onBack;
  const d = app.querySelector('[data-act="drill"]');
  if (d) d.onclick = () => onDrill(mission.id);
  const rv = app.querySelector('[data-act="review"]');
  if (rv && onReview) rv.onclick = () => onReview(mission.id);
  const ts = app.querySelector('[data-act="test"]');
  if (ts && onTest) ts.onclick = () => onTest(mission.id, 'sound');
}
