// THE WORD THAT DOES NOT EXIST
//
// A legal English word English never happened to build: `preflectable`,
// `trimortless`, `ungraphment`. He cannot have memorised it, cannot have seen
// it, and cannot guess it from context — the only route through is to take it
// apart and read the pieces.
//
// This is the transfer test. If he can do it, he owns the morphemes. If he can
// only do it for corpus words, he has memorised 519 words and the teaching has
// not transferred. Nothing else in the app answers that question.
//
// The answer is a CHAIN of piece meanings rather than a sentence, because
// mechanically composed English ("able to be looked at beforehand") reads like
// a translation error. Each wrong answer swaps exactly one link in the chain,
// so every piece has to be read.

import { MORPH } from '../content/lexicon.js';
import { say } from '../voice/voice.js';

function shuffle(a) {
  const o = a.slice();
  for (let i = o.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [o[i], o[j]] = [o[j], o[i]];
  }
  return o;
}

const chainOf = parts => parts.map(p => MORPH[p.m].gloss);

/** Swap one link for another morpheme of the same type. */
function decoy(word, all) {
  const i = Math.floor(Math.random() * word.parts.length);
  const target = MORPH[word.parts[i].m];
  const alts = all.filter(m => m.type === target.type && m.id !== target.id && m.gloss !== target.gloss);
  if (!alts.length) return null;
  const swap = alts[Math.floor(Math.random() * alts.length)];
  const chain = chainOf(word.parts);
  chain[i] = swap.gloss;
  return { chain, swappedAt: i };
}

export function mount(el, word, opts = {}) {
  return new Promise(resolve => {
    const started = performance.now();
    const all = word.parts.map(p => MORPH[p.m]);
    const universe = opts.morphemePool || Object.values(MORPH);

    const truth = { chain: chainOf(word.parts), correct: true };
    const wrongs = [];
    const seen = new Set([truth.chain.join('|')]);
    for (let tries = 0; wrongs.length < 3 && tries < 60; tries++) {
      const d = decoy(word, universe);
      if (!d) break;
      const key = d.chain.join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      wrongs.push(d);
    }
    const options = shuffle([truth, ...wrongs]);

    const chainHTML = (chain) => chain.map((g, i) =>
      `<span class="link ${all[i].type}">${g}</span>`).join('<span class="linkjoin">+</span>');

    el.innerHTML = `
      <div class="act act-invent">
        <p class="prompt">This word does not exist. What would it mean if it did?</p>
        <div class="casefile fake">
          <div class="stamp">not a real word</div>
          <div class="suspect">${word.text}</div>
        </div>
        <div class="options">${options.map((o, i) =>
          `<button class="opt chain" data-i="${i}">${chainHTML(o.chain)}</button>`).join('')}</div>
        <div class="feedback" aria-live="polite"></div>
        <div class="actions"></div>
      </div>`;

    el.querySelectorAll('.opt').forEach(b =>
      b.addEventListener('click', () => choose(Number(b.dataset.i))));

    function choose(i) {
      const picked = options[i];
      const ok = !!picked.correct;
      const ms = performance.now() - started;

      el.querySelectorAll('.opt').forEach((b, k) => {
        b.disabled = true;
        if (options[k].correct) b.classList.add('right');
        else if (k === i) b.classList.add('chosen-wrong');
        else b.classList.add('dimmed');
      });

      const credit = {};
      for (const p of word.parts) credit[p.m] = ok;

      // Name the piece that was misread. On an invented word that is the whole
      // lesson — there is no meaning to fall back on, only the pieces.
      const why = !ok && picked.swappedAt !== undefined
        ? `<p class="msg gentle">The <b>${word.parts[picked.swappedAt].surface}</b> is the piece that changed — it means
           “${MORPH[word.parts[picked.swappedAt].m].gloss}”.</p>`
        : '';

      el.querySelector('.feedback').innerHTML = `
        ${why}
        <p class="msg ${ok ? 'good' : 'gentle'}">${
          say(ok ? 'inventRight' : 'inventWrong', { word: word.text }, opts.personality)}</p>
        <div class="cmp-chips built">${word.parts.map((p, k) => {
          const m = MORPH[p.m];
          return `<span class="part ${m.type}"><span class="part-text">${p.surface}</span>
            <span class="part-gloss">${m.gloss}</span></span>`;
        }).join('<span class="joiner">+</span>')}</div>`;

      el.querySelector('.actions').innerHTML =
        `<button class="btn primary" data-act="next">Next</button>`;
      el.querySelector('[data-act="next"]').focus();
      resolve({ correct: ok, ms, credit, detail: { picked: picked.chain.join(' + ') } });
    }
  });
}
