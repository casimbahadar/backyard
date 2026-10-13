// Pack validator. Run: node test-packs.mjs
// Exit 0 = all checks passed, 1 = a check failed, 2 = the harness itself crashed.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const packDir = root;

// The templates release one knows about. A pack naming anything else fails.
const TEMPLATES = new Set([
  'hear-first-sound', 'blend-word', 'read-cvc', 'spell-cvc', 'read-sentence',
  'trace-letter', 'count-set', 'number-facts', 'compare', 'pattern-next', 'name-shape', 'measure', 'belongs', 'money', 'fix-sentence', 'sight-word'
]);

// Codes confirmed on 2026-10-11 against the official PDF, The Ontario Curriculum,
// Kindergarten, 2026 (issued December 2025). Only codes a pack uses or may soon use
// are listed. A pack code outside this list fails until someone checks it and adds it.
const OFFICIALLY_CONFIRMED = {
  k: new Set([
    'A2.1', 'A2.2', 'A2.3', 'A2.4', 'A2.5', 'A2.6',
    'A6.1', 'A6.2', 'A6.3', 'A6.4', 'A6.5', 'A6.6', 'A6.7', 'A6.8', 'A6.9', 'A6.10', 'A6.11', 'A6.12',
    'A7.1', 'A7.2', 'A7.3', 'A7.4',
    'A9.1', 'A9.2', 'A9.3', 'A9.4'
  ]),
  // Grade 1 Language, checked 2026-10-11 against the official Grades 1 to 8 Language PDF (2023).
  '1-language': new Set(['B2.1', 'B2.2', 'B2.3', 'B2.4', 'B2.5', 'B2.6', 'B2.7', 'B2.8', 'B3.1', 'B3.2', 'B3.3']),
  // Grade 1 Mathematics, checked 2026-10-12 against the official Grades 1 to 8 Mathematics PDF (2020, revised to 2024).
  '1-math': new Set(['B1.1', 'B1.2', 'B1.3', 'B1.4', 'B1.5', 'B2.1', 'B2.2', 'B2.3', 'B2.4', 'C1.1', 'C1.2', 'C1.3', 'C1.4', 'E1.1', 'E1.2', 'E1.3', 'E1.4', 'E1.5', 'E2.1', 'E2.2', 'F1.1'])
};
const confirmedFor = pack => OFFICIALLY_CONFIRMED[`${pack.grade}-${pack.subject}`] ?? OFFICIALLY_CONFIRMED[pack.grade];

const SOUND_TYPES = new Set(['continuous', 'stop', 'glide']);
const BANNED_CHARS = [['\u2014', 'em dash'], ['\u2013', 'en dash']];

let passed = 0;
const allPacks = new Map();
const failures = [];
function check(ok, msg) { if (ok) passed++; else failures.push(msg); }

function checkText(where, s) {
  check(typeof s === 'string' && s.length > 0, `${where}: empty or not a string`);
  if (typeof s !== 'string') return;
  check(!/ {2}/.test(s), `${where}: doubled space`);
  check(!/ [.,;:!?]/.test(s), `${where}: space before punctuation`);
  check(s === s.trim(), `${where}: leading or trailing space`);
}

function hasCycle(byCode) {
  const state = new Map();
  const visit = (c) => {
    if (state.get(c) === 1) return true;
    if (state.get(c) === 2) return false;
    state.set(c, 1);
    for (const p of byCode.get(c)?.prerequisites ?? []) if (visit(p)) return true;
    state.set(c, 2);
    return false;
  };
  return [...byCode.keys()].some(visit);
}

