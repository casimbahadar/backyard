// The parent area: a PIN gate, then five tabs. Kids, Print, Mark, Results, Settings.
import { loadPacks, fullTaughtOrder } from './packs.js';
import { load, save, migrate, empty, newProfile, problemWith } from './store.js';
import { newSheetId, normaliseSheetId } from './sheet-id.js';
import { sheetItems, renderSheet, answerText } from './worksheet.js';
import { starsFor, masteredFor, attemptsFor, nodeKey, today, dayKey, growTaught, packsForGrade, packsFor, goalMet, SHEET_MINUTES, earnsSticker, neededFor } from './rules.js';
import { voiceStatus, onVoices, speak, unlock, clipSet, phonemeList, preferVoice, englishVoices, arabicVoice } from './audio.js';
import { voiceBundle } from './voice.js';
import { allClips } from './audio-store.js';
import { recorderView } from './recorder.js';
import { FIRST_SOUNDS } from './words.js';

const $ = id => document.getElementById(id);
const packs = await loadPacks();
let data = load();
const GRADE = { k: 'Kindergarten', 1: 'Grade 1' };
const SUBJECT = { language: 'reading and writing', math: 'math' };
const order = fullTaughtOrder(packs);

function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null) n.append(kid);
  return n;
}
const persist = () => save(data);
const say = (node, text, warn = false) => { node.textContent = text; node.classList.toggle('warn', warn); };
const allNodes = () => Object.entries(packs).flatMap(([name, pack]) => pack.expectations.map(e => ({ name, pack, e, key: nodeKey(name, e.code) })));
const nodeName = n => `${n.e.code} ${n.e.label}`;
const childSelect = (id, selected) => el('select', { id }, data.profiles.map(p => el('option', { value: p.id, selected: p.id === selected }, p.name)));

// ---------- PIN gate ----------
function gate() {
  const main = $('main');
  const unlocked = sessionStorage.getItem('backyard-parent') === 'open';
  if (data.settings.pin && unlocked) return openArea();
  const first = !data.settings.pin;
  const pin = el('input', { id: 'pin', type: 'password', inputmode: 'numeric', maxlength: '4', autocomplete: 'off', pattern: '[0-9]{4}' });
  const again = first ? el('input', { id: 'pin-again', type: 'password', inputmode: 'numeric', maxlength: '4', autocomplete: 'off' }) : null;
  const status = el('p', { class: 'status', role: 'status' });
  const go = el('button', { id: 'pin-go', class: 'btn', type: 'button', onclick: () => {
    if (!/^\d{4}$/.test(pin.value)) return say(status, 'A PIN is four numbers.', true);
    if (first) {
      if (pin.value !== again.value) return say(status, 'The two PINs are different. Type the same four numbers twice.', true);
      data.settings.pin = pin.value;
      persist();
    } else if (pin.value !== data.settings.pin) {
      pin.value = '';
      return say(status, 'That PIN is not right.', true);
    }
    sessionStorage.setItem('backyard-parent', 'open');
    openArea();
  } }, first ? 'Set PIN' : 'Open');
  main.replaceChildren(el('section', { class: 'gate' },
    el('h1', {}, 'Grown-ups'),
    first ? el('p', {}, 'Choose a four-number PIN for this area. It keeps children out of the settings. It is not a password and does not protect your data.') : null,
    el('label', { class: 'field' }, first ? 'New PIN' : 'PIN', pin),
    first ? el('label', { class: 'field' }, 'Type it again', again) : null,
    go, status,
    el('a', { class: 'back', href: 'index.html' }, 'Back to the yard')));
  pin.focus();
}

// ---------- tabs ----------
const TABS = { kids: kidsTab, print: printTab, mark: markTab, results: resultsTab, settings: settingsTab };
function openArea(tab = 'kids') {
  $('tabs').hidden = false;
  for (const b of $('tabs').querySelectorAll('button')) {
    b.onclick = () => openArea(b.dataset.tab);
    b.setAttribute('aria-current', String(b.dataset.tab === tab));
  }
  data = load();
  // Leaving locks the area again, so a child cannot walk back in without the PIN.
  const out = el('a', { id: 'to-yard', class: 'to-yard', href: 'index.html', onclick: () => sessionStorage.removeItem('backyard-parent') }, 'Back to the yard');
  $('main').replaceChildren(out, ...TABS[tab]().filter(Boolean));
  window.__parentTab = tab;
}

