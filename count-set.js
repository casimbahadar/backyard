import { COUNTERS, NUMBER_WORDS } from './vocab.js';
import { nearNumbers } from './util.js';

export const id = 'count-set';

export function make(params, rng) {
  const { mode, min, max } = params;
  if (mode === 'how-many') {
    const n = rng.int(Math.max(min, 1), max);
    const counter = rng.pick(COUNTERS);
    const distractors = nearNumbers(n, Math.max(min, 1), max, 3, rng);
    return {
      template: id, key: `${counter.id}:${n}`,
      prompt: { text: `How many ${counter.many}?`, speech: `How many ${counter.many}?` },
      answer: n, distractors, choices: rng.shuffle([n, ...distractors]),
      facts: { numbers: [n], range: [min, max] },
      print: { kind: 'count-and-write', counter: counter.id, n }
    };
  }
  if (mode === 'count-on') {
    const start = rng.int(min, max - 3);
    const shown = [start, start + 1, start + 2];
    const answer = start + 3;
    const distractors = nearNumbers(answer, min, max, 3, rng);
    const spoken = shown.map(x => NUMBER_WORDS[x]);
    spoken[0] = spoken[0][0].toUpperCase() + spoken[0].slice(1);
    return {
      template: id, key: `on:${start}`,
      prompt: { text: 'What number comes next?', speech: `${spoken.join(', ')}. What number comes next?` },
      answer, distractors, choices: rng.shuffle([answer, ...distractors]),
      facts: { numbers: [...shown, answer], range: [min, max] },
      print: { kind: 'sequence-write-next', shown }
    };
  }
  if (mode === 'tens-ones') {
    // Bigger numbers shown as tens rods and loose ones, the way Grade 1 classrooms show them.
    const n = rng.int(Math.max(min, 11), max);
    const distractors = nearNumbers(n, Math.max(min, 1), max, 3, rng);
    return {
      template: id, key: `tens:${n}`,
      prompt: { text: 'How many in all?', speech: 'Count the tens and the ones. How many in all?' },
      answer: n, distractors, choices: rng.shuffle([n, ...distractors]),
      facts: { numbers: [n], range: [min, max], tens: Math.floor(n / 10), ones: n % 10 },
      print: { kind: 'tens-ones-write', tens: Math.floor(n / 10), ones: n % 10 }
    };
  }
  if (mode === 'skip') {
    const step = rng.pick(params.steps);
    const start = step * rng.int(0, Math.floor(max / step) - 3);
    const shown = [start, start + step, start + 2 * step];
    const answer = start + 3 * step;
    const pool = [answer - 1, answer + 1, answer + step, answer - 2 * step, answer + 2].filter(x => x >= min && x <= max && x !== answer);
    const distractors = rng.shuffle([...new Set(pool)]).slice(0, 3);
    const by = { 1: 'ones', 2: 'twos', 5: 'fives', 10: 'tens' }[step];
    const spoken = shown.map(x => NUMBER_WORDS[x]);
    spoken[0] = spoken[0][0].toUpperCase() + spoken[0].slice(1);
    return {
      template: id, key: `skip:${step}:${start}`,
      prompt: { text: 'What number comes next?', speech: `Count by ${by}. ${spoken.join(', ')}. What number comes next?` },
      answer, distractors, choices: rng.shuffle([answer, ...distractors]),
      facts: { numbers: [...shown, answer], range: [min, max], step },
      print: { kind: 'sequence-write-next', shown, step }
    };
  }
  throw new Error(`count-set: unknown mode ${mode}`);
}