function validate(file) {
  const raw = readFileSync(join(packDir, file), 'utf8');
  for (const [ch, name] of BANNED_CHARS) check(!raw.includes(ch), `${file}: contains an ${name}`);
  const pack = JSON.parse(raw);

  const expectedName = `${pack.jurisdiction}-${pack.grade}-${pack.subject}.json`;
  check(file === expectedName, `${file}: name should be ${expectedName}`);
  check(pack.schemaVersion === 1, `${file}: schemaVersion must be 1`);
  for (const f of ['jurisdiction', 'grade', 'subject', 'document', 'checkedBy']) checkText(`${file}.${f}`, pack[f]);
  check(/^\d{4}-\d{2}-\d{2}$/.test(pack.checkedOn ?? ''), `${file}: checkedOn must be YYYY-MM-DD`);
  for (const f of ['sourceUrl', 'documentUrl']) {
    check(String(pack[f]).startsWith('https://www.dcp.edu.gov.on.ca/'), `${file}.${f}: must be on the Ministry site`);
  }

  const exps = pack.expectations ?? [];
  check(exps.length > 0, `${file}: no expectations`);
  const byCode = new Map();
  for (const e of exps) {
    const w = `${file} ${e.code}`;
    check(/^[A-F]\d+\.\d+$/.test(e.code ?? ''), `${w}: bad code format`);
    check(!byCode.has(e.code), `${w}: duplicate code`);
    byCode.set(e.code, e);
    check(confirmedFor(pack)?.has(e.code), `${w}: code not in the officially confirmed list`);
    check(e.overall === e.code.split('.')[0], `${w}: overall does not match code`);
    checkText(`${w}.label`, e.label);
    check(/^[A-Z]/.test(e.label ?? ''), `${w}: label should start with a capital`);
    check(!/[.]$/.test(e.label ?? ''), `${w}: label should not end with a period`);
    checkText(`${w}.note`, e.note);
    check(Array.isArray(e.skills) && e.skills.length > 0, `${w}: no skills`);
    for (const s of e.skills ?? []) check(TEMPLATES.has(s.template), `${w}: unknown template ${s.template}`);
  }
  for (const e of exps) {
    for (const p of e.prerequisites ?? []) {
      check(byCode.has(p), `${file} ${e.code}: prerequisite ${p} is not in this pack`);
      check(p !== e.code, `${file} ${e.code}: lists itself as a prerequisite`);
    }
  }
  check(!hasCycle(byCode), `${file}: prerequisite cycle`);
  for (const e of exps) {
    if (!e.follows) continue;
    const [otherFile, otherCode] = e.follows.split('/');
    const other = allPacks.get(`${otherFile}.json`);
    check(!!other && other.expectations.some(x => x.code === otherCode), `${file} ${e.code}: follows ${e.follows}, which does not exist`);
  }
  if (pack.taughtSetFrom) {
    check(!!allPacks.get(`${pack.taughtSetFrom}.json`)?.taughtSet, `${file}: taughtSetFrom ${pack.taughtSetFrom} has no taught set`);
  }
  const roots = exps.filter(e => (e.prerequisites ?? []).length === 0).length;
  check(roots > 0, `${file}: no starting node`);

  if (pack.taughtSet) {
    const ts = pack.taughtSet;
    const order = ts.order ?? [];
    check(order.length > 0, `${file}: taughtSet.order empty`);
    check(Number.isInteger(ts.startCount) && ts.startCount >= 1 && ts.startCount <= order.length,
      `${file}: taughtSet.startCount out of range`);
    const seen = new Set();
    for (const g of order) {
      const key = `${g.grapheme}/${g.phoneme}`;
      check(!seen.has(key), `${file}: taught set repeats ${key}`);
      seen.add(key);
      check(/^[a-z]{1,3}$/.test(g.grapheme ?? ''), `${file}: bad grapheme ${g.grapheme}`);
      check(SOUND_TYPES.has(g.soundType), `${file}: bad soundType on ${key}`);
    }
    checkText(`${file}.taughtSet.orderSource`, ts.orderSource);
  }
  if (pack.taughtSetExtra) {
    for (const g of pack.taughtSetExtra.order) {
      check(/^[a-z]{1,3}$/.test(g.grapheme ?? '') && typeof g.phoneme === 'string', `${file}: bad extra grapheme ${g.grapheme}`);
      check(SOUND_TYPES.has(g.soundType), `${file}: bad soundType on extra ${g.grapheme}`);
    }
    check(!!pack.taughtSetFrom, `${file}: taughtSetExtra needs taughtSetFrom`);
  }
  if (pack.taughtWordsExtra) {
    check(Array.isArray(pack.taughtWordsExtra.words) && pack.taughtWordsExtra.words.every(w => /^[a-zA-Z]+$/.test(w)), `${file}: bad taughtWordsExtra`);
    check(new Set(pack.taughtWordsExtra.words).size === pack.taughtWordsExtra.words.length, `${file}: taughtWordsExtra has duplicates`);
  }
  if (pack.taughtWords) {
    const tw = pack.taughtWords;
    check(byCode.has(tw.unlocksWith), `${file}: taughtWords.unlocksWith ${tw.unlocksWith} is not in this pack`);
    check(new Set(tw.words).size === tw.words.length, `${file}: taughtWords has duplicates`);
  }
  return { file, expectations: exps.length, graphemes: pack.taughtSet?.order.length ?? 0 };
}

try {
  const files = readdirSync(packDir).filter(f => /^on-.*\.json$/.test(f)).sort();
  for (const f of files) allPacks.set(f, JSON.parse(readFileSync(join(packDir, f), 'utf8')));
  check(files.length > 0, 'no pack files found');
  const summary = files.map(validate);
  for (const s of summary) console.log(`${s.file}: ${s.expectations} expectations, ${s.graphemes} taught-set entries`);
  console.log(`checks passed: ${passed}, failed: ${failures.length}`);
  for (const f of failures) console.log(`FAIL ${f}`);
  process.exit(failures.length ? 1 : 0);
} catch (err) {
  console.log(`DID NOT COMPLETE: ${err.stack}`);
  process.exit(2);
}
