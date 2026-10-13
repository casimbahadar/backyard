// Child flow, driven through the real index.html in headless Chromium.
// Run: node test-flow.mjs   (needs Playwright with a Chromium browser)
// Exit 0 = all checks passed, 1 = a check failed, 2 = the harness itself crashed.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const shots = join(root, 'test-output', 'flow-out');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf' };
const failures = [];
const report = [];
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

let browser, url;
async function open(seed) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.errors = [];
  page.dialogs = [];
  page.taps = 0;
  page.on('pageerror', e => page.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') page.errors.push(m.text()); });
  page.on('dialog', d => { page.dialogs.push(d.message()); d.dismiss(); });
  if (seed) await context.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('backyard', s); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(seed));
  await page.goto(url);
  await page.waitForFunction(() => window.__by?.ready === true);
  return page;
}
async function tap(page, sel) { page.taps++; await page.click(sel); }
const screen = page => page.evaluate(() => document.getElementById('app').dataset.screen);
const state = page => page.evaluate(() => JSON.parse(localStorage.getItem('backyard')));

async function answer(page, correct) {
  const before = await page.evaluate(() => ({ key: window.__by.item.key, idx: document.querySelectorAll('.pip.done').length }));
  const item = await page.evaluate(() => window.__by.item);
  if (item.template === 'spell-cvc') {
    const order = correct ? item.answer : [...item.answer].reverse();
    if (!correct && order.join('') === item.answer.join('')) order.splice(0, 1, item.distractors[0]);
    const used = new Set();
    for (const t of order) {
      const i = item.tiles.findIndex((x, k) => x === t && !used.has(k));
      used.add(i);
      await tap(page, `.tiles button:nth-child(${i + 1})`);
    }
    await tap(page, '#spell-check');
  } else {
    const right = await page.evaluate(() => window.__by.answerIndex);
    const pick = correct ? right : (right + 1) % item.choices.length;
    await tap(page, `[data-choice="${pick}"]`);
  }
  await page.waitForFunction(b => document.getElementById('app').dataset.screen !== 'quest'
    || document.querySelectorAll('.pip.done').length > b.idx, before, { timeout: 8000 });
}

async function playQuest(page, wrongAt = []) {
  for (let i = 0; i < 8; i++) await answer(page, !wrongAt.includes(i));
  await page.waitForFunction(() => ['pick', 'quest-end'].includes(document.getElementById('app').dataset.screen) && document.querySelectorAll('.stars .star').length === 3, null, { timeout: 8000 });
}

async function placeAt(page, fx, fy) {
  const box = await page.locator('.yard-scene').boundingBox();
  const x = box.x + box.width * fx, y = box.y + box.height * fy;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(x, y, { steps: 6 });
  await page.mouse.up();
  page.taps++;
}

