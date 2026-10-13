import { WORDS, lookAlike, wordsOfShapes } from './words.js';
import { decodable } from './taught.js';

export const id = 'blend-word';
const CONTINUOUS = new Set(['a', 'e', 'i', 'o', 'u', 'm', 's', 'f', 'n', 'l', 'r', 'v', 'z', 'sh', 'th']);

export function available() { return true; }

// Listening comes first, so blending works before she can read. Early on only
// words that open with a sound you can hold (mmm, sss) are used, as the Ministry
// continuum advises; stop sounds join once half the taught set is in.
function pool(params, ctx) {
  const early = params.continuousFirst && ctx.taughtCount < ctx.taughtOrder.length / 2;
  const words = wordsOfShapes(params.shapes);
  return early ? words.filter(x => CONTINUOUS.has(x.phonemes[0])) : words;
}

function shownAs(entry, ctx) {
  const read = (ctx.readWords ?? []).includes(entry.word);
  return read && decodable(entry, ctx) ? 'word' : 'picture';
}

export function make(params, rng, ctx) {
  const entry = rng.pick(pool(params, ctx));
  const sharesSound = WORDS.filter(x => x !== entry && !lookAlike(x.word, entry.word) && x.phonemes.some(p => entry.phonemes.includes(p)));
  const first = rng.pick(sharesSound);
  const second = rng.pick(sharesSound.filter(x => x !== first && !lookAlike(x.word, first.word)));
  const answer = entry.word;
  const distractors = [first.word, second.word];
  const choices = rng.shuffle([answer, ...distractors]);
  const show = Object.fromEntries(choices.map(c => [c, shownAs(WORDS.find(x => x.word === c), ctx)]));
  const allWords = choices.every(c => show[c] === 'word');
  return {
    template: id, key: `blend:${answer}`,
    prompt: { text: 'Put the sounds together.', speech: 'Listen. Put the sounds together. Which one is it?', sounds: entry.phonemes },
    answer, distractors, choices, show,
    facts: { word: answer, phonemes: entry.phonemes },
    print: allWords
      ? { kind: 'match-word-to-picture', words: choices, text: 'Draw a line from each word to its picture.' }
      : { kind: 'sound-boxes-circle', boxes: entry.phonemes.length, pictures: choices, show, text: 'Say the sounds. Circle the picture.' }
  };
}
