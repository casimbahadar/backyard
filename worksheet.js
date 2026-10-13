// Builds a worksheet from a sheet record. The same record always gives the same
// questions, which is what lets Mark regenerate a sheet from its printed ID.
import { generate } from './engine.js';
import { PATTERN_PIECES } from './vocab.js';
import { MONEY } from './money.js';
import { shapeSvg, counterSvg, blankBox } from './art.js';
import { pictureSvg, sceneSvg } from './pictures.js';
import { tensOnes, thing, ribbon, money } from './visuals.js';

// Worksheet pictures are the outline versions, for colouring in.
const pic = (word, size = '1in') => pictureSvg(word, { outline: true, size });
import { childContext } from './packs.js';

const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pieceName = id => PATTERN_PIECES.find(p => p.id === id)?.name ?? id;
const pieceShape = id => PATTERN_PIECES.find(p => p.id === id)?.shape ?? 'circle';

export function findExpectation(packs, packName, code) {
  const pack = packs[packName];
  const exp = pack?.expectations.find(e => e.code === code);
  return exp ? { pack, exp } : null;
}

// Items for a sheet. A node with two skills (read and spell) alternates them.
// keep(skill) lets quests leave out skills the screen cannot run yet. Each skill
// keeps its own seed suffix, so leaving one out never changes another's questions.
export function sheetItems(record, packs, keep = () => true) {
  const found = findExpectation(packs, record.packName, record.code);
  if (!found) return { error: 'missing-node' };
  const { pack, exp } = found;
  const ctx = childContext(pack, packs, record.child);
  const skills = exp.skills.map((skill, i) => ({ skill, i })).filter(({ skill }) => keep(skill));
  const per = Math.ceil(record.count / Math.max(skills.length, 1));
  const lists = skills.map(({ skill, i }) => generate(skill, `${record.id}:${i}`, per, ctx));
  const items = [];
  for (let n = 0; items.length < record.count && n < per; n++) {
    for (const list of lists) if (list[n] && items.length < record.count) items.push(list[n]);
  }
  if (items.length === 0) return { error: 'not-ready' };
  return { items, pack, exp, packChanged: record.packCheckedOn !== pack.checkedOn };
}

// What the grown-up says aloud for an item, since paper cannot speak.
export function sayLine(item) {
  const p = item.print;
  switch (p.kind) {
    case 'count-and-write': return 'Count the circles. Write how many.';
    case 'tens-ones-write': return 'Count the tens and the ones. Write how many in all.';
    case 'sequence-write-next': return `${item.prompt.speech} Write it in the box.`;
    case 'circle-group': return `${item.prompt.speech} Circle it, or circle same.`;
    case 'circle-number': return `${item.prompt.speech} Circle it.`;
    case 'equation-write': return `${item.prompt.speech} Write the answer.`;
    case 'pattern-draw': return `${item.prompt.speech} Draw it in the empty box.`;
    case 'circle-first-letter': return `${item.prompt.speech} Circle the letter.`;
    case 'sound-boxes-circle': return `Say each sound: ${item.prompt.sounds.map(x => `/${x}/`).join(' ')}. Which picture is it? Circle it.`;
    case 'picture-write-letters': return `${item.prompt.speech} Write one letter in each box.`;
    default: return p.text ?? item.prompt.speech;
  }
}

// The right answer in plain words, shared by the grown-up page and Mark.
export function answerText(item) {
  const a = item.answer;
  switch (item.template) {
    case 'compare':
      if (item.print.kind === 'circle-group') return a === 'same' ? 'They are the same' : `The ${a} group`;
      return String(a);
    case 'pattern-next': return `A ${pieceName(a)}`;
    case 'spell-cvc': return a.join(' ');
    case 'read-sentence': return a.rel ? `The picture of the ${a.a} ${a.rel} the ${a.b}` : `The picture of the ${a.a}`;
    case 'trace-letter': return `${a}, formed with the right strokes`;
    case 'money': return `The ${MONEY[a].name}`;
    case 'fix-sentence': return `"${a}"`;
    case 'sight-word': return `${a}`;
    case 'belongs': return `The ${a}`;
    case 'measure': return item.facts.mode === 'length' ? `The ${a} ribbon` : `The ${a}`;
    case 'blend-word': case 'read-cvc': return `The ${a}`;
    default: return String(a);
  }
}

