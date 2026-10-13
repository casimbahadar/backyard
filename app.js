// The child's side: first run, profile picker, yard, quest, stars, sticker, daily goal.
import { loadPacks, fullTaughtOrder } from './packs.js';
import { load, save, newProfile } from './store.js';
import { sheetItems } from './worksheet.js';
import { starsFor, masteredFor, nodeKey, today, pickNode, dayKey, growTaught, recordRead, goalProgress, goalMet, earnsSticker, neededFor } from './rules.js';
import { stickerSvg, offerThree } from './stickers.js';
import { shape, piece, counters, tensOnes, thing, ribbon, money } from './visuals.js';
import { NUMBER_WORDS } from './vocab.js';
import { TREEHOUSE_SVG } from './scene.js';
import { PLACES, placeOf } from './places.js';
import { BOOKS, canReadBook, wordsIn } from './books.js';
import { seasonsOn } from './seasons.js';
import { ALL_STICKER_IDS } from './stickers.js';
import { childContext } from './packs.js';
import { speak as say, unlock, playSounds, clipSet, phonemeList, preferVoice, playVoice, audioReady, speakArabic } from './audio.js';
import { voiceBundle, clipsFor, spokenAnswer } from './voice.js';
import { allClips } from './audio-store.js';
import { piecesFor } from './arabic.js';
import { pictureSvg, sceneSvg } from './pictures.js';
import { FIRST_SOUNDS } from './words.js';

const TEST = new URLSearchParams(location.search).has('test');
const QUEST_LENGTH = 8;
const REDUCED_MEDIA = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.getElementById('app');
const packs = await loadPacks();
let data = load();
// Tracing is paper only. Blending waits until every letter sound has a recording.
const ORDER = packs['on-k-language'].taughtSet.order;
// Letter sounds and voice recorded on this device, in Grown-ups.
const deviceSounds = await allClips('sounds').catch(() => ({}));
const deviceVoice = await allClips('voice').catch(() => ({}));
const clipsReady = await clipSet(deviceSounds).then(have => phonemeList(ORDER, FIRST_SOUNDS).every(x => have.has(x.phoneme))).catch(() => false);
const NOT_ON_SCREEN = new Set(['trace-letter', ...(clipsReady ? [] : ['blend-word'])]);
const keepSkill = skill => !NOT_ON_SCREEN.has(skill.template);
const playable = (pack, exp) => exp.skills.some(keepSkill);
// Clear theme also means no motion, as if the device asked for reduced motion.
const reduced = () => REDUCED_MEDIA || data.settings?.theme === 'clear';
document.documentElement.dataset.theme = data.settings?.theme ?? 'bright';
preferVoice(data.settings?.voiceName);
const hooks = TEST ? (window.__by = { spoken: [], voiced: [], arabic: [], arabicVoiced: [], sounds: [], screens: [], answerIndex: null, offerRandom: null }) : null;

// ---------- small helpers ----------
function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v; // only ever given SVG built in this app
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null) n.append(kid);
  return n;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const persist = () => save(data);
const profile = () => data.profiles.find(p => p.id === data.activeProfile);

// Your recorded voice reads a line when every piece of it is recorded; otherwise the
// device voice does, so nothing is ever left silent.
const voiceClips = await voiceBundle(deviceVoice).catch(() => ({}));
const speak = text => {
  if (!data.settings?.voiceOff && audioReady()) {
    const clips = clipsFor(text, voiceClips);
    if (clips) { if (hooks) { hooks.spoken.push(text); hooks.voiced.push(text); } playVoice(clips); return; }
  }
  say(text, { off: data.settings?.voiceOff, log: hooks ? t => hooks.spoken.push(t) : null });
};
const sounds = list => (data.settings?.voiceOff ? Promise.resolve() : playSounds(list, deviceSounds, { log: hooks ? l => hooks.sounds.push(l) : null }));
// Arabic lessons: the English instruction, then the letter or sound in the Arabic voice.
// A teacher's or parent's recordings play when every piece is recorded on this device.
const deviceArabic = await allClips('arabic').catch(() => ({}));
const sayArabic = item => {
  if (!item.prompt.arabic) return;
  setTimeout(() => {
    if (data.settings?.voiceOff) return;
    const keys = piecesFor(item);
    if (audioReady() && keys.every(k => deviceArabic[k])) { hooks?.arabicVoiced.push(item.prompt.arabic); playVoice(keys.map(k => deviceArabic[k]), { gap: 0.25 }); return; }
    speakArabic(item.prompt.arabic, { log: hooks ? t => hooks.arabic.push(t) : null });
  }, 1400);
};
// iOS starts speech and sound only from a tap, so the first tap anywhere wakes both.
document.addEventListener('pointerdown', unlock, { once: true, capture: true });

function show(name, ...kids) {
  if (hooks) hooks.screens.push({ name, t: performance.now() });
  root.dataset.screen = name;
  root.replaceChildren(...kids);
}

