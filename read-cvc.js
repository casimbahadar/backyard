import { WORDS, lookAlike } from './words.js';
import { readableWords } from './taught.js';

export const id = 'read-cvc';

export function available(params, ctx) { return readableWords(ctx, params.shapes).length >= 1; }

export function make(params, rng, ctx) {
  const entry = rng.pick(readableWords(ctx, params.shapes));
  // Wrong pictures share a letter in the same place, so she has to read the
  // whole word rather than guess from the first letter.
  const near = WORDS.filter(x => x !== entry && !lookAlike(x.word, entry.word) && x.graphemes.some((g, i) => g === entry.graphemes[i]));
  const others = near.length >= 2 ? near : WORDS.filter(x => x !== entry && !lookAlike(x.word, entry.word));
  const a = rng.pick(others);
  const b = rng.pick(others.filter(x => x !== a && !lookAlike(x.word, a.word)));
  const answer = entry.word;
  const distractors = [a.word, b.word];
  return {
    template: id, key: `read:${answer}`,
    prompt: { text: 'Read the word. Tap its picture.', speech: 'Read the word. Tap its picture.' },
    read: answer,
    answer, distractors, choices: rng.shuffle([answer, ...distractors]),
    facts: { word: answer },
    print: { kind: 'word-circle-picture', word: answer, text: 'Read the word. Circle its picture.' }
  };
}
