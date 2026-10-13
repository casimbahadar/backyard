// What the child has been taught, read from the context the app passes in:
// ctx.taughtOrder (the pack's order), ctx.taughtCount, ctx.taughtWords, ctx.readWords.
import { wordsOfShapes } from './words.js';

export function taughtPairs(ctx) {
  return new Set(ctx.taughtOrder.slice(0, ctx.taughtCount).map(g => `${g.grapheme}/${g.phoneme}`));
}

export function taughtGraphemes(ctx) {
  return ctx.taughtOrder.slice(0, ctx.taughtCount);
}

// A word can be shown in print only if every letter-sound in it has been taught.
export function decodable(entry, ctx) {
  const pairs = taughtPairs(ctx);
  return entry.graphemes.every((g, i) => pairs.has(`${g}/${entry.phonemes[i]}`));
}

export function readableWords(ctx, shapes) {
  return wordsOfShapes(shapes).filter(x => decodable(x, ctx));
}

export function isTaughtWord(word, ctx) {
  return (ctx.taughtWords ?? []).some(t => t.toLowerCase() === word.toLowerCase());
}