const PLAY_FACE = '<svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true"><path d="M13 9 L32 20 L13 31 Z" fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg><span>Play</span>';
const TICK = '<svg viewBox="0 0 40 40" width="36" height="36" aria-hidden="true"><path d="M8 21 L17 30 L33 10" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const BADGE = '<svg viewBox="0 0 100 100" width="34" height="34" aria-hidden="true"><polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38" fill="var(--sun)" stroke="var(--ink)" stroke-width="6" stroke-linejoin="round"/></svg>';
// Progress through a quest as a row of plants: a seed still to come, a sprout for
// the question now, a flower for each one done. Shape, not colour, tells them apart.
const PLANT = {
  seed: '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><ellipse cx="12" cy="17" rx="5" ry="3.5" fill="var(--bark)"/></svg>',
  sprout: '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 21 V10" stroke="var(--leaf-dark)" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="8" cy="10" rx="4.5" ry="2.6" fill="var(--leaf)" transform="rotate(-25 8 10)"/><ellipse cx="16" cy="9" rx="4.5" ry="2.6" fill="var(--leaf)" transform="rotate(25 16 9)"/></svg>',
  flower: '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 22 V13" stroke="var(--leaf-dark)" stroke-width="2.5"/><g fill="var(--petal)"><circle cx="12" cy="5.5" r="3.6"/><circle cx="17" cy="9.5" r="3.6"/><circle cx="12" cy="13.5" r="3.6"/><circle cx="7" cy="9.5" r="3.6"/></g><circle cx="12" cy="9.5" r="2.8" fill="var(--sun)"/></svg>'
};
const speakerIcon = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a8.5 8.5 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

// ---------- first run and picker ----------
function firstRun() {
  let grade = null;
  const name = el('input', { id: 'name', class: 'name-input', maxlength: '20', autocomplete: 'off', autocapitalize: 'words', 'aria-label': "Child's name" });
  const play = el('button', { id: 'first-play', class: 'btn btn-play', disabled: true, onclick: start }, 'Play');
  const ready = () => { play.disabled = !(name.value.trim() && grade); };
  name.addEventListener('input', ready);
  const gradeBtn = (value, label, enabled) => el('button', {
    class: 'btn btn-grade', 'data-grade': value, disabled: !enabled, 'aria-pressed': 'false',
    onclick: e => { grade = value; for (const b of e.currentTarget.parentElement.children) b.setAttribute('aria-pressed', String(b === e.currentTarget)); ready(); }
  }, label, enabled ? null : el('span', { class: 'later' }, 'coming later'));
  function start() {
    const startCount = packs['on-k-language'].taughtSet.startCount;
    const p = newProfile({ name: name.value.trim(), grade, startCount });
    data.profiles.push(p);
    data.activeProfile = p.id;
    persist();
    yard();
  }
  show('first-run', el('main', { class: 'first-run' },
    el('div', { class: 'first-scene', html: TREEHOUSE_SVG }),
    el('h1', { class: 'title' }, 'Sticker Yard'),
    el('label', { class: 'name-tag' }, el('span', { class: 'name-tag-top' }, 'Hello, my name is'), name),
    el('fieldset', { class: 'grades' }, el('legend', {}, 'Grade'),
      el('div', { class: 'grade-row' }, gradeBtn('k', 'K', true), gradeBtn('1', '1', true), gradeBtn('2', '2+', false))),
    play));
}

function picker() {
  show('picker', el('main', { class: 'picker' }, el('h1', { class: 'title' }, 'Who is playing?'),
    el('div', { class: 'picker-row' }, data.profiles.map(p => el('button', {
      class: 'btn face', onclick: () => { data.activeProfile = p.id; persist(); speak(p.name); yard(); }
    }, el('span', { class: 'face-initial', 'aria-hidden': 'true' }, p.name.slice(0, 1).toUpperCase()), el('span', {}, p.name))))));
}

// ---------- yard ----------
function yardScene(p, extra) {
  const here = placeOf(p.scene).id;
  const scene = el('div', { class: 'yard-scene', role: 'img', 'aria-label': `${p.name}'s ${placeOf(here).name.toLowerCase()}`, html: placeOf(here).svg });
  // Tall screens show sky above the drawing, so it takes the place's own sky colour.
  scene.style.setProperty('--place-top', placeOf(here).top);
  // Each place keeps its own stickers. data-index is the sticker's place in the whole
  // list, which is also its drawing order.
  p.stickers.forEach((s, i) => {
    if ((s.scene ?? 'yard') !== here) return;
    scene.append(el('span', { class: 'placed', 'data-sticker': s.id, 'data-index': String(i), html: stickerSvg(s.id, { shiny: s.shiny }) }));
    const node = scene.lastChild;
    node.style.left = `${s.x}%`;
    node.style.top = `${s.y}%`;
    node.style.setProperty('--s', String(s.size ?? 1));
  });
  if (extra) scene.append(extra);
  return scene;
}

