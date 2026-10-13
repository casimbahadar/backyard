// Spoken prompts use the device voice. Letter sounds use short recorded clips, because
// a synthetic voice says "em" where phonics needs the pure sound /m/. Clips come from
// clips recorded on this device first, then from clips.json in the repo.

let voice = null;
let voicesKnown = false;
const listeners = new Set();

function pickVoice() {
  if (!window.speechSynthesis) return;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return;
  voicesKnown = true;
  voice = voices.find(v => v.lang === 'en-CA') ?? voices.find(v => v.lang?.startsWith('en-')) ?? voices.find(v => v.lang?.startsWith('en')) ?? null;
  for (const f of listeners) f();
}
if (window.speechSynthesis) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
  // Some devices never announce their voices. After two seconds, treat the list as final.
  setTimeout(() => { if (!voicesKnown) { voicesKnown = true; for (const f of listeners) f(); } }, 2000);
}

// What the parent area should say about the voice on this device.
export function voiceStatus() {
  if (!window.speechSynthesis) return { ok: false, reason: 'This browser cannot speak. Questions still show on screen, and the replay button stays, but nothing is read aloud.' };
  if (voicesKnown && !voice) return { ok: false, reason: 'This device has no English voice installed, so questions are not read aloud. On an iPhone or iPad, add one in Settings, Accessibility, Spoken Content, Voices.' };
  return { ok: true, name: voice?.name ?? 'the device voice', lang: voice?.lang ?? '' };
}
export const onVoices = f => listeners.add(f);

// iOS only lets a page start speech and sound from inside a tap. The first tap
// anywhere calls this, which speaks nothing and wakes the audio output.
let ctx = null;
export function unlock() {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { ctx = null; }
  if (window.speechSynthesis && window.SpeechSynthesisUtterance && !unlock.done) {
    try {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      speechSynthesis.speak(u);
    } catch { /* nothing to wake */ }
    unlock.done = true;
  }
}

// Never throws: a voice problem must not stop a quest.
export function speak(text, { off = false, log } = {}) {
  log?.(text);
  if (off || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang ?? 'en-CA';
    try { if (voice) u.voice = voice; } catch { /* keep the language, let the device pick */ }
    u.rate = 0.9;
    speechSynthesis.speak(u);
  } catch { /* stay silent rather than break the screen */ }
}

// ---------- letter-sound clips ----------
let repoClips = null;
const decoded = new Map();

async function repoBundle() {
  if (repoClips) return repoClips;
  try {
    const r = await fetch('clips.json');
    repoClips = r.ok ? (await r.json()).clips ?? {} : {};
  } catch { repoClips = {}; }
  return repoClips;
}

// Every phoneme with a clip, from this device's recordings and the repo bundle.
export async function clipSet(deviceClips = {}) {
  return new Set([...Object.keys(await repoBundle()), ...Object.keys(deviceClips)]);
}

async function buffer(phoneme, deviceClips) {
  const src = deviceClips[phoneme] ?? (await repoBundle())[phoneme];
  if (!src || !ctx) return null;
  const key = `${phoneme}:${src.length}:${src.slice(-24)}`;
  if (decoded.has(key)) return decoded.get(key);
  const bytes = Uint8Array.from(atob(src.split(',')[1]), c => c.charCodeAt(0));
  const buf = await ctx.decodeAudioData(bytes.buffer);
  decoded.set(key, buf);
  return buf;
}

// Plays the sounds one after another with a short gap, like a teacher saying
// "/m/ ... /a/ ... /p/". Resolves when the last one ends. Missing clips are skipped.
export async function playSounds(phonemes, deviceClips = {}, { gap = 0.35, log } = {}) {
  log?.(phonemes);
  if (!ctx) return;
  let t = ctx.currentTime + 0.05;
  for (const p of phonemes) {
    // A clip that will not decode is skipped, never allowed to stop a quest.
    const b = await buffer(p, deviceClips).catch(() => null);
    if (!b) continue;
    const s = ctx.createBufferSource();
    s.buffer = b;
    s.connect(ctx.destination);
    s.start(t);
    t += b.duration + gap;
  }
  await new Promise(r => setTimeout(r, Math.max(0, (t - ctx.currentTime) * 1000)));
}

// The distinct letter sounds in a taught-set order, each with a word to say it in.
export function phonemeList(order, firstSounds) {
  const seen = new Map();
  for (const g of order) {
    if (seen.has(g.phoneme)) continue;
    const example = firstSounds.find(w => w.firstSound === g.phoneme)?.word
      ?? { ks: 'box, the end', z: 'has, the end', k: 'duck, the end' }[g.phoneme] ?? null;
    seen.set(g.phoneme, { phoneme: g.phoneme, grapheme: g.grapheme, example });
  }
  return [...seen.values()];
}
