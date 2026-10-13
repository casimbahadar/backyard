// Print and Mark flow, driven through the real page in headless Chromium.
// Run: node test-flow-print.mjs   (needs Playwright with a Chromium browser)
// Exit 0 = all checks passed, 1 = a check failed, 2 = the harness itself crashed.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = join(root, 'test-output', 'print-out');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf' };
const failures = [];
let passed = 0;
const check = (ok, msg) => { if (ok) passed++; else failures.push(msg); };

const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const body = await readFile(join(root, path === '/' ? 'parent.html' : path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});

const pdfPages = file => Number(execFileSync('pdfinfo', [file]).toString().match(/Pages:\s+(\d+)/)[1]);
const pdfPageText = (file, n) => execFileSync('pdftotext', ['-f', String(n), '-l', String(n), '-layout', file, '-']).toString();

let browser;
try {
  await mkdir(outDir, { recursive: true });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/parent.html`;
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
  browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [], dialogs = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', d => { dialogs.push(d.message()); d.dismiss(); });
  const evil = '<img src=x onerror=alert(1)>';
  const kid = (id, name) => ({ id, name, grade: 'k', dailyGoal: 3, taughtCount: 32, taughtLocked: false, readWords: [], readLog: {}, attempts: {}, unlocked: [], chosenNode: null, stickers: [], pendingStickers: 0, sheetRewards: [], days: {}, quest: null });
  const seed = { version: 3, sheets: {}, results: {}, profiles: [kid('pe', evil), kid('pt', 'Test child')], activeProfile: 'pt', settings: { pin: '1234', voiceOff: false } };
  await page.addInitScript(v => {
    window.print = () => { window.__printed = (window.__printed ?? 0) + 1; };
    if (!sessionStorage.getItem('seeded')) { localStorage.setItem('backyard', v); sessionStorage.setItem('seeded', '1'); }
  }, JSON.stringify(seed));
  await page.goto(base);
  await page.waitForFunction(() => window.__parentReady === true);
  await page.fill('#pin', '1234');
  await page.click('#pin-go');
  await page.click('[data-tab="print"]');

  const nodes = await page.$$eval('#node option', os => os.map(o => o.value));
  check(nodes.length === 28, `expected 28 skills in the list, found ${nodes.length}`);
  const made = [];

  for (const [i, node] of nodes.entries()) {
    const count = i === 0 ? 6 : 10;
    await page.emulateMedia({ media: 'screen' });
    await page.selectOption('#child', i === 0 ? 'pe' : 'pt');
    await page.selectOption('#node', node);
    await page.selectOption('#count', String(count));
    const printedBefore = await page.evaluate(() => window.__printed ?? 0);
    await page.click('#print-btn');
    await page.waitForFunction(n => (window.__printed ?? 0) > n, printedBefore, { timeout: 10000 }).catch(() => {});
    const status = await page.textContent('#print-status');
    const id = status.match(/W-[0-9A-Z]{4}/)?.[0];
    check(!!id, `${node}: no sheet ID after Print ("${status}")`);
    if (!id) continue;
    check(await page.evaluate(() => window.__printed ?? 0) === printedBefore + 1, `${node}: print dialog not opened`);
    const items = await page.$$eval('#print-area .sheet:not(.key) .item', els => els.length);
    check(items === count, `${node}: sheet has ${items} items, asked for ${count}`);
    const keyAnswers = await page.$$eval('#print-area .key .ans', els => els.map(e => e.textContent.replace(/^Answer: /, '')));
    check(keyAnswers.length === items, `${node}: grown-up page lists ${keyAnswers.length} answers for ${items} items`);
    if (i === 0) {
      check(await page.$('#print-area img') === null, 'child name was turned into an image tag');
      const shown = await page.$eval('#print-area [data-child-name]', el => el.textContent);
      check(shown === evil, 'child name not shown as plain text');
    }

    // Print layout, measured with print styles applied.
    await page.emulateMedia({ media: 'print' });
    const layout = await page.evaluate(() => {
      const px = 96;
      const out = { wide: [], cut: [], tall: [] };
      for (const sheet of document.querySelectorAll('#print-area .sheet')) {
        const s = sheet.getBoundingClientRect();
        if (s.width > 7.5 * px + 1) out.wide.push(`sheet ${s.width.toFixed(0)}px`);
        for (const el of sheet.querySelectorAll('*')) {
          const r = el.getBoundingClientRect();
          if (r.width && (r.right > s.right + 1 || r.left < s.left - 1)) out.wide.push(`${el.className || el.tagName} sticks out`);
        }
        for (const it of sheet.querySelectorAll('.item')) {
          if (it.scrollHeight > it.clientHeight + 1 || it.scrollWidth > it.clientWidth + 1) out.cut.push(it.dataset.kind);
          if (it.getBoundingClientRect().height > 9.4 * px) out.tall.push(it.dataset.kind);
        }
      }
      return out;
    });
    check(layout.wide.length === 0, `${node}: content wider than the page: ${layout.wide.slice(0, 3).join(', ')}`);
    check(layout.cut.length === 0, `${node}: item content clipped: ${layout.cut.slice(0, 3).join(', ')}`);
    check(layout.tall.length === 0, `${node}: an item is taller than a page: ${layout.tall.join(', ')}`);
    const file = join(outDir, `${node.replace('|', '-')}.pdf`);
    await page.pdf({ path: file, format: 'Letter', preferCSSPageSize: true, printBackground: true });
    const pages = pdfPages(file);
    const texts = Array.from({ length: pages }, (_, n) => pdfPageText(file, n + 1));
    const keyPage = texts.findIndex(t => t.includes('Grown-up page'));
    check(texts[0].includes(`Sheet ${id}`) && !texts[0].includes('Grown-up page'), `${node}: page 1 is not the worksheet alone`);
    check(keyPage > 0, `${node}: grown-up page does not start on its own page`);
    check(keyPage === 1, `${node}: the ${count} questions do not fit on one page (grown-up page starts on page ${keyPage + 1})`);
    check(keyPage > 0 && texts[keyPage].includes(`Sheet ${id}`), `${node}: grown-up page is missing the sheet ID`);
    check(texts.slice(0, keyPage).every(t => !t.includes('Answer:')), `${node}: answers printed on the child's pages`);
    made.push({ node, id, count, keyAnswers, pages, keyPage: keyPage + 1, file });
  }

  // Mark each sheet: regenerate from the ID alone and compare with what was printed.
  await page.emulateMedia({ media: 'screen' });
  await page.reload();
  await page.waitForFunction(() => window.__parentReady === true);
  check(await page.$('#pin') === null, 'the PIN was asked again after a reload in the same session');
  await page.click('[data-tab="mark"]');
  for (const s of made) {
    const typed = s.id.replace('W-', '').toLowerCase();
    await page.fill('#mark-id', typed);
    await page.click('#find-btn');
    const answers = await page.$$eval('#mark-list .answer', els => els.map(e => e.textContent));
    check(JSON.stringify(answers) === JSON.stringify(s.keyAnswers), `${s.node}: Mark regenerated different questions from ${s.id}`);
    const rows = await page.$$('#mark-list .mark-row');
    for (const [n, row] of rows.entries()) {
      const btns = await row.$$('.mark-btn');
      await btns[n === rows.length - 1 ? 1 : 0].click();
      if (n < rows.length - 1) check(await page.$eval('#done-btn', b => b.disabled), `${s.node}: Done enabled before every question was marked`);
    }
    check(!(await page.$eval('#done-btn', b => b.disabled)), `${s.node}: Done still disabled after marking all`);
    await page.click('#done-btn');
    const status = await page.textContent('#mark-status');
    check(status.startsWith(`Saved. ${s.count - 1} of ${s.count} right.`), `${s.node}: unexpected save message "${status}"`);
    const stored = await page.evaluate(id => JSON.parse(localStorage.getItem('backyard')).results[id], s.id);
    check(stored && stored.marks.length === s.count && stored.marks.filter(Boolean).length === s.count - 1, `${s.node}: marks not stored correctly`);
    const kidId = s.node === nodes[0] ? 'pe' : 'pt';
    const attempts = await page.evaluate(([id, key]) => JSON.parse(localStorage.getItem('backyard')).profiles.find(p => p.id === id).attempts[key], [kidId, s.node.replace('|', '/')]);
    check(attempts?.some(a => a.source === 'sheet' && a.right === s.count - 1 && a.total === s.count), `${s.node}: the marked sheet did not count for the child`);
  }

  await page.fill('#mark-id', 'W-2222');
  await page.click('#find-btn');
  check((await page.textContent('#mark-status')).startsWith('No sheet W-2222 on this device'), 'unknown sheet ID not reported');
  await page.fill('#mark-id', 'hello');
  await page.click('#find-btn');
  check((await page.textContent('#mark-status')).startsWith('A sheet ID has a W'), 'badly typed ID not explained');

  check(dialogs.length === 0, `a dialog opened: ${dialogs.join('; ')}`);
  check(errors.length === 0, `page errors: ${errors.slice(0, 3).join('; ')}`);

  for (const s of made) console.log(`${s.node}: ${s.id}, ${s.count} items, ${s.pages} pages, grown-up page starts on page ${s.keyPage}`);
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
