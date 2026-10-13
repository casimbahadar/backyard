// The recorders inside Grown-ups, Settings, with Chromium's fake microphone (a steady
// tone): record a voice piece and a letter sound, keep them on the device, move them to
// another device with a file, and have the app read a quest in the recorded voice.
// Run: node test-recorder.mjs   Exit 0 = passed, 1 = a check failed, 2 = crashed.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, 'test-output', 'ui-out');
mkdirSync(out, { recursive: true });
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
const kid = { id: 'pa', name: 'Ava', grade: 'k', dailyGoal: 3, taughtCount: 32, taughtLocked: false, readWords: [], readLog: {}, attempts: {}, unlocked: [], chosenNode: 'on-k-math/A6.3', stickers: [], pendingStickers: 0, sheetRewards: [], days: {}, quest: null };
const seed = JSON.stringify({ version: 3, sheets: {}, results: {}, profiles: [kid], activeProfile: 'pa', settings: { pin: '1234', voiceOff: false, theme: 'bright' } });

let browser;
try {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
  browser = await chromium.launch({ args: ['--no-sandbox', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  const newCtx = async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true, permissions: ['microphone'] });
    await ctx.addInitScript(v => { if (!sessionStorage.getItem('s')) { localStorage.setItem('backyard', v); sessionStorage.setItem('s', '1'); } sessionStorage.setItem('backyard-parent', 'open'); }, seed);
    return ctx;
  };
  const ctx = await newCtx();
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const openTo = async (p, which) => {
    await p.goto(`${base}/parent.html`);
    await p.waitForFunction(() => window.__parentReady);
    await p.click('[data-tab="settings"]');
    await p.click(which);
    await p.waitForSelector('#rec-list .vrow');
  };
  const recordFirst = async p => {
    const key = await p.$eval('#rec-list .vrow', r => r.dataset.key);
    await p.click('#rec-list .vrow .rec');
    await p.waitForTimeout(1200);
    if (await p.$eval('#rec-list .vrow .rec', b => b.textContent) === 'Stop') await p.click('#rec-list .vrow .rec');
    await p.waitForFunction(() => /Kept/.test(document.getElementById('rec-status').textContent), null, { timeout: 8000 });
    return key;
  };

  // 1. Your voice, from Settings.
  await openTo(page, '#open-voice');
  const total = Number((await page.textContent('#rec-progress')).match(/of (\d+)/)[1]);
  check(total > 280, `the voice list has only ${total} pieces`);
  await page.screenshot({ path: join(out, 'recorder-voice-390.png') });
  const vKey = await recordFirst(page);
  const stored = await page.evaluate(async k => (await (await import('./audio-store.js')).allClips('voice'))[k], vKey);
  check(stored && stored.src.startsWith('data:audio/') && stored.end > stored.start && stored.gain > 0, 'the voice piece was not kept on the device with its start, end and loudness');
  check((await page.textContent('#rec-progress')).startsWith('1 of'), 'the progress line did not count the recording');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#rec-export')]);
  const file = join(out, 'voice-file.json');
  await dl.saveAs(file);
  const vf = JSON.parse(await readFile(file, 'utf8'));
  check(vf.kind === 'sticker-yard-voice' && Object.keys(vf.clips).length === 1, 'the voice file has the wrong shape');
  await page.click('#rec-back');
  await page.waitForSelector('#open-voice');
  check((await page.textContent('#voice-status')).startsWith('1 of'), 'Settings did not count the recorded piece');

  // 2. Letter sounds, from Settings.
  await page.click('#open-sounds');
  await page.waitForSelector('#rec-list .vrow');
  check(Number((await page.textContent('#rec-progress')).match(/of (\d+)/)[1]) === 28, 'the letter-sound list is not 28 sounds');
  const sKey = await recordFirst(page);
  const sStored = await page.evaluate(async k => (await (await import('./audio-store.js')).allClips('sounds'))[k], sKey);
  check(!!sStored, 'the letter sound was not kept on the device');

  // 3. Another device: load the file there.
  const ctx2 = await newCtx();
  const other = await ctx2.newPage();
  await openTo(other, '#open-voice');
  check((await other.textContent('#rec-progress')).startsWith('0 of'), 'a fresh device already had recordings');
  await other.setInputFiles('#rec-import', file);
  await other.waitForFunction(() => /Loaded 1 recording/.test(document.getElementById('rec-status').textContent), null, { timeout: 8000 });
  check((await other.textContent('#rec-progress')).startsWith('1 of'), 'loading the file did not add the recording');
  const bad = join(out, 'not-voice.json');
  await (await import('node:fs/promises')).writeFile(bad, '{"kind":"something-else","clips":{}}');
  await other.setInputFiles('#rec-import', bad);
  await other.waitForFunction(() => /not a Sticker Yard/.test(document.getElementById('rec-status').textContent));
  check(true, '');

  // 4. With every piece recorded on this device, the app reads the quest in that voice.
  const pieces = JSON.parse(await readFile(join(root, 'voice-pieces.json'), 'utf8')).pieces;
  await page.evaluate(async ({ keys, src }) => {
    const { saveClips } = await import('./audio-store.js');
    await saveClips('voice', Object.fromEntries(keys.map(k => [k, { src, start: 0, end: 0.2, gain: 1 }])));
  }, { keys: pieces.map(p => p.key), src: stored.src });
  const app = await ctx.newPage();
  await app.goto(`${base}/index.html?test`);
  await app.waitForFunction(() => window.__by?.ready);
  await app.click('#play');
  await app.waitForSelector('[data-screen="quest"]');
  await app.waitForTimeout(300);
  check((await app.evaluate(() => window.__by.voiced.length)) >= 1, 'the app did not use the voice recorded on this device');

  // 5. The Arabic recorder: 110 pieces; with all of them recorded, a Qaida lesson plays them.
  await openTo(page, '#open-arabic');
  check(Number((await page.textContent('#rec-progress')).match(/of (\d+)/)[1]) === 110, 'the Arabic list is not 110 pieces');
  await recordFirst(page);
  const arKeys = await page.evaluate(async () => (await import('./arabic.js')).arabicPieces().map(x => x.key));
  await page.evaluate(async ({ keys, src }) => { const { saveClips } = await import('./audio-store.js'); await saveClips('arabic', Object.fromEntries(keys.map(k => [k, { src, start: 0, end: 0.2, gain: 1 }]))); }, { keys: arKeys, src: stored.src });
  const arApp = await ctx.newPage();
  await arApp.goto(`${base}/index.html?test`);
  await arApp.waitForFunction(() => window.__by?.ready);
  // Switch the Qaida on for this child, then reload so the app picks it up.
  await arApp.evaluate(() => { const d = JSON.parse(localStorage.getItem('backyard')); d.profiles[0].noorani = true; d.profiles[0].chosenNode = 'noorani/Q4'; localStorage.setItem('backyard', JSON.stringify(d)); });
  await arApp.reload();
  await arApp.waitForFunction(() => window.__by?.ready);
  await arApp.click('#play');
  await arApp.waitForSelector('[data-screen="quest"]');
  await arApp.waitForFunction(() => window.__by.arabicVoiced.length > 0 || window.__by.arabic.length > 0, null, { timeout: 4000 });
  check((await arApp.evaluate(() => window.__by.arabicVoiced.length)) === 1, 'the Qaida lesson did not use the Arabic recordings');

  check(!(await (async () => { const p = await ctx.newPage(); await p.goto(`${base}/parent.html`); const c = await p.content(); await p.close(); return c; })()).includes('record-voice.html'), 'the parent area still points to the old recorder page');
  check(errors.length === 0, `page errors: ${errors.join('; ')}`);
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
