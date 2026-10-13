// The recorder inside Grown-ups, Settings: record your own voice for everything the app
// says, or the 28 letter sounds. Recordings stay on this device; Save file and Load file
// move them to another device. Microphones only work on a secure (https) address.
import { allClips, saveClip, saveClips, clearClips, measure, exportFile, readFile } from './audio-store.js';
import { phonemeList } from './audio.js';
import { FIRST_SOUNDS } from './words.js';
import { speechPieces } from './voice.js';
import { arabicPieces } from './arabic.js';

let ctx = null;
const audio = () => (ctx ??= new (window.AudioContext || window.webkitAudioContext)());
const decode = src => audio().decodeAudioData(Uint8Array.from(atob(src.split(',')[1]), c => c.charCodeAt(0)).buffer);
const toDataUrl = blob => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(blob); });

async function playClip(c, at = 0) {
  const b = await decode(c.src);
  const s = audio().createBufferSource(), g = audio().createGain();
  g.gain.value = c.gain ?? 1;
  s.buffer = b; s.connect(g); g.connect(audio().destination);
  const len = (c.end ?? b.duration) - (c.start ?? 0);
  s.start(audio().currentTime + at, c.start ?? 0, len);
  return len;
}

export async function recorderView(kind, { el, onBack, order }) {
  const store = kind;
  const items = kind === 'voice'
    ? (await (await fetch('voice-pieces.json')).json()).pieces.map(p => ({ key: p.key, say: p.say, note: `Used in: ${p.example}`, group: p.key[0] }))
    : kind === 'arabic' ? arabicPieces()
    : phonemeList(order, FIRST_SOUNDS).map(s => ({ key: s.phoneme, say: s.grapheme, note: s.example ? `The sound at the start of ${s.example}. Say the sound, not the letter name.` : '', group: 's' }));
  let clips = await allClips(store);
  let group = items[0].group;
  const GROUPS = kind === 'voice' ? [['p', 'Phrases'], ['w', 'Words'], ['n', 'Numbers'], ['l', 'Letters']] : kind === 'arabic' ? [['n', 'Letter names'], ['v', 'With vowels']] : [];
  const status = el('p', { id: 'rec-status', class: 'status', role: 'status' });
  const progress = el('p', { id: 'rec-progress', class: 'week' });
  const list = el('ol', { id: 'rec-list', class: 'vlist' });
  const groups = GROUPS.length ? el('div', { class: 'vgroups' }, GROUPS.map(([g, name]) => el('button', { type: 'button', class: 'btn quiet small', 'data-group': g, onclick: () => { group = g; draw(); } }, name))) : null;
  const say = (t, warn = false) => { status.textContent = t; status.classList.toggle('warn', warn); };

  let stream = null, recorder = null;
  async function record(item, row, btn) {
    if (recorder) { recorder.stop(); return; }
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) return say('Recording needs the app opened from its https web address, such as your GitHub Pages link, not from a file or a local server.', true);
    try { stream ??= await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true } }); } catch {
      return say('The microphone is not allowed. In the browser settings, allow the microphone for this site, then try again.', true);
    }
    audio().resume();
    const parts = [];
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = e => parts.push(e.data);
    recorder.onstop = async () => {
      recorder = null;
      row.classList.remove('recording');
      btn.textContent = 'Record';
      try {
        const src = await toDataUrl(new Blob(parts, { type: parts[0]?.type }));
        const buf = await decode(src);
        const m = measure(buf.getChannelData(0), buf.sampleRate);
        if (!m) throw new Error('silent');
        const clip = { src, ...m };
        await saveClip(store, item.key, clip);
        clips[item.key] = clip;
        say(`Kept "${item.say}".`);
        draw();
        playClip(clip);
      } catch { say(`Nothing was heard for "${item.say}". Try again a little closer to the microphone.`, true); }
    };
    recorder.start();
    row.classList.add('recording');
    btn.textContent = 'Stop';
    setTimeout(() => recorder?.stop(), kind === 'sounds' ? 2500 : 8000);
  }
  async function hearLine(text) {
    audio().resume();
    let t = 0;
    for (const p of speechPieces(text)) if (clips[p.key]) t += (await playClip(clips[p.key], t)) + 0.06;
  }
  function draw() {
    const done = items.filter(i => clips[i.key]).length;
    progress.textContent = `${done} of ${items.length} recorded on this device.`;
    groups?.querySelectorAll('[data-group]').forEach(b => b.setAttribute('aria-current', String(b.dataset.group === group)));
    list.replaceChildren(...items.filter(i => !GROUPS.length || i.group === group).map(item => {
      let row = null;
      const rec = el('button', { type: 'button', class: 'btn rec', onclick: () => record(item, row, rec) }, clips[item.key] ? 'Redo' : 'Record');
      const play = el('button', { type: 'button', class: 'btn quiet', disabled: !clips[item.key], onclick: () => { audio().resume(); playClip(clips[item.key]); } }, 'Play');
      const extra = kind === 'voice' ? el('button', { type: 'button', class: 'btn quiet', onclick: () => hearLine(item.note.replace('Used in: ', '')) }, 'Hear line') : null;
      row = el('li', { class: clips[item.key] ? 'vrow done' : 'vrow', 'data-key': item.key },
        el('span', { class: kind === 'arabic' ? 'vsay ar' : 'vsay', lang: kind === 'arabic' ? 'ar' : null }, item.say), el('span', { class: 'help' }, item.note), el('span', { class: kind === 'voice' ? 'vbuttons' : 'vbuttons two' }, rec, play, extra));
      return row;
    }));
  }
  const saveFile = el('button', { id: 'rec-export', type: 'button', class: 'btn quiet', onclick: () => {
    const a = el('a', { href: URL.createObjectURL(new Blob([exportFile(store, clips)], { type: 'application/json' })), download: `sticker-yard-${store}.json` });
    document.body.append(a); a.click(); a.remove();
    say('File saved. Open Grown-ups on the other device, come to this screen, and tap Load a file.');
  } }, 'Save a file for another device');
  const load = el('input', { id: 'rec-import', type: 'file', accept: 'application/json,.json' });
  load.onchange = async () => {
    try {
      const incoming = readFile(store, await load.files[0].text());
      await saveClips(store, incoming);
      clips = await allClips(store);
      say(`Loaded ${Object.keys(incoming).length} recordings.`);
      draw();
    } catch { say(`That file is not a Sticker Yard ${{ voice: 'voice', sounds: 'letter sounds', arabic: 'Arabic' }[kind]} file.`, true); }
  };
  let armed = false;
  const wipe = el('button', { id: 'rec-clear', type: 'button', class: 'btn danger', onclick: async e => {
    if (!armed) { armed = true; e.currentTarget.textContent = 'Tap again to delete every recording on this device'; return; }
    await clearClips(store); clips = {}; armed = false; e.currentTarget.textContent = 'Delete these recordings'; say('Deleted. The device voice reads everything again.'); draw();
  } }, 'Delete these recordings');
  draw();
  const intro = kind === 'arabic'
    ? ['Record the Arabic for the Noorani Qaida lessons: each letter name, and each letter with fatha, kasra and damma. Joined letters and the muqatta\'at are read as a run of letter names, so they need no extra recordings.', 'A teacher or anyone who reads the Qaida well is the best voice. Until every piece a question needs is recorded, the device\'s Arabic voice reads it.']
    : kind === 'voice'
    ? ['Record your own voice for everything the app says. Each line is a short piece; the app joins pieces into each question. Say each one evenly and at the same speed. Say lines ending in a question mark like a question.', 'Tap Record, speak, tap Stop. It plays back so you can check, and Hear line plays a whole sentence from your pieces. Anything not recorded is read by the device voice. You can stop and carry on later.']
    : ['Record the 28 letter sounds for the blending game. Say the pure sound, "mmm" for m, not "em". Short sounds like t and p are a quick puff with no "uh" after.', 'The blending game joins quests as soon as all 28 are recorded.'];
  return [el('button', { type: 'button', class: 'to-yard', id: 'rec-back', onclick: onBack }, 'Back to Settings'),
    el('h1', {}, { voice: 'Your voice', sounds: 'Letter sounds', arabic: 'Arabic for the Qaida' }[kind]), ...intro.map(t => el('p', { class: 'help' }, t)),
    progress, groups, list, status,
    el('section', { class: 'group' }, el('h2', {}, 'Another device'), saveFile, el('label', { class: 'field' }, 'Load a file', load)),
    el('section', { class: 'group' }, wipe)].filter(Boolean);
}
