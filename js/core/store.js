// Persistence.
//
// One JSON blob in localStorage holding several PROFILES — one per player, so
// that siblings sharing a device cannot contaminate each other's mastery data.
// The whole thing exports to a file for Dropbox sync between the Mac and the
// iPad. No accounts, no server, no build step, works on a plane.

const KEY = 'wordbreaker.v2';
const LEGACY_KEY = 'wordbreaker.v1';

export const AVATARS = ['🥔', '🦆', '🐙', '🦖', '🦇', '🐐', '🦉', '🍕', '🚀', '👹', '🐛', '🧿'];

function blankProfile(name, avatar) {
  return {
    id: 'p' + Math.random().toString(36).slice(2, 9),
    name,
    avatar: avatar || AVATARS[0],
    created: Date.now(),
    settings: { personality: 'funny' },
    mastery: {},        // morphemeId -> { n, recent[], lastSeen, msTotal, days[] }
    log: [],            // response records, newest last
    codex: {},          // morphemeId -> { note, drawing }
    sessions: [],       // { started, ended, items, correct }
    streak: { count: 0, lastDay: null },
    rewards: [],        // reward lines already shown, so they don't repeat
  };
}

const BLANK_ROOT = { version: 2, profiles: [], activeId: null };

function today(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

let root = null;

function migrate(oldState) {
  const p = blankProfile(oldState.name || 'Player 1');
  for (const k of ['settings', 'mastery', 'log', 'codex', 'sessions', 'streak']) {
    if (oldState[k]) p[k] = oldState[k];
  }
  return p;
}

/**
 * Ask the browser to keep this data. Safari evicts script-writable storage
 * after seven days without a visit — on macOS as well as iOS — which would
 * quietly erase months of progress. Chrome grants persistence based on
 * engagement; Safari ignores the request, so the export nudge below is the
 * real backstop there.
 */
export async function requestPersistence() {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch { return null; }
}

/** Sessions since the last export. Drives the periodic backup nudge. */
export function sessionsSinceBackup() {
  const p = load();
  if (!p) return 0;
  return p.sessions.length - (p.lastBackupAt || 0);
}

export function markBackedUp() {
  const p = load();
  if (!p) return;
  p.lastBackupAt = p.sessions.length;
  flush();
}

export function loadRoot() {
  if (root) return root;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      root = { ...structuredClone(BLANK_ROOT), ...JSON.parse(raw) };
    } else {
      root = structuredClone(BLANK_ROOT);
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        try { root.profiles.push(migrate(JSON.parse(legacy))); } catch {}
      }
    }
  } catch {
    root = structuredClone(BLANK_ROOT);
  }
  if (root.activeId && !root.profiles.some(p => p.id === root.activeId)) root.activeId = null;
  return root;
}

/** The active profile. Everything else in the app talks to this. */
export function load() {
  const r = loadRoot();
  return r.profiles.find(p => p.id === r.activeId) || null;
}

let saveTimer = null;
export function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 150);
}

export function flush() {
  clearTimeout(saveTimer);
  try { localStorage.setItem(KEY, JSON.stringify(root)); }
  catch (e) { console.warn('save failed', e); }
}

// ---------------------------------------------------------------- profiles
export function profiles() { return loadRoot().profiles; }

export function createProfile(name, avatar) {
  const r = loadRoot();
  const p = blankProfile((name || '').trim() || 'Player', avatar);
  r.profiles.push(p);
  r.activeId = p.id;
  flush();
  return p;
}

export function switchProfile(id) {
  const r = loadRoot();
  if (r.profiles.some(p => p.id === id)) { r.activeId = id; flush(); }
  return load();
}

export function signOut() { loadRoot().activeId = null; flush(); }

export function deleteProfile(id) {
  const r = loadRoot();
  r.profiles = r.profiles.filter(p => p.id !== id);
  if (r.activeId === id) r.activeId = null;
  flush();
}

export function renameProfile(id, name, avatar) {
  const p = loadRoot().profiles.find(x => x.id === id);
  if (!p) return;
  if (name) p.name = name.trim();
  if (avatar) p.avatar = avatar;
  flush();
}

export { today };

// ------------------------------------------------------------ export/import
/** Export one profile, so a sibling's data never rides along by accident. */
export function exportProfile(id = loadRoot().activeId) {
  flush();
  const p = loadRoot().profiles.find(x => x.id === id);
  return JSON.stringify({ kind: 'wordbreaker-profile', version: 2, profile: p }, null, 2);
}

export function importProfile(text) {
  const data = JSON.parse(text);
  const incoming = data.kind === 'wordbreaker-profile' ? data.profile
    : data.version === 1 ? migrate(data)
    : null;
  if (!incoming) throw new Error('unrecognised save file');

  const r = loadRoot();
  const existing = r.profiles.findIndex(p => p.id === incoming.id);
  // Same profile from the other device: keep whichever has more history.
  if (existing >= 0) {
    if ((incoming.log?.length || 0) >= (r.profiles[existing].log?.length || 0)) {
      r.profiles[existing] = incoming;
    }
  } else {
    r.profiles.push(incoming);
  }
  r.activeId = incoming.id;
  flush();
  return incoming;
}

export function resetProfile(id = loadRoot().activeId) {
  const r = loadRoot();
  const i = r.profiles.findIndex(p => p.id === id);
  if (i < 0) return;
  const { name, avatar } = r.profiles[i];
  const fresh = blankProfile(name, avatar);
  fresh.id = id;
  r.profiles[i] = fresh;
  flush();
}
