// Everything the app keeps, in one versioned record in this browser's storage.
// Nothing leaves the device. Every read and write survives storage being off.
const KEY = 'backyard';
export const SCHEMA_VERSION = 3;

export function empty() {
  return { version: SCHEMA_VERSION, sheets: {}, results: {}, profiles: [], activeProfile: null, settings: { pin: null, voiceOff: false, theme: 'bright' } };
}

const PROFILE_DEFAULTS = { taughtLocked: false, sheetRewards: [] };

// Older saved data is upgraded here, one version at a time.
export function migrate(data) {
  if (!data || typeof data !== 'object') return empty();
  let d = { ...data };
  if (d.version === 1) {
    // Version 1 held only printed sheets and their marks.
    d = { ...d, version: 2, profiles: [], activeProfile: null };
  }
  if (d.version === 2) {
    // Version 3 added parent settings and two profile fields.
    d = { ...d, version: 3, settings: { pin: null, voiceOff: false, theme: 'bright' }, profiles: (d.profiles ?? []).map(p => ({ ...PROFILE_DEFAULTS, ...p })) };
  }
  if (d.version !== SCHEMA_VERSION) throw new Error(`saved data is version ${d.version}, which this app does not know`);
  return { ...empty(), ...d };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? migrate(JSON.parse(raw)) : empty();
  } catch {
    return empty();
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function newProfile({ name, grade, startCount, dailyGoal = 3 }) {
  return {
    id: `p${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`,
    name, grade, dailyGoal, goalType: 'quests',
    taughtCount: startCount, readWords: [], readLog: {},
    attempts: {}, unlocked: [], chosenNode: null,
    stickers: [], pendingStickers: 0, taughtLocked: false, sheetRewards: [],
    days: {}, quest: null, createdAt: new Date().toISOString()
  };
}

// A backup file is checked field by field before it replaces anything. Returns a
// reason string when something is wrong, or null when the file is safe to load.
export function problemWith(d) {
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  if (!isObj(d) || !isObj(d.sheets) || !isObj(d.results) || !Array.isArray(d.profiles) || !isObj(d.settings)) return 'missing parts';
  for (const p of d.profiles) {
    if (!isObj(p) || typeof p.id !== 'string' || typeof p.name !== 'string' || p.name.length > 40) return 'a child record is broken';
    if (!['k', '1'].includes(p.grade)) return 'a child has an unknown grade';
    if (!Number.isInteger(p.taughtCount) || p.taughtCount < 1 || p.taughtCount > 64) return 'a sound count is out of range';
    if (p.birthday != null && !(Array.isArray(p.birthday) && p.birthday.length === 2 && p.birthday[0] >= 1 && p.birthday[0] <= 12 && p.birthday[1] >= 1 && p.birthday[1] <= 31)) return 'a birthday is broken';
    if (p.taughtSounds !== undefined && (!Array.isArray(p.taughtSounds) || !p.taughtSounds.every(i => Number.isInteger(i) && i >= 0 && i < 64))) return 'the chosen sounds are broken';
    if (!Number.isInteger(p.dailyGoal) || p.dailyGoal < 1 || p.dailyGoal > (p.goalType === 'minutes' ? 60 : 12)) return 'a daily goal is out of range';
    if (p.goalType && !['quests', 'minutes'].includes(p.goalType)) return 'a daily goal has an unknown kind';
    if (!isObj(p.attempts) || !Array.isArray(p.stickers) || !Array.isArray(p.readWords)) return 'a child record is broken';
    for (const st of p.stickers) if (!isObj(st) || typeof st.id !== 'string' || typeof st.x !== 'number' || typeof st.y !== 'number' || (st.scene != null && typeof st.scene !== 'string') || (st.size != null && typeof st.size !== 'number')) return 'a sticker is broken';
  }
  if (d.settings.pin !== null && !/^\d{4}$/.test(String(d.settings.pin))) return 'the PIN is not four numbers';
  if (d.settings.theme && !['bright', 'calm', 'clear'].includes(d.settings.theme)) return 'unknown theme';
  if (d.settings.voiceName != null && (typeof d.settings.voiceName !== 'string' || d.settings.voiceName.length > 120)) return 'the voice name is broken';
  return null;
}