function goalDots(p) {
  // A minutes goal shows five marks, each a fifth of the time; a quests goal shows one per quest.
  const g = goalProgress(p, today(p));
  const marks = g.unit === 'minutes' ? 5 : g.target;
  const done = g.unit === 'minutes' ? Math.min(5, Math.floor((g.done / g.target) * 5)) : g.done;
  return el('div', { class: 'goal', 'aria-label': `${Math.min(g.done, g.target)} of ${g.target} ${g.unit} today` },
    Array.from({ length: marks }, (_, i) => el('span', { class: i < done ? 'dot done' : 'dot', html: i < done ? shape('star', { fill: '#f6c90e', size: 26 }) : shape('circle', { fill: '#fff', size: 22 }) })));
}

function yard() {
  const p = profile();
  if (!p) return data.profiles.length ? picker() : firstRun();
  if (p.quest) return quest(); // a quest left open resumes exactly where it stopped
  if (p.sheetRewards?.length) return sheetReward();
  const next = pickNode(p, packs, playable);
  const play = el('button', { id: 'play', class: 'play-sticker', onclick: () => startQuest(next), disabled: !next, html: PLAY_FACE });
  const bottom = el('div', { class: 'yard-bottom' },
    el('span', { class: 'side' }, el('button', { id: 'books', class: 'btn round-btn', 'aria-label': 'Books', html: BOOK_ICON, onclick: shelf })),
    next ? play : el('p', { class: 'note' }, 'Ask a grown-up to pick what to practise next.'),
    el('span', { class: 'side' }, el('button', { id: 'album', class: 'btn round-btn', 'aria-label': 'Sticker album', html: ALBUM_ICON, onclick: album })));
  const scene = yardScene(p);
  show('yard', el('main', { class: 'yard' },
    scene,
    el('header', { class: 'yard-top' }, goalDots(p), el('span', { class: 'top-right' },
      el('button', { id: 'places', class: 'btn places-btn', 'aria-label': 'Choose a place', html: PLACES_ICON, onclick: choosePlace }),
      el('a', { class: 'grownups', href: 'parent.html' }, 'Grown-ups'))),
    bottom));
  editStickers(p, scene, bottom);
}

// Tap a sticker in the yard to pick it up: drag it somewhere else, make it bigger or
// smaller, or move it in front of or behind the others. Done puts Play back.
const SIZES = [0.6, 0.8, 1, 1.2, 1.4, 1.7, 2];
function editStickers(p, scene, bottom) {
  let sel = null;
  const normal = [...bottom.childNodes];
  const node = i => scene.querySelector(`.placed[data-index="${i}"]`);
  const tool = (id, label, html, fn) => el('button', { id, class: 'btn tool', 'aria-label': label, html, onclick: fn });
  const ICON = {
    smaller: '<svg viewBox="0 0 40 40" width="32" height="32"><rect x="8" y="17" width="24" height="6" rx="3" fill="currentColor"/></svg>',
    bigger: '<svg viewBox="0 0 40 40" width="32" height="32"><rect x="8" y="17" width="24" height="6" rx="3" fill="currentColor"/><rect x="17" y="8" width="6" height="24" rx="3" fill="currentColor"/></svg>',
    back: '<svg viewBox="0 0 40 40" width="34" height="34"><rect x="6" y="6" width="18" height="18" rx="3" fill="currentColor"/><rect x="16" y="16" width="18" height="18" rx="3" fill="#fff" stroke="currentColor" stroke-width="3"/></svg>',
    front: '<svg viewBox="0 0 40 40" width="34" height="34"><rect x="6" y="6" width="18" height="18" rx="3" fill="#fff" stroke="currentColor" stroke-width="3"/><rect x="16" y="16" width="18" height="18" rx="3" fill="currentColor"/></svg>',
    done: '<svg viewBox="0 0 40 40" width="32" height="32"><path d="M8 21 L17 30 L33 10" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  const resize = step => {
    const s = p.stickers[sel];
    const i = Math.max(0, Math.min(SIZES.length - 1, SIZES.indexOf(s.size ?? 1) + step));
    s.size = SIZES[i];
    node(sel).style.setProperty('--s', String(s.size));
    persist();
  };
  // Later in the list is drawn on top, so moving a sticker in the list restacks it.
  const restack = toFront => {
    const [s] = p.stickers.splice(sel, 1);
    const n = node(sel);
    if (toFront) { p.stickers.push(s); scene.append(n); } else { p.stickers.unshift(s); scene.insertBefore(n, scene.querySelector('.placed')); }
    scene.querySelectorAll('.placed').forEach((x, i) => { x.dataset.index = String(i); });
    sel = toFront ? p.stickers.length - 1 : 0;
    persist();
  };
  const tools = el('div', { class: 'tools', role: 'toolbar', 'aria-label': 'Change this sticker' },
    tool('st-smaller', 'Make it smaller', ICON.smaller, () => resize(-1)),
    tool('st-bigger', 'Make it bigger', ICON.bigger, () => resize(1)),
    tool('st-back', 'Put it behind', ICON.back, () => restack(false)),
    tool('st-front', 'Put it in front', ICON.front, () => restack(true)),
    tool('st-done', 'Done', ICON.done, () => select(null)));
  function select(i) {
    scene.querySelectorAll('.placed.picked').forEach(n => n.classList.remove('picked'));
    sel = i;
    if (i === null) { bottom.replaceChildren(...normal); return; }
    node(i).classList.add('picked');
    bottom.replaceChildren(tools);
    speak('Move it, make it bigger or smaller, or tap the tick when you are done.');
  }
  // Dragging: a sticker follows the finger once it has moved a little.
  scene.addEventListener('pointerdown', e => {
    const n = e.target.closest('.placed');
    if (!n) { if (sel !== null) select(null); return; }
    if (sel !== Number(n.dataset.index)) select(Number(n.dataset.index));
    const box = scene.getBoundingClientRect();
    const start = { x: e.clientX, y: e.clientY };
    let moved = false;
    const move = ev => {
      if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 8) return;
      moved = true;
      const x = Math.max(4, Math.min(96, ((ev.clientX - box.left) / box.width) * 100));
      const y = Math.max(4, Math.min(96, ((ev.clientY - box.top) / box.height) * 100));
      n.style.left = `${x}%`; n.style.top = `${y}%`;
      const i = Number(n.dataset.index);
      p.stickers[i].x = Math.round(x * 10) / 10; p.stickers[i].y = Math.round(y * 10) / 10;
    };
    const up = () => { scene.removeEventListener('pointermove', move); if (moved) persist(); };
    scene.addEventListener('pointermove', move);
    scene.addEventListener('pointerup', up, { once: true });
  });
  if (hooks) hooks.selectSticker = i => select(i);
}

