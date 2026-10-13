// Sight words (Grade 1 B2.8): she hears a word and taps it among four printed ones.
// The words are her taught words, the short common ones read by sight.
export const id = 'sight-word';

export function available(params, ctx) { return (ctx?.taughtWords ?? []).length >= 4; }

export function make(params, rng, ctx) {
  const words = [...new Set(ctx.taughtWords)];
  const pool = rng.shuffle(words);
  const answer = pool[0];
  const distractors = pool.slice(1, 4);
  return {
    template: id, key: `sight:${answer}`,
    prompt: { text: 'Tap the word you hear.', speech: `Tap the word: ${answer}.` },
    answer, distractors, choices: rng.shuffle([answer, ...distractors]),
    facts: { word: answer },
    print: { kind: 'circle-word', text: 'Circle the word you hear.' }
  };
}