// ---------- Kids ----------
let kidId = null;
function kidsTab() {
  if (!data.profiles.length) return [el('h1', {}, 'Kids'), el('p', {}, 'No child yet. Open the yard and start with a name.'), el('a', { class: 'btn', href: 'index.html' }, 'Open the yard')];
  kidId = data.profiles.some(p => p.id === kidId) ? kidId : data.profiles[0].id;
  const p = data.profiles.find(x => x.id === kidId);
  const status = el('p', { class: 'status', role: 'status' });
  const pick = childSelect('kid', kidId);
  pick.onchange = () => { kidId = pick.value; openArea('kids'); };
  const name = el('input', { id: 'kid-name', value: p.name, maxlength: '20' });
  const grade = el('select', { id: 'kid-grade' }, Object.entries(GRADE).map(([v, t]) => el('option', { value: v, selected: p.grade === v }, t)));
  const kind = p.goalType ?? 'quests';
  const goal = el('select', { id: 'kid-goal' },
    el('optgroup', { label: 'Quests' }, [1, 2, 3, 4, 5, 6].map(n => el('option', { value: `q${n}`, selected: kind === 'quests' && p.dailyGoal === n }, `${n} quest${n > 1 ? 's' : ''} a day`))),
    el('optgroup', { label: 'Minutes' }, [10, 15, 20, 30].map(n => el('option', { value: `m${n}`, selected: kind === 'minutes' && p.dailyGoal === n }, `${n} minutes a day`))));
  // Sounds are chips she has or has not been taught; tap to switch each one.
  const picked = new Set(Array.isArray(p.taughtSounds) ? p.taughtSounds : order.map((_, i) => i).slice(0, p.taughtCount));
  const lock = el('input', { id: 'kid-lock', type: 'checkbox', checked: p.taughtLocked });
  const noorani = el('input', { id: 'kid-noorani', type: 'checkbox', checked: !!p.noorani });
  const count = el('p', { id: 'sound-count', class: 'help', 'aria-live': 'polite' });
  const sounds = el('div', { class: 'sounds', role: 'group', 'aria-label': 'Sounds taught' });
  const showSounds = () => {
    sounds.replaceChildren(...order.map((g, i) => el('button', {
      type: 'button', class: `sound${picked.has(i) ? ' on' : ''}${(g.display ?? g.grapheme).length > 3 ? ' long' : ''}`, 'aria-pressed': String(picked.has(i)), 'data-sound': String(i),
      'aria-label': g.note ?? `${g.display ?? g.grapheme}`,
      onclick: () => { picked.has(i) ? picked.delete(i) : picked.add(i); showSounds(); }
    }, g.display ?? g.grapheme)));
    count.textContent = `${picked.size} of ${order.length} sounds chosen.${picked.size < 4 ? ' Choose at least 4 so there are words to read.' : ''}`;
  };
  showSounds();
  const setFirst = n => () => { picked.clear(); for (let i = 0; i < n; i++) picked.add(i); showSounds(); };
  const quick = el('div', { class: 'quick' },
    el('button', { id: 'sounds-first4', type: 'button', class: 'btn quiet small', onclick: setFirst(4) }, 'First 4'),
    el('button', { id: 'sounds-k', type: 'button', class: 'btn quiet small', onclick: setFirst(32) }, 'All kindergarten'),
    el('button', { id: 'sounds-all', type: 'button', class: 'btn quiet small', onclick: setFirst(order.length) }, 'All'));
  const next = el('select', { id: 'kid-next' }, el('option', { value: '' }, 'Let the app choose'),
    allNodes().map(n => el('option', { value: n.key, selected: p.chosenNode === n.key }, nodeName(n))));
  const early = el('div', { class: 'checks' }, allNodes().map(n => el('label', { class: 'check' },
    el('input', { type: 'checkbox', value: n.key, checked: p.unlocked.includes(n.key) }), nodeName(n))));
  const saveBtn = el('button', { id: 'kid-save', class: 'btn', type: 'button', onclick: () => {
    if (picked.size < 4) return say(status, 'Choose at least 4 sounds, so there are words to read.', true);
    const chosen = [...picked].sort((a, b) => a - b);
    Object.assign(p, {
      name: name.value.trim() || p.name, grade: grade.value, goalType: goal.value[0] === 'm' ? 'minutes' : 'quests', dailyGoal: Number(goal.value.slice(1)), noorani: noorani.checked, taughtSounds: chosen, taughtCount: chosen.length, taughtLocked: lock.checked,
      chosenNode: next.value || null, unlocked: [...early.querySelectorAll('input:checked')].map(i => i.value)
    });
    persist();
    say(status, `Saved for ${p.name}.`);
  } }, 'Save');
  const addName = el('input', { id: 'add-name', maxlength: '20' });
  const addGrade = el('select', { id: 'add-grade' }, Object.entries(GRADE).map(([v, t]) => el('option', { value: v }, t)));
  const add = el('button', { id: 'add-kid', class: 'btn quiet', type: 'button', onclick: () => {
    if (!addName.value.trim()) return say(status, 'Type a name for the new child.', true);
    const np = newProfile({ name: addName.value.trim(), grade: addGrade.value, startCount: packs['on-k-language'].taughtSet.startCount });
    data.profiles.push(np);
    persist();
    kidId = np.id;
    openArea('kids');
  } }, 'Add child');
  let armed = false;
  const remove = el('button', { id: 'kid-delete', class: 'btn danger', type: 'button', onclick: e => {
    if (!armed) { armed = true; e.currentTarget.textContent = `Tap again to delete ${p.name} and all of their stickers`; return; }
    data.profiles = data.profiles.filter(x => x.id !== p.id);
    if (data.activeProfile === p.id) data.activeProfile = data.profiles[0]?.id ?? null;
    persist();
    kidId = null;
    openArea('kids');
  } }, `Delete ${p.name}`);
  return [
    el('h1', {}, 'Kids'),
    data.profiles.length > 1 ? el('label', { class: 'field' }, 'Child', pick) : null,
    el('section', { class: 'group' },
      el('label', { class: 'field' }, 'Name', name),
      el('div', { class: 'row' }, el('label', { class: 'field' }, 'Grade to start from', grade), el('label', { class: 'field' }, 'Daily goal', goal))),
    el('section', { class: 'group' },
      el('h2', {}, 'Sounds taught'),
      el('p', { class: 'help' }, `Tap each sound ${p.name} has learned. Reading and spelling only use words made of these sounds. The app adds the next 4 each time ${p.name} learns the letter-sounds skill.`),
      quick, sounds, count,
      el('label', { class: 'check' }, lock, 'Only change sounds when I choose them')),
    el('section', { class: 'group' },
      el('h2', {}, 'Arabic'),
      el('label', { class: 'check' }, noorani, `Include Noorani Qaida lessons for ${p.name}`),
      el('p', { class: 'help' }, 'Lessons 1 to 4: the single letters, joined letters, the opening letters of surahs, and the short vowels. The device\'s Arabic voice reads them for now.')),
    el('section', { class: 'group' },
      el('h2', {}, `What ${p.name} practises`),
      el('label', { class: 'field' }, 'Practise next', next),
      el('details', {}, el('summary', {}, 'Open skills early'), early)),
    saveBtn, status,
    el('section', { class: 'group' }, el('h2', {}, 'Add a child'),
      el('div', { class: 'row' }, el('label', { class: 'field' }, 'Name', addName), el('label', { class: 'field' }, 'Grade', addGrade)), add),
    el('section', { class: 'group' }, remove)
  ];
}