// ---------- places ----------
const PLACES_ICON = '<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true"><rect x="5" y="7" width="13" height="11" rx="3" fill="currentColor"/><rect x="22" y="7" width="13" height="11" rx="3" fill="currentColor"/><rect x="5" y="22" width="13" height="11" rx="3" fill="currentColor"/><rect x="22" y="22" width="13" height="11" rx="3" fill="currentColor"/></svg>';
// Seasonal places show in their season, and stay once she has stickers there.
const seasonsNow = p => (hooks?.seasons ?? seasonsOn(new Date(), p));
const placesFor = p => PLACES.filter(pl => !pl.season || pl.season.some(s => seasonsNow(p).includes(s)) || p.stickers.some(s => s.scene === pl.id));
function choosePlace() {
  const p = profile();
  const count = id => p.stickers.filter(s => (s.scene ?? 'yard') === id).length;
  show('places', el('main', { class: 'places' },
    el('p', { class: 'end-line' }, 'Where do you want to play?'),
    el('div', { class: 'place-grid' }, placesFor(p).map(pl => el('button', {
      class: `btn place-btn${placeOf(p.scene).id === pl.id ? ' here' : ''}`, 'data-place': pl.id, 'aria-label': `${pl.name}, ${count(pl.id)} stickers`,
      onclick: () => { p.scene = pl.id; persist(); speak(pl.name); yard(); }
    }, el('span', { class: 'place-art', html: pl.svg }), el('span', { class: 'place-name' }, pl.name))))));
  speak('Where do you want to play?');
}

