import { FIRST_SOUNDS } from './words.js';
import { taughtGraphemes } from './taught.js';

export const id = 'hear-first-sound';
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

// Graphemes that can open a word. ck, x and the s in has only end words.
function openers(ctx) {
  const seen = new Set();
  return taughtGraphemes(ctx).filter(g => {
    if ((g.position && g.position !== 'start') || seen.has(g.grapheme)) return false;
    seen.add(g.grapheme);
    return true;
  });
}

function startWords(ctx) {
  const ok = new Set(openers(ctx).map(g => `${g.grapheme}/${g.phoneme}`));
  return FIRST_SOUNDS.filter(x => ok.has(`${x.first}/${x.firstSound}`));
}

export function available(params, ctx) {
  if (params.prompt === 'letter-name') return true;
  const words = startWords(ctx);
  return words.length > 0 && openers(ctx).length >= 3;
}

export function make(params, rng, ctx) {
  if (params.prompt === 'letter-name') {
    const upper = params.letterCase === 'both' ? rng.int(0, 1) === 1 : params.letterCase === 'upper';
    const fix = l => (upper ? l.toUpperCase() : l);
    const letter = rng.pick(LETTERS);
    const distractors = rng.shuffle(LETTERS.filter(l => l !== letter)).slice(0, 3).map(fix);
    const answer = fix(letter);
    return {
      template: id, key: `name:${answer}`,
      prompt: { text: 'Find the letter you hear.', speech: `Find the letter ${answer}.` },
      answer, distractors, choices: rng.shuffle([answer, ...distractors]),
      facts: { mode: 'letter-name' },
      print: { kind: 'circle-letter', text: `Circle the letter ${answer}.` }
    };
  }
  const entry = rng.pick(startWords(ctx));
  const answer = entry.first;
  const sound = entry.firstSound;
  // Wrong choices never make the same sound anywhere in a word, so c is never
  // offered against k for kite, and s (as in has) never against z for zebra.
  const sameSound = new Set(taughtGraphemes(ctx).filter(g => g.phoneme === sound).map(g => g.grapheme));
  const pool = openers(ctx).filter(g => !sameSound.has(g.grapheme) && g.grapheme !== answer).map(g => g.grapheme);
  const distractors = rng.shuffle(pool).slice(0, 3);
  return {
    template: id, key: `first:${entry.word}`,
    prompt: { text: 'What does it start with?', speech: `${entry.word[0].toUpperCase()}${entry.word.slice(1)}. What does ${entry.word} start with?` },
    picture: entry.word,
    answer, distractors, choices: rng.shuffle([answer, ...distractors]),
    facts: { mode: 'first-sound', word: entry.word, sound },
    print: { kind: 'circle-first-letter', picture: entry.word, text: 'Circle the letter it starts with.' }
  };
}
