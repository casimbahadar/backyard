// Recordings made on this device: your voice pieces and the letter sounds. Kept in the
// browser's own database (IndexedDB), which holds far more than ordinary storage, so a
// whole set of recordings fits. Each clip is { src, start, end, gain }: the recording,
// where the speech starts and ends inside it, and how loud to play it.
const DB = 'sticker-yard-audio';
const STORES = ['voice', 'sounds', 'arabic'];
let dbp = null;
let memory = null; // used when the browser refuses a database (some private modes)

function open() {
  if (!('indexedDB' in window)) return Promise.reject(new Error('no database'));
  dbp ??= new Promise((ok, no) => {
    const r = indexedDB.open(DB, 2); // version 2 added the Arabic recordings
    r.onupgradeneeded = () => { for (const s of STORES) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s); };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
  return dbp;
}
const run = async (store, mode, f) => {
  try {
    const db = await open();
    return await new Promise((ok, no) => {
      const tx = db.transaction(store, mode);
      const out = f(tx.objectStore(store));
      tx.oncomplete = () => ok(out?.result ?? out);
      tx.onerror = () => no(tx.error);
    });
  } catch {
    memory ??= { voice: {}, sounds: {}, arabic: {} };
    return null;
  }
};

export const usingMemory = () => memory !== null;

export async function allClips(store) {
  const out = {};
  const ok = await run(store, 'readonly', s => {
    const req = s.openCursor();
    req.onsuccess = () => { const c = req.result; if (c) { out[c.key] = c.value; c.continue(); } };
    return true;
  });
  return ok === null ? { ...(memory?.[store] ?? {}) } : out;
}
export async function saveClip(store, key, clip) {
  const r = await run(store, 'readwrite', s => { s.put(clip, key); return true; });
  if (r === null) memory[store][key] = clip;
}
export async function saveClips(store, clips) {
  const r = await run(store, 'readwrite', s => { for (const [k, v] of Object.entries(clips)) s.put(v, k); return true; });
  if (r === null) Object.assign(memory[store], clips);
}
export async function clearClips(store) {
  const r = await run(store, 'readwrite', s => { s.clear(); return true; });
  if (r === null) memory[store] = {};
}

// Turns a recording into a clip: finds the speech and how much to turn it up.
export function measure(samples, rate, threshold = 0.03) {
  let first = -1, last = -1, peak = 0;
  for (let i = 0; i < samples.length; i++) { const v = Math.abs(samples[i]); if (v > threshold) { if (first < 0) first = i; last = i; } if (v > peak) peak = v; }
  if (first < 0) return null;
  return { start: Math.max(0, first / rate - 0.05), end: Math.min(samples.length / rate, last / rate + 0.05), gain: Math.min(4, 0.9 / peak) };
}

// A file for moving recordings to another device: { kind, version, clips }.
export const exportFile = (kind, clips) => JSON.stringify({ kind: `sticker-yard-${kind}`, version: 1, made: new Date().toISOString().slice(0, 10), clips });
export function readFile(kind, text) {
  const d = JSON.parse(text);
  if (d?.kind !== `sticker-yard-${kind}` || typeof d.clips !== 'object') throw new Error('wrong kind');
  for (const [k, c] of Object.entries(d.clips)) {
    if (typeof k !== 'string' || !c || typeof c.src !== 'string' || !/^data:audio\//.test(c.src) || !(c.end > c.start)) throw new Error('bad clip');
  }
  return d.clips;
}
