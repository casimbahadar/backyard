// Spoken prompts use the device voice. Letter sounds use short recorded clips, because
// a synthetic voice says "em" where phonics needs the pure sound /m/. Clips come from
// clips recorded on this device first, then from clips.json in the repo.

let voice = null;
let voicesKnown = false;
const listeners = new Set();

// A parent can pick which installed voice reads aloud; otherwise Canadian English first.
let preferred = null;
export function preferVoice(name) { preferred = name || null; pickVoice(); }
export function englishVoices() {
  return window.speechSynthesis ? speechSynthesis.getVoices().filter(v => v.lang?.startsWith('en')).map(v => ({ name: v.name, lang: v.lang })) : [];
}

function pickVoice() {
  if (!window.speechSynthesis) return;
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return;
  voicesKnown = true;
  voice = voices.find(v => v.name === preferred && v.lang?.startsWith('en')) ?? voices.find(v => v.lang === 'en-CA') ?? voices.find(v => v.lang?.startsWith('en-')) ?? voices.find(v => v.lang?.startsWith('en')) ?? null;
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
  stopVoice();
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

// A letter sound is either a plain recording (the repo's clips.json) or a clip recorded
// in Grown-ups with where the sound starts and ends and how loud to play it.
async function buffer(phoneme, deviceClips) {
  const raw = deviceClips[phoneme] ?? (await repoBundle())[phoneme];
  if (!raw || !ctx) return null;
  const c = typeof raw === 'string' ? { src: raw } : raw;
  const key = `${phoneme}:${c.src.length}:${c.src.slice(-24)}`;
  let buf = decoded.get(key);
  if (!buf) {
    buf = await ctx.decodeAudioData(Uint8Array.from(atob(c.src.split(',')[1]), ch => ch.charCodeAt(0)).buffer);
    decoded.set(key, buf);
  }
  return { buf, start: c.start ?? 0, len: (c.end ?? buf.duration) - (c.start ?? 0), gain: c.gain ?? 1 };
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
    const g = ctx.createGain();
    g.gain.value = b.gain;
    s.buffer = b.buf;
    s.connect(g); g.connect(ctx.destination);
    s.start(t, b.start, b.len);
    t += b.len + gap;
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

// ---------- recorded voice ----------
// Pieces recorded in Grown-ups, Settings, each with where its speech starts and ends and
// how loud to play it. A line plays as one run of pieces with a short gap between.
const voiceDecoded = new Map();
let voiceSources = [];
export function stopVoice() {
  for (const s of voiceSources) { try { s.stop(); } catch { /* already ended */ } }
  voiceSources = [];
}
export const audioReady = () => !!ctx;
export async function playVoice(list, { gap = 0.06 } = {}) {
  if (!ctx) return false;
  stopVoice();
  try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch { /* nothing to cancel */ }
  const mine = [];
  voiceSources = mine;
  let t = ctx.currentTime + 0.03;
  for (const c of list) {
    const key = `${c.src.length}:${c.src.slice(-32)}`;
    let buf = voiceDecoded.get(key);
    if (!buf) {
      try { buf = await ctx.decodeAudioData(Uint8Array.from(atob(c.src.split(',')[1]), ch => ch.charCodeAt(0)).buffer); } catch { buf = null; }
      if (buf) voiceDecoded.set(key, buf);
    }
    if (voiceSources !== mine) return true; // a newer line started; this one stops
    if (!buf) continue;
    const s = ctx.createBufferSource();
    const g = ctx.createGain();
    g.gain.value = c.gain ?? 1;
    s.buffer = buf; s.connect(g); g.connect(ctx.destination);
    const len = Math.max(0.05, (c.end ?? buf.duration) - (c.start ?? 0));
    s.start(Math.max(t, ctx.currentTime), c.start ?? 0, len);
    mine.push(s);
    t = Math.max(t, ctx.currentTime) + len + gap;
  }
  return true;
}

// ---------- Arabic ----------
// The Noorani Qaida lessons are read by the device's Arabic voice for now. iPhones and
// iPads include one (add more in Settings, Accessibility, Spoken Content, Voices).
export const arabicVoice = () => (window.speechSynthesis ? speechSynthesis.getVoices().find(v => v.lang?.startsWith('ar')) ?? null : null);
export function speakArabic(text, { off = false, log } = {}) {
  log?.(text);
  if (off || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    const v = arabicVoice();
    u.lang = v?.lang ?? 'ar-SA';
    try { if (v) u.voice = v; } catch { /* keep the language */ }
    u.rate = 0.8;
    speechSynthesis.speak(u);
  } catch { /* stay silent rather than break the screen */ }
}