try {
  await mkdir(shots, { recursive: true });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  url = `http://127.0.0.1:${server.address().port}/index.html?test`;
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
  browser = await chromium.launch({ args: ['--no-sandbox'] });

  // 1. First run, then a returning child: taps from launch to the first question.
  const page = await open();
  check(await screen(page) === 'first-run', 'a new device does not open on first run');
  await page.screenshot({ path: join(shots, '1-first-run.png') });
  await page.fill('#name', '<img src=x onerror=alert(1)>');
  await tap(page, '[data-grade="k"]');
  await tap(page, '#first-play');
  await page.waitForSelector('#play');
  await page.screenshot({ path: join(shots, '2-yard-empty.png') });
  await tap(page, '#play');
  await page.waitForSelector('[data-screen="quest"]');
  report.push(`first run: ${page.taps} taps to the first question, plus typing the name`);
  check(page.taps <= 3, `first run took ${page.taps} taps to the first question (was 3)`);
  check(await page.$('img') === null, 'child name became an image tag');
  await page.screenshot({ path: join(shots, '3-quest.png') });
  const s0 = await state(page);
  check(s0.profiles.length === 1 && s0.profiles[0].taughtCount === 4, 'profile not created with the pack start of 4 sounds');

  // 2. Perfect quest: three stars, shiny sticker, placed by dragging.
  await playQuest(page);
  check(await page.$$eval('.stars .star.on', e => e.length) === 3, 'perfect quest did not give 3 stars');
  await page.waitForSelector('[data-screen="pick"]', { timeout: 8000 });
  check(await page.$$eval('.sticker-choice', e => e.length) === 3, 'not three stickers to pick from');
  check(await page.$$eval('.sticker-choice .sticker.shiny', e => e.length) === 3, 'perfect quest stickers are not shiny');
  await page.screenshot({ path: join(shots, '4-pick.png') });
  const picked = await page.$eval('.sticker-choice', b => b.dataset.sticker);
  await tap(page, '.sticker-choice');
  await page.waitForSelector('[data-screen="place"]');
  await placeAt(page, 0.7, 0.75);
  await page.waitForSelector('#play', { timeout: 5000 });
  let s1 = await state(page);
  const st = s1.profiles[0].stickers[0];
  check(st && st.id === picked && st.shiny && Math.abs(st.x - 70) < 2 && Math.abs(st.y - 75) < 2, `sticker not placed where dropped: ${JSON.stringify(st)}`);

  // 3. Returning child: reload and count taps again.
  await page.reload();
  await page.waitForFunction(() => window.__by?.ready === true);
  page.taps = 0;
  check(await page.$$eval('.yard-scene .placed', e => e.length) === 1, 'placed sticker missing after reload');
  await page.screenshot({ path: join(shots, '5-yard-one-sticker.png') });
  await tap(page, '#play');
  await page.waitForSelector('[data-screen="quest"]');
  report.push(`returning child: ${page.taps} tap to the first question`);
  check(page.taps <= 2, `returning child took ${page.taps} taps (target 2)`);

  // 4. Wrong answers: the right one is shown and said; three wrong gives 2 stars.
  const firstItem = await page.evaluate(() => window.__by.item);
  await answer(page, false);
  const spoken = await page.evaluate(() => window.__by.spoken);
  check(spoken.some(t => t.startsWith('It is ')), 'a wrong answer was not followed by saying the right one');
  for (let i = 1; i < 8; i++) await answer(page, ![1, 2].includes(i));
  await page.waitForFunction(() => document.querySelectorAll('.stars .star').length === 3, null, { timeout: 8000 });
  check(await page.$$eval('.stars .star.on', e => e.length) === 2, '5 of 8 right did not give 2 stars');
  // 5 of 8 is under 70%: no sticker, a Try again button, and it does not count toward the goal.
  await page.waitForSelector('#again', { timeout: 8000 });
  check(await page.$('[data-screen="pick"]') === null, '5 of 8 right still gave a sticker');
  check((await page.textContent('#end-line')).includes('Get six right to earn a sticker'), 'the end line did not say how many to get right');
  check(Object.values((await state(page)).profiles[0].days)[0].quests === 1, 'a quest under 70% counted toward the daily goal');
  await tap(page, '#again');
  await page.waitForSelector('[data-screen="quest"]');
  // 6 of 8 is enough: a sticker, not shiny.
  for (let i = 0; i < 8; i++) await answer(page, ![1, 2].includes(i));
  await page.waitForSelector('[data-screen="pick"]', { timeout: 8000 });
  check(await page.$$eval('.sticker-choice .sticker.shiny', e => e.length) === 0, 'imperfect quest gave a shiny sticker');
  await tap(page, '.sticker-choice');
  await page.waitForSelector('[data-screen="place"]');
  await placeAt(page, 0.25, 0.8);
  await page.waitForSelector('#play', { timeout: 5000 });

  // 5. Resume: answer three, reload, land on the same fourth question.
  await tap(page, '#play');
  await page.waitForSelector('[data-screen="quest"]');
  for (let i = 0; i < 3; i++) await answer(page, true);
  const beforeKey = await page.evaluate(() => window.__by.item.key);
  await page.reload();
  await page.waitForFunction(() => window.__by?.ready === true);
  check(await screen(page) === 'quest', 'reload mid-quest did not reopen the quest');
  check(await page.$$eval('.pip.done', e => e.length) === 3, 'resume did not keep the three answered questions');
  check(await page.evaluate(() => window.__by.item.key) === beforeKey, 'resume showed a different question');

  // 6. Daily goal: the third quest ends with the goal moment; the fourth earns no sticker.
  for (let i = 3; i < 8; i++) await answer(page, true);
  await page.waitForSelector('[data-screen="pick"]', { timeout: 8000 });
  await tap(page, '.sticker-choice');
  await page.waitForSelector('[data-screen="place"]');
  await placeAt(page, 0.5, 0.6);
  await page.waitForSelector('[data-screen="goal"]', { timeout: 5000 });
  await page.screenshot({ path: join(shots, '6-goal.png') });
  await tap(page, '#goal-ok');
  await page.waitForSelector('#play');
  check(await page.$$eval('.goal .dot.done', e => e.length) === 3, 'yard does not show three quests done');
  await tap(page, '#play');
  await page.waitForSelector('[data-screen="quest"]');
  await playQuest(page);
  await page.waitForSelector('#back', { timeout: 8000 });
  check(await page.$('[data-screen="pick"]') === null, 'a quest after the daily goal still offered a sticker');
  check((await page.textContent('#end-line')).includes("That's all the stickers for today"), 'no plain line saying stickers are done for today');
  await page.screenshot({ path: join(shots, '7-after-goal.png') });
  s1 = await state(page);
  const p1 = s1.profiles[0];
  check(p1.stickers.length === 3, `expected 3 stickers after the goal, found ${p1.stickers.length}`);
  check(Object.values(p1.attempts).flat().length === 5, 'not every quest was recorded as an attempt (the one under 70% still counts for learning)');
  check(page.dialogs.length === 0 && page.errors.length === 0, `errors or dialogs: ${[...page.errors, ...page.dialogs].join('; ')}`);
  await page.context().close();

  // 7. Two profiles: the picker shows both, one tap picks and says the name.
  const two = { version: 2, sheets: {}, results: {}, activeProfile: null, profiles: [
    { ...p1, id: 'pa', name: 'Ava', quest: null }, { ...p1, id: 'pb', name: 'Sam', quest: null, stickers: [] }] };
  const pp = await open(two);
  check(await screen(pp) === 'picker', 'two profiles did not open the picker');
  check(await pp.$$eval('.face', e => e.length) === 2, 'picker does not show two faces');
  await tap(pp, '.face:nth-child(2)');
  await pp.waitForSelector('#play');
  check((await pp.evaluate(() => window.__by.spoken)).includes('Sam'), 'picking a face did not say the name');
  await tap(pp, '#play');
  await pp.waitForSelector('[data-screen="quest"]');
  report.push(`two profiles: ${pp.taps} taps to the first question`);
  check(pp.taps <= 2, `two profiles took ${pp.taps} taps to the first question`);
  await pp.context().close();

  // 8. Saved data from milestone 3 (version 1) still opens, and its sheets survive.
  const v1 = { version: 1, sheets: { 'W-2345': { id: 'W-2345', packName: 'on-k-math', code: 'A6.3', count: 6, child: { name: '', taughtCount: 32, readWords: [] } } }, results: {} };
  const pm = await open(v1);
  check(await screen(pm) === 'first-run', 'version 1 data did not open first run');
  await pm.fill('#name', 'Ava');
  await tap(pm, '[data-grade="1"]');
  await tap(pm, '#first-play');
  await pm.waitForSelector('#play');
  const sm = await state(pm);
  check(sm.version === 3 && sm.sheets['W-2345'] && sm.profiles.length === 1, 'migration from version 1 lost data');
  check(pm.errors.length === 0, `errors after migration: ${pm.errors.join('; ')}`);
  await pm.context().close();

  // 9. Reading: a right answer to a printed word is logged toward "can read it", and
  // the question shows the word and drawn pictures, never an empty frame.
  const pr = await open({ version: 3, sheets: {}, results: {}, activeProfile: 'pr', settings: { pin: null, voiceOff: false, theme: 'bright' },
    profiles: [{ ...p1, id: 'pr', name: 'Ava', quest: null, taughtCount: 32, readWords: [], readLog: {}, chosenNode: 'on-k-language/A2.5', days: {} }] });
  await tap(pr, '#play');
  await pr.waitForSelector('[data-screen="quest"]');
  const ri = await pr.evaluate(() => window.__by.item);
  check(ri.template === 'read-cvc' && (await pr.textContent('.stage.reading')) === ri.read, 'the reading question does not show its word');
  check(await pr.$$eval('.choice.pic svg.picture', e => e.length) === 3, 'the reading question does not show three drawn pictures');
  await answer(pr, true);
  const rs = await state(pr);
  check((rs.profiles[0].readLog[ri.answer] ?? []).length === 1, 'a right reading answer was not logged toward reading the word');
  check(pr.errors.length === 0, `errors in a reading quest: ${pr.errors.join('; ')}`);
  await pr.context().close();

  // 10. A minutes goal: time on questions counts, and the goal moment comes when it is reached.
  const pmin = await open({ version: 3, sheets: {}, results: {}, activeProfile: 'pm', settings: { pin: null, voiceOff: false, theme: 'bright' },
    profiles: [{ ...p1, id: 'pm', name: 'Ava', quest: null, days: {}, stickers: [], goalType: 'minutes', dailyGoal: 1, chosenNode: 'on-k-math/A6.3' }] });
  await pmin.clock.install();
  await pmin.reload();
  await pmin.clock.runFor(500);
  await pmin.waitForFunction(() => window.__by?.ready === true);
  check((await pmin.getAttribute('.goal', 'aria-label')) === '0 of 1 minutes today', 'a minutes goal does not show as minutes');
  await pmin.click('#play');
  for (let i = 0; i < 8; i++) {
    await pmin.clock.runFor(10000);
    await pmin.click(`[data-choice="${await pmin.evaluate(() => window.__by.answerIndex)}"]`);
    await pmin.clock.runFor(i === 7 ? 50 : 400);
  }
  await pmin.clock.runFor(2500);
  await pmin.click('.sticker-choice');
  await pmin.clock.runFor(500);
  await placeAt(pmin, 0.4, 0.7);
  await pmin.clock.runFor(400);
  check(await screen(pmin) === 'goal', 'reaching a minutes goal did not show the goal moment');
  const ms = await state(pmin);
  const secs = Object.values(ms.profiles[0].days)[0].seconds;
  check(secs >= 78 && secs <= 82, `eight questions at ten seconds counted ${secs} seconds, not about 80`);
  await pmin.context().close();

  // 11. Spelling: a mis-tapped letter comes back out when tapped, and nothing is checked
  // until the tick.
  const ps = await open({ version: 3, sheets: {}, results: {}, activeProfile: 'ps', settings: { pin: null, voiceOff: false, theme: 'bright' },
    profiles: [{ ...p1, id: 'ps', name: 'Ava', quest: null, days: {}, stickers: [], taughtCount: 32, chosenNode: 'on-1-language/B2.4', grade: '1' }] });
  await ps.click('#play');
  await ps.waitForSelector('[data-screen="quest"]');
  for (let n = 0; n < 2 && (await ps.evaluate(() => window.__by.item.template)) !== 'spell-cvc'; n++) {
    await ps.click(`[data-choice="${await ps.evaluate(() => window.__by.answerIndex)}"]`);
    await ps.waitForFunction(k => document.querySelectorAll('.pip.done').length === k, n + 1, { timeout: 8000 });
  }
  const sp = await ps.evaluate(() => window.__by.item);
  const at = await ps.evaluate(() => document.querySelectorAll('.pip.done').length);
  check(sp.template === 'spell-cvc', 'no spelling question to test undo on');
  const tileOf = (t, used) => sp.tiles.findIndex((x, j) => x === t && !used.has(j));
  const usedT = new Set();
  const wrongTile = sp.tiles.findIndex(x => !sp.answer.includes(x));
  await ps.click(`.tiles button:nth-child(${wrongTile + 1})`);
  check((await ps.textContent('[data-slot="0"]')) === sp.tiles[wrongTile], 'the tapped letter did not go into the first box');
  await ps.click('[data-slot="0"]');
  check((await ps.textContent('[data-slot="0"]')) === '' && !(await ps.$eval(`.tiles button:nth-child(${wrongTile + 1})`, b => b.disabled)), 'tapping the letter in the box did not take it back out');
  for (const t of sp.answer) { const k = tileOf(t, usedT); usedT.add(k); await ps.click(`.tiles button:nth-child(${k + 1})`); }
  check(await ps.$eval('#spell-check', b => !b.hidden), 'the tick did not appear when every box was full');
  check((await ps.evaluate(() => document.querySelectorAll('.pip.done').length)) === at, 'spelling was checked before the tick was tapped');
  await ps.click('#spell-check');
  await ps.waitForFunction(k => document.querySelectorAll('.pip.done').length === k + 1, at, { timeout: 8000 });
  const sAns = (await state(ps)).profiles[0].quest.answers;
  check(sAns[at] === true, 'a word spelled right after an undo was not marked right');
  check(ps.errors.length === 0, `errors while spelling: ${ps.errors.join('; ')}`);
  await ps.context().close();

  // 12. Noorani Qaida: switched on for a child, a lesson 1 quest shows Arabic letters and
  // reads the letter name in the Arabic voice after the English instruction.
  const pn = await open({ version: 3, sheets: {}, results: {}, activeProfile: 'pn', settings: { pin: null, voiceOff: false, theme: 'bright' },
    profiles: [{ ...p1, id: 'pn', name: 'Ava', quest: null, days: {}, stickers: [], noorani: true, chosenNode: 'noorani/Q1' }] });
  await pn.click('#play');
  await pn.waitForSelector('[data-screen="quest"]');
  const ai = await pn.evaluate(() => window.__by.item);
  check(ai.template === 'arabic' && (await pn.$$eval('.choice.arabic', e => e.map(x => x.textContent))).includes(ai.answer), 'the Arabic lesson did not show Arabic letters');
  await pn.waitForFunction(() => window.__by.arabic.length > 0, null, { timeout: 4000 });
  check((await pn.evaluate(() => window.__by.arabic[0])) === ai.prompt.arabic, 'the Arabic letter name was not read');
  check(pn.errors.length === 0, `errors in the Arabic lesson: ${pn.errors.join('; ')}`);
  await pn.context().close();

  // 12b. Books, album and seasons.
  const pb = await open({ version: 3, sheets: {}, results: {}, activeProfile: 'pb', settings: { pin: null, voiceOff: false, theme: 'bright' },
    profiles: [{ ...p1, id: 'pb', name: 'Ava', quest: null, days: {}, taughtCount: 20, stickers: [{ id: 'cat', x: 30, y: 70 }, { id: 'fanoos', x: 50, y: 60, scene: 'ramadan' }] }] });
  await pb.click('#books');
  await pb.waitForSelector('[data-screen="books"]');
  const openBooks = await pb.$$eval('.book:not(.locked)', e => e.map(x => x.dataset.book));
  check(openBooks.join() === 'dog,bus', `with 20 sounds the open books should be Dot the Dog and The Red Bus, found ${openBooks.join()}`);
  await pb.screenshot({ path: join(shots, 'books.png') });
  await pb.click('[data-book="dog"]');
  check((await pb.$$eval('#page-text .word-btn', e => e.map(x => x.textContent).join(' '))) === 'I see a dog.', 'the first page is wrong');
  await pb.click('#page-text .word-btn:last-child');
  check((await pb.evaluate(() => window.__by.spoken.at(-1))) === 'dog', 'tapping a word did not read it');
  await pb.screenshot({ path: join(shots, 'book-page.png') });
  for (let i = 0; i < 5; i++) await pb.click('#page-next');
  await pb.waitForSelector('[data-screen="books"]');
  check(!!(await state(pb)).profiles[0].booksRead?.dog, 'finishing a book was not saved');
  check(await pb.$('[data-book="dog"].read') !== null, 'the finished book is not marked on the shelf');
  await pb.click('.back-small');
  await pb.click('#album');
  await pb.waitForSelector('[data-screen="album"]');
  check((await pb.textContent('#album-count')) === '2 of 271 stickers', `the album count is wrong: ${await pb.textContent('#album-count')}`);
  check((await pb.$$eval('.slot-sticker.got', e => e.map(x => x.dataset.album))).sort().join() === 'cat,fanoos', `the album did not colour the stickers she has: ${await pb.$$eval('.slot-sticker.got', e => e.map(x => x.dataset.album).join())}`);
  await pb.screenshot({ path: join(shots, 'album.png') });
  await pb.click('.back-small');
  // Out of season, Ramadan night shows only because she already has a sticker there; the
  // birthday party shows only in her birthday week.
  await pb.evaluate(() => { window.__by.seasons = []; });
  await pb.click('#places');
  check(await pb.$('[data-place="ramadan"]') !== null && await pb.$('[data-place="party"]') === null, 'seasonal places did not follow the rules out of season');
  await pb.evaluate(() => { window.__by.seasons = ['birthday']; });
  await pb.click('[data-place="yard"]');
  await pb.click('#places');
  check(await pb.$('[data-place="party"]') !== null, 'the birthday party place did not appear in the birthday week');
  check(pb.errors.length === 0, `errors in books or album: ${pb.errors.join('; ')}`);
  await pb.context().close();

  // 13. Sticker editing: pick one up, resize it, move it behind, drag it, put it down.
  const pe = await open({ version: 3, sheets: {}, results: {}, activeProfile: 'pe', settings: { pin: null, voiceOff: false, theme: 'bright' },
    profiles: [{ ...p1, id: 'pe', name: 'Ava', quest: null, days: {}, stickers: [{ id: 'cat', x: 30, y: 70 }, { id: 'dog', x: 60, y: 70 }] }] });
  await pe.click('.placed[data-sticker="dog"]');
  check(await pe.$('#st-bigger') !== null && await pe.$('#play') === null, 'tapping a sticker did not show the sticker tools');
  await pe.click('#st-bigger'); await pe.click('#st-bigger');
  await pe.click('#st-back');
  let es = await state(pe);
  check(es.profiles[0].stickers[0].id === 'dog' && es.profiles[0].stickers[0].size === 1.4, `resize and send back did not save: ${JSON.stringify(es.profiles[0].stickers)}`);
  check(await pe.$eval('.yard-scene .placed', n => n.dataset.sticker) === 'dog', 'the sticker sent back is not drawn first');
  const sb = await pe.locator('.yard-scene').boundingBox();
  const db = await pe.locator('.placed[data-sticker="dog"]').boundingBox();
  await pe.mouse.move(db.x + db.width / 2, db.y + db.height / 2); await pe.mouse.down();
  await pe.mouse.move(sb.x + sb.width * 0.5, sb.y + sb.height * 0.4, { steps: 6 }); await pe.mouse.up();
  es = await state(pe);
  check(Math.abs(es.profiles[0].stickers[0].x - 50) < 3 && Math.abs(es.profiles[0].stickers[0].y - 40) < 3, `dragging did not move the sticker: ${es.profiles[0].stickers[0].x}, ${es.profiles[0].stickers[0].y}`);
  await pe.click('#st-done');
  check(await pe.$('#play') !== null, 'Done did not bring Play back');
  // Places: each has its own stickers.
  await pe.click('#places');
  await pe.waitForSelector('[data-screen="places"]');
  check(await pe.$$eval('.place-btn', e => e.length) === 8, 'the places chooser does not show 8 places');
  await pe.click('[data-place="beach"]');
  await pe.waitForSelector('#play');
  check(await pe.$$eval('.yard-scene .placed', e => e.length) === 0, 'yard stickers showed on the beach');
  check((await state(pe)).profiles[0].scene === 'beach', 'the chosen place was not saved');
  await pe.click('#places');
  await pe.click('[data-place="yard"]');
  await pe.waitForSelector('#play');
  check(await pe.$$eval('.yard-scene .placed', e => e.length) === 2, 'the yard lost its stickers after visiting the beach');
  check(pe.errors.length === 0, `errors while editing stickers: ${pe.errors.join('; ')}`);
  await pe.context().close();

  // 14. Practice share in a scripted ten-minute session on a fake clock.
  // Dwell times are the script's assumptions: 7 s per question, 3 s choosing a
  // sticker, 4 s placing it, 3 s in the yard before Play. The app's own waits run as they are.
  const pt = await open();
  await pt.clock.install();
  await pt.reload();
  await pt.clock.runFor(500);
  await pt.waitForFunction(() => window.__by?.ready === true);
  await pt.fill('#name', 'Ava');
  await pt.click('[data-grade="k"]');
  await pt.click('#first-play');
  const t0 = await pt.evaluate(() => performance.now());
  let quests = 0;
  while ((await pt.evaluate(() => performance.now())) - t0 < 600000) {
    await pt.clock.runFor(3000);
    await pt.click('#play');
    await pt.clock.runFor(50);
    for (let i = 0; i < 8; i++) {
      await pt.clock.runFor(7000);
      const item = await pt.evaluate(() => window.__by.item);
      if (item.template === 'spell-cvc') {
        const used = new Set();
        for (const t of item.answer) { const k = item.tiles.findIndex((x, j) => x === t && !used.has(j)); used.add(k); await pt.click(`.tiles button:nth-child(${k + 1})`); }
        await pt.click('#spell-check');
      } else await pt.click(`[data-choice="${await pt.evaluate(() => window.__by.answerIndex)}"]`);
      await pt.clock.runFor(i === 7 ? 50 : 400);
    }
    await pt.clock.runFor(2000);
    quests++;
    if (await screen(pt) === 'pick') {
      await pt.clock.runFor(3000);
      await pt.click('.sticker-choice');
      await pt.clock.runFor(4000);
      await placeAt(pt, 0.3 + (quests % 5) * 0.1, 0.7);
      await pt.clock.runFor(400);
      if (await screen(pt) === 'goal') { await pt.clock.runFor(1000); await pt.click('#goal-ok'); }
    } else {
      await pt.clock.runFor(1000);
      await pt.click('#back');
    }
    await pt.clock.runFor(50);
  }
  const screens = await pt.evaluate(() => window.__by.screens);
  const end = await pt.evaluate(() => performance.now());
  let inQuest = 0;
  for (let i = 0; i < screens.length; i++) {
    const s = screens[i];
    if (s.t < t0) continue;
    const next = screens[i + 1]?.t ?? end;
    if (s.name === 'quest') inQuest += next - s.t;
  }
  const share = inQuest / (end - t0);
  report.push(`practice share: ${(share * 100).toFixed(1)}% of ${((end - t0) / 60000).toFixed(1)} minutes in questions, ${quests} quests`);
  check(share >= 0.7, `practice share ${(share * 100).toFixed(1)}% is under 70%`);
  await pt.context().close();

  for (const r of report) console.log(r);
  console.log(`checks passed: ${passed}, failed: ${failures.length}`);
  for (const f of failures) console.log(`FAIL ${f}`);
  await browser.close();
  server.close();
  process.exit(failures.length ? 1 : 0);
} catch (err) {
  console.log(`DID NOT COMPLETE: ${err.stack}`);
  for (const r of report) console.log(r);
  await browser?.close();
  server.close();
  process.exit(2);
}