// ---------- Print ----------
const fontsReady = () => Promise.all(['400 16px Andika', '700 16px Andika', '600 16px Fredoka'].map(f => document.fonts.load(f))).catch(() => {});
function printTab() {
  if (!data.profiles.length) return [el('h1', {}, 'Print'), el('p', {}, 'Add a child first, so the sheet matches what they have learned.')];
  const child = childSelect('child', data.activeProfile ?? data.profiles[0].id);
  const node = el('select', { id: 'node' }, Object.entries(packs).map(([name, pack]) => el('optgroup', { label: `${GRADE[pack.grade]}, ${SUBJECT[pack.subject]}` },
    pack.expectations.map(e => el('option', { value: `${name}|${e.code}` }, `${e.code} ${e.label}`)))));
  const count = el('select', { id: 'count' }, [6, 8, 10].map(n => el('option', { value: n, selected: n === 8 }, `${n} questions`)));
  const status = el('p', { id: 'print-status', class: 'status', role: 'status' });
  const btn = el('button', { id: 'print-btn', class: 'btn', type: 'button', onclick: async () => {
    const p = data.profiles.find(x => x.id === child.value);
    const [packName, code] = node.value.split('|');
    const record = {
      id: newSheetId(new Set(Object.keys(data.sheets))), packName, code, count: Number(count.value), childId: p.id,
      child: { name: p.name, taughtCount: p.taughtCount, taughtSounds: p.taughtSounds?.slice(), readWords: p.readWords.slice() },
      packCheckedOn: packs[packName].checkedOn, createdAt: new Date().toISOString()
    };
    const built = sheetItems(record, packs);
    if (built.error === 'not-ready') return say(status, `${p.name} needs more sounds taught before this skill has questions. Raise the number in Kids, or pick another skill.`, true);
    $('print-area').innerHTML = renderSheet(record, built);
    for (const n of $('print-area').querySelectorAll('[data-child-name]')) n.textContent = p.name;
    data.sheets[record.id] = record;
    const stored = persist();
    await fontsReady();
    say(status, stored ? `Sheet ${record.id} is ready. Its ID is printed at the top of the page.` : `Sheet ${record.id} printed, but this browser would not save it, so it cannot be marked later.`, !stored);
    window.print();
  } }, 'Print');
  return [el('h1', {}, 'Print'),
    el('p', { class: 'help' }, 'Each sheet has a second page for you, with what to read aloud and the answers.'),
    el('label', { class: 'field' }, 'Child', child), el('label', { class: 'field' }, 'Skill', node), el('label', { class: 'field narrow' }, 'Length', count), btn, status];
}

