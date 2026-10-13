// Comparing everyday things (Grade 1 E2.2): which is longer, heavier, or holds more.
// Length uses two drawn ribbons, so the answer is on screen. Weight and holding
// use pictures of familiar things whose sizes are far apart, so only one answer fits.
export const id = 'measure';

// Rough size classes, 1 to 5. Pairs are only asked when they differ by 2 or more.
export const HEAVY = { bus: 5, ship: 5, van: 5, bed: 4, desk: 4, log: 4, rock: 3, dog: 3, pig: 3, cat: 2, drum: 2, hat: 1, sock: 1, bug: 1, nut: 1, pen: 1, gum: 1, plum: 1 };
export const HOLDS = { tub: 5, pond: 5, pot: 3, jug: 3, bag: 3, box: 3, pan: 2, cup: 1, can: 1, nest: 1 };
const ASK = {
  length: [['longer', 'Which ribbon is longer?'], ['shorter', 'Which ribbon is shorter?']],
  mass: [['heavier', 'Which one is heavier?'], ['lighter', 'Which one is lighter?']],
  capacity: [['more', 'Which one holds more?'], ['less', 'Which one holds less?']]
};

export function make(params, rng) {
  const mode = rng.pick(params.modes);
  const [ask, q] = rng.pick(ASK[mode]);
  const bigger = ['longer', 'heavier', 'more'].includes(ask);
  if (mode === 'length') {
    const a = rng.int(2, 9);
    let b = rng.int(2, 9);
    while (Math.abs(a - b) < 2) b = rng.int(2, 9);
    const answer = (a > b) === bigger ? 'top' : 'bottom';
    return {
      template: id, key: `len:${a}:${b}:${ask}`,
      prompt: { text: q, speech: q },
      answer, distractors: [answer === 'top' ? 'bottom' : 'top'], choices: ['top', 'bottom'], fixedOrder: true,
      facts: { mode, ask, lengths: [a, b] },
      print: { kind: 'circle-ribbon', lengths: [a, b], text: `Circle the ribbon that is ${ask}.` }
    };
  }
  const table = mode === 'mass' ? HEAVY : HOLDS;
  const words = Object.keys(table);
  const x = rng.pick(words);
  const y = rng.pick(words.filter(w => Math.abs(table[w] - table[x]) >= 2));
  const answer = (table[x] > table[y]) === bigger ? x : y;
  const choices = rng.shuffle([x, y]);
  return {
    template: id, key: `${mode}:${[x, y].sort().join(':')}:${ask}`,
    prompt: { text: q, speech: q },
    answer, distractors: [answer === x ? y : x], choices,
    facts: { mode, ask, sizes: Object.fromEntries([[x, table[x]], [y, table[y]]]) },
    print: { kind: 'circle-picture-pair', pictures: choices, text: `Circle the one that ${mode === 'mass' ? 'is' : 'holds'} ${ask}.`.replace('holds more', 'holds more').replace('holds less', 'holds less') }
  };
}