// ---------- books and album ----------
const BOOK_ICON = '<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true"><path d="M4 9 Q12 6 20 10 V33 Q12 29 4 32 Z" fill="currentColor"/><path d="M36 9 Q28 6 20 10 V33 Q28 29 36 32 Z" fill="currentColor" opacity="0.65"/></svg>';
const ALBUM_ICON = '<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true"><rect x="7" y="5" width="26" height="31" rx="3" fill="currentColor"/><path d="M20 12 L22.5 17.5 L28.5 18 L24 22 L25.5 28 L20 25 L14.5 28 L16 22 L11.5 18 L17.5 17.5 Z" fill="#fff"/></svg>';
// Which sounds and sight words she knows, the same way questions are chosen.
function readingContext(p) {
  const pack = packs[p.grade === '1' ? 'on-1-language' : 'on-k-language'];
  return childContext(pack, packs, { taughtCount: p.taughtCount, taughtSounds: p.taughtSounds, readWords: p.readWords });
}
function shelf() {
  const p = profile();
  const ctx = readingContext(p);
  show('books', el('main', { class: 'books' },
    el('button', { class: 'btn btn-quiet back-small', onclick: yard }, 'Back to the yard'),
    el('div', { class: 'shelf' }, BOOKS.map(b => {
      const open = canReadBook(b, ctx);
      return el('button', { class: `btn book${open ? '' : ' locked'}${p.booksRead?.[b.id] ? ' read' : ''}`, 'data-book': b.id, disabled: !open,
        'aria-label': open ? b.title : `${b.title}, not yet`, onclick: () => readBook(b, 0) },
        el('span', { class: 'cover', html: pictureSvg(b.cover, { size: '88px' }) }), el('span', { class: 'book-title' }, b.title));
    }))));
  speak('Pick a book to read.');
}
function readBook(b, i) {
  const p = profile();
  const [text, pic] = b.pages[i];
  const words = text.split(/\s+/);
  const last = i === b.pages.length - 1;
  show('book', el('main', { class: 'book-page' },
    el('p', { class: 'page-count' }, `${b.title}: page ${i + 1} of ${b.pages.length}`),
    el('div', { class: 'page-art', html: pictureSvg(pic, { size: '200px' }) }),
    el('p', { class: 'page-text', id: 'page-text' }, ...words.map(w => el('button', { class: 'word-btn', onclick: () => speak(wordsIn(w)[0] ?? w) }, w))),
    el('div', { class: 'page-nav' },
      el('button', { id: 'page-back', class: 'btn btn-quiet', disabled: i === 0, onclick: () => readBook(b, i - 1) }, 'Back'),
      el('button', { id: 'read-to-me', class: 'btn btn-quiet', onclick: () => speak(text) }, 'Read to me'),
      el('button', { id: 'page-next', class: 'btn btn-play', onclick: () => {
        if (!last) return readBook(b, i + 1);
        (p.booksRead ??= {})[b.id] = dayKey(); persist(); speak('The end! Great reading.'); shelf();
      } }, last ? 'The end' : 'Next'))));
}
function album() {
  const p = profile();
  const have = new Set(p.stickers.map(s => s.id));
  show('album', el('main', { class: 'album' },
    el('button', { class: 'btn btn-quiet back-small', onclick: yard }, 'Back to the yard'),
    el('p', { class: 'end-line', id: 'album-count' }, `${[...have].filter(id => ALL_STICKER_IDS.includes(id)).length} of ${ALL_STICKER_IDS.length} stickers`),
    el('div', { class: 'album-grid' }, ALL_STICKER_IDS.map(id => el('span', { class: have.has(id) ? 'slot-sticker got' : 'slot-sticker', 'data-album': id, html: stickerSvg(id, { size: 64 }) })))));
  speak('Your sticker album.');
}

// ---------- quest ----------
function startQuest(next) {
  const p = profile();
  p.quest = {
    packName: next.packName, code: next.exp.code, index: 0, answers: [],
    id: `Q-${Date.now().toString(36)}`, child: { taughtCount: p.taughtCount, taughtSounds: p.taughtSounds?.slice(), readWords: p.readWords.slice() }
  };
  persist();
  quest();
}

function questItems(q) {
  const record = { id: q.id, packName: q.packName, code: q.code, count: QUEST_LENGTH, child: q.child, packCheckedOn: packs[q.packName].checkedOn };
  return sheetItems(record, packs, keepSkill).items ?? [];
}

const label = c => String(c);

function choiceContent(item, c) {
  switch (item.template) {
    case 'pattern-next': return { html: piece(c, 56), aria: c.replace('-', ' ') };
    case 'name-shape': return { html: shape(c, { size: 72 }), aria: c };
    case 'read-cvc': return { html: pictureSvg(c, { size: 92 }), aria: c, cls: 'pic' };
    case 'belongs': return { html: thing(c, { size: 72 }), aria: c };
    case 'money': return { html: money(c, { scale: 2.2 }), aria: c, cls: 'pic money-choice' };
    case 'fix-sentence': return { text: c, cls: 'sentence-choice' };
    case 'arabic': return { text: c, cls: 'arabic', aria: c };
    case 'sight-word': return { text: c, cls: 'word' };
    case 'measure':
      if (item.facts.mode === 'length') return { html: ribbon(item.facts.lengths[c === 'top' ? 0 : 1], { unit: 30 }), aria: `${c} ribbon`, cls: 'ribbon-choice' };
      return { html: pictureSvg(c, { size: 92 }), aria: c, cls: 'pic' };
    case 'read-sentence': return { html: sceneSvg(c, { size: 150 }), aria: c.rel ? `${c.a} ${c.rel} ${c.b}` : c.a, cls: 'pic' };
    case 'blend-word': return item.show[c] === 'word' ? { text: c, cls: 'word' } : { html: pictureSvg(c, { size: 92 }), aria: c, cls: 'pic' };
    case 'compare':
      if (item.print.kind === 'circle-group') {
        if (c === 'same') return { text: 'Same' };
        return { html: counters(item.print.counter, c === 'left' ? item.print.left : item.print.right, 28), aria: `${c} group` };
      }
      return { text: label(c), cls: 'num' };
    default: return { text: label(c), cls: item.template === 'hear-first-sound' ? 'letter' : 'num' };
  }
}

