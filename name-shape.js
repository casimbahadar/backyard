import { SHAPE_NAMES } from './vocab.js';

export const id = 'name-shape';

export function make(params, rng) {
  const answer = rng.pick(params.shapes);
  const distractors = rng.shuffle(params.shapes.filter(s => s !== answer)).slice(0, 3);
  const name = SHAPE_NAMES[answer];
  return {
    template: id, key: answer,
    prompt: { text: `Tap the ${name}.`, speech: `Tap the ${name}.` },
    answer, distractors, choices: rng.shuffle([answer, ...distractors]),
    facts: {},
    print: { kind: 'colour-shape', text: `Colour the ${name}.` }
  };
}