// Picture names left to right, printed on the grown-up page so a grown-up can check.
function pictureNote(item) {
  const pics = item.print.pictures ?? (['read-cvc', 'blend-word'].includes(item.template) ? item.choices : item.picture ? [item.picture] : null);
  if (!pics) return '';
  const names = pics.map(p => (typeof p === 'object' ? (p.rel ? `${p.a} ${p.rel} ${p.b}` : p.a) : p));
  return `Pictures, left to right: ${names.join('; ')}.`;
}

// Three-line guide drawn in the same SVG as the letters, sized from Andika's own
// measurements (units per em 2048, x-height 1040, ascender 1600, capital 1485), so
// the dashed line meets the top of a, tall letters reach the top line, and q dips below.
// Capitals are scaled up slightly so they touch the top line too.
const TOP = 14, BASE = 76, SCALE = (BASE - TOP) / 1600, MID = BASE - 1040 * SCALE;
function traceRow(letter) {
  const upper = letter !== letter.toLowerCase();
  const size = (2048 * (BASE - TOP) / (upper ? 1485 : 1600)).toFixed(2);
  const glyphs = [60, 170, 280].map(x => `<text x="${x}" y="${BASE}" font-size="${size}" text-anchor="middle">${esc(letter)}</text>`).join('');
  return `<svg class="trace-row" viewBox="0 0 660 112" width="6.6in" height="1.12in" aria-hidden="true">`
    + `<line class="guide" x1="0" x2="660" y1="${TOP}" y2="${TOP}"/>`
    + `<line class="guide mid" x1="0" x2="660" y1="${MID.toFixed(2)}" y2="${MID.toFixed(2)}"/>`
    + `<line class="guide base" x1="0" x2="660" y1="${BASE}" y2="${BASE}"/>${glyphs}</svg>`;
}

function counters(n) {
  return `<span class="counters">${Array.from({ length: n }, () => counterSvg()).join('')}</span>`;
}

function body(item) {
  const p = item.print;
  switch (p.kind) {
    case 'count-and-write': return `${counters(p.n)}<span class="write">${blankBox()}</span>`;
    case 'circle-word': return `<span class="row read">${item.choices.map(c => `<span class="word">${esc(c)}</span>`).join('')}</span>`;
    case 'circle-sentence': return `<span class="sentences read">${item.choices.map(c => `<span class="sentence-line">${esc(c)}</span>`).join('')}</span>`;
    case 'circle-money': return `<span class="row">${item.choices.map(c => money(c, { outline: true, scale: 1.3 })).join('')}</span>`;
    case 'circle-ribbon': return `<span class="ribbons">${p.lengths.map(l => ribbon(l, { outline: true, unit: 22 })).join('')}</span>`;
    case 'circle-picture-pair': return `<span class="row">${p.pictures.map(w => pic(w)).join('')}</span>`;
    case 'circle-belongs': return `<span class="belong-group">${p.group.map(g => thing(g, { outline: true, size: '0.6in' })).join('')}</span><span class="row">${item.choices.map(c => thing(c, { outline: true, size: '0.75in' })).join('')}</span>`;
    case 'tens-ones-write': return `${tensOnes(p.tens, p.ones, { outline: true, unit: 8 })}<span class="write">${blankBox()}</span>`;
    case 'sequence-write-next': return `<span class="big">${p.shown.join('&nbsp;&nbsp;')}&nbsp;&nbsp;</span>${blankBox()}`;
    case 'circle-group': return `<span class="group">${counters(p.left)}</span><span class="pill">same</span><span class="group">${counters(p.right)}</span>`;
    case 'circle-number': return `<span class="big">${p.left}</span><span class="big">${p.right}</span>`;
    case 'equation-write': return `<span class="big">${esc(p.text.replace(' = ?', ' ='))}</span>${blankBox()}`;
    case 'pattern-draw': {
      const cells = p.shown.map(id => shapeSvg(pieceShape(id), '0.5in'));
      const gap = `<span class="blank-cell"></span>`;
      if (p.where === 'next') cells.push(gap);
      else if (p.where === 'before') cells.unshift(gap);
      else cells[p.blank] = gap;
      return `<span class="row">${cells.join('')}</span>`;
    }
    case 'colour-shape': return `<span class="row">${item.choices.map(s => shapeSvg(s, '0.85in')).join('')}</span>`;
    case 'circle-letter': return `<span class="row read">${item.choices.map(l => `<span class="letter">${esc(l)}</span>`).join('')}</span>`;
    case 'circle-first-letter': return `${pic(p.picture)}<span class="row read">${item.choices.map(l => `<span class="letter">${esc(l)}</span>`).join('')}</span>`;
    case 'sound-boxes-circle': return `<span class="row">${Array.from({ length: p.boxes }, () => blankBox('sm')).join('')}</span><span class="row">${p.pictures.map(w => (p.show[w] === 'word' ? `<span class="word read">${esc(w)}</span>` : pic(w))).join('')}</span>`;
    case 'match-word-to-picture': {
      const words = p.words.slice().sort();
      return `<span class="match"><span class="col read">${words.map(w => `<span class="word">${esc(w)}</span>`).join('')}</span><span class="col">${p.words.map(w => pic(w, '0.8in')).join('')}</span></span>`;
    }
    case 'word-circle-picture': return `<span class="word read">${esc(p.word)}</span><span class="row">${item.choices.map(w => pic(w, '0.8in')).join('')}</span>`;
    case 'picture-write-letters': return `${pic(p.picture)}<span class="row">${Array.from({ length: p.boxes }, () => blankBox('sm')).join('')}</span>`;
    case 'sentence-circle-picture': return `<span class="sentence read">${esc(p.sentence)}</span><span class="row">${p.pictures.map(sc => sceneSvg(sc, { outline: true, size: '1.3in' })).join('')}</span>`;
    case 'trace-letter': return traceRow(p.letter);
    default: throw new Error(`no print layout for ${p.kind}`);
  }
}