function stage(item) {
  const p = item.print;
  switch (item.template) {
    case 'count-set':
      if (p.kind === 'count-and-write') return el('div', { class: 'stage', html: counters(p.counter, p.n, 44) });
      if (p.kind === 'tens-ones-write') return el('div', { class: 'stage', html: tensOnes(p.tens, p.ones) });
      return el('div', { class: 'stage seq' }, `${p.shown.join('  ')}  ?`);
    case 'number-facts': return el('div', { class: 'stage eq' }, item.prompt.text);
    case 'pattern-next': {
      const cells = item.facts.shown.map(id => piece(id, 48));
      const gap = '<span class="gap"></span>';
      if (item.facts.where === 'next') cells.push(gap); else if (item.facts.where === 'before') cells.unshift(gap); else cells[item.facts.blank] = gap;
      const row = el('div', { class: 'stage pattern', html: cells.join('') });
      row.style.setProperty('--n', String(cells.length)); // every piece shares one row, whatever the screen
      return row;
    }
    case 'hear-first-sound': return item.facts.mode === 'first-sound' ? el('div', { class: 'stage', html: pictureSvg(item.picture, { size: 132 }) }) : null;
    case 'spell-cvc': return el('div', { class: 'stage', html: pictureSvg(item.picture, { size: 132 }) });
    case 'read-cvc': return el('div', { class: 'stage reading' }, item.read);
    case 'belongs': return el('div', { class: 'stage group', html: item.facts.group.map(g => thing(g, { size: 64 })).join('') });
    case 'read-sentence': return el('div', { class: 'stage reading sentence' }, item.read);
    case 'blend-word': return el('div', { class: 'stage' }, el('button', { id: 'listen', class: 'btn btn-listen', 'aria-label': 'Hear the sounds again', html: speakerIcon, onclick: () => sounds(item.prompt.sounds) }));
    default: return null;
  }
}

function quest() {
  const p = profile();
  const q = p.quest;
  const items = questItems(q);
  if (!items.length) { p.quest = null; persist(); return yard(); }
  const item = items[q.index];
  if (hooks) hooks.answerIndex = item.template === 'spell-cvc' ? null : item.choices.findIndex(c => JSON.stringify(c) === JSON.stringify(item.answer));
  if (hooks) hooks.item = item;
  const progress = el('div', { class: 'progress', 'aria-label': `Question ${q.index + 1} of ${items.length}` },
    items.map((_, i) => el('span', { class: i < q.index ? 'pip done' : i === q.index ? 'pip now' : 'pip', html: PLANT[i < q.index ? 'flower' : i === q.index ? 'sprout' : 'seed'] })));
  const replay = el('button', { id: 'replay', class: 'btn btn-icon', 'aria-label': 'Hear it again', html: speakerIcon, onclick: () => {
    speak(item.prompt.speech);
    sayArabic(item);
    if (item.template === 'blend-word') setTimeout(() => sounds(item.prompt.sounds), 2200);
  } });
  const prompt = el('p', { class: 'prompt read' }, item.prompt.text);
  let answerArea;
  let locked = false;
  const shownAt = performance.now();

  async function finish(correct, rightLabel) {
    if (locked) return;
    locked = true;
    // Practice time: from the question appearing to the answer, at most a minute each,
    // so a phone left on the table does not count.
    const spent = Math.min(60, Math.round((performance.now() - shownAt) / 1000));
    q.seconds = (q.seconds ?? 0) + spent;
    today(p).seconds += spent;
    // Picking the right picture for a printed word counts toward "can read it".
    if (correct && item.template === 'read-cvc') recordRead(p, item.answer);
    q.answers.push(correct);
    q.index += 1;
    persist();
    if (!correct) {
      speak(spokenAnswer(item));
      // For a letter-sound question, also play the sound itself after the name.
      if (item.template === 'hear-first-sound' && item.facts.mode === 'first-sound') { await wait(900); await sounds([item.facts.sound]); }
      await wait(1600);
    } else await wait(350);
    if (q.index >= items.length) return questEnd(items);
    quest();
  }

  if (item.template === 'spell-cvc') {
    // Tapping a letter in the boxes takes it back out, so a mis-tap can be undone.
    // Nothing is checked until every box is full and she taps the tick.
    const built = []; // { t, tile }
    const slots = el('div', { class: 'slots' });
    const check = el('button', { id: 'spell-check', class: 'btn spell-check', 'aria-label': 'Check my spelling', hidden: true, html: TICK, onclick: () => {
      if (locked || built.length < item.answer.length) return;
      const ok = built.map(b => b.t).join('') === item.answer.join('');
      check.hidden = true;
      if (!ok) [...slots.children].forEach((sl, k) => { sl.textContent = item.answer[k]; sl.classList.add('fixed'); sl.disabled = true; });
      else { slots.classList.add('right'); [...slots.children].forEach(sl => { sl.disabled = true; }); }
      finish(ok, item.answer.join(', '));
    } });
    const draw = () => {
      slots.replaceChildren(...item.answer.map((_, k) => {
        const b = built[k];
        return el('button', { type: 'button', class: b ? 'slot filled' : 'slot', 'data-slot': String(k), disabled: !b,
          'aria-label': b ? `Take out ${b.t}` : 'Empty box',
          onclick: () => { if (locked || !built[k]) return; built[k].tile.disabled = false; built.splice(k, 1); draw(); } }, b ? b.t : '');
      }));
      check.hidden = built.length < item.answer.length;
    };
    const tiles = el('div', { class: 'choices tiles' }, item.tiles.map(t => el('button', {
      class: 'btn choice letter', 'data-tile': t, onclick: e => {
        if (locked || built.length >= item.answer.length) return;
        built.push({ t, tile: e.currentTarget });
        e.currentTarget.disabled = true;
        draw();
        if (built.length === item.answer.length) speak('Tap the tick when you are done.');
      }
    }, t)));
    draw();
    answerArea = el('div', {}, el('div', { class: 'slot-row' }, slots, check), tiles);
  } else {
    answerArea = el('div', { class: `choices n${item.choices.length}${item.facts.mode === 'length' || item.template === 'fix-sentence' ? ' stack' : ''}` }, item.choices.map((c, i) => {
      const content = choiceContent(item, c);
      const b = el('button', { class: `btn choice ${content.cls ?? ''}`, 'data-choice': String(i), 'aria-label': content.aria ?? false, html: content.html ?? false }, content.text ?? null);
      b.addEventListener('click', () => {
        if (locked) return;
        const ok = JSON.stringify(c) === JSON.stringify(item.answer);
        b.classList.add(ok ? 'right' : 'wrong');
        const rightBtn = answerArea.children[item.choices.findIndex(x => JSON.stringify(x) === JSON.stringify(item.answer))];
        rightBtn.classList.add('right');
        rightBtn.append(el('span', { class: 'badge', html: BADGE }));
        const right = choiceContent(item, item.answer);
        finish(ok, right.text ?? right.aria ?? String(item.answer));
      });
      return b;
    }));
  }
  show('quest', el('main', { class: 'quest' },
    el('header', { class: 'quest-top' }, progress, replay),
    stage(item), prompt, el('div', { class: 'answers' }, answerArea)));
  speak(item.prompt.speech);
  sayArabic(item);
  // For blending, the sounds follow the spoken instruction.
  if (item.template === 'blend-word') setTimeout(() => { if (!locked) sounds(item.prompt.sounds); }, 2200);
}

