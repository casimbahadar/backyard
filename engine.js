import { hashString, makeRng } from './prng.js';
import * as countSet from './count-set.js';
import * as compare from './compare.js';
import * as numberFacts from './number-facts.js';
import * as patternNext from './pattern-next.js';
import * as nameShape from './name-shape.js';
import * as hearFirstSound from './hear-first-sound.js';
import * as blendWord from './blend-word.js';
import * as readCvc from './read-cvc.js';
import * as spellCvc from './spell-cvc.js';
import * as readSentence from './read-sentence.js';
import * as traceLetter from './trace-letter.js';
import * as measure from './measure.js';
import * as belongs from './belongs.js';
import * as money from './money.js';
import * as fixSentence from './fix-sentence.js';
import * as sightWord from './sight-word.js';
import * as arabic from './arabic.js';

export const TEMPLATES = Object.fromEntries(
  [countSet, compare, numberFacts, patternNext, nameShape,
    hearFirstSound, blendWord, readCvc, spellCvc, readSentence, traceLetter, measure, belongs, money, fixSentence, sightWord, arabic].map(m => [m.id, m])
);

// Builds count items for one skill from one seed. The same seed string always
// gives the same items, which is how a printed sheet ID regenerates its questions.
// ctx describes the child (taught sounds and words, words she can read). It is part
// of the seed, so a sheet record must store it to regenerate the same questions.
// Returns an empty list when the child cannot do this skill yet.
export function generate(skill, seed, count, ctx = null) {
  const tpl = TEMPLATES[skill.template];
  if (!tpl) throw new Error(`template not built: ${skill.template}`);
  if (tpl.available && !tpl.available(skill.params, ctx)) return [];
  const ctxPart = ctx ? `|${hashString(JSON.stringify(ctx))}` : '';
  const rng = makeRng(hashString(`${seed}|${skill.template}|${JSON.stringify(skill.params)}${ctxPart}`));
  const items = [];
  const seen = new Set();
  for (let i = 0; i < count; i++) {
    let item = tpl.make(skill.params, rng, ctx);
    for (let tries = 0; seen.has(item.key) && tries < 50; tries++) item = tpl.make(skill.params, rng, ctx);
    if (seen.has(item.key)) {
      // Every item has been used once. Start a fresh round, but never repeat the last one.
      const last = items[items.length - 1].key;
      seen.clear();
      seen.add(last);
      for (let tries = 0; seen.has(item.key) && tries < 50; tries++) item = tpl.make(skill.params, rng, ctx);
    }
    seen.add(item.key);
    items.push(item);
  }
  return items;
}
