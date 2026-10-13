// Build tool: records the letter sounds once and saves them as clips.json.
// Each recording is trimmed of silence, peak-normalised and stored as 16-bit mono WAV,
// which every browser decodes. Work in progress is kept in this browser until saved.
import { phonemeList } from './audio.js';
import { FIRST_SOUNDS } from './words.js';

const KEY = 'backyard-recorder';
const RATE = 22050;
const $ = id => document.getElementById(id);
const pack = await (await fetch('./on-k-language.json')).json();
const sounds = phonemeList(pack.taughtSet.order, FIRST_SOUNDS);
let clips = {};
try { clips = JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { clips = {}; }
let ctx = null;
const audio = () => (ctx ??= new (window.AudioContext || window.webkitAudioContext)());

function keep() {
  try { localStorage.setItem(KEY, JSON.stringify(clips)); return true; } catch { return false; }
}

// Cut leading and trailing silence, leave 40 ms either side, scale the loudest point to 90%.
export function trim(samples, rate, threshold = 0.04) {
  let start = samples.findIndex(v => Math.abs(v) > threshold);
  if (start < 0) return null;
  let end = samples.length - 1;
  while (end > start && Math.abs(samples[end]) <= threshold) end--;
  const pad = Math.round(rate * 0.04);
  const cut = samples.slice(Math.max(0, start - pad), Math.min(samples.length, end + pad));
  let peak = 0;
  for (const v of cut) peak = Math.max(peak, Math.abs(v));
  return cut.map(v => (v / peak) * 0.9);
}

export function wav(samples, rate) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const d = new DataView(buf);
  const str = (o, s) => [...s].forEach((c, i) => d.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); d.setUint32(4, 36 + samples.length * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true); d.setUint32(24, rate, true);
  d.setUint32(28, rate * 2, true); d.setUint16(32, 2, true); d.setUint16(34, 16, true); str(36, 'data'); d.setUint32(40, samples.length * 2, true);
  samples.forEach((v, i) => d.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 0x7fff, true));
  let bin = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:audio/wav;base64,${btoa(bin)}`;
}

async function toClip(blob) {
  const decoded = await audio().decodeAudioData(await blob.arrayBuffer());
  // Resample to one channel at 22 kHz, which keeps files small and speech clear.
  const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * RATE), RATE);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  const mono = (await off.startRendering()).getChannelData(0);
  const cut = trim(Array.from(mono), RATE);
  return cut ? wav(cut, RATE) : null;
}

async function play(src) {
  const bytes = Uint8Array.from(atob(src.split(',')[1]), c => c.charCodeAt(0));
  const b = await audio().decodeAudioData(bytes.buffer);
  const s = audio().createBufferSource();
  s.buffer = b; s.connect(audio().destination); s.start();
}

let stream = null, recorder = null;
async function record(row, phoneme, btn) {
  const status = $('status');
  if (recorder) { recorder.stop(); return; }
  try {
    stream ??= await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true } });
  } catch {
    status.textContent = 'The microphone is not available. Allow it for this page in the browser settings, then try again.';
    status.classList.add('warn');
    return;
  }
  audio().resume();
  const parts = [];
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = e => parts.push(e.data);
  recorder.onstop = async () => {
    recorder = null;
    row.classList.remove('recording');
    btn.textContent = 'Record';
    const clip = await toClip(new Blob(parts, { type: parts[0]?.type })).catch(() => null);
    if (!clip) { status.textContent = `Nothing was heard for /${phoneme}/. Try again a little closer to the microphone.`; status.classList.add('warn'); return; }
    clips[phoneme] = clip;
    status.classList.remove('warn');
    status.textContent = keep() ? `Kept /${phoneme}/. Tap Play to check it.` : 'This browser would not keep the recording. Save clips.json now so nothing is lost.';
    render();
    play(clip);
  };
  recorder.start();
  row.classList.add('recording');
  btn.textContent = 'Stop';
  setTimeout(() => recorder?.stop(), 2000);
}

function render() {
  const done = sounds.filter(s => clips[s.phoneme]).length;
  $('progress').textContent = `${done} of ${sounds.length} sounds recorded.`;
  $('list').replaceChildren(...sounds.map(s => {
    const row = document.createElement('li');
    row.className = clips[s.phoneme] ? 'rec-row done' : 'rec-row';
    row.dataset.phoneme = s.phoneme;
    const sound = Object.assign(document.createElement('span'), { className: 'rec-sound', textContent: s.grapheme });
    const word = Object.assign(document.createElement('span'), { className: 'rec-word', textContent: s.example ? `as in ${s.example}` : `/${s.phoneme}/` });
    const btns = Object.assign(document.createElement('span'), { className: 'rec-buttons' });
    const rec = Object.assign(document.createElement('button'), { type: 'button', className: 'btn rec', textContent: clips[s.phoneme] ? 'Redo' : 'Record' });
    rec.onclick = () => record(row, s.phoneme, rec);
    const pl = Object.assign(document.createElement('button'), { type: 'button', className: 'btn quiet', textContent: 'Play', disabled: !clips[s.phoneme] });
    pl.onclick = () => play(clips[s.phoneme]);
    btns.append(rec, pl);
    row.append(sound, word, btns);
    return row;
  }));
}

$('export').onclick = () => {
  const missing = sounds.filter(s => !clips[s.phoneme]).map(s => s.grapheme);
  const bundle = { version: 1, source: `Recorded with record-sounds.html on ${new Date().toISOString().slice(0, 10)}`, clips };
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([JSON.stringify(bundle)], { type: 'application/json' })), download: 'clips.json' });
  document.body.append(a); a.click(); a.remove();
  $('status').textContent = missing.length ? `Saved, but ${missing.length} sounds are still missing (${missing.join(', ')}). The blending game waits for all of them.` : 'Saved. Upload it to the repo as clips.json, replacing the empty one.';
};

render();
window.__recorderReady = true;
