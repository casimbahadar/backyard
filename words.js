// The picture words: 42 three-letter, 23 four-letter (approved 2026-10-11) and 14 silent-e
// words (approved 2026-10-12).
// Every word needs sticker art.
// Each word lists its letters and sounds explicitly, so no code has to guess
// that the c in cat sounds like k, or that box ends in two sounds.
// size: 1 small, 2 medium, 3 large. holds and carries give the largest size that
// fits in it or sits on it, and 0 means it cannot. subject marks words that can
// start a sentence like "The cat is in the box." A bed and a ship only carry
// things, because in and on look the same when drawn on either.

const w = (word, graphemes, phonemes, size, holds = 0, carries = 0, subject = false) =>
  ({ word, graphemes, phonemes, size, holds, carries, subject });

export const WORDS = [
  w('hat', ['h', 'a', 't'], ['h', 'a', 't'], 2, 0, 1, true),
  w('map', ['m', 'a', 'p'], ['m', 'a', 'p'], 1, 0, 0, true),
  w('fan', ['f', 'a', 'n'], ['f', 'a', 'n'], 2),
  w('can', ['c', 'a', 'n'], ['k', 'a', 'n'], 1, 1, 0, true),
  w('pan', ['p', 'a', 'n'], ['p', 'a', 'n'], 2, 1, 0, true),
  w('van', ['v', 'a', 'n'], ['v', 'a', 'n'], 3, 2, 2),
  w('bag', ['b', 'a', 'g'], ['b', 'a', 'g'], 2, 2, 0, true),
  w('jam', ['j', 'a', 'm'], ['j', 'a', 'm'], 1, 0, 0, true),
  w('cat', ['c', 'a', 't'], ['k', 'a', 't'], 2, 0, 0, true),
  w('bed', ['b', 'e', 'd'], ['b', 'e', 'd'], 3, 0, 2),
  w('hen', ['h', 'e', 'n'], ['h', 'e', 'n'], 2, 0, 0, true),
  w('pen', ['p', 'e', 'n'], ['p', 'e', 'n'], 1, 0, 0, true),
  w('net', ['n', 'e', 't'], ['n', 'e', 't'], 2, 1),
  w('jet', ['j', 'e', 't'], ['j', 'e', 't'], 3),
  w('web', ['w', 'e', 'b'], ['w', 'e', 'b'], 2),
  w('leg', ['l', 'e', 'g'], ['l', 'e', 'g'], 2),
  w('pig', ['p', 'i', 'g'], ['p', 'i', 'g'], 2, 0, 0, true),
  w('bib', ['b', 'i', 'b'], ['b', 'i', 'b'], 1, 0, 0, true),
  w('wig', ['w', 'i', 'g'], ['w', 'i', 'g'], 1, 0, 0, true),
  w('lid', ['l', 'i', 'd'], ['l', 'i', 'd'], 1),
  w('dog', ['d', 'o', 'g'], ['d', 'o', 'g'], 2, 0, 0, true),
  w('pot', ['p', 'o', 't'], ['p', 'o', 't'], 2, 1, 0, true),
  w('mop', ['m', 'o', 'p'], ['m', 'o', 'p'], 3),
  w('box', ['b', 'o', 'x'], ['b', 'o', 'ks'], 2, 2, 2, true),
  w('fox', ['f', 'o', 'x'], ['f', 'o', 'ks'], 2, 0, 0, true),
  w('log', ['l', 'o', 'g'], ['l', 'o', 'g'], 3, 0, 2),
  w('sun', ['s', 'u', 'n'], ['s', 'u', 'n'], 3),
  w('bug', ['b', 'u', 'g'], ['b', 'u', 'g'], 1, 0, 0, true),
  w('cup', ['c', 'u', 'p'], ['k', 'u', 'p'], 1, 1, 0, true),
  w('bus', ['b', 'u', 's'], ['b', 'u', 's'], 3, 2),
  w('nut', ['n', 'u', 't'], ['n', 'u', 't'], 1, 0, 0, true),
  w('rug', ['r', 'u', 'g'], ['r', 'u', 'g'], 3, 0, 2),
  w('tub', ['t', 'u', 'b'], ['t', 'u', 'b'], 3, 2),
  w('gum', ['g', 'u', 'm'], ['g', 'u', 'm'], 1, 0, 0, true),
  w('jug', ['j', 'u', 'g'], ['j', 'u', 'g'], 2, 1, 0, true),
  w('fish', ['f', 'i', 'sh'], ['f', 'i', 'sh'], 1, 0, 0, true),
  w('ship', ['sh', 'i', 'p'], ['sh', 'i', 'p'], 3, 0, 2),
  w('shed', ['sh', 'e', 'd'], ['sh', 'e', 'd'], 3, 2),
  w('duck', ['d', 'u', 'ck'], ['d', 'u', 'k'], 2, 0, 0, true),
  w('sock', ['s', 'o', 'ck'], ['s', 'o', 'k'], 1, 0, 0, true),
  w('rock', ['r', 'o', 'ck'], ['r', 'o', 'k'], 2, 0, 2, true),
  w('chick', ['ch', 'i', 'ck'], ['ch', 'i', 'k'], 1, 0, 0, true),
  // Four-letter words, approved 2026-10-11. Ontario teaches reading these in Grade 1.
  w('flag', ['f', 'l', 'a', 'g'], ['f', 'l', 'a', 'g'], 2, 0, 0, true),
  w('crab', ['c', 'r', 'a', 'b'], ['k', 'r', 'a', 'b'], 1, 0, 0, true),
  w('hand', ['h', 'a', 'n', 'd'], ['h', 'a', 'n', 'd'], 2, 0, 1),
  w('lamp', ['l', 'a', 'm', 'p'], ['l', 'a', 'm', 'p'], 2, 0, 0, true),
  w('clam', ['c', 'l', 'a', 'm'], ['k', 'l', 'a', 'm'], 1, 0, 0, true),
  w('mask', ['m', 'a', 's', 'k'], ['m', 'a', 's', 'k'], 1, 0, 0, true),
  w('raft', ['r', 'a', 'f', 't'], ['r', 'a', 'f', 't'], 3, 0, 2),
  w('nest', ['n', 'e', 's', 't'], ['n', 'e', 's', 't'], 2, 1),
  w('tent', ['t', 'e', 'n', 't'], ['t', 'e', 'n', 't'], 3, 2),
  w('desk', ['d', 'e', 's', 'k'], ['d', 'e', 's', 'k'], 3, 0, 2),
  w('belt', ['b', 'e', 'l', 't'], ['b', 'e', 'l', 't'], 1, 0, 0, true),
  w('sled', ['s', 'l', 'e', 'd'], ['s', 'l', 'e', 'd'], 3, 0, 2),
  w('vest', ['v', 'e', 's', 't'], ['v', 'e', 's', 't'], 1, 0, 0, true),
  w('gift', ['g', 'i', 'f', 't'], ['g', 'i', 'f', 't'], 2, 0, 0, true),
  w('milk', ['m', 'i', 'l', 'k'], ['m', 'i', 'l', 'k'], 1, 0, 0, true),
  w('crib', ['c', 'r', 'i', 'b'], ['k', 'r', 'i', 'b'], 3, 2),
  w('twig', ['t', 'w', 'i', 'g'], ['t', 'w', 'i', 'g'], 1, 0, 0, true),
  w('frog', ['f', 'r', 'o', 'g'], ['f', 'r', 'o', 'g'], 1, 0, 0, true),
  w('pond', ['p', 'o', 'n', 'd'], ['p', 'o', 'n', 'd'], 3, 2),
  w('stop', ['s', 't', 'o', 'p'], ['s', 't', 'o', 'p'], 3),
  w('drum', ['d', 'r', 'u', 'm'], ['d', 'r', 'u', 'm'], 2, 0, 1, true),
  w('plum', ['p', 'l', 'u', 'm'], ['p', 'l', 'u', 'm'], 1, 0, 0, true),
  w('slug', ['s', 'l', 'u', 'g'], ['s', 'l', 'u', 'g'], 1, 0, 0, true),
  // Silent-e words, approved 2026-10-12. The vowel says its name and the final e is
  // silent, written as the phoneme ''. Ontario teaches these in Grade 1.
  w('cake', ['c', 'a', 'k', 'e'], ['k', 'ā', 'k', ''], 2),
  w('rake', ['r', 'a', 'k', 'e'], ['r', 'ā', 'k', ''], 3),
  w('gate', ['g', 'a', 't', 'e'], ['g', 'ā', 't', ''], 3),
  w('snake', ['s', 'n', 'a', 'k', 'e'], ['s', 'n', 'ā', 'k', ''], 2),
  w('plate', ['p', 'l', 'a', 't', 'e'], ['p', 'l', 'ā', 't', ''], 2),
  w('bike', ['b', 'i', 'k', 'e'], ['b', 'ī', 'k', ''], 3),
  w('kite', ['k', 'i', 't', 'e'], ['k', 'ī', 't', ''], 2),
  w('hive', ['h', 'i', 'v', 'e'], ['h', 'ī', 'v', ''], 2),
  w('slide', ['s', 'l', 'i', 'd', 'e'], ['s', 'l', 'ī', 'd', ''], 3),
  w('rope', ['r', 'o', 'p', 'e'], ['r', 'ō', 'p', ''], 2),
  w('bone', ['b', 'o', 'n', 'e'], ['b', 'ō', 'n', ''], 1),
  w('nose', ['n', 'o', 's', 'e'], ['n', 'ō', 'z', ''], 2),
  w('rose', ['r', 'o', 's', 'e'], ['r', 'ō', 'z', ''], 1),
  w('cube', ['c', 'u', 'b', 'e'], ['k', 'ū', 'b', ''], 1)
];

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
// Word shape from its letters: frog is CCVC, lamp is CVCC, duck is CVC (ck is one
// consonant), cake is CVCe (a silent e is written e).
export const shapeOf = entry => entry.graphemes.map((g, i) => (entry.phonemes[i] === '' ? 'e' : VOWELS.has(g) ? 'V' : 'C')).join('');

