import { PATTERN_PIECES } from './vocab.js';

export const id = 'pattern-next';
const QUESTIONS = { next: 'What comes next?', before: 'What comes first?', missing: 'What is missing?' };

export function make(params, rng) {
  const core = rng.pick(params.cores);
  const letters = [...new Set(core)];
  const pieces = rng.shuffle(PATTERN_PIECES);
  const map = Object.fromEntries(letters.map((l, i) => [l, pieces[i].id]));
  const outside = pieces[letters.length].id;
  const where = params.missing ? rng.pick(['next', 'before', 'missing']) : rng.pick(params.direction === 'both' ? ['next', 'before'] : ['next']);
  const len = core.length * 2 + rng.int(1, core.length);
  const full = [];
  for (let i = 0; i < len + 1; i++) full.push(map[core[i % core.length]]);
  let shown, answer, blank;
  if (where === 'next') { shown = full.slice(0, len); answer = full[len]; blank = len; }
  else if (where === 'before') { shown = full.slice(1, len + 1); answer = full[0]; blank = 0; }
  else {
    shown = full.slice(0, len);
    blank = rng.int(0, len - 1);
    answer = shown[blank];
  }
  const distractors = rng.shuffle([...letters.map(l => map[l]).filter(p => p !== answer), outside]).slice(0, 2);
  const q = QUESTIONS[where];
  return {
    template: id, key: `${core}:${where}:${len}:${blank}:${answer}`,
    prompt: { text: q, speech: q },
    answer, distractors, choices: rng.shuffle([answer, ...distractors]),
    facts: { core, where, shown, blank },
    print: { kind: 'pattern-draw', shown, where, blank }
  };
}