// ---------- quest end, stickers, daily goal ----------
async function questEnd(items) {
  const p = profile();
  const q = p.quest;
  const right = q.answers.filter(Boolean).length;
  const stars = starsFor(right, q.answers.length);
  const perfect = right === q.answers.length;
  const key = nodeKey(q.packName, q.code);
  (p.attempts[key] ??= []).push({ right, total: q.answers.length, taught: q.child.taughtCount, day: dayKey(), source: 'quest', at: new Date().toISOString() });
  growTaught(p, key, fullTaughtOrder(packs).length);
  const day = today(p);
  // Below 70% right: no sticker, and the quest does not count toward today's goal.
  const passed = earnsSticker(right, q.answers.length);
  if (!passed) day.seconds = Math.max(0, day.seconds - (q.seconds ?? 0));
  const earns = passed && !goalMet(p, { ...day, seconds: day.seconds - (q.seconds ?? 0) });
  if (passed) day.quests += 1;
  const goalNow = earns && goalMet(p, day);
  p.quest = null;
  if (earns) p.pendingStickers += 1;
  p.lastQuest = { stars, perfect, earns, goalNow, mastered: masteredFor(p, key) };
  persist();

  const row = el('div', { class: 'stars', 'aria-label': `${stars} stars` });
  show('quest-end', el('main', { class: 'quest-end' }, row, el('p', { class: 'end-line read', id: 'end-line' })));
  for (let i = 0; i < 3; i++) {
    await wait(reduced() ? 0 : 220);
    row.append(el('span', { class: i < stars ? 'star on' : 'star', html: i < stars ? shape('star', { fill: '#f6c90e', size: 64 }) : shape('star', { fill: '#fff', size: 64 }) }));
  }
  const words = `${NUMBER_WORDS[stars][0].toUpperCase()}${NUMBER_WORDS[stars].slice(1)} star${stars > 1 ? 's' : ''}!`;
  const need = neededFor(q.answers.length);
  const tryAgain = `Get ${NUMBER_WORDS[need]} right to earn a sticker. Try again!`;
  const line = !passed ? `${words} ${tryAgain}` : earns ? words : `${words} That's all the stickers for today.`;
  document.getElementById('end-line').textContent = line;
  speak(!passed ? `${words} ${tryAgain}` : earns ? `${words} Pick a sticker.` : `${words} That's all the stickers for today. Great practice!`);
  await wait(reduced() ? 300 : 900);
  if (earns) pickSticker(perfect, goalNow);
  else {
    const end = root.querySelector('.quest-end');
    if (!passed) {
      const again = pickNode(p, packs, playable);
      if (again) end.append(el('button', { id: 'again', class: 'btn btn-play', onclick: () => startQuest(again) }, 'Try again'));
    }
    end.append(el('button', { id: 'back', class: passed ? 'btn btn-play' : 'btn btn-quiet', onclick: yard }, 'Back to the yard'));
  }
}

