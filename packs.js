// The packs this build ships. hash.js and the harnesses list the same files.
export const PACK_FILES = ['on-1-language', 'on-1-math', 'on-k-language', 'on-k-math'];

export async function loadPacks(base = './') {
  const out = {};
  for (const name of PACK_FILES) out[name] = await (await fetch(`${base}${name}.json`)).json();
  return out;
}

// The child context a language pack needs. Built in one place so a sheet made
// today and marked next week rebuild exactly the same context, and so the same seed.
export function childContext(pack, packs, child) {
  const source = pack.taughtSet ? pack : pack.taughtSetFrom ? packs[pack.taughtSetFrom] : null;
  if (!source) return null;
  return {
    taughtOrder: source.taughtSet.order.concat(pack.taughtSetExtra?.order ?? []),
    taughtCount: child.taughtCount,
    taughtWords: source.taughtWords.words.concat(pack.taughtWordsExtra?.words ?? []),
    readWords: child.readWords
  };
}

// Every taught sound a child can be given, kindergarten first, then Grade 1 additions.
export function fullTaughtOrder(packs) {
  return packs['on-k-language'].taughtSet.order.concat(packs['on-1-language']?.taughtSetExtra?.order ?? []);
}
