// WORD AUTOPSY — tap the gaps to cut a word into its morphemes.
//
// This is the "show the middle" mechanic. He cannot answer by recognising the
// word; he has to commit to where the seams are. Touch-native by design.

import { MORPH, originLabel } from '../content/lexicon.js';
import { say } from '../voice/voice.js';

export function mount(el, word, opts = {}) {
  return new Promise(resolve => {
    const cuts = new Set();
    const started = performance.now();
    let attempts = 0;

    el.innerHTML = `
      <div class="act act-autopsy">
        <p class="prompt">Cut it into pieces.</p>
        <div class="wordstage" role="group" aria-label="letters of ${word.text}"></div>
        <div class="feedback" aria-live="polite"></div>
        <div class="actions">
          <button class="btn ghost" data-act="hint">Hint</button>
          <button class="btn primary" data-act="go">Dissect</button>
        </div>
        <p class="keyhint"><kbd>←</kbd><kbd>→</kbd> move &nbsp; <kbd>space</kbd> cut &nbsp; <kbd>enter</kbd> dissect</p>
      </div>`;

    const stage = el.querySelector('.wordstage');
    let cursor = 0;                      // which gap the keyboard is on
    const feedback = el.querySelector('.feedback');
    const letters = [...(word.display || word.text)];

    letters.forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'ltr';
      s.textContent = ch;
      stage.appendChild(s);
      if (i < letters.length - 1) {
        const gap = document.createElement('button');
        gap.className = 'gap';
        gap.dataset.at = String(i + 1);
        gap.setAttribute('aria-label', `cut after ${ch}`);
        gap.addEventListener('click', () => {
          const at = Number(gap.dataset.at);
          if (cuts.has(at)) { cuts.delete(at); gap.classList.remove('cut'); }
          else { cuts.add(at); gap.classList.add('cut'); }
        });
        stage.appendChild(gap);
      }
    });

    const gaps = [...stage.querySelectorAll('.gap')];

    function moveCursor(to) {
      if (!gaps.length) return;
      cursor = Math.max(0, Math.min(gaps.length - 1, to));
      gaps.forEach((g, i) => g.classList.toggle('at', i === cursor));
    }
    moveCursor(0);

    // Desktop is the only target, so the whole activity is drivable from the
    // keyboard: arrows to move, space to cut, enter to submit. In a fluency
    // round this is several times faster than aiming at 3px-wide seams.
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowRight') { moveCursor(cursor + 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { moveCursor(cursor - 1); e.preventDefault(); }
      else if (e.key === ' ') { gaps[cursor]?.click(); e.preventDefault(); }
      else if (e.key === 'Enter') { check(); e.preventDefault(); }
      else if (e.key === '?') { el.querySelector('[data-act="hint"]')?.click(); }
    }
    window.addEventListener('keydown', onKey);
    const releaseKeys = () => window.removeEventListener('keydown', onKey);

    el.querySelector('[data-act="hint"]').addEventListener('click', () => {
      const sib = word.parts
        .map(p => MORPH[p.m].family.find(f => f !== word.text))
        .find(Boolean);
      feedback.innerHTML = `<p class="msg gentle">${say('hint',
        { sibling: sib || 'another word you know' }, opts.personality)}</p>`;
    });

    el.querySelector('[data-act="go"]').addEventListener('click', check);

    function check() {
      if (!el.isConnected) return releaseKeys();
      attempts++;
      const ms = performance.now() - started;
      const want = new Set(word.cuts);
      const exact = cuts.size === want.size && [...want].every(c => cuts.has(c));

      // Per-morpheme credit: a part counts as known only if BOTH its seams
      // were found and no spurious cut was placed inside it.
      const credit = {};
      let at = 0;
      for (const p of word.parts) {
        const a = at, b = at + p.surface.length;
        const seamsOk = (a === 0 || cuts.has(a)) && (b === word.text.length || cuts.has(b));
        let clean = true;
        for (let k = a + 1; k < b; k++) if (cuts.has(k)) clean = false;
        credit[p.m] = seamsOk && clean;
        at = b;
      }

      if (!exact && attempts === 1) {
        feedback.innerHTML = `<p class="msg gentle">${say('errorAutopsy', {}, opts.personality)}</p>`;
        markNearMisses();
        return;                       // one free retry before it counts
      }

      releaseKeys();
      reveal(exact);
      resolve({ correct: exact, ms, credit, detail: { cuts: [...cuts], attempts } });
    }

    function markNearMisses() {
      const want = new Set(word.cuts);
      stage.querySelectorAll('.gap').forEach(g => {
        const at = Number(g.dataset.at);
        g.classList.toggle('wrong', cuts.has(at) && !want.has(at));
      });
    }

    function reveal(correct) {
      const want = new Set(word.cuts);
      const spurious = [...cuts].filter(c => !want.has(c)).sort((a, b) => a - b);
      const missed   = word.cuts.filter(c => !cuts.has(c));

      // On a miss, show his split and the real seams side by side, with the
      // exact cuts that went wrong marked. Yellow text alone does not explain
      // anything; this does.
      const yoursRow = correct ? '' : `
        <div class="cmp-row wrong">
          <span class="cmp-label">you cut</span>
          <span class="cmp-word">${[...(word.display || word.text)].map((ch, i) => {
            const at = i + 1;
            let mark = '';
            if (cuts.has(at) && !want.has(at)) mark = '<i class="cut bad" title="not a seam">✕</i>';
            else if (cuts.has(at)) mark = '<i class="cut ok"></i>';
            else if (want.has(at)) mark = '<i class="cut missed" title="you missed this seam">▾</i>';
            return `<b>${ch}</b>${i < word.text.length - 1 ? mark : ''}`;
          }).join('')}</span>
        </div>`;

      stage.classList.add('revealed');
      stage.innerHTML = '';

      const chips = document.createElement('div');
      chips.className = 'cmp-chips';
      word.parts.forEach((p, i) => {
        const m = MORPH[p.m];
        const chip = document.createElement('span');
        chip.className = `part ${m.type}`;
        chip.innerHTML = `<span class="part-text">${p.surface}</span>
          <span class="part-gloss">${m.gloss}</span>
          <span class="part-origin">${originLabel(m.origin)}</span>`;
        chips.appendChild(chip);
        if (i < word.parts.length - 1) {
          const plus = document.createElement('span');
          plus.className = 'joiner'; plus.textContent = '+';
          chips.appendChild(plus);
        }
      });

      if (correct) {
        stage.appendChild(chips);
      } else {
        const wrap = document.createElement('div');
        wrap.className = 'compare';
        wrap.innerHTML = yoursRow +
          `<div class="cmp-row right"><span class="cmp-label">the seams</span></div>`;
        wrap.querySelector('.cmp-row.right').appendChild(chips);
        stage.appendChild(wrap);
      }

      // Say plainly what went wrong, in structural terms, without blame.
      let why = '';
      if (!correct) {
        const bits = [];
        if (spurious.length) bits.push(
          `${spurious.length === 1 ? 'That cut is' : 'Those cuts are'} inside a piece — ` +
          spurious.map(c => `<b>${word.text.slice(0, c)}|${word.text.slice(c)}</b>`).join(', ') +
          ` splits something that only works whole.`);
        if (missed.length) bits.push(
          `${missed.length === 1 ? 'One seam' : `${missed.length} seams`} went unmarked.`);
        if (!cuts.size) bits.push(`This word is ${word.parts.length} pieces, not one.`);
        why = `<p class="msg reason">${bits.join(' ')}</p>`;
      }

      const ctx = correct ? (word.level >= 4 ? 'correctBig' : 'correct') : 'errorAutopsy';
      feedback.innerHTML = why + `<p class="msg ${correct ? 'good' : 'gentle'}">${
        say(ctx, { word: word.text, n: word.parts.length, len: word.text.length },
            opts.personality)}</p>`;
      el.querySelector('.actions').innerHTML =
        `<button class="btn primary" data-act="next">Next</button>`;
      el.querySelector('[data-act="next"]').focus();
    }
  });
}