// A worksheet marked in the parent area waits here until she next opens the yard.
async function sheetReward() {
  const p = profile();
  const r = p.sheetRewards[0];
  const row = el('div', { class: 'stars', 'aria-label': `${r.stars} stars` });
  show('sheet-reward', el('main', { class: 'quest-end' }, el('p', { class: 'end-line' }, 'Your worksheet got stars!'), row));
  speak('Your worksheet got stars! Pick a sticker.');
  for (let i = 0; i < 3; i++) {
    await wait(reduced() ? 0 : 220);
    row.append(el('span', { class: i < r.stars ? 'star on' : 'star', html: shape('star', { fill: i < r.stars ? '#ffc845' : '#fff', size: 64 }) }));
  }
  await wait(reduced() ? 300 : 900);
  pickSticker(r.shiny, r.goalNow, true);
}

function pickSticker(shiny, goalNow, fromSheet = false) {
  const offer = offerThree(hooks?.offerRandom ?? undefined, placeOf(profile().scene).id, seasonsNow(profile()));
  show('pick', el('main', { class: 'pick' }, el('p', { class: 'end-line read' }, 'Pick a sticker.'),
    el('div', { class: 'choices n3' }, offer.map(id => el('button', {
      class: 'btn choice sticker-choice', 'data-sticker': id, 'aria-label': id, html: stickerSvg(id, { shiny, size: 96 }),
      onclick: () => placeSticker(id, shiny, goalNow, fromSheet)
    })))));
}

function placeSticker(id, shiny, goalNow, fromSheet = false) {
  const p = profile();
  const held = el('span', { class: 'held', html: stickerSvg(id, { shiny, size: 84 }) });
  const scene = yardScene(p, held);
  let placed = false;
  const moveTo = (x, y) => {
    const r = scene.getBoundingClientRect();
    const px = Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100));
    const py = Math.max(0, Math.min(100, ((y - r.top) / r.height) * 100));
    held.style.left = `${px}%`;
    held.style.top = `${py}%`;
    return { px, py };
  };
  held.style.left = '50%'; held.style.top = '50%';
  const drop = e => {
    if (placed) return;
    placed = true;
    const { px, py } = moveTo(e.clientX, e.clientY);
    p.stickers.push({ id, shiny, scene: placeOf(p.scene).id, x: Math.round(px * 10) / 10, y: Math.round(py * 10) / 10, at: new Date().toISOString() });
    if (fromSheet) p.sheetRewards.shift();
    else p.pendingStickers = Math.max(0, p.pendingStickers - 1);
    persist();
    held.classList.remove('lifted');
    if (goalNow) goalMoment(); else setTimeout(yard, reduced() ? 0 : 300);
  };
  // Drag the sticker, or simply tap the spot where it should go.
  scene.addEventListener('pointerdown', e => { held.classList.add('lifted'); moveTo(e.clientX, e.clientY); scene.setPointerCapture?.(e.pointerId); });
  scene.addEventListener('pointermove', e => { if (held.classList.contains('lifted')) moveTo(e.clientX, e.clientY); });
  scene.addEventListener('pointerup', drop);
  show('place', el('main', { class: 'yard placing' }, scene, el('p', { class: 'place-line' }, 'Put it in your yard.')));
  speak('Put it in your yard.');
}

function goalMoment() {
  const p = profile();
  today(p).goalShown = true;
  persist();
  const done = () => { clearTimeout(t); yard(); };
  const t = setTimeout(done, reduced() ? 1500 : 3000);
  show('goal', el('main', { class: 'goal-moment', onclick: done },
    el('div', { class: 'stars', html: shape('star', { fill: '#f6c90e', size: 96 }) }),
    el('p', { class: 'end-line read' }, 'You did your quests today!'),
    el('button', { id: 'goal-ok', class: 'btn btn-play' }, 'Yay!')));
  speak('You did your quests today!');
}

// ---------- start ----------
if (!data.profiles.length) firstRun();
else if (data.profiles.length > 1) picker();
else { data.activeProfile = data.profiles[0].id; yard(); }
if (hooks) hooks.ready = true;
