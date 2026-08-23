// THE CODEX — the thing he is building, as opposed to the thing he is completing.
// Every morpheme he has met becomes a card: meaning, origin, and the family of
// words it turns up in.

import { MORPH, collectableMorphemes, originLabel } from '../content/lexicon.js';
import { level, LEVEL, LEVEL_NAME, strength, entry } from '../core/mastery.js';

export function renderCodex(el, { onBack }) {
  const all = collectableMorphemes();
  const met = all.filter(m => level(m.id) !== LEVEL.UNSEEN);
  const byType = { prefix: [], root: [], suffix: [] };
  for (const m of all) byType[m.type].push(m);

  el.innerHTML = `
    <div class="topbar">
      <button class="btn ghost" data-act="back">Back</button>
      <div class="spacer"></div>
      <span class="pill">${met.length} of ${all.length} collected</span>
    </div>
    <div class="hero" style="padding:8px 0 18px">
      <h1 style="font-size:34px">Codex</h1>
      <p>Every piece of English you have taken apart.</p>
    </div>
    ${['prefix', 'root', 'suffix'].map(t => `
      <div class="section-title">${t}es — ${byType[t].filter(m => level(m.id) !== LEVEL.UNSEEN).length}/${byType[t].length}</div>
      <div class="codex-grid">${byType[t].map(cardHTML).join('')}</div>`).join('')}
    <div class="detail" id="detail"></div>`;

  el.querySelector('[data-act="back"]').addEventListener('click', onBack);
  el.querySelectorAll('.card').forEach(c =>
    c.addEventListener('click', () => showDetail(c.dataset.id)));

  function cardHTML(m) {
    const lvl = level(m.id);
    const s = strength(m.id);
    const pct = s === null ? 0 : Math.round(s * 100);
    return `<button class="card ${m.type} ${lvl === LEVEL.UNSEEN ? 'locked' : ''}" data-id="${m.id}">
      <b>${m.canonical}${m.type === 'prefix' ? '-' : m.type === 'suffix' ? '-' : ''}</b>
      <span class="gloss">${lvl === LEVEL.UNSEEN ? 'not met yet' : m.gloss}</span>
      <span class="bar"><i style="width:${pct}%"></i></span>
    </button>`;
  }

  function showDetail(id) {
    const m = MORPH[id];
    const e = entry(id);
    const lvl = level(id);
    const d = el.querySelector('#detail');
    d.innerHTML = `
      <div class="section-title">card</div>
      <div class="card ${m.type}" style="cursor:default">
        <b>${m.canonical}</b>
        <span class="gloss">${m.gloss} &nbsp;·&nbsp; ${originLabel(m.origin)}</span>
        ${m.lit ? `<p class="msg plainmsg" style="text-align:left">${m.lit}</p>` : ''}
        ${(() => { const alt = m.forms.filter(f => f !== m.canonical);
            return alt.length ? `<p class="msg plainmsg" style="text-align:left">Also shows up as: ${alt.join(', ')}</p>` : ''; })()}
        <p class="msg plainmsg" style="text-align:left">
          Status: ${LEVEL_NAME[lvl]} · seen ${e.n} time${e.n === 1 ? '' : 's'}${e.days.length ? ` across ${e.days.length} day${e.days.length === 1 ? '' : 's'}` : ''}
        </p>
        <div class="family">${m.family.map(w => `<span>${w}</span>`).join('')}</div>
      </div>`;
    d.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