// ---------- Mark ----------
function markTab() {
  const idInput = el('input', { id: 'mark-id', autocomplete: 'off', autocapitalize: 'characters', placeholder: 'W-7KQ2' });
  const status = el('p', { id: 'mark-status', class: 'status', role: 'status' });
  const list = el('ol', { id: 'mark-list', class: 'mark-list' });
  const done = el('button', { id: 'done-btn', class: 'btn', type: 'button', hidden: true, disabled: true }, 'Done');
  let marking = null;
  const find = el('button', { id: 'find-btn', class: 'btn', type: 'button', onclick: () => {
    list.replaceChildren(); done.hidden = true;
    const id = normaliseSheetId(idInput.value);
    data = load();
    const record = id && data.sheets[id];
    if (!record) { marking = null; return say(status, id ? `No sheet ${id} on this device. Sheets can only be marked on the device that printed them.` : 'A sheet ID has a W and four letters or numbers, like W-7KQ2.', true); }
    const built = sheetItems(record, packs);
    if (built.error) return say(status, 'This sheet\'s skill is no longer in the app, so it cannot be marked.', true);
    marking = { record, items: built.items, marks: new Array(built.items.length).fill(null) };
    const who = record.child.name ? ` for ${record.child.name}` : '';
    say(status, built.packChanged ? `Sheet ${id}${who}. The curriculum pack has changed since this was printed, so check each question against the paper.` : `Sheet ${id}${who}: ${built.items.length} questions. Tap Right or Not yet for each.`, built.packChanged);
    built.items.forEach((item, i) => {
      const choices = el('span', { class: 'choices' });
      for (const [labelText, value] of [['Right', true], ['Not yet', false]]) {
        const b = el('button', { type: 'button', class: 'mark-btn', 'aria-pressed': 'false' }, labelText);
        b.onclick = () => { marking.marks[i] = value; for (const s of choices.children) s.setAttribute('aria-pressed', String(s === b)); done.disabled = marking.marks.includes(null); };
        choices.append(b);
      }
      list.append(el('li', { class: 'mark-row' }, el('span', { class: 'q' }, String(i + 1)), el('span', { class: 'answer' }, answerText(item)), choices));
    });
    done.hidden = false; done.disabled = true;
  } }, 'Find sheet');
  done.onclick = () => {
    if (!marking || marking.marks.includes(null)) return;
    const { record, marks } = marking;
    data = load();
    const again = !!data.results[record.id];
    data.results[record.id] = { sheetId: record.id, packName: record.packName, code: record.code, marks, markedAt: new Date().toISOString() };
    const right = marks.filter(Boolean).length, total = marks.length;
    const p = data.profiles.find(x => x.id === record.childId);
    let line = `Saved. ${right} of ${total} right.`;
    if (p) {
      const key = nodeKey(record.packName, record.code);
      const list2 = (p.attempts[key] ??= []);
      const prior = list2.findIndex(a => a.sheetId === record.id);
      const attempt = { right, total, taught: record.child.taughtCount, day: dayKey(), source: 'sheet', sheetId: record.id, at: new Date().toISOString() };
      if (prior >= 0) list2[prior] = attempt; else list2.push(attempt);
      growTaught(p, key, order.length);
      if (!again) {
        const day = today(p);
        const passed = earnsSticker(right, total);
        const earns = passed && !goalMet(p, day);
        if (passed) { day.quests += 1; day.seconds += SHEET_MINUTES * 60; }
        const stars = starsFor(right, total);
        if (!passed) line += ` A sticker needs ${neededFor(total)} of ${total} right, so this sheet counts toward learning but gives no sticker.`;
        else if (earns) {
          p.sheetRewards.push({ sheetId: record.id, stars, shiny: right === total, goalNow: goalMet(p, day) });
          line += ` ${p.name} gets ${stars} star${stars > 1 ? 's' : ''} and a sticker, waiting in the yard.`;
        } else line += ` ${p.name} has met today's goal, so this sheet counts toward learning but gives no sticker.`;
      } else line = `Updated. ${right} of ${total} right. Stickers are only given the first time a sheet is marked.`;
    }
    const stored = persist();
    say(status, stored ? line : 'This browser would not save the marks.', !stored);
    list.replaceChildren(); done.hidden = true; marking = null;
  };
  return [el('h1', {}, 'Mark'), el('label', { class: 'field narrow' }, 'Sheet ID from the top of the page', idInput), find, status, list, done];
}

