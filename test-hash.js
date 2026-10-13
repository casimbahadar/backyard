// Browser twin of the hashing part of test-generator.mjs. Same packs, same seeds,
// same child contexts, same order, so Safari (JavaScriptCore) must print the same
// combined hash as Node (V8).
import { generate, TEMPLATES } from './engine.js';
import { hashString } from './prng.js';
import { contexts, SEEDS_NO_CTX, SEEDS_PER_CTX, PER_SET } from './test-cases.js';

const PACKS = ['on-1-language.json', 'on-1-math.json', 'on-k-language.json', 'on-k-math.json'];
const out = document.getElementById('out');

try {
  let allHash = 0;
  const lines = [];
  const byName = {};
  for (const file of PACKS) byName[file.replace(/\.json$/, '')] = await (await fetch(`./${file}`)).json();
  for (const file of PACKS) {
    const pack = byName[file.replace(/\.json$/, '')];
    const ctxs = contexts(pack, byName);
    const seeds = ctxs[0] ? SEEDS_PER_CTX : SEEDS_NO_CTX;
    for (const exp of pack.expectations) {
      for (const skill of exp.skills) {
        if (!TEMPLATES[skill.template]) continue;
        let text = '';
        for (const ctx of ctxs) {
          for (let s = 0; s < seeds; s++) {
            const set = generate(skill, `W-${s}`, PER_SET, ctx);
            if (set.length) text += JSON.stringify(set);
          }
        }
        const h = hashString(text);
        allHash = hashString(`${allHash}:${h}`);
        lines.push(`${exp.code} ${skill.template}: ${h.toString(16)}`);
      }
    }
  }
  out.textContent = '';
  const big = document.createElement('p');
  big.append('Combined hash: ');
  const code = document.createElement('code');
  code.textContent = allHash.toString(16);
  big.append(code);
  out.append(big);
  for (const l of lines) { const p = document.createElement('p'); p.textContent = l; out.append(p); }
} catch (err) {
  out.textContent = `Did not complete: ${err.message}`;
}