// Words a skill may use, limited to the shapes its pack lists.
export const wordsOfShapes = (shapes) => (shapes ? WORDS.filter(x => shapes.includes(shapeOf(x))) : WORDS);

export const BY_WORD = Object.fromEntries(WORDS.map(x => [x.word, x]));

// Pictures used only in the first-sound game, approved 2026-10-11. She hears these
// and picks the first letter, but never has to read them, so only the first sound
// is recorded. They cover the vowels and the letters none of the 42 words start with.
const o = (word, grapheme, phoneme) => ({ word, first: grapheme, firstSound: phoneme });
export const OPENERS = [
  o('apple', 'a', 'a'), o('egg', 'e', 'e'), o('igloo', 'i', 'i'), o('octopus', 'o', 'o'),
  o('umbrella', 'u', 'u'), o('yo-yo', 'y', 'y'), o('zebra', 'z', 'z'),
  o('queen', 'qu', 'kw'), o('thumb', 'th', 'th'), o('wheel', 'wh', 'w')
];

// Every picture's first letter and first sound, for the first-sound game.
export const FIRST_SOUNDS = [
  ...WORDS.map(x => ({ word: x.word, first: x.graphemes[0], firstSound: x.phonemes[0] })),
  ...OPENERS
];

// Pictures that look too alike to sit in the same question.
export const LOOK_ALIKE = [['hen', 'chick'], ['pot', 'pan'], ['cup', 'jug'], ['dog', 'fox'], ['cup', 'can'], ['van', 'bus'], ['net', 'web'], ['twig', 'log'], ['raft', 'ship'], ['crib', 'bed'], ['cube', 'box'], ['rake', 'mop']];

export function lookAlike(a, b) {
  return LOOK_ALIKE.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}