// ---------- Results ----------
function weekLines(p) {
  const since = new Date(); since.setDate(since.getDate() - 6);
  const from = dayKey(since);
  let quests = 0, sheets = 0;
  const per = [];
  for (const n of allNodes()) {
    const week = (p.attempts[n.key] ?? []).filter(a => a.day >= from);
    if (!week.length) continue;
    for (const a of week) a.source === 'sheet' ? sheets++ : quests++;
    const right = week.reduce((s, a) => s + a.right, 0), total = week.reduce((s, a) => s + a.total, 0);
    per.push({ n, right, total, last: week.at(-1).day });
  }
  const lines = [`This week: ${quests} quest${quests === 1 ? '' : 's'}, ${sheets} worksheet${sheets === 1 ? '' : 's'}.`];
  for (const x of per.sort((a, b) => (a.last < b.last ? 1 : -1)).slice(0, 3)) {
    lines.push(`${x.n.e.label}: ${x.right} of ${x.total}${x.right / x.total < 7 / 8 ? ', worth another go' : ''}.`);
  }
  return lines;
}

function resultsTab() {
  if (!data.profiles.length) return [el('h1', {}, 'Results'), el('p', {}, 'No child yet.')];
  kidId = data.profiles.some(p => p.id === kidId) ? kidId : data.profiles[0].id;
  const p = data.profiles.find(x => x.id === kidId);
  const pick = childSelect('results-kid', kidId);
  pick.onchange = () => { kidId = pick.value; openArea('results'); };
  const detail = el('div', { id: 'node-detail', class: 'detail', role: 'region', 'aria-live': 'polite' });
  const grid = el('div', { class: 'node-grid' });
  const grades = new Set(packsFor(p));
  for (const n of allNodes()) {
    if (!grades.has(n.name)) continue;
    const list = p.attempts[n.key] ?? [];
    const state = masteredFor(p, n.key) ? 'learned' : list.length ? 'practising' : 'new';
    const icon = { learned: '★', practising: '◐', new: '○' }[state];
    const b = el('button', { type: 'button', class: `node ${state}`, 'aria-expanded': 'false', 'data-key': n.key },
      el('span', { class: 'node-icon', 'aria-hidden': 'true' }, icon), el('span', { class: 'node-code' }, n.e.code));
    b.onclick = () => {
      for (const x of grid.children) x.setAttribute('aria-expanded', String(x === b));
      const last = list.at(-1);
      const shown = attemptsFor(p, n.key).slice(-2).map(a => `${a.right} of ${a.total}`).join(', ');
      detail.replaceChildren(
        el('h2', {}, `${n.e.code} ${n.e.label}`),
        el('p', {}, { learned: 'Learned.', practising: 'Practising.', new: 'Not started.' }[state]),
        el('p', {}, last ? `Last practised ${last.day}. Most recent: ${shown}.` : 'No quests or worksheets yet.'),
        el('p', { class: 'help' }, `${GRADE[n.pack.grade]}, ${n.pack.document}. Checked against the Ministry document on ${n.pack.checkedOn}.`),
        el('a', { href: n.pack.sourceUrl, rel: 'noopener', target: '_blank' }, 'Official page'));
    };
    grid.append(b);
  }
  return [el('h1', {}, 'Results'), data.profiles.length > 1 ? el('label', { class: 'field' }, 'Child', pick) : null,
    el('div', { class: 'week', id: 'week' }, weekLines(p).map(l => el('p', {}, l))),
    el('p', { class: 'legend' }, el('span', {}, '★ learned'), el('span', {}, '◐ practising'), el('span', {}, '○ not started')),
    grid, detail];
}

