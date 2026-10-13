import { WORDS, lookAlike } from './words.js';
import { decodable, isTaughtWord, readableWords } from './taught.js';

export const id = 'read-sentence';

// Every sentence is built from scene facts the engine holds (who, where, what),
// and both pictures are drawn from facts, so the right picture is the only one
// the sentence describes.
const fits = (a, rel, b) => a !== b && !lookAlike(a.word, b.word) &&
  (rel === 'in' ? a.size <= b.holds : a.size <= b.carries);

export function canUse(word, ctx) {
  const entry = WORDS.find(x => x.word === word);
  if (entry) return decodable(entry, ctx);
  const tiny = { in: [['i', 'i'], ['n', 'n']], on: [['o', 'o'], ['n', 'n']], at: [['a', 'a'], ['t', 't']] }[word];
  if (tiny) return decodable({ graphemes: tiny.map(t => t[0]), phonemes: tiny.map(t => t[1]) }, ctx);
  return isTaughtWord(word, ctx);
}

// Working out every possible scene is slow with many words, and it depends only on
// the taught set and the word shapes, so each answer is kept and reused.
const sceneCache = new Map();
export function sceneOptions(ctx, shapes) {
  const key = `${ctx.taughtOrder.slice(0, ctx.taughtCount).map(g => g.grapheme + g.phoneme).join(',')}|${(ctx.taughtWords ?? []).join(',')}|${shapes ?? ''}`;
  if (!sceneCache.has(key)) sceneCache.set(key, computeScenes(ctx, shapes));
  return sceneCache.get(key);
}
function computeScenes(ctx, shapes) {
  const nouns = readableWords(ctx, shapes);
  const out = [];
  for (const rel of ['in', 'on']) {
    if (!canUse(rel, ctx) || !canUse('the', ctx) || !canUse('is', ctx)) continue;
    for (const a of nouns) if (a.subject) for (const b of nouns) if (fits(a, rel, b)) out.push({ a, rel, b });
  }
  return out.filter(s => swaps(s).length > 0 || fits(s.a, other(s.rel), s.b));
}

const other = rel => (rel === 'in' ? 'on' : 'in');
// Other things that could sit in the same place, for the wrong picture.
const swaps = s => WORDS.filter(x => x.subject && x !== s.a && !lookAlike(x.word, s.a.word) && fits(x, s.rel, s.b));

export function seeOptions(ctx, shapes) {
  return NOUN_FRAMES.some(f => frameReady(f, ctx)) ? readableWords(ctx, shapes) : [];
}

// Sentences about one thing. Each needs all its words readable or taught; with only the
// kindergarten words, "I see a" is the one that fits.
const NOUN_FRAMES = [['I', 'see', 'a'], ['We', 'see', 'a'], ['You', 'see', 'a'], ['They', 'see', 'a'], ['Look', 'at', 'the'], ['Here', 'is', 'a']];
const frameReady = (f, ctx) => f.every(x => canUse(x, ctx));

export function available(params, ctx) {
  return sceneOptions(ctx, params.shapes).length > 0 || seeOptions(ctx, params.shapes).length > 0;
}

export function make(params, rng, ctx) {
  const scenes = sceneOptions(ctx, params.shapes);
  const sees = seeOptions(ctx, params.shapes);
  const useScene = scenes.length > 0 && (sees.length === 0 || rng.int(1, 3) > 1);
  let sentence, answer, distractor;
  if (useScene) {
    const s = rng.pick(scenes);
    // "My" can lead once it is a taught word.
    const lead = canUse('my', ctx) && rng.int(0, 2) === 0 ? 'My' : 'The';
    sentence = `${lead} ${s.a.word} is ${s.rel} the ${s.b.word}.`;
    answer = { a: s.a.word, rel: s.rel, b: s.b.word };
    // Prefer the same two things with the place swapped, which only reading tells apart.
    if (fits(s.a, other(s.rel), s.b)) distractor = { a: s.a.word, rel: other(s.rel), b: s.b.word };
    else distractor = { a: rng.pick(swaps(s)).word, rel: s.rel, b: s.b.word };
  } else {
    const n = rng.pick(sees);
    const frame = rng.pick(NOUN_FRAMES.filter(f => frameReady(f, ctx)));
    sentence = `${frame.join(' ')} ${n.word}.`;
    answer = { a: n.word };
    const others = WORDS.filter(x => x !== n && !lookAlike(x.word, n.word));
    distractor = { a: rng.pick(others).word };
  }
  const choices = rng.shuffle([answer, distractor]);
  return {
    template: id, key: `sent:${sentence}`,
    prompt: { text: 'Read it. Tap the picture that matches.', speech: 'Read it. Tap the picture that matches.' },
    read: sentence,
    answer, distractors: [distractor], choices,
    facts: { sentence },
    print: { kind: 'sentence-circle-picture', sentence, pictures: choices, text: 'Read the sentence. Circle the picture that matches.' }
  };
}
