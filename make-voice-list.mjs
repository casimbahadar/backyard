// Builds voice-pieces.json: every piece of speech the app can say, worked out by
// generating questions for every skill and child situation, so the recording list is
// complete. Run after adding a skill or words: node make-voice-list.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { generate } from './engine.js';
import { contexts } from './test-cases.js';
import { speechPieces, spokenAnswer, APP_LINES } from './voice.js';

const names = ['on-k-language', 'on-k-math', 'on-1-language', 'on-1-math', 'noorani'];
const packs = Object.fromEntries(names.map(n => [n, JSON.parse(readFileSync(new URL(`./${n}.json`, import.meta.url)))]));
const lines = new Set(APP_LINES);
for (const pack of Object.values(packs)) for (const e of pack.expectations) for (const sk of e.skills) {
  const ctxs = contexts(pack, packs);
  for (const ctx of ctxs.length ? ctxs : [null]) for (let s = 0; s < 60; s++) {
    let items = [];
    try { items = generate(sk, `V-${s}`, 10, ctx); } catch { items = []; }
    for (const it of items) { lines.add(it.prompt.speech); lines.add(spokenAnswer(it)); }
  }
}
const pieces = new Map();
for (const l of lines) for (const p of speechPieces(l)) if (!pieces.has(p.key)) pieces.set(p.key, { key: p.key, say: p.say, example: l });
const order = { p: 0, w: 1, n: 2, l: 3 };
const list = [...pieces.values()].sort((a, b) => order[a.key[0]] - order[b.key[0]] || a.key.localeCompare(b.key, 'en', { numeric: true }));
writeFileSync(new URL('./voice-pieces.json', import.meta.url), JSON.stringify({ made: new Date().toISOString().slice(0, 10), lines: lines.size, pieces: list }, null, 1) + '\n');
const count = k => list.filter(p => p.key[0] === k).length;
console.log(`${lines.size} lines, ${list.length} pieces: ${count('p')} phrases, ${count('w')} words, ${count('n')} numbers, ${count('l')} letters`);