// The recorders open in place of the Settings tab, with a way back.
async function openRecorder(kind) {
  $('main').replaceChildren(el('p', {}, 'Loading'));
  const view = await recorderView(kind, { el, order: packs['on-k-language'].taughtSet.order, onBack: () => openArea('settings') });
  $('main').replaceChildren(...view);
  window.__recorderOpen = kind;
}

// ---------- Settings ----------
function settingsTab() {
  const status = el('p', { id: 'settings-status', class: 'status', role: 'status' });
  const voice = el('input', { id: 'voice', type: 'checkbox', checked: !data.settings.voiceOff });
  voice.onchange = () => { data.settings.voiceOff = !voice.checked; persist(); say(status, voice.checked ? 'Questions will be read aloud.' : 'Questions will not be read aloud.'); };
  const exportBtn = el('button', { id: 'export', class: 'btn quiet', type: 'button', onclick: () => {
    const blob = new Blob([JSON.stringify(load(), null, 1)], { type: 'application/json' });
    const a = el('a', { href: URL.createObjectURL(blob), download: `sticker-yard-backup-${dayKey()}.json` });
    document.body.append(a); a.click(); a.remove();
    say(status, 'Backup file saved. Keep it somewhere safe; it holds every child\'s progress.');
  } }, 'Save a backup file');
  const file = el('input', { id: 'import', type: 'file', accept: 'application/json,.json' });
  file.onchange = async () => {
    try {
      const incoming = migrate(JSON.parse(await file.files[0].text()));
      const problem = problemWith(incoming);
      if (problem) return say(status, `That backup cannot be loaded: ${problem}. Nothing was changed.`, true);
      const pin = data.settings.pin;
      data = { ...incoming, settings: { ...incoming.settings, pin: incoming.settings?.pin ?? pin } };
      persist();
      say(status, `Backup loaded: ${data.profiles.length} child${data.profiles.length === 1 ? '' : 'ren'}, ${Object.keys(data.sheets).length} sheets.`);
    } catch (err) {
      say(status, /version/.test(err.message) ? 'That backup comes from a newer version of the app. Update the app, then load it again.' : 'That file is not a Sticker Yard backup.', true);
    }
  };
  const newPin = el('input', { id: 'new-pin', type: 'password', inputmode: 'numeric', maxlength: '4', autocomplete: 'off' });
  const pinBtn = el('button', { id: 'pin-change', class: 'btn quiet', type: 'button', onclick: () => {
    if (!/^\d{4}$/.test(newPin.value)) return say(status, 'A PIN is four numbers.', true);
    data.settings.pin = newPin.value; persist(); newPin.value = ''; say(status, 'PIN changed.');
  } }, 'Change PIN');
  let armed = false;
  const clear = el('button', { id: 'clear', class: 'btn danger', type: 'button', onclick: e => {
    if (!armed) { armed = true; e.currentTarget.textContent = 'Tap again to delete every child, sticker and sheet on this device'; return; }
    data = empty(); persist(); sessionStorage.removeItem('backyard-parent'); gate();
  } }, 'Delete all data on this device');
  const voiceNote = el('p', { id: 'voice-note', class: 'help' });
  const showVoice = () => {
    const v = voiceStatus();
    say(voiceNote, v.ok ? `Questions are read by ${v.name}${v.lang ? ` (${v.lang})` : ''}.` : v.reason, !v.ok);
  };
  // Choosing a voice: iPhones and iPads can download nicer English voices in
  // Settings, Accessibility, Spoken Content, Voices; they show up here once installed.
  const voicePick = el('select', { id: 'voice-pick' });
  const fillVoices = () => {
    const list = englishVoices();
    voicePick.replaceChildren(el('option', { value: '' }, 'Let the app choose'),
      ...list.map(v => el('option', { value: v.name, selected: data.settings.voiceName === v.name }, `${v.name} (${v.lang})`)));
  };
  voicePick.onchange = () => {
    data.settings.voiceName = voicePick.value || null;
    persist();
    preferVoice(data.settings.voiceName);
    showVoice();
    unlock();
    speak('Hello! This is how I sound.', { off: false });
  };
  preferVoice(data.settings.voiceName);
  fillVoices();
  showVoice();
  onVoices(() => { fillVoices(); showVoice(); });
  const test = el('button', { id: 'voice-test', class: 'btn quiet', type: 'button', onclick: () => {
    unlock();
    speak('How many apples? Now three letter sounds: m. s. a.', { off: false });
    say(status, 'If the voice said "em, ess, ay", it says letter names, not letter sounds. That is why the blending game uses recorded sounds.');
  } }, 'Test the voice');
  const arNote = el('p', { id: 'arabic-voice', class: 'help' });
  const showArabic = () => { const v = arabicVoice(); arNote.textContent = v ? `Arabic lessons are read by ${v.name} (${v.lang}).` : 'No Arabic voice found on this device. To hear the Noorani Qaida lessons, add one in Settings, Accessibility, Spoken Content, Voices, Arabic.'; };
  showArabic();
  onVoices(showArabic);
  const arRec = el('p', { id: 'arabic-status', class: 'help' });
  import('./arabic.js').then(async m => {
    const have = await allClips('arabic');
    const n = m.arabicPieces().filter(x => have[x.key]).length;
    arRec.textContent = n ? `${n} of ${m.arabicPieces().length} Arabic recordings on this device. Questions with every piece recorded use them.` : 'No Arabic recordings yet.';
  });
  const recorded = el('p', { id: 'voice-status', class: 'help' });
  Promise.all([allClips('voice').then(d => voiceBundle(d)), fetch('voice-pieces.json').then(r => r.json())]).then(([clips, list]) => {
    const have = list.pieces.filter(x => clips[x.key]).length;
    recorded.textContent = have === 0 ? 'No recorded voice yet, so the device voice reads everything.'
      : `${have} of ${list.pieces.length} voice pieces are recorded. Lines with a missing piece use the device voice.`;
  }).catch(() => { recorded.textContent = 'No recorded voice yet, so the device voice reads everything.'; });
  const sounds = el('p', { id: 'sounds-status', class: 'help' });
  allClips('sounds').then(dev => clipSet(dev)).then(have => {
    const need = phonemeList(packs['on-k-language'].taughtSet.order, FIRST_SOUNDS);
    const ready = need.filter(x => have.has(x.phoneme)).length;
    sounds.textContent = ready === need.length ? `All ${need.length} letter sounds are ready.` : `${ready} of ${need.length} letter sounds are ready. The blending game waits until all of them are.`;
  });
  const THEMES = [['bright', 'Bright', 'Strong colours. The default.'], ['calm', 'Calm', 'Softer colours, for evenings or a child who finds Bright too much.'], ['clear', 'Clear', 'High contrast, bigger text, outlines on everything, no movement.']];
  const themes = el('fieldset', { class: 'themes' }, el('legend', {}, 'Look of the child screens'),
    THEMES.map(([v, name, note]) => {
      const r = el('input', { type: 'radio', name: 'theme', value: v, checked: (data.settings.theme ?? 'bright') === v });
      r.onchange = () => { data.settings.theme = v; persist(); say(status, `${name} is on. It shows the next time the yard opens.`); };
      return el('label', { class: `theme-choice theme-${v}` }, r, el('span', { class: 'swatch', 'aria-hidden': 'true' }), el('span', {}, el('strong', {}, name), el('span', { class: 'help' }, note)));
    }));
  const keeps = el('section', { class: 'group' }, el('h2', {}, 'What this app keeps'),
    el('p', {}, "Each child's first name, the grade you chose, practice results, stickers, and the worksheets printed on this device. It keeps them in this browser's storage and sends nothing anywhere: no accounts, no tracking, no network calls after the page loads."),
    el('p', { class: 'help' }, 'The app lives on a github.io address, which other github.io sites share. Those sites can read this browser storage, which is why the app keeps nothing more sensitive than a first name and practice results.'));
  return [el('h1', {}, 'Settings'),
    el('section', { class: 'group' }, el('label', { class: 'check' }, voice, 'Read questions aloud'), voiceNote,
      el('label', { class: 'field' }, 'Voice', voicePick),
      el('p', { class: 'help' }, 'On an iPhone or iPad you can add nicer voices in Settings, Accessibility, Spoken Content, Voices. The enhanced and premium voices sound much more natural.'), test),
    el('section', { class: 'group' }, el('h2', {}, 'Your own voice'), el('p', { class: 'help' }, 'Record the app\'s questions in your own voice. Recordings stay on this device, and you can move them to another device with a file.'), recorded,
      el('button', { id: 'open-voice', type: 'button', class: 'btn quiet', onclick: () => openRecorder('voice') }, 'Record your own voice')),
    el('section', { class: 'group' }, themes),
    el('section', { class: 'group' }, el('h2', {}, 'Arabic voice'), arNote, arRec,
      el('button', { id: 'open-arabic', type: 'button', class: 'btn quiet', onclick: () => openRecorder('arabic') }, 'Record the Arabic')),
    el('section', { class: 'group' }, el('h2', {}, 'Letter sounds'), sounds,
      el('button', { id: 'open-sounds', type: 'button', class: 'btn quiet', onclick: () => openRecorder('sounds') }, 'Record the letter sounds')),
    el('section', { class: 'group' }, el('h2', {}, 'Backup'),
      el('p', { class: 'help' }, 'Everything stays on this device. A backup file lets you move it to another device or keep a copy.'),
      exportBtn, el('label', { class: 'field' }, 'Load a backup file', file)),
    el('section', { class: 'group' }, el('h2', {}, 'PIN'), el('label', { class: 'field narrow' }, 'New PIN', newPin), pinBtn),
    keeps,
    el('section', { class: 'group' }, clear), status];
}

gate();
window.__parentReady = true;
