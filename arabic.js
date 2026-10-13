// Noorani Qaida, lessons 1 to 4: single letters, joined letters, the opening letters of
// some surahs (muqatta'at), and the three short vowels. She hears it and taps it.
// Letters are in the Qaida's order; names are spelled in Arabic so the device's Arabic
// voice reads the name, and in English letters for the grown-up page.
export const id = 'arabic';

// The consonant each letter carries, for writing a vowelled sound like "ba" or "qu".
const CONSONANT = { 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'H', 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 'S', 'ض': 'D',
  'ط': 'T', 'ظ': 'Z', 'ع': "'", 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'و': 'w', 'ه': 'h', 'ي': 'y', 'ا': '', 'ء': "'" };

export const LETTERS = [
  ['ا', 'ألف', 'alif'], ['ب', 'باء', 'baa'], ['ت', 'تاء', 'taa'], ['ث', 'ثاء', 'thaa'], ['ج', 'جيم', 'jeem'], ['ح', 'حاء', 'Haa (deep h)'],
  ['خ', 'خاء', 'khaa'], ['د', 'دال', 'daal'], ['ذ', 'ذال', 'dhaal'], ['ر', 'راء', 'raa'], ['ز', 'زاي', 'zaa'], ['س', 'سين', 'seen'],
  ['ش', 'شين', 'sheen'], ['ص', 'صاد', 'saad'], ['ض', 'ضاد', 'daad'], ['ط', 'طاء', 'Taa (heavy t)'], ['ظ', 'ظاء', 'Zaa (heavy z)'],
  ['ع', 'عين', "'ain"], ['غ', 'غين', 'ghain'], ['ف', 'فاء', 'faa'], ['ق', 'قاف', 'qaaf'], ['ك', 'كاف', 'kaaf'], ['ل', 'لام', 'laam'],
  ['م', 'ميم', 'meem'], ['ن', 'نون', 'noon'], ['و', 'واو', 'waaw'], ['ه', 'هاء', 'haa'], ['ء', 'همزة', 'hamza'], ['ي', 'ياء', 'yaa']
].map(([glyph, name, roman]) => ({ glyph, name, roman, c: CONSONANT[glyph] }));

// Letters that differ only by dots or a small mark, offered together so she learns to look closely.
const FAMILIES = [['ب', 'ت', 'ث'], ['ج', 'ح', 'خ'], ['د', 'ذ'], ['ر', 'ز'], ['س', 'ش'], ['ص', 'ض'], ['ط', 'ظ'], ['ع', 'غ'], ['ف', 'ق']];

// The joined letters at the start of some surahs, with the letter names read for each.
export const MUQATTAAT = ['الم', 'المص', 'الر', 'المر', 'كهيعص', 'طه', 'طسم', 'طس', 'يس', 'ص', 'حم', 'عسق', 'ق', 'ن'];

export const HARAKAT = [['َ', 'fatha', 'a'], ['ِ', 'kasra', 'i'], ['ُ', 'damma', 'u']].map(([mark, name, sound]) => ({ mark, name, sound }));

const byGlyph = Object.fromEntries(LETTERS.map(l => [l.glyph, l]));
const namesOf = s => [...s].map(ch => byGlyph[ch].name).join(' ');
const romanOf = s => [...s].map(ch => byGlyph[ch].roman.split(' ')[0]).join(' ');
// Letters that can carry a vowel mark in lesson 4 (alif and hamza are left out there).
const VOWELLED = LETTERS.filter(l => !['ا', 'ء'].includes(l.glyph));

function lookAlikes(glyph, rng, n) {
  const fam = FAMILIES.find(f => f.includes(glyph))?.filter(g => g !== glyph) ?? [];
  const others = rng.shuffle(LETTERS.map(l => l.glyph).filter(g => g !== glyph && !fam.includes(g)));
  return [...rng.shuffle(fam), ...others].slice(0, n);
}

