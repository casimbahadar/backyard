// Audio checks in headless Chromium: voice choice and the no-voice notes, speech started
// inside the tap that opens a quest, replay, the voice-off switch, and letter-sound clips
// decoding and playing. Real iOS voices are not reachable here; see docs/TODO.md.
// Run: node test-audio.mjs   Exit 0 = passed, 1 = a check failed, 2 = crashed.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf' };
const failures = [];
let passed = 0;
const check = (ok, msg) => { if (ok) passed++; else failures.push(msg); };
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const body = await readFile(join(root, path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
const kid = extra => ({ id: 'pa', name: 'Ava', grade: 'k', dailyGoal: 3, taughtCount: 32, taughtLocked: false, readWords: [], readLog: {}, attempts: {}, unlocked: [], chosenNode: null, stickers: [], pendingStickers: 0, sheetRewards: [], days: {}, quest: null, ...extra });
const store = (p, settings = {}) => ({ version: 3, sheets: {}, results: {}, profiles: [p], activeProfile: p.id, settings: { pin: '1234', voiceOff: false, ...settings } });

// Replaces the device voice with a recorder: every speak() is logged with whether it
// happened inside a tap. voices = what getVoices() returns; null removes speech entirely.
const fakeVoice = voices => `(() => {
  const voices = ${JSON.stringify(voices)};
  if (voices === null) { delete window.speechSynthesis; window.speechSynthesis = undefined; delete window.SpeechSynthesisUtterance; return; }
  window.__speech = [];
  const synth = { getVoices: () => voices, cancel() {}, speak(u) { window.__speech.push({ text: u.text, inTap: navigator.userActivation.isActive, lang: u.lang }); }, addEventListener() {} };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
})();`;

let browser;
async function open(path, seed, voices, clips = true) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(fakeVoice(voices));
  if (seed) await ctx.addInitScript(v => { if (!sessionStorage.getItem('s')) { localStorage.setItem('backyard', v); sessionStorage.setItem('s', '1'); sessionStorage.setItem('backyard-parent', 'open'); } }, JSON.stringify(seed));
  if (clips) await ctx.route('**/clips.json', r => r.fulfill({ path: join(root, 'test-clips.json') }));
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') page.errors.push(m.text()); });
  await page.goto(`http://127.0.0.1:${server.address().port}/${path}`);
  return page;
}

try {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
  browser = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const EN = [{ name: 'Samantha', lang: 'en-US' }, { name: 'Nora', lang: 'en-CA' }];

  // 1. The quest prompt is spoken inside the Play tap, in the Canadian voice; replay speaks again.
  const p1 = await open('index.html?test', store(kid({ chosenNode: 'on-k-language/A2.4' })), EN);
  await p1.waitForFunction(() => window.__by?.ready);
  await p1.click('#play');
  await p1.waitForSelector('[data-screen="quest"]');
  let speech = await p1.evaluate(() => window.__speech);
  const firstPrompt = speech.find(s => s.text.includes('start with'));
  check(firstPrompt?.inTap === true, 'the first quest prompt was not spoken inside the Play tap (iOS would stay silent)');
  check(firstPrompt?.lang === 'en-CA', `prompt voice was ${firstPrompt?.lang}, not the en-CA voice`);
  const before = speech.length;
  await p1.click('#replay');
  check((await p1.evaluate(() => window.__speech.length)) === before + 1, 'replay did not speak the prompt again');

  // 2. A wrong letter-sound answer says the letter, then plays its recorded sound.
  const right = await p1.evaluate(() => window.__by.answerIndex);
  const item = await p1.evaluate(() => window.__by.item);
  await p1.click(`[data-choice="${(right + 1) % item.choices.length}"]`);
  await p1.waitForFunction(() => document.querySelectorAll('.pip.done').length === 1, null, { timeout: 8000 });
  const played = await p1.evaluate(() => window.__by.sounds);
  check(JSON.stringify(played[0]) === JSON.stringify([item.facts.sound]), `wrong answer played ${JSON.stringify(played[0])}, expected the /${item.facts.sound}/ clip`);
  const decoded = await p1.evaluate(async () => {
    const { playSounds } = await import('./audio.js');
    const t = performance.now();
    await playSounds(['m', 'a', 'p']);
    return performance.now() - t;
  });
  check(decoded > 300, `three clips finished in ${decoded.toFixed(0)} ms, so they did not really play`);
  check(p1.errors.length === 0, `errors while playing clips: ${p1.errors.join('; ')}`);
  await p1.context().close();

  // 2b. Your recorded voice: with every piece recorded, the quest is read from the
  // recordings and the device voice stays quiet; with one piece missing, that line
  // falls back to the device voice.
  const tone = (() => {
    const rate = 8000, n = 1200, buf = Buffer.alloc(44 + n * 2);
    buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
    buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 2, 40);
    for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin(i / 4) * 8000), 44 + i * 2);
    return `data:audio/wav;base64,${buf.toString('base64')}`;
  })();
  const { pieces } = JSON.parse(await readFile(join(root, 'voice-pieces.json'), 'utf8'));
  const full = { version: 1, clips: Object.fromEntries(pieces.map(p => [p.key, { src: tone, start: 0, end: 0.15, gain: 1 }])) };
  const withVoice = async bundle => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.addInitScript(fakeVoice(EN));
    await ctx.addInitScript(v => localStorage.setItem('backyard', v), JSON.stringify(store(kid({ chosenNode: 'on-k-math/A6.3' }))));
    await ctx.route('**/voice.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(bundle) }));
    const page = await ctx.newPage();
    page.errors = [];
    page.on('pageerror', e => page.errors.push(e.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/index.html?test`);
    await page.waitForFunction(() => window.__by?.ready);
    await page.click('#play');
    await page.waitForSelector('[data-screen="quest"]');
    await page.waitForTimeout(300);
    return page;
  };
  const pv1 = await withVoice(full);
  const voiced = await pv1.evaluate(() => window.__by.voiced);
  const tts = await pv1.evaluate(() => window.__speech.filter(s => s.text).length);
  check(voiced.length >= 1 && tts === 0, `with every piece recorded the quest still used the device voice (${voiced.length} voiced, ${tts} device)`);
  check(pv1.errors.length === 0, `errors playing the recorded voice: ${pv1.errors.join('; ')}`);
  const firstLine = voiced[0];
  await pv1.context().close();
  const { speechPieces } = await import('./voice.js');
  // Every counting prompt starts "How many", so leaving that piece out must send the
  // next quest's first line to the device voice whatever it counts.
  const missingKey = speechPieces(firstLine)[0].key;
  check(missingKey === 'p:how many', `unexpected first piece ${missingKey}`);
  const partial = { version: 1, clips: Object.fromEntries(Object.entries(full.clips).filter(([k]) => k !== missingKey)) };
  const pv2 = await withVoice(partial);
  const spokenByDevice = await pv2.evaluate(() => window.__speech.filter(s => s.text).map(s => s.text));
  check(spokenByDevice.length === 1 && spokenByDevice[0].startsWith('How many'), `a line with a missing piece was not read by the device voice: ${JSON.stringify(spokenByDevice)}`);
  await pv2.context().close();

  // 3. Voice off: nothing is spoken at all.
  const p2 = await open('index.html?test', store(kid({ chosenNode: 'on-k-math/A6.3' }), { voiceOff: true }), EN);
  await p2.waitForFunction(() => window.__by?.ready);
  await p2.click('#play');
  await p2.waitForSelector('[data-screen="quest"]');
  await p2.click('#replay');
  check((await p2.evaluate(() => window.__speech.filter(s => s.text).length)) === 0, 'the voice-off switch did not silence the voice');
  await p2.context().close();

  // 4. Settings: the voice note for each kind of device, and the letter-sound count.
  const note = async (voices, clips) => {
    const p = await open('parent.html', store(kid()), voices, clips);
    await p.waitForFunction(() => window.__parentReady);
    await p.click('[data-tab="settings"]');
    await p.waitForTimeout(2300);
    const text = { voice: await p.textContent('#voice-note'), sounds: await p.textContent('#sounds-status') };
    await p.context().close();
    return text;
  };
  let n = await note(EN, true);
  check(n.voice.includes('Nora') && n.voice.includes('en-CA'), `voice note with an en-CA voice: "${n.voice}"`);
  check(n.sounds === 'All 28 letter sounds are ready.', `sound count with clips: "${n.sounds}"`);
  // Picking a voice by name: the chosen one reads the quest, ahead of en-CA.
  const pv = await open('parent.html', store(kid()), EN);
  await pv.waitForFunction(() => window.__parentReady);
  await pv.click('[data-tab="settings"]');
  await pv.selectOption('#voice-pick', 'Samantha');
  check((await pv.textContent('#voice-note')).includes('Samantha'), 'choosing a voice did not change the note');
  const saved = await pv.evaluate(() => JSON.parse(localStorage.getItem('backyard')).settings.voiceName);
  await pv.context().close();
  check(saved === 'Samantha', 'the chosen voice was not saved');
  const pq = await open('index.html?test', { ...store(kid({ chosenNode: 'on-k-math/A6.3' })), settings: { pin: '1234', voiceOff: false, voiceName: 'Samantha' } }, EN);
  await pq.waitForFunction(() => window.__by?.ready);
  await pq.click('#play');
  await pq.waitForSelector('[data-screen="quest"]');
  check((await pq.evaluate(() => window.__speech.filter(s => s.text).at(-1).lang)) === 'en-US', 'the quest did not use the chosen voice');
  await pq.context().close();
  n = await note([{ name: 'Amélie', lang: 'fr-CA' }], false);
  check(n.voice.startsWith('This device has no English voice'), `voice note with only French: "${n.voice}"`);
  check(n.sounds.startsWith('0 of 28 letter sounds are ready'), `sound count without clips: "${n.sounds}"`);
  n = await note([], false);
  check(n.voice.startsWith('This device has no English voice'), `voice note when voices never load: "${n.voice}"`);
  n = await note(null, false);
  check(n.voice.startsWith('This browser cannot speak'), `voice note with no speech at all: "${n.voice}"`);

  // 5. With no speech at all, a quest still runs and replay does not break.
  const p3 = await open('index.html?test', store(kid({ chosenNode: 'on-k-math/A6.3' })), null);
  await p3.waitForFunction(() => window.__by?.ready);
  await p3.click('#play');
  await p3.waitForSelector('[data-screen="quest"]');
  await p3.click('#replay');
  await p3.click(`[data-choice="${await p3.evaluate(() => window.__by.answerIndex)}"]`);
  await p3.waitForFunction(() => document.querySelectorAll('.pip.done').length === 1, null, { timeout: 8000 });
  check(p3.errors.length === 0, `errors with no speech available: ${p3.errors.join('; ')}`);
  await p3.context().close();

  console.log(`checks passed: ${passed}, failed: ${failures.length}`);
  for (const f of failures) console.log(`FAIL ${f}`);
  await browser.close();
  server.close();
  process.exit(failures.length ? 1 : 0);
} catch (err) {
  console.log(`DID NOT COMPLETE: ${err.stack}`);
  await browser?.close();
  server.close();
  process.exit(2);
}
