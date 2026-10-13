// Parent area, driven through the real parent.html and index.html in headless Chromium.
// Run: node test-parent.mjs   Exit 0 = all checks passed, 1 = a check failed, 2 = crashed.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, 'test-output', 'ui-out');
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
const state = page => page.evaluate(() => JSON.parse(localStorage.getItem('backyard')));

let browser;
try {
  await mkdir(out, { recursive: true });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
  browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => { window.print = () => {}; });

  // A child exists from first run in the yard.
  await page.goto(`${base}/index.html?test`);
  await page.waitForFunction(() => window.__by?.ready);
  await page.fill('#name', 'Ava');
  await page.click('[data-grade="k"]');
  await page.click('#first-play');
  await page.waitForSelector('#play');

  // PIN: set it the first time, then it is asked for in a new session, and a wrong PIN is refused.
  await page.goto(`${base}/parent.html`);
  await page.waitForFunction(() => window.__parentReady);
  await page.screenshot({ path: join(out, 'parent-pin-390.png') });
  await page.fill('#pin', '12');
  await page.click('#pin-go');
  check((await page.textContent('.status')).includes('four numbers'), 'a short PIN was not refused');
  await page.fill('#pin', '4321'); await page.fill('#pin-again', '4320');
  await page.click('#pin-go');
  check((await page.textContent('.status')).includes('different'), 'mismatched PINs were not refused');
  await page.fill('#pin', '4321'); await page.fill('#pin-again', '4321');
  await page.click('#pin-go');
  await page.waitForSelector('#kid-name');
  check((await state(page)).settings.pin === '4321', 'PIN not saved');
  const fresh = await ctx.newPage();
  await fresh.goto(`${base}/parent.html`);
  await fresh.waitForFunction(() => window.__parentReady);
  await fresh.fill('#pin', '0000');
  await fresh.click('#pin-go');
  check((await fresh.textContent('.status')) === 'That PIN is not right.', 'a wrong PIN was not refused');
  check(await fresh.$('#kid-name') === null, 'a wrong PIN opened the area');
  await fresh.close();

  // Kids: set every sound, lock it, change the daily goal, add a second child, then delete them.
  await page.screenshot({ path: join(out, 'parent-kids-390.png'), fullPage: true });
  await page.fill('#kid-taught', '32');
  check(await page.$$eval('.sound.on', e => e.length) === 32, 'the sound list does not show 32 taught sounds');
  await page.check('#kid-lock');
  await page.selectOption('#kid-goal', 'm15');
  await page.click('#kid-save');
  let sm = await state(page);
  check(sm.profiles[0].goalType === 'minutes' && sm.profiles[0].dailyGoal === 15, 'a minutes goal was not saved');
  await page.selectOption('#kid-goal', 'q2');
  await page.click('#kid-save');
  let s = await state(page);
  check(s.profiles[0].taughtCount === 32 && s.profiles[0].taughtLocked && s.profiles[0].dailyGoal === 2 && s.profiles[0].goalType === 'quests', 'Kids changes were not saved');
  await page.fill('#add-name', 'Sam');
  await page.click('#add-kid');
  await page.waitForSelector('#kid');
  check((await state(page)).profiles.length === 2, 'second child not added');
  await page.click('#kid-delete');
  check((await state(page)).profiles.length === 2, 'one tap deleted a child');
  await page.click('#kid-delete');
  await page.waitForSelector('#kid-name');
  s = await state(page);
  check(s.profiles.length === 1 && s.profiles[0].name === 'Ava', 'the second tap did not delete only the new child');

  // Print and mark a sheet for Ava; the reward reaches her yard.
  await page.click('[data-tab="print"]');
  await page.selectOption('#node', 'on-k-math|A6.3');
  await page.selectOption('#count', '8');
  await page.click('#print-btn');
  await page.waitForFunction(() => /W-/.test(document.getElementById('print-status').textContent));
  const id = (await page.textContent('#print-status')).match(/W-[0-9A-Z]{4}/)[0];
  await page.click('[data-tab="mark"]');
  await page.fill('#mark-id', id);
  await page.click('#find-btn');
  const rows = await page.$$('.mark-row');
  for (const [i, row] of rows.entries()) await (await row.$$('.mark-btn'))[i < 7 ? 0 : 1].click();
  await page.click('#done-btn');
  const msg = await page.textContent('#mark-status');
  check(msg.includes('Ava gets 3 stars and a sticker'), `mark message did not promise the reward: "${msg}"`);
  await page.fill('#mark-id', id);
  await page.click('#find-btn');
  for (const row of await page.$$('.mark-row')) await (await row.$$('.mark-btn'))[0].click();
  await page.click('#done-btn');
  check((await page.textContent('#mark-status')).startsWith('Updated.'), 'marking a sheet twice was not treated as an update');
  s = await state(page);
  check(s.profiles[0].sheetRewards.length === 1, `a sheet marked twice queued ${s.profiles[0].sheetRewards.length} rewards`);
  check(s.profiles[0].attempts['on-k-math/A6.3'].length === 1 && s.profiles[0].attempts['on-k-math/A6.3'][0].right === 8, 'the second marking did not replace the first');
  const yard = await ctx.newPage();
  await yard.goto(`${base}/index.html?test`);
  await yard.waitForFunction(() => window.__by?.ready);
  check(await yard.evaluate(() => document.getElementById('app').dataset.screen) === 'sheet-reward', 'the yard did not open on the worksheet reward');
  await yard.waitForSelector('[data-screen="pick"]', { timeout: 8000 });
  await yard.click('.sticker-choice');
  await yard.waitForSelector('[data-screen="place"]');
  const box = await yard.locator('.yard-scene').boundingBox();
  await yard.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.8);
  await yard.waitForSelector('#play', { timeout: 5000 });
  s = await state(yard);
  check(s.profiles[0].sheetRewards.length === 0 && s.profiles[0].stickers.length === 1, 'the worksheet sticker was not placed');

  // Results: weekly summary and a node opened by tap.
  await page.click('[data-tab="results"]');
  const week = await page.$$eval('#week p', e => e.map(x => x.textContent));
  check(week[0] === 'This week: 0 quests, 1 worksheet.', `weekly summary first line was "${week[0]}"`);
  check(week.some(l => l.startsWith('Read and write numbers to 20: 8 of 8')), `weekly summary misses the sheet: ${week.join(' | ')}`);
  await page.click('[data-key="on-k-math/A6.3"]');
  check((await page.textContent('#node-detail')).includes('Last practised'), 'tapping a node did not show when it was last practised');
  await page.screenshot({ path: join(out, 'parent-results-390.png'), fullPage: true });

  // Settings: voice off reaches the child app; backup out and back in; clear needs two taps.
  await page.click('[data-tab="settings"]');
  await page.uncheck('#voice');
  check((await state(page)).settings.voiceOff === true, 'voice setting not saved');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#export')]);
  const file = join(out, 'backup.json');
  await download.saveAs(file);
  const backup = JSON.parse(await readFile(file, 'utf8'));
  check(backup.version === 3 && backup.profiles[0].name === 'Ava' && backup.sheets[id], 'backup file is missing data');
  const v1 = join(out, 'old-backup.json');
  await writeFile(v1, JSON.stringify({ version: 1, sheets: { 'W-2345': { id: 'W-2345' } }, results: {} }));
  await page.setInputFiles('#import', v1);
  await page.waitForFunction(() => /Backup loaded|not a Backyard/.test(document.getElementById('settings-status').textContent));
  s = await state(page);
  check(s.version === 3 && s.sheets['W-2345'] && s.settings.pin === '4321', 'an old backup did not load, or loading it lost the PIN');
  await page.setInputFiles('#import', file);
  await page.waitForFunction(() => /Backup loaded/.test(document.getElementById('settings-status').textContent));
  check((await state(page)).profiles.length === 1, 'restoring the backup did not bring Ava back');
  const bad = join(out, 'bad.json');
  await writeFile(bad, '{"hello": 1');
  await page.setInputFiles('#import', bad);
  await page.waitForFunction(() => /not a Backyard backup/.test(document.getElementById('settings-status').textContent));
  check((await state(page)).profiles.length === 1, 'a broken file changed the saved data');
  await page.click('#clear');
  check((await state(page)).profiles.length === 1, 'one tap cleared all data');
  await page.click('#clear');
  await page.waitForSelector('#pin');
  s = await state(page);
  check(s.profiles.length === 0 && s.settings.pin === null, 'clearing did not remove everything');

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
