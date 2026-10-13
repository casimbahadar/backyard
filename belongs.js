// Sorting by one attribute (Grade 1 E1.1): a small group shares one rule, and she
// picks the one choice that follows it. Every question keeps the other attributes
// the same, so only one rule can explain the group.
export const id = 'belongs';

export const SOLIDS = { cube: false, pyramid: false, prism: false, sphere: true, cone: true, cylinder: true }; // true = can roll
const QUADS = ['square', 'rectangle', 'rhombus', 'trapezoid'];
const NOT_QUADS = ['circle', 'triangle', 'hexagon'];
const FLATS = [...QUADS, ...NOT_QUADS];

export function make(params, rng) {
  const rule = rng.pick(params.rules);
  let group, answer, distractors;
  if (rule === 'solid') {
    const solids = rng.shuffle(Object.keys(SOLIDS));
    group = solids.slice(0, 3); answer = solids[3];
    distractors = rng.shuffle(FLATS).slice(0, 2);
  } else if (rule === 'four-sides') {
    const q = rng.shuffle(QUADS);
    group = q.slice(0, 3); answer = q[3];
    distractors = rng.shuffle(NOT_QUADS).slice(0, 2);
  } else {
    // rolls, or does not roll: solids only, so "solid" cannot be the rule.
    const rolls = rule === 'rolls';
    const yes = rng.shuffle(Object.keys(SOLIDS).filter(k => SOLIDS[k] === rolls));
    const no = rng.shuffle(Object.keys(SOLIDS).filter(k => SOLIDS[k] !== rolls));
    group = yes.slice(0, 2); answer = yes[2];
    distractors = no.slice(0, 2);
  }
  const q = 'Which one belongs with these?';
  return {
    template: id, key: `${rule}:${group.slice().sort().join(',')}:${answer}`,
    prompt: { text: q, speech: q },
    answer, distractors, choices: rng.shuffle([answer, ...distractors]),
    facts: { rule, group },
    print: { kind: 'circle-belongs', group, text: 'Circle the one that belongs with the group.' }
  };
}
