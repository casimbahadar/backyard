// The child situations every harness run covers. Shared by test-generator.mjs
// and test-hash.js so Node and Safari generate exactly the same items.
import { WORDS } from './words.js';
import { readableWords } from './taught.js';

export const SEEDS_NO_CTX = 1000;
export const SEEDS_PER_CTX = 200;
export const PER_SET = 10;

// Math packs need no child context. Language packs are run at six points along
// the taught-sound order, each with no words read, every other readable word
// read, every readable word read, and every word read (after a rollback).
// packs maps a pack name (file name without .json) to the pack, so a pack that
// borrows another's taught set (taughtSetFrom) runs with that set.
export function contexts(pack, packs) {
  const source = pack.taughtSet ? pack : pack.taughtSetFrom ? packs[pack.taughtSetFrom] : null;
  if (!source) return [null];
  const order = source.taughtSet.order.concat(pack.taughtSetExtra?.order ?? []);
  const out = [];
  const points = [4, 8, 11, 15, 20, source.taughtSet.order.length];
  if (order.length > points.at(-1)) points.push(order.length);
  for (const taughtCount of points) {
    const base = { taughtOrder: order, taughtCount, taughtWords: source.taughtWords.words.concat(pack.taughtWordsExtra?.words ?? []), readWords: [] };
    const readable = readableWords(base).map(x => x.word);
    out.push(base);
    out.push({ ...base, readWords: readable.filter((_, i) => i % 2 === 0) });
    out.push({ ...base, readWords: readable });
    // A parent can move the taught sounds back after words were marked read.
    // Those words must go back to pictures until their sounds are taught again.
    out.push({ ...base, readWords: WORDS.map(x => x.word) });
  }
  return out;
}

export const ALL_WORDS = WORDS.map(x => x.word);
