import { COUNTERS, NUMBER_WORDS } from './vocab.js';

export const id = 'compare';

export function make(params, rng) {
  const { mode, min, max, allowEqual } = params;
  const ask = rng.pick(['more', 'less']);
  if (mode === 'sets') {
    const a = rng.int(min, max);
    let b = rng.int(min, max);
    while (!allowEqual && b === a) b = rng.int(min, max);
    const counter = rng.pick(COUNTERS);
    const sides = allowEqual ? ['left', 'right', 'same'] : ['left', 'right'];
    let answer;
    if (a === b) answer = 'same';
    else if (ask === 'more') answer = a > b ? 'left' : 'right';
    else answer = a < b ? 'left' : 'right';
    const q = `Which group has ${ask}?`;
    return {
      template: id, key: `sets:${a}:${b}:${ask}`,
      prompt: { text: q, speech: q },
      answer, distractors: sides.filter(s => s !== answer), choices: sides, fixedOrder: true,
      facts: { numbers: [a, b], range: [min, max] },
      print: { kind: 'circle-group', counter: counter.id, left: a, right: b, ask }
    };
  }
  if (mode === 'numerals') {
    const a = rng.int(min, max);
    let b = rng.int(min, max);
    while (b === a) b = rng.int(min, max);
    const word = ask === 'more' ? 'bigger' : 'smaller';
    const answer = ask === 'more' ? Math.max(a, b) : Math.min(a, b);
    return {
      template: id, key: `num:${a}:${b}:${ask}`,
      prompt: { text: `Which number is ${word}?`, speech: `Which number is ${word}, ${NUMBER_WORDS[a]} or ${NUMBER_WORDS[b]}?` },
      answer, distractors: [answer === a ? b : a], choices: [a, b],
      facts: { numbers: [a, b], range: [min, max] },
      print: { kind: 'circle-number', left: a, right: b, ask: word }
    };
  }
  throw new Error(`compare: unknown mode ${mode}`);
}
