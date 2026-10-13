export const id = 'trace-letter';
export const paperOnly = true;
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

export function available() { return true; }

export function make(params, rng) {
  const upper = params.letterCase === 'both' ? rng.int(0, 1) === 1 : params.letterCase === 'upper';
  const base = rng.pick(LETTERS);
  const letter = upper ? base.toUpperCase() : base;
  return {
    template: id, key: `trace:${letter}`, paperOnly: true,
    prompt: { text: `Trace the letter ${letter}.`, speech: `Trace the letter ${letter}.` },
    answer: letter, distractors: [], choices: [],
    facts: { letter },
    print: { kind: 'trace-letter', letter, guide: params.guide, text: `Trace the letter ${letter}.` }
  };
}
