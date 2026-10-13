import { readableWords, taughtGraphemes } from './taught.js';

export const id = 'spell-cvc';

export function available(params, ctx) { return readableWords(ctx, params.shapes).length >= 1; }

export function make(params, rng, ctx) {
  const entry = rng.pick(readableWords(ctx, params.shapes));
  // Extra tiles never make a sound that is in the word, so no other spelling
  // of the same sounds (kat for cat) can be built from the tiles.
  const used = new Set(entry.phonemes);
  const seen = new Set(entry.graphemes);
  const extras = [];
  for (const g of rng.shuffle(taughtGraphemes(ctx))) {
    if (extras.length === 3) break;
    if (used.has(g.phoneme) || seen.has(g.grapheme)) continue;
    seen.add(g.grapheme);
    extras.push(g.grapheme);
  }
  const answer = entry.graphemes;
  return {
    template: id, key: `spell:${entry.word}`,
    prompt: { text: 'Spell the word.', speech: `Can you spell ${entry.word}?` },
    picture: entry.word,
    answer, distractors: extras, tiles: rng.shuffle([...answer, ...extras]),
    facts: { word: entry.word, phonemes: entry.phonemes },
    print: { kind: 'picture-write-letters', picture: entry.word, boxes: answer.length, text: 'Say the word. Write one letter for each sound.' }
  };
}
