// Runs the avoid-ai-ui-tells audit (test-ui-tell-audit.js, copied from the skills
// kit) on the real screens at 390, 320 and 1280px, and saves screenshots.
// Run: node test-ui-audit.mjs   Exit 0 = every screen at 0 or 1 slop categories
// and no quality findings, 1 = findings, 2 = the harness itself crashed.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = join(root, 'test-output', 'ui-out');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const body = await readFile(join(root, path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});

const profile = (extra = {}) => ({
  id: 'pa', name: 'Ava', grade: 'k', dailyGoal: 3, taughtCount: 32, readWords: [], readLog: {}, attempts: {}, unlocked: [],
  chosenNode: null, stickers: [
    { id: 'sunflower', shiny: false, x: 22, y: 78 }, { id: 'bunny', shiny: true, x: 64, y: 82 }, { id: 'ladybug', shiny: false, x: 80, y: 70 }],
  pendingStickers: 0, days: {}, quest: null, ...extra
});
const store = p => ({ version: 3, sheets: {}, results: {}, profiles: [p], activeProfile: p.id, settings: { pin: null, voiceOff: false, theme: 'bright' } });

const SCREENS = [
  { name: 'first-run', seed: null, drive: async () => {} },
  { name: 'yard', seed: store(profile()), drive: async () => {} },
  { name: 'quest-pattern', seed: store(profile({ chosenNode: 'on-k-math/A7.4' })), drive: async p => { await p.click('#play'); await p.waitForSelector('[data-screen="quest"]'); } },
  { name: 'quest-count', seed: store(profile({ chosenNode: 'on-k-math/A6.3' })), drive: async p => { await p.click('#play'); await p.waitForSelector('[data-screen="quest"]'); } },
  { name: 'quest-spell', seed: store(profile({ chosenNode: 'on-1-language/B2.4', grade: '1' })), drive: async p => { await p.click('#play'); await p.waitForSelector('[data-screen="quest"]'); await p.click('[data-choice="' + (await p.evaluate(() => window.__by.answerIndex)) + '"]'); await p.waitForFunction(() => document.querySelectorAll('.pip.done').length === 1); } },
  { name: 'quest-read', seed: store(profile({ chosenNode: 'on-k-language/A2.5' })), drive: async p => { await p.click('#play'); await p.waitForSelector('[data-screen="quest"]'); } },
  { name: 'quest-sentence', seed: store(profile({ chosenNode: 'on-k-language/A2.6' })), drive: async p => { await p.click('#play'); await p.waitForSelector('[data-screen="quest"]'); } },
  { name: 'quest-tens', seed: store(profile({ chosenNode: 'on-1-math/B1.1', grade: '1' })), drive: async p => { await p.click('#play'); await p.waitForSelector('[data-screen="quest"]'); } },
  { name: 'quest-skip', seed: store(profile({ chosenNode: 'on-1-math/B1.5', grade: '1' })), drive: async p => { await p.click('#play'); await p.waitForSelector('[data-screen="quest"]'); await p.click('[data-choice="' + (await p.evaluate(() => window.__by.answerIndex)) + '"]'); await p.waitForFunction(() => document.querySelectorAll('.pip.done').length === 1); } },
  { name: 'quest-belongs', seed: store(profile({ chosenNode: 'on-1-math/E1.1', grade: '1' })), drive: async p => { await p.click('#play'); await p.waitForSelector('[data-screen="quest"]'); } },
  { name: 'quest-measure', seed: store(profile({ chosenNode: 'on-1-math/E2.2', grade: '1' })), drive: async p => { await p.click('#play'); await p.waitForSelector('[data-screen="quest"]'); } },
  { name: 'quest-money', seed: store(profile({ chosenNode: 'on-1-math/F1.1', grade: '1' })), drive: async p => { await p.click('#play'); await p.waitForSelector('[data-screen="quest"]'); } },
  { name: 'quest-fix', seed: store(profile({ chosenNode: 'on-1-language/B3.3', grade: '1', taughtCount: 37 })), drive: async p => { await p.click('#play'); await p.waitForSelector('[data-screen="quest"]'); } },
  { name: 'quest-sight', seed: store(profile({ chosenNode: 'on-1-language/B2.8', grade: '1', taughtCount: 37 })), drive: async p => { await p.click('#play'); await p.waitForSelector('[data-screen="quest"]'); await p.click('[data-choice="' + (await p.evaluate(() => window.__by.answerIndex)) + '"]'); await p.waitForFunction(() => document.querySelectorAll('.pip.done').length === 1); } },
  { name: 'pick', seed: store(profile({ chosenNode: 'on-k-math/A9.1' })), drive: async p => {
    await p.click('#play');
    for (let i = 0; i < 8; i++) {
      await p.waitForSelector('[data-screen="quest"] [data-choice]');
      const n = await p.$$eval('.pip.done', e => e.length);
      await p.click(`[data-choice="${await p.evaluate(() => window.__by.answerIndex)}"]`);
      await p.waitForFunction(k => document.getElementById('app').dataset.screen !== 'quest' || document.querySelectorAll('.pip.done').length > k, n);
    }
    await p.waitForSelector('[data-screen="pick"]', { timeout: 8000 });
  } }
];