// A small outline sun for the corner, and three stars to colour when the sheet is done.
const SUN = `<svg viewBox="0 0 100 100" width="0.55in" height="0.55in"><g fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"><circle cx="50" cy="50" r="20"/><path d="M50 8 V20 M50 80 V92 M8 50 H20 M80 50 H92 M20 20 L28 28 M72 72 L80 80 M80 20 L72 28 M28 72 L20 80"/></g></svg>`;
const STAR = '<svg viewBox="0 0 100 100" width="0.45in" height="0.45in"><polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38" fill="#fff" stroke="#000" stroke-width="4" stroke-linejoin="round"/></svg>';
const STARS = `<span class="done-stars">${STAR}${STAR}${STAR}</span>`;

function footer(pack, exp) {
  return `<footer class="sheet-foot">${esc(exp.code)} &middot; Grade ${esc(pack.grade.toUpperCase())} &middot; ${esc(pack.document)} &middot; checked ${esc(pack.checkedOn)} &middot; ${esc(pack.sourceUrl)}</footer>`;
}

// Returns the sheet and grown-up page as one HTML string. The child's name is
// left out on purpose and filled in with textContent by the caller.
export function renderSheet(record, built) {
  const { items, pack, exp } = built;
  const sheet = items.map((it, i) => `<li class="item" data-kind="${esc(it.print.kind)}"><span class="num">${i + 1}</span><span class="item-body">${body(it)}</span></li>`).join('');
  const key = items.map((it, i) => {
    const note = pictureNote(it);
    return `<li class="key-item"><span class="num">${i + 1}</span><span><span class="say">Say: ${esc(sayLine(it))}</span><span class="ans">Answer: ${esc(answerText(it))}</span>${note ? `<span class="pics">${esc(note)}</span>` : ''}</span></li>`;
  }).join('');
  return `
<section class="sheet" aria-label="Worksheet">
  <header class="sheet-head">
    <span class="sheet-badge" aria-hidden="true">${SUN}</span>
    <span class="head-lines"><span class="skill-title">${esc(exp.label)}</span>
      <span class="head-fields"><span>Name <span class="name-line" data-child-name></span></span><span>Date <span class="line"></span></span></span></span>
    <span class="sheet-id">Sheet ${esc(record.id)}</span>
  </header>
  <ol class="items">${sheet}</ol>
  <p class="done-row"><span>I did it!</span>${STARS}</p>
  ${footer(pack, exp)}
</section>
<section class="sheet key" aria-label="Grown-up page">
  <header class="sheet-head"><span class="key-title">Grown-up page</span><span class="sheet-id">Sheet ${esc(record.id)}</span></header>
  <p class="key-note">Read each line aloud as your child reaches that number. Afterwards, open Grown-ups, Mark, and type the sheet ID above.</p>
  <ol class="key-items">${key}</ol>
  ${footer(pack, exp)}
</section>`;
}
