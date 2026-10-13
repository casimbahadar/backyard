import { NUMBER_WORDS } from './vocab.js';
import { nearNumbers } from './util.js';

export const id = 'number-facts';
const MINUS = '\u2212';

export function make(params, rng) {
  const { ops, maxTotal } = params;
  const op = rng.pick(ops);
  // Facts with a zero are real facts but easy, so they get about 1 item in 5,
  // and 0 + 0 never appears. Otherwise both numbers are at least 1.
  let total, part;
  if (rng.int(1, 5) === 1) {
    total = rng.int(1, maxTotal);
    part = rng.pick([0, total]);
  } else {
    total = rng.int(2, maxTotal);
    part = rng.int(1, total - 1);
  }
  let text, speech, answer, numbers;
  if (op === 'add') {
    const other = total - part;
    text = `${part} + ${other} = ?`;
    speech = `What is ${NUMBER_WORDS[part]} plus ${NUMBER_WORDS[other]}?`;
    answer = total; numbers = [part, other, total];
  } else if (op === 'sub') {
    text = `${total} ${MINUS} ${part} = ?`;
    speech = `What is ${NUMBER_WORDS[total]} take away ${NUMBER_WORDS[part]}?`;
    answer = total - part; numbers = [total, part, answer];
  } else throw new Error(`number-facts: unknown op ${op}`);
  const distractors = nearNumbers(answer, 0, maxTotal, 3, rng);
  return {
    template: id, key: `${op}:${numbers.join(',')}`,
    prompt: { text, speech, kind: 'equation' },
    answer, distractors, choices: rng.shuffle([answer, ...distractors]),
    facts: { numbers, range: [0, maxTotal], op },
    print: { kind: 'equation-write', text }
  };
}
