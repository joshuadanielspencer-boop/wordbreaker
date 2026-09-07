// Speech, for the spelling strand only.
//
// A classroom spelling test is dictation, so hearing the word is the authentic
// prompt rather than a shortcut. Browser speech is fine for this because every
// curriculum word is a REAL English word. It is not fine for the invented
// words in the transfer test — a speech engine is language-model driven and
// will happily "correct" `preflectable` into something else — so nothing
// outside Spelling Slaughter uses it.

// Voice quality matters more here than anywhere else in the app, because the
// spelling test IS the audio. macOS ships two tiers: the old compact voices
// (Samantha and friends, installed by default, and frankly robotic) and the
// Enhanced/Premium downloads, which are dramatically better and free. Prefer
// the good ones by name when they are installed, and fall back gracefully.
// System Settings > Accessibility > Spoken Content > System Voice > Manage
// Voices is where they come from; nothing in the app can substitute for them.
const QUALITY = /\((Enhanced|Premium)\)|^Siri/i;

const PREFERRED = ['Samantha', 'Alex', 'Karen', 'Daniel', 'Serena', 'Moira', 'Tessa', 'Google US English'];

// Dictation is slower than ordinary speech on purpose. 0.85 was too fast to
// make out a nonsense word from — there is no lexical knowledge to fall back
// on when the word does not exist, so every phoneme has to actually land.
export const RATE = { normal: 0.9, word: 0.75, nonsense: 0.6 };

// macOS ships a pile of novelty voices that would read a spelling word in a
// robot monotone or as a series of bells. Never pick one by accident.
const NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Jester|Junior|Organ|Pipe Organ|Princess|Ralph|Trinoids|Whisper|Wobble|Zarvox|Superstar|Grandma|Grandpa|Rocko|Sandy|Shelley|Eddy|Flo|Reed|Rishi|Bruce|Fred|Hysterical|Kathy)\b/i;

let cached = null;
let ready = false;

function pickVoice() {
  const all = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
  if (!all.length) return null;
  const usable = all.filter(v => !NOVELTY.test(v.name));

  // An Enhanced/Premium/Siri voice beats every compact voice, whatever its
  // name, so quality is checked before the name preferences below.
  const good = usable.filter(v => QUALITY.test(v.name));
  if (good.length) {
    for (const name of PREFERRED) {
      const hit = good.find(v => v.name.startsWith(name));
      if (hit) return hit;
    }
    return good.find(v => /en[-_]US/i.test(v.lang)) || good[0];
  }

  for (const name of PREFERRED) {
    const hit = usable.find(v => v.name === name);
    if (hit) return hit;
  }
  return usable.find(v => v.default) || usable.find(v => v.localService) || usable[0] || null;
}

/** Whether the chosen voice is one of the good ones. The teacher area says so,
 *  because "the computer sounds robotic" has a fix and it is not in this app. */
export function voiceQuality() {
  if (!cached) return { name: null, good: false };
  return { name: cached.name, good: QUALITY.test(cached.name) };
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
export function say(text, { rate = RATE.normal, slow = false } = {}) {
  if (!speechAvailable()) return false;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = cached;
    u.lang = cached.lang;
    // "Slower" is a rung, not a toggle to a crawl: below about 0.45 the macOS
    // compact voices start slurring rather than clarifying, which makes a
    // nonsense word harder to catch, not easier.
    u.rate = Math.max(0.45, slow ? rate * 0.7 : rate);
    speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

/**
 * Say a word twice with a gap. Dictation in a real spelling test is not a
 * single reading you must catch first time — the teacher says the word, uses
 * it, says it again. One pass at a nonsense word is a listening test with a
 * spelling test hidden behind it.
 */
export function sayTwice(text, opts = {}) {
  if (!say(text, opts)) return false;
  const u = new SpeechSynthesisUtterance(text);
  u.voice = cached;
  u.lang = cached.lang;
  u.rate = Math.max(0.45, (opts.slow ? (opts.rate ?? RATE.normal) * 0.7 : (opts.rate ?? RATE.normal)));
  // A pause long enough to be a second reading rather than a stutter.
  setTimeout(() => { try { speechSynthesis.speak(u); } catch {} }, 900);
  return true;
}

/**
 * Spell a word out letter by letter, using letter NAMES — Kilpatrick is
 * explicit that oral decoding uses names, not sounds. Letters are queued as
 * separate utterances with a gap, because handing the engine "b r i c k" as
 * one string gets it read as a word.
 *
 * @returns a cancel function, so leaving the activity stops the reading.
 */
export function spellAloud(text, { gap = 620, rate = 0.9 } = {}) {
  if (!speechAvailable()) return () => {};
  const letters = [...text.toUpperCase()].filter(c => /[A-Z]/.test(c));
  let i = 0, timer = null, cancelled = false;
  stopSpeaking();

  const next = () => {
    if (cancelled || i >= letters.length) return;
    try {
      const u = new SpeechSynthesisUtterance(letters[i]);
      u.voice = cached;
      u.lang = cached.lang;
      u.rate = rate;
      speechSynthesis.speak(u);
    } catch {}
    i++;
    timer = setTimeout(next, gap);
  };
  next();

  return () => { cancelled = true; clearTimeout(timer); stopSpeaking(); };
}

export function stopSpeaking() {
  try { speechSynthesis.cancel(); } catch {}
}
