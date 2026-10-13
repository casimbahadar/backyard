// Run after changing any drawing: node measure-pictures.mjs
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
import { PICTURE_WORDS, pictureSvg } from './pictures.js';
import { writeFileSync } from 'node:fs';
const b=await chromium.launch({args:['--no-sandbox']}); const p=await b.newPage();
await p.setContent(`<body>${PICTURE_WORDS.map(w=>`<div data-w="${w}">${pictureSvg(w,{size:100})}</div>`).join('')}</body>`);
const bounds = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-w]')].map(d => { const r = d.querySelector('g').getBBox(); return [d.dataset.w, [r.x, r.y, r.width, r.height].map(v => Math.round(v * 10) / 10)]; })));
await b.close();
writeFileSync(new URL('./bounds.js', import.meta.url), `// Measured outline of each drawing (x, y, width, height in its 100 by 100 box),\n// made by measure-pictures.mjs with a headless browser. Used to sit one picture on another.\nexport const BOUNDS = ${JSON.stringify(bounds)};\n`);
console.log(Object.keys(bounds).length, bounds.hen, bounds.log, bounds.pig, bounds.rug);