// WCAG AA text contrast: 4.5:1, or 3:1 for large text (24px, or 18.66px bold).
// The background is the nearest ancestor with a solid colour; text over a drawing is skipped.
const CONTRAST = `(() => {
  const rgb = s => (s.match(/[\\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 0)) continue;
    const st = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (!r.width || st.visibility === 'hidden' || st.display === 'none' || Number(st.opacity) < 0.6) continue;
    if (el.closest('[disabled]') || el.closest('#print-area')) continue;
    let bg = null, node = el;
    while (node && node !== document.documentElement) {
      const s2 = getComputedStyle(node);
      if (s2.backgroundImage !== 'none' && !rgb(s2.backgroundColor)[3] && rgb(s2.backgroundColor).length === 4) { bg = 'image'; break; }
      const c = rgb(s2.backgroundColor);
      if (c.length === 3 || (c.length === 4 && c[3] > 0.9)) { bg = c; break; }
      node = node.parentElement;
    }
    if (!bg || bg === 'image') continue;
    const fg = rgb(st.color);
    const a = lum(fg), b = lum(bg);
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const size = parseFloat(st.fontSize), bold = Number(st.fontWeight) >= 700;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    if (ratio < need) out.push(\`\${el.tagName.toLowerCase()}.\${String(el.className).split(' ')[0]} "\${el.textContent.trim().slice(0, 20)}" \${ratio.toFixed(2)} < \${need}\`);
  }
  return out;
})()`;

let browser;
try {
  await mkdir(outDir, { recursive: true });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
  browser = await chromium.launch({ args: ['--no-sandbox'] });
  const audit = (await readFile(join(root, 'test-ui-tell-audit.js'), 'utf8')).replace(/^\s*\/\/.*\n/gm, '');
  let worst = 0, quality = 0;
  let contrastFails = 0;
  const runs = [];
  for (const s of SCREENS) {
    for (const w of [390, 320, 1280]) runs.push({ s, w, theme: 'bright' });
    for (const theme of ['calm', 'clear']) runs.push({ s, w: 390, theme });
  }
  for (const { s, w, theme } of runs) {
    {
      const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2 });
      const seed = s.seed ? { ...s.seed, settings: { ...s.seed.settings, theme } } : { version: 3, sheets: {}, results: {}, profiles: [], activeProfile: null, settings: { pin: null, voiceOff: false, theme } };
      await ctx.addInitScript(v => localStorage.setItem('backyard', v), JSON.stringify(seed));
      const page = await ctx.newPage();
      await page.goto(`${base}/index.html?test`);
      await page.waitForFunction(() => window.__by?.ready === true);
      await s.drive(page);
      await page.waitForTimeout(400);
      const r = await page.evaluate(`(${audit})()`);
      worst = Math.max(worst, r.slopCount);
      quality += r.quality.length;
      const low = await page.evaluate(CONTRAST);
      contrastFails += low.length;
      console.log(`${s.name} ${theme} @${w}px: slop ${r.slopCount} (${r.verdict}), quality ${r.quality.length}, contrast failures ${low.length}`);
      for (const c of low) console.log(`  CONTRAST ${c}`);
      for (const f of r.findings) console.log(`  SLOP ${f.id}: ${f.detail}`);
      for (const q of r.quality) console.log(`  QUALITY ${q.id}: ${JSON.stringify(q.detail).slice(0, 200)}`);
      if (w !== 320) await page.screenshot({ path: join(outDir, `${s.name}-${theme}-${w}.png`) });
      await ctx.close();
    }
  }
  // Parent area: every tab at three widths, with one child and a worksheet marked.
  const pseed = store(profile({ attempts: { 'on-k-math/A6.3': [{ right: 7, total: 8, taught: 32, day: '2026-10-11', source: 'quest' }] } }));
  pseed.version = 3;
  pseed.settings = { pin: '1234', voiceOff: false };
  for (const tab of ['kids', 'print', 'mark', 'results', 'settings']) {
    for (const w of [390, 320, 1280]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2 });
      await ctx.addInitScript(v => { localStorage.setItem('backyard', v); sessionStorage.setItem('backyard-parent', 'open'); }, JSON.stringify(pseed));
      const page = await ctx.newPage();
      await page.goto(`${base}/parent.html`);
      await page.waitForFunction(() => window.__parentReady === true);
      await page.click(`[data-tab="${tab}"]`);
      await page.waitForTimeout(200);
      const r = await page.evaluate(`(${audit})()`);
      const low = await page.evaluate(CONTRAST);
      contrastFails += low.length;
      for (const c of low) console.log(`  CONTRAST parent ${tab}: ${c}`);
      worst = Math.max(worst, r.slopCount);
      quality += r.quality.length;
      console.log(`parent ${tab} @${w}px: slop ${r.slopCount} (${r.verdict}), quality ${r.quality.length}`);
      for (const f of r.findings) console.log(`  SLOP ${f.id}: ${f.detail}`);
      for (const q of r.quality) console.log(`  QUALITY ${q.id}: ${JSON.stringify(q.detail).slice(0, 200)}`);
      if (w === 390) await page.screenshot({ path: join(outDir, `parent-${tab}-390.png`), fullPage: true });
      await ctx.close();
    }
  }
  console.log(`worst screen: ${worst} slop categories; quality findings: ${quality}; contrast failures: ${contrastFails}`);
  await browser.close();
  server.close();
  process.exit(worst <= 1 && quality === 0 && contrastFails === 0 ? 0 : 1);
} catch (err) {
  console.log(`DID NOT COMPLETE: ${err.stack}`);
  await browser?.close();
  server.close();
  process.exit(2);
}
