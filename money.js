// Canadian coins and bills (Grade 1 F1.1): find one by name, or pick which of two is
// worth more. Values in cents. There is no penny: Canada stopped making it in 2012.
export const id = 'money';

export const MONEY = {
  nickel: { value: 5, name: 'nickel', kind: 'coin' },
  dime: { value: 10, name: 'dime', kind: 'coin' },
  quarter: { value: 25, name: 'quarter', kind: 'coin' },
  fifty: { value: 50, name: 'fifty-cent coin', kind: 'coin' },
  loonie: { value: 100, name: 'loonie', kind: 'coin' },
  toonie: { value: 200, name: 'toonie', kind: 'coin' },
  five: { value: 500, name: 'five-dollar bill', kind: 'bill' },
  ten: { value: 1000, name: 'ten-dollar bill', kind: 'bill' },
  twenty: { value: 2000, name: 'twenty-dollar bill', kind: 'bill' },
  fiftyBill: { value: 5000, name: 'fifty-dollar bill', kind: 'bill' }
};

export function make(params, rng) {
  const ids = params.items;
  const mode = rng.pick(params.modes);
  if (mode === 'find') {
    const pool = rng.shuffle(ids);
    const answer = pool[0];
    const distractors = pool.slice(1, 3);
    const q = `Tap the ${MONEY[answer].name}.`;
    return {
      template: id, key: `find:${answer}`,
      prompt: { text: 'Find the one you hear.', speech: q },
      answer, distractors, choices: rng.shuffle([answer, ...distractors]),
      facts: { mode, target: answer },
      print: { kind: 'circle-money', items: null, text: `Circle the ${MONEY[answer].name}.` }
    };
  }
  // Worth more. Half the time the two are a small coin worth more and a bigger coin
  // worth less (the dime and the nickel), since size is not value.
  let a, b;
  if (ids.includes('dime') && ids.includes('nickel') && rng.int(1, 4) === 1) [a, b] = rng.shuffle(['dime', 'nickel']);
  else { [a, b] = rng.shuffle(ids).slice(0, 2); }
  const answer = MONEY[a].value > MONEY[b].value ? a : b;
  const q = 'Which one is worth more?';
  return {
    template: id, key: `more:${[a, b].sort().join(':')}`,
    prompt: { text: q, speech: q },
    answer, distractors: [answer === a ? b : a], choices: [a, b],
    facts: { mode: 'more', values: { [a]: MONEY[a].value, [b]: MONEY[b].value } },
    print: { kind: 'circle-money', items: null, text: 'Circle the one that is worth more.' }
  };
}
