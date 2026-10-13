// Capitals and end marks (Grade 1 B3.3): three versions of one sentence, only one
// written the right way. The others drop the capital, drop the end mark, or use the
// wrong one. Every word in them is one she can already read.
import { sceneOptions, seeOptions, canUse } from './read-sentence.js';

export const id = 'fix-sentence';

export function available(params, ctx) {
  return sceneOptions(ctx, params.shapes).length > 0 || seeOptions(ctx, params.shapes).length > 0;
}

function sentence(rng, params, ctx) {
  const scenes = sceneOptions(ctx, params.shapes);
  const sees = seeOptions(ctx, params.shapes);
  if (scenes.length && (!sees.length || rng.int(0, 1) === 1)) {
    const s = rng.pick(scenes);
    // A question when "is" can lead the sentence: "Is the cat in the box?"
    if (rng.int(0, 2) === 0) return { words: ['is', 'the', s.a.word, s.rel, 'the', s.b.word], mark: '?' };
    return { words: ['the', s.a.word, 'is', s.rel, 'the', s.b.word], mark: '.' };
  }
  return { words: ['I', 'see', 'a', rng.pick(sees).word], mark: '.' };
}

const cap = w => w[0].toUpperCase() + w.slice(1);
const join = (words, capital, mark) => [capital ? cap(words[0]) : words[0], ...words.slice(1)].join(' ') + mark;

export function make(params, rng, ctx) {
  const { words, mark } = sentence(rng, params, ctx);
  const right = join(words, true, mark);
  const other = mark === '?' ? '.' : '?';
  // "I" is always a capital, so a sentence starting with I cannot lose its capital.
  const wrongs = [join(words, true, ''), join(words, true, other)];
  if (words[0] !== 'I') wrongs.push(join(words, false, mark));
  const distractors = rng.shuffle(wrongs).slice(0, 2);
  return {
    template: id, key: `fix:${right}`,
    prompt: { text: 'Which one is written the right way?', speech: 'Which one is written the right way?' },
    answer: right, distractors, choices: rng.shuffle([right, ...distractors]),
    facts: { words, mark },
    print: { kind: 'circle-sentence', text: 'Circle the sentence that is written the right way.' }
  };
}
