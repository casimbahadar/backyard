// Generator harness. Run: node test-generator.mjs
// Exit 0 = all checks passed, 1 = a check failed, 2 = the harness itself crashed.
// Reads the shipped packs and the shipped templates, never a copy of either.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate, TEMPLATES } from './engine.js';
import { hashString } from './prng.js';
import { WORDS, BY_WORD, FIRST_SOUNDS, lookAlike, shapeOf, wordsOfShapes } from './words.js';
import { contexts, SEEDS_NO_CTX, SEEDS_PER_CTX, PER_SET } from './test-cases.js';
import { PICTURE_WORDS } from './pictures.js';
const DRAWN = new Set(PICTURE_WORDS);

const root = dirname(fileURLToPath(import.meta.url));
const failures = [];
let passed = 0;
const check = (ok, msg) => { if (ok) passed++; else if (failures.length < 200) failures.push(msg); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function checkSentence(where, s) {
  check(typeof s === 'string', `${where}: missing text`);
  if (typeof s !== 'string') return;
  check(!/[{}]/.test(s), `${where}: unfilled slot in "${s}"`);
  check(!/ {2}/.test(s), `${where}: doubled space in "${s}"`);
  check(!/ [.,;:!?]/.test(s), `${where}: space before punctuation in "${s}"`);
  check(!/[\u2013\u2014]/.test(s), `${where}: dash in "${s}"`);
  check(/^[A-Z]/.test(s), `${where}: no capital in "${s}"`);
  check(/[.?!]$/.test(s), `${where}: not terminated "${s}"`);
  check(s.split(' ').length >= 3, `${where}: under three words "${s}"`);
}
function checkEquation(where, s) {
  check(!/[{}]/.test(s) && !/ {2}/.test(s) && !/[\u2013\u2014]/.test(s), `${where}: bad equation text "${s}"`);
}
function periodic(seq) {
  for (let p = 1; p <= Math.floor(seq.length / 2); p++) if (seq.every((x, i) => x === seq[i % p])) return true;
  return false;
}

// The harness's own reading of "taught", written apart from taught.js
// so a bug there cannot hide itself.
const DIGRAPHS = ['sh', 'ch', 'th', 'wh', 'ck', 'qu'];
function splitLetters(word) {
  const out = [];
  for (let i = 0; i < word.length;) {
    const two = word.slice(i, i + 2);
    if (DIGRAPHS.includes(two)) { out.push(two); i += 2; } else { out.push(word[i]); i += 1; }
  }
  return out;
}
function canRead(word, ctx) {
  const lower = word.toLowerCase();
  if (ctx.taughtWords.some(t => t.toLowerCase() === lower)) return true;
  const taught = ctx.taughtOrder.slice(0, ctx.taughtCount);
  const entry = BY_WORD[lower];
  if (entry) return entry.graphemes.every((g, i) => taught.some(t => t.grapheme === g && t.phoneme === entry.phonemes[i]));
  return splitLetters(lower).every(g => taught.some(t => t.grapheme === g));
}
// Written apart from the word data, so a wrong size in words.js still gets caught.
const BIG_ANIMALS = ['cat', 'dog', 'pig', 'hen', 'fox', 'duck'];
const SMALL_HOLDERS = ['cup', 'can', 'pot', 'pan', 'jug', 'net', 'nest'];
const absurd = sc => sc.rel === 'in' && BIG_ANIMALS.includes(sc.a) && SMALL_HOLDERS.includes(sc.b);
const fits = (a, rel, b) => a !== b && !lookAlike(a.word, b.word) && (rel === 'in' ? a.size <= b.holds : a.size <= b.carries);

function expected(item) {
  const f = item.facts, pr = item.print;
  switch (item.template) {
    case 'count-set': return pr.kind === 'count-and-write' ? pr.n : pr.kind === 'tens-ones-write' ? pr.tens * 10 + pr.ones : f.numbers[2] + (f.step ?? 1);
    case 'number-facts': return f.op === 'add' ? f.numbers[0] + f.numbers[1] : f.numbers[0] - f.numbers[1];
    case 'compare':
      if (pr.kind === 'circle-group') {
        if (pr.left === pr.right) return 'same';
        return (pr.ask === 'more') === (pr.left > pr.right) ? 'left' : 'right';
      }
      return pr.ask === 'bigger' ? Math.max(pr.left, pr.right) : Math.min(pr.left, pr.right);
    case 'measure': {
      const bigger = ['longer', 'heavier', 'more'].includes(f.ask);
      if (f.mode === 'length') return (f.lengths[0] > f.lengths[1]) === bigger ? 'top' : 'bottom';
      const [x, y] = Object.keys(f.sizes);
      return (f.sizes[x] > f.sizes[y]) === bigger ? x : y;
    }
    case 'money': {
      if (f.mode === 'find') return f.target;
      const [x, y] = Object.keys(f.values);
      return f.values[x] > f.values[y] ? x : y;
    }
    default: return undefined;
  }
}

// The harness's own facts for sorting, written apart from belongs.js.
const ROLLS = new Set(['sphere', 'cone', 'cylinder']);
const SOLID = new Set(['cube', 'pyramid', 'prism', 'sphere', 'cone', 'cylinder']);
const FOUR = new Set(['square', 'rectangle', 'rhombus', 'trapezoid']);
const RULES = { solid: x => SOLID.has(x), 'four-sides': x => FOUR.has(x), rolls: x => ROLLS.has(x), 'no-roll': x => SOLID.has(x) && !ROLLS.has(x) };

function checkLanguage(it, w, ctx, params) {
  // Every picture a question shows must have a drawing.
  const shown = [];
  if (it.picture) shown.push(it.picture);
  if (['read-cvc', 'blend-word'].includes(it.template)) shown.push(...it.choices);
  if (it.template === 'read-sentence') for (const c of it.choices) shown.push(c.a, ...(c.b ? [c.b] : []));
  for (const x of shown) check(DRAWN.has(x), `${w}: no drawing for "${x}"`);
  const taught = ctx.taughtOrder.slice(0, ctx.taughtCount);
  const phonemesOf = g => taught.filter(t => t.grapheme === g).map(t => t.phoneme);
  if (it.template === 'hear-first-sound' && it.facts.mode === 'first-sound') {
    const e = FIRST_SOUNDS.find(x => x.word === it.facts.word);
    check(it.answer === e.first && it.word === undefined, `${w}: answer ${it.answer} is not how ${e.word} starts`);
    check(!new RegExp(`\\b${e.word}\\b`, 'i').test(it.prompt.text), `${w}: on-screen text gives the word away`);
    for (const c of it.choices) check(phonemesOf(c).length > 0, `${w}: choice ${c} not taught yet`);
    for (const d of it.distractors) check(!phonemesOf(d).includes(it.facts.sound), `${w}: wrong choice ${d} makes the same sound as ${it.answer}`);
  }
  if (it.template === 'blend-word') {
    check(same(it.prompt.sounds, BY_WORD[it.answer].phonemes), `${w}: sounds played do not spell ${it.answer}`);
    for (const c of it.choices) {
      const wordShown = it.show[c] === 'word';
      check(!wordShown || (ctx.readWords.includes(c) && canRead(c, ctx)), `${w}: ${c} shown in print before she can read it`);
      check(wordShown || !ctx.readWords.includes(c) || !canRead(c, ctx), `${w}: ${c} still a picture after she can read it`);
    }
  }
  if (it.template === 'read-cvc') {
    check(canRead(it.read, ctx), `${w}: shows "${it.read}" before its sounds are taught`);
    check(it.read === it.answer, `${w}: word shown is not the answer`);
  }
  if (['blend-word', 'read-cvc'].includes(it.template)) {
    for (let i = 0; i < it.choices.length; i++) for (let j = i + 1; j < it.choices.length; j++)
      check(!lookAlike(it.choices[i], it.choices[j]), `${w}: look-alike pictures ${it.choices[i]} and ${it.choices[j]}`);
  }
  if (it.template === 'spell-cvc') {
    const e = BY_WORD[it.facts.word];
    check(it.answer.join('') === e.word, `${w}: answer tiles do not spell ${e.word}`);
    check(canRead(e.word, ctx), `${w}: asks to spell ${e.word} before its sounds are taught`);
    const pool = it.tiles.slice();
    for (const g of it.answer) { const k = pool.indexOf(g); check(k >= 0, `${w}: tile ${g} missing`); if (k >= 0) pool.splice(k, 1); }
    check(same(pool.slice().sort(), it.distractors.slice().sort()), `${w}: tiles are not answer plus extras`);
    for (const t of it.tiles) check(phonemesOf(t).length > 0, `${w}: tile ${t} not taught yet`);
    for (const d of it.distractors) check(!phonemesOf(d).some(p => e.phonemes.includes(p)), `${w}: extra tile ${d} could spell a sound in ${e.word}`);
  }
  if (it.template === 'sight-word') {
    const taught = new Set(ctx.taughtWords);
    check(it.choices.every(c => taught.has(c)), `${w}: a sight-word choice is not a taught word`);
    check(it.choices.length === 4 && new Set(it.choices).size === 4, `${w}: sight-word choices are not four different words`);
  }
  if (it.template === 'fix-sentence') {
    const ok = c => /^[A-Z]/.test(c) && c.endsWith(it.facts.mark) && !/[.?!].*[.?!]$/.test(c);
    check(it.choices.filter(ok).length === 1 && ok(it.answer), `${w}: not exactly one sentence is written the right way`);
    for (const x of it.answer.replace(/[.?!]$/, '').split(' ')) check(canRead(x, ctx), `${w}: "${x}" is not readable yet`);
    check(it.facts.mark === (it.facts.words[0] === 'is' ? '?' : '.'), `${w}: a question without a question mark, or the reverse`);
  }
  if (it.template === 'read-sentence') {
    const s = it.read;
    checkSentence(`${w} sentence`, s);
    const words = s.replace(/[.?!]$/, '').split(' ');
    check(words.length <= params.maxWords, `${w}: sentence over ${params.maxWords} words`);
    for (const x of words) check(canRead(x, ctx), `${w}: "${x}" in "${s}" is not readable yet`);
    for (let i = 0; i < words.length - 1; i++) check(!(words[i].toLowerCase() === 'a' && /^[aeiou]/.test(words[i + 1])), `${w}: "a" before a vowel in "${s}"`);
    const m = s.match(/^(?:The|My) (\w+) is (in|on) the (\w+)\.$/) || s.match(/^(?:I|We|You|They) see a (\w+)\.$/) || s.match(/^Look at the (\w+)\.$/) || s.match(/^Here is a (\w+)\.$/);
    check(!!m, `${w}: sentence has an unknown shape "${s}"`);
    if (m) {
      const told = m.length === 4 ? { a: m[1], rel: m[2], b: m[3] } : { a: m[1] };
      check(same(told, it.answer), `${w}: sentence "${s}" does not describe the answer picture`);
      check(!same(it.distractors[0], it.answer), `${w}: both pictures are the same`);
      if (told.rel) {
        check(fits(BY_WORD[told.a], told.rel, BY_WORD[told.b]), `${w}: "${s}" is not physically possible`);
        const d = it.distractors[0];
        check(fits(BY_WORD[d.a], d.rel, BY_WORD[d.b]), `${w}: wrong picture is not physically possible`);
        check(!absurd(told) && !absurd(d), `${w}: a big animal inside a small thing in "${s}"`);
      }
    }
  }
}

const report = [];
let allHash = 0;
try {
  rmSync(join(root, 'test-output', 'samples'), { recursive: true, force: true });
  mkdirSync(join(root, 'test-output', 'samples'), { recursive: true });
  const packs = readdirSync(root).filter(f => /^on-.*\.json$/.test(f)).sort();
  const byName = Object.fromEntries(packs.map(f => [f.replace(/\.json$/, ''), JSON.parse(readFileSync(join(root, f), 'utf8'))]));
  for (const file of packs) {
    const pack = byName[file.replace(/\.json$/, '')];
    const ctxs = contexts(pack, byName);
    const seeds = ctxs[0] ? SEEDS_PER_CTX : SEEDS_NO_CTX;
    for (const exp of pack.expectations) {
      for (const skill of exp.skills) {
        const name = `${exp.code} ${skill.template}${skill.params.mode ? ' ' + skill.params.mode : ''}${skill.params.prompt ? ' ' + skill.params.prompt : ''}`;
        if (!TEMPLATES[skill.template]) { check(false, `${name}: template not built`); continue; }
        const answerPos = new Map(), answers = new Set(), fullAnswers = new Set();
        let items = 0, consecutiveRepeats = 0, setsWithRepeat = 0, fixedOrder = false, zeroFacts = 0, out = '';
        const unavailableAt = new Set();
        const sample = [];
        for (const ctx of ctxs) {
          const full = !ctx || ctx.taughtCount === ctx.taughtOrder.length;
          let ctxSampled = 0;
          for (let s = 0; s < seeds; s++) {
            const seed = `W-${s}`;
            const set = generate(skill, seed, PER_SET, ctx);
            if (set.length === 0) { unavailableAt.add(ctx.taughtCount); continue; }
            if (s % 10 === 0) check(same(set, generate(skill, seed, PER_SET, ctx)), `${name}: seed ${seed} not deterministic`);
            out += JSON.stringify(set);
            const keys = set.map(i => i.key);
            if (new Set(keys).size < keys.length) setsWithRepeat++;
            set.forEach((it, i) => {
              items++;
              const w = `${name} ${seed}#${i}${ctx ? ` taught=${ctx.taughtCount} read=${ctx.readWords.length}` : ''}`;
              if (it.fixedOrder) fixedOrder = true;
              if (i > 0 && keys[i] === keys[i - 1]) consecutiveRepeats++;
              if (!it.paperOnly && it.template !== 'spell-cvc') {
                const hits = it.choices.filter(c => same(c, it.answer)).length;
                check(hits === 1, `${w}: answer appears ${hits} times in choices`);
                check(it.choices.length >= 2, `${w}: fewer than two choices`);
                check(!it.distractors.some(d => same(d, it.answer)), `${w}: a distractor equals the answer`);
                check(new Set(it.distractors.map(d => JSON.stringify(d))).size === it.distractors.length, `${w}: duplicate distractors`);
                check(it.choices.length === it.distractors.length + 1, `${w}: choices are not answer plus distractors`);
                const pos = it.choices.findIndex(c => same(c, it.answer));
                answerPos.set(pos, (answerPos.get(pos) ?? 0) + 1);
              }
              if (it.paperOnly) check(/^[a-zA-Z]$/.test(it.answer), `${w}: trace letter "${it.answer}" is not one letter`);
              if (it.facts.range) {
                const [lo, hi] = it.facts.range;
                check(it.facts.numbers.every(n => Number.isInteger(n) && n >= lo && n <= hi), `${w}: number out of range ${it.facts.numbers}`);
                for (const c of it.choices) if (typeof c === 'number') check(c >= lo && c <= hi, `${w}: choice ${c} out of range`);
              }
              const exp2 = expected(it);
              if (exp2 !== undefined) check(same(exp2, it.answer), `${w}: answer ${it.answer} but facts give ${exp2}`);
              if (it.template === 'number-facts' && it.facts.numbers.slice(0, 2).includes(0)) zeroFacts++;
              if (it.template === 'belongs') {
                const ok = RULES[it.facts.rule];
                check(it.facts.group.every(ok), `${w}: a group member breaks the rule ${it.facts.rule}`);
                check(it.choices.filter(ok).length === 1 && ok(it.answer), `${w}: not exactly one choice follows ${it.facts.rule}`);
                check(!it.facts.group.includes(it.answer), `${w}: the answer is already in the group`);
              }
              if (it.template === 'money' && it.facts.values) {
                const v = Object.values(it.facts.values);
                check(v[0] !== v[1], `${w}: two money pieces of the same value`);
              }
              if (it.template === 'measure' && it.facts.sizes) {
                const v = Object.values(it.facts.sizes);
                check(Math.abs(v[0] - v[1]) >= 2, `${w}: the two things are too close in size to compare`);
              }
              if (it.template === 'pattern-next') {
                const f = it.facts;
                const fills = it.choices.map(c => {
                  if (f.where === 'next') return [...f.shown, c];
                  if (f.where === 'before') return [c, ...f.shown];
                  const s2 = f.shown.slice(); s2[f.blank] = c; return s2;
                });
                check(fills.filter(periodic).length === 1, `${w}: not exactly one choice completes the pattern`);
                check(periodic(fills[it.choices.indexOf(it.answer)]), `${w}: answer does not complete the pattern`);
              }
              if (ctx) checkLanguage(it, w, ctx, skill.params);
              if (skill.params.shapes && ['blend-word', 'read-cvc', 'spell-cvc'].includes(it.template)) {
                check(skill.params.shapes.includes(shapeOf(BY_WORD[it.facts.word])), `${w}: ${it.facts.word} is not one of the shapes ${skill.params.shapes}`);
              }
              if (skill.params.shapes && it.template === 'read-sentence') {
                for (const x of it.read.replace(/\.$/, '').split(' ')) {
                  const e = BY_WORD[x.toLowerCase()];
                  if (e) check(skill.params.shapes.includes(shapeOf(e)), `${w}: "${x}" is not one of the shapes ${skill.params.shapes}`);
                }
              }
              if (it.prompt.kind === 'equation') checkEquation(`${w} text`, it.prompt.text);
              else checkSentence(`${w} text`, it.prompt.text);
              checkSentence(`${w} speech`, it.prompt.speech);
              if (it.print.text && it.print.kind !== 'equation-write') checkSentence(`${w} print`, it.print.text);
              answers.add(JSON.stringify(it.answer));
              if (full) fullAnswers.add(JSON.stringify(it.answer));
              if (sample.length < 100 && i === s % PER_SET && s % 3 === 0 && ctxSampled++ < Math.ceil(100 / ctxs.length)) sample.push(`${seed}#${i}${ctx ? ` [taught ${ctx.taughtCount}, read ${ctx.readWords.length}]` : ''}  ${it.read ? `"${it.read}"  ` : ''}${it.prompt.speech}  |  answer ${JSON.stringify(it.answer)}  |  ${it.choices?.length ? 'choices ' + JSON.stringify(it.choices) : it.tiles ? 'tiles ' + JSON.stringify(it.tiles) : 'paper only'}${it.show ? '  |  shown ' + JSON.stringify(it.show) : ''}`);
            });
          }
        }
        if (answerPos.size) {
          const maxPosShare = Math.max(...answerPos.values()) / [...answerPos.values()].reduce((a, b) => a + b, 0);
          const fairShare = 1 / Math.max(...[...answerPos.keys()].map(k => k + 1));
          if (fixedOrder) {
            const l = answerPos.get(0) ?? 0, r = answerPos.get(1) ?? 0;
            check(Math.abs(l - r) / (l + r) < 0.1, `${name}: left and right answers unbalanced (${l} vs ${r})`);
          } else check(maxPosShare < fairShare + 0.1, `${name}: answer sits in one position ${(maxPosShare * 100).toFixed(1)}% of the time`);
        }
        if (skill.template === 'number-facts') {
          const share = zeroFacts / items;
          check(share >= 0.1 && share <= 0.3, `${name}: facts with a zero are ${(share * 100).toFixed(1)}% of items`);
        }
        // With every sound taught, every letter that can open a word must be asked.
        if (skill.template === 'hear-first-sound' && skill.params.prompt === 'first-sound') {
          const openers = new Set(pack.taughtSet.order.filter(g => g.position !== 'end').map(g => g.grapheme));
          for (const g of openers) check(fullAnswers.has(JSON.stringify(g)), `${name}: never asks for ${g} with every sound taught`);
        }
        // With every sound taught, every picture word must turn up as an answer.
        if (['blend-word', 'read-cvc', 'spell-cvc'].includes(skill.template)) {
          for (const x of wordsOfShapes(skill.params.shapes)) check(fullAnswers.has(JSON.stringify(skill.template === 'spell-cvc' ? x.graphemes : x.word)), `${name}: ${x.word} never asked with every sound taught`);
        }
        check(items > 0, `${name}: produced nothing`);
        check(consecutiveRepeats === 0, `${name}: ${consecutiveRepeats} back-to-back repeated items`);
        const h = hashString(out);
        allHash = hashString(`${allHash}:${h}`);
        writeFileSync(join(root, 'test-output', 'samples', `${name.replace(/ /g, '-')}.txt`), sample.join('\n') + '\n');
        const notYet = unavailableAt.size ? `, not available yet at ${[...unavailableAt].sort((a, b) => a - b).join(', ')} sounds` : '';
        report.push(`${name}: ${items} items, ${answers.size} distinct answers${notYet}, hash ${h.toString(16)}`);
      }
    }
  }
  for (const r of report) console.log(r);
  console.log(`combined hash ${allHash.toString(16)}`);
  console.log(`checks passed: ${passed}, failed: ${failures.length}${failures.length >= 200 ? ' (first 200 shown)' : ''}`);
  for (const f of failures) console.log(`FAIL ${f}`);
  process.exit(failures.length ? 1 : 0);
} catch (err) {
  console.log(`DID NOT COMPLETE: ${err.stack}`);
  process.exit(2);
}