export function make(params, rng) {
  const mode = params.mode;
  if (mode === 'letter') {
    const l = rng.pick(LETTERS);
    const distractors = lookAlikes(l.glyph, rng, 2);
    return {
      template: id, key: `letter:${l.glyph}`,
      prompt: { text: 'Tap the letter you hear.', speech: 'Tap the letter you hear.', arabic: l.name },
      answer: l.glyph, distractors, choices: rng.shuffle([l.glyph, ...distractors]),
      facts: { mode, target: l.glyph, roman: l.roman },
      print: { kind: 'circle-arabic', say: l.roman }
    };
  }
  if (mode === 'joined') {
    // Two letters joined, the way they are written inside words.
    const a = rng.pick(LETTERS.filter(x => x.glyph !== 'ء')).glyph;
    const b = rng.pick(LETTERS.filter(x => x.glyph !== 'ء' && x.glyph !== a)).glyph;
    const word = a + b;
    const pool = new Set();
    for (const g of lookAlikes(b, rng, 4)) if (g !== 'ء') pool.add(a + g);
    for (const g of lookAlikes(a, rng, 4)) if (g !== 'ء') pool.add(g + b);
    pool.delete(word);
    const distractors = rng.shuffle([...pool]).slice(0, 2);
    return {
      template: id, key: `joined:${word}`,
      prompt: { text: 'Tap the letters you hear.', speech: 'Tap the letters you hear.', arabic: namesOf(word) },
      answer: word, distractors, choices: rng.shuffle([word, ...distractors]),
      facts: { mode, target: word, roman: romanOf(word) },
      print: { kind: 'circle-arabic', say: romanOf(word) }
    };
  }
  if (mode === 'muqattaat') {
    const m = rng.pick(MUQATTAAT);
    const distractors = rng.shuffle(MUQATTAAT.filter(x => x !== m)).slice(0, 2);
    return {
      template: id, key: `muq:${m}`,
      prompt: { text: 'Tap the letters you hear.', speech: 'Tap the letters you hear.', arabic: namesOf(m) },
      answer: m, distractors, choices: rng.shuffle([m, ...distractors]),
      facts: { mode, target: m, roman: romanOf(m) },
      print: { kind: 'circle-arabic', say: romanOf(m) }
    };
  }
  if (mode === 'harakat') {
    // One letter with fatha, kasra or damma; the choices are the same letter with the other two.
    const l = rng.pick(VOWELLED);
    const h = rng.pick(HARAKAT);
    const answer = l.glyph + h.mark;
    const distractors = HARAKAT.filter(x => x !== h).map(x => l.glyph + x.mark);
    const roman = `${l.c}${h.sound}`;
    return {
      template: id, key: `harakah:${answer}`,
      prompt: { text: 'Tap the sound you hear.', speech: 'Tap the sound you hear.', arabic: answer },
      answer, distractors, choices: rng.shuffle([answer, ...distractors]),
      facts: { mode, target: answer, letter: l.glyph, harakah: h.name, roman },
      print: { kind: 'circle-arabic', say: `${roman} (${l.roman.split(' ')[0]} with ${h.name})` }
    };
  }
  throw new Error(`arabic: unknown mode ${mode}`);
}

// Recording keys for the Arabic lessons: each letter's name, and each letter with each
// short vowel. Joined letters and the muqatta'at are read as a run of letter names.
export const nameKey = glyph => `name:${glyph}`;
export const sylKey = syllable => `syl:${syllable}`;
export function arabicPieces() {
  return [...LETTERS.map(l => ({ key: nameKey(l.glyph), say: l.glyph, note: `The letter name: ${l.roman}`, group: 'n' })),
    ...LETTERS.filter(l => !['ا', 'ء'].includes(l.glyph)).flatMap(l => HARAKAT.map(h => ({ key: sylKey(l.glyph + h.mark), say: l.glyph + h.mark, note: `The sound ${l.c}${h.sound} (${h.name})`, group: 'v' })))];
}
export function piecesFor(item) {
  if (item.facts.mode === 'harakat') return [sylKey(item.answer)];
  return [...item.answer].map(nameKey);
}
