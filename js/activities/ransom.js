// RANSOM NOTE — reading text that refuses to look like text.
// Kilpatrick, Chapter 6 §20–24.
//
// The same word rendered hostile: all capitals, upside down, letters stacked
// vertically, alternating case, spaced apart, or run together with no gaps.
// Each distortion destroys a different compensating cue — word shape, length,
// the familiar silhouette of a known word — and leaves only the letters.
//
// The distortion type rotates so he cannot settle into one and adapt to it.
//
// It is also diagnostic. Kilpatrick notes that a learner who *cannot* adjust
// to distorted text probably lacks letter-sound or phoneme skills, so a low
// score here is a signal in its own right rather than just a bad round —
// which is why accuracy is logged per distortion type, not pooled.

import { say } from '../voice/voice.js';

export const DISTORTIONS = {
  caps:        { label: 'all capitals',     defeats: 'word shape' },
  alternating: { label: 'alternating case', defeats: 'word shape' },
  spaced:      { label: 'spaced out',       defeats: 'whole-word recognition' },
  vertical:    { label: 'stacked',          defeats: 'left-to-right scanning' },
  rotated:     { label: 'upside down',      defeats: 'everything visual' },
  mixedfont:   { label: 'mixed lettering',  defeats: 'letter-shape familiarity' },
};

export const DISTORTION_KEYS = Object.keys(DISTORTIONS);

function render(text, kind) {
  const letters = [...text];
  switch (kind) {
    case 'caps':
      return `<span class="ransom-word caps">${text.toUpperCase()}</span>`;
    case 'alternating':
      return `<span class="ransom-word">${letters.map((c, i) =>
        i % 2 ? c.toUpperCase() : c.toLowerCase()).join('')}</span>`;
    case 'spaced':
      return `<span class="ransom-word spaced">${letters.join(' ')}</span>`;
    case 'vertical':
      return `<span class="ransom-word vertical">${letters.map(c =>
        `<i>${c}</i>`).join('')}</span>`;
    case 'rotated':
      return `<span class="ransom-word rotated">${text}</span>`;
    case 'mixedfont':
      // Deliberately ugly: every letter in a different face, size and weight,
      // so no two letters share a silhouette convention.
      return `<span class="ransom-word">${letters.map((c, i) =>
        `<i class="mf mf${i % 4}">${c}</i>`).join('')}</span>`;
    default:
      return `<span class="ransom-word">${text}</span>`;
  }
}

export function mount(el, item, opts = {}) {
  return new Promise(resolve => {
    const started = performance.now();
    // A missing word would take the whole session down; hand the item back.
    if (!(item && (item.word || item).text)) {
      resolve({ correct: true, ms: 0, credit: {}, detail: { skipped: 'no word' } });
      return;
    }
    const word = item.word;
    const kind = item.distortion;
    const target = word.text;
    let attempts = 0;
    let revealed = false;

    el.innerHTML = `
      <div class="act act-ransom">
        <p class="prompt">Somebody has done something unspeakable to this word. What does it say?</p>
        <div class="casefile ransom-card">
          <div class="ransom-stage">${render(word.display || target, kind)}</div>
          <p class="ransom-kind">${DISTORTIONS[kind].label}</p>
        </div>
        <input class="answer" type="text" inputmode="text" autocapitalize="off"
               autocomplete="off" autocorrect="off" spellcheck="false"
               aria-label="type the word" placeholder="type what it says">
        <div class="feedback" aria-live="polite"></div>
        <div class="actions">
          <button class="btn ghost" data-act="straighten">Straighten it out</button>
          <button class="btn primary" data-act="go">That's the word</button>
        </div>
      </div>`;

    const input = el.querySelector('.answer');
    input.focus();
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    el.querySelector('[data-act="go"]').onclick = check;

    // The escape hatch shows the word normally. It is counted, because needing
    // it is exactly the measurement.
    el.querySelector('[data-act="straighten"]').onclick = () => {
      revealed = true;
      el.querySelector('.ransom-stage').innerHTML = render(word.display || target, 'plain');
      el.querySelector('.ransom-kind').textContent = 'straightened out';
      el.querySelector('[data-act="straighten"]').disabled = true;
      input.focus();
    };

    function check() {
      const given = input.value.trim().toLowerCase();
      if (!given) return;
      attempts++;
      const ok = given === target;

      if (!ok && attempts === 1 && !revealed) {
        el.querySelector('.feedback').innerHTML =
          `<p class="msg gentle">${say('ransomWrong', {}, opts.personality)}</p>`;
        input.select();
        return;
      }

      const ms = performance.now() - started;
      input.disabled = true;
      el.querySelector('.ransom-stage').innerHTML = render(word.display || target, 'plain');
      el.querySelector('.ransom-kind').textContent = DISTORTIONS[kind].label;

      const clean = ok && attempts === 1 && !revealed;
      el.querySelector('.feedback').innerHTML = `<p class="msg ${ok ? 'good' : 'gentle'}">${
        say(ok ? 'ransomRight' : 'ransomWrong', { word: target }, opts.personality)}</p>`;
      el.querySelector('.actions').innerHTML =
        `<button class="btn primary" data-act="next">Next</button>`;
      el.querySelector('[data-act="next"]').focus();

      resolve({
        correct: ok,
        ms,
        credit: {},
        detail: { word: target, distortion: kind, clean, attempts, revealed },
      });
    }
  });
}
