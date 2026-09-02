// Speech, for the spelling strand only.
//
// A classroom spelling test is dictation, so hearing the word is the authentic
// prompt rather than a shortcut. Browser speech is fine for this because every
// curriculum word is a REAL English word. It is not fine for the invented
// words in the transfer test — a speech engine is language-model driven and
// will happily "correct" `preflectable` into something else — so nothing
// outside Spelling Slaughter uses it.

const PREFERRED = ['Samantha', 'Alex', 'Karen', 'Daniel', 'Serena', 'Moira', 'Tessa', 'Google US English'];

// macOS ships a pile of novelty voices that would read a spelling word in a
// robot monotone or as a series of bells. Never pick one by accident.
const NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Jester|Junior|Organ|Pipe Organ|Princess|Ralph|Trinoids|Whisper|Wobble|Zarvox|Superstar|Grandma|Grandpa|Rocko|Sandy|Shelley|Eddy|Flo|Reed|Rishi|Bruce|Fred|Hysterical|Kathy)\b/i;

let cached = null;
let ready = false;

function pickVoice() {
  const all = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
  if (!all.length) return null;
  const usable = all.filter(v => !NOVELTY.test(v.name));
  for (const name of PREFERRED) {
    const hit = usable.find(v => v.name === name);
    if (hit) return hit;
  }
  return usable.find(v => v.default) || usable.find(v => v.localService) || usable[0] || null;
}

/** Resolve once the voice list has populated. Safe to call repeatedly. */
export async function initSpeech() {
  if (ready) return cached;
  if (typeof speechSynthesis === 'undefined') { ready = true; return null; }
  cached = pickVoice();
  if (!cached) {
    await new Promise(r => {
      const done = () => { speechSynthesis.onvoiceschanged = null; r(); };
      speechSynthesis.onvoiceschanged = done;
      setTimeout(done, 1200);              // some browsers never fire the event
    });
    cached = pickVoice();
  }
  ready = true;
  return cached;
}

export function speechAvailable() {
  return typeof speechSynthesis !== 'undefined' && !!cached;
}

/**
 * Say a word, slightly slowed. Cancels anything already speaking so a fast
 * double-tap does not queue up two overlapping readings.
 */
export function say(text, { rate = 0.85 } = {}) {
  if (!speechAvailable()) return false;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = cached;
    u.lang = cached.lang;
    u.rate = rate;
    speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking() {
  try { speechSynthesis.cancel(); } catch {}
}
