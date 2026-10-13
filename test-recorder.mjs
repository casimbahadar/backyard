// The one-time sound recorder, with Chromium's fake microphone (a steady tone).
// Run: node test-recorder.mjs   Exit 0 = passed, 1 = a check failed, 2 = crashed.
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

let browser;
try {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
  browser = await chromium.launch({ args: ['--no-sandbox', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true, permissions: ['microphone'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}/record-sounds.html`);
  await page.waitForFunction(() => window.__recorderReady);
  check((await page.textContent('#progress')) === '0 of 28 sounds recorded.', 'the recorder does not list 28 sounds');
  const app = await (await ctx.newPage());
  await app.goto(`${base}/parent.html`);
  check(!(await app.content()).includes('record-sounds'), 'the parent area links to the recorder');
  await app.close();

  await page.click('.rec-row[data-phoneme="m"] .rec');
  await page.waitForFunction(() => /Kept \/m\//.test(document.getElementById('status').textContent), null, { timeout: 8000 });
  check((await page.textContent('#progress')) === '1 of 28 sounds recorded.', 'the recording did not count');
  check(await page.$eval('.rec-row[data-phoneme="m"] .rec', b => b.textContent) === 'Redo', 'the recorded sound does not offer Redo');
  const clip = await page.evaluate(() => JSON.parse(localStorage.getItem('backyard-recorder')).m);
  check(clip.startsWith('data:audio/wav;base64,'), 'the clip is not stored as WAV');
  const seconds = await page.evaluate(async src => {
    const bytes = Uint8Array.from(atob(src.split(',')[1]), c => c.charCodeAt(0));
    return (await new AudioContext().decodeAudioData(bytes.buffer)).duration;
  }, clip);
  check(seconds > 0.3 && seconds < 2.2, `the clip lasts ${seconds.toFixed(2)} s, outside 0.3 to 2.2 s`);
  const silent = await page.evaluate(async () => (await import('./record-sounds.js')).trim(new Array(22050).fill(0.001), 22050));
  check(silent === null, 'silence was kept as a clip');

  await page.reload();
  await page.waitForFunction(() => window.__recorderReady);
  check((await page.textContent('#progress')) === '1 of 28 sounds recorded.', 'the recording did not survive a reload');

  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#export')]);
  const file = join(root, 'test-output', 'ui-out', 'clips-export.json');
  await download.saveAs(file);
  const bundle = JSON.parse(await readFile(file, 'utf8'));
  check(bundle.version === 1 && Object.keys(bundle.clips).join() === 'm', 'the saved clips.json has the wrong shape');
  check((await page.textContent('#status')).includes('27 sounds are still missing'), 'saving early did not say what is missing');

  // The saved file, dropped in as clips.json, is picked up by the app.
  const p2 = await ctx.newPage();
  await p2.route('**/clips.json', r => r.fulfill({ path: file }));
  await p2.addInitScript(() => { localStorage.setItem('backyard', JSON.stringify({ version: 3, sheets: {}, results: {}, profiles: [], activeProfile: null, settings: { pin: '1234', voiceOff: false } })); sessionStorage.setItem('backyard-parent', 'open'); });
  await p2.goto(`${base}/parent.html`);
  await p2.waitForFunction(() => window.__parentReady);
  await p2.click('[data-tab="settings"]');
  await p2.waitForFunction(() => /letter sounds are ready/.test(document.getElementById('sounds-status').textContent));
  check((await p2.textContent('#sounds-status')).startsWith('1 of 28'), 'the app did not count the exported sound');

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
