// The packs this build ships. hash.js and the harnesses list the same files.
export const PACK_FILES = ['on-1-language', 'on-1-math', 'on-k-language', 'on-k-math', 'noorani'];

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
  const order = source.taughtSet.order.concat(pack.taughtSetExtra?.order ?? []);
  // A parent can pick sounds one by one. The picked ones keep the pack's order, so the
  // templates see "the first N taught sounds" as they always have.
  const picked = Array.isArray(child.taughtSounds) ? order.filter((_, i) => child.taughtSounds.includes(i)) : null;
  const taughtWords = source.taughtWords.words.concat(pack.taughtWordsExtra?.words ?? []);
  // Sheets printed before sounds could be picked one by one must rebuild exactly, so the
  // older shape of the context is kept whenever no sounds were picked.
  if (!picked) return { taughtOrder: order, taughtCount: child.taughtCount, taughtWords, readWords: child.readWords };
  return { taughtOrder: picked, taughtCount: picked.length, totalSounds: order.length, taughtWords, readWords: child.readWords };
}

// Every taught sound a child can be given, kindergarten first, then Grade 1 additions.
export function fullTaughtOrder(packs) {
  return packs['on-k-language'].taughtSet.order.concat(packs['on-1-language']?.taughtSetExtra?.order ?? []);
}
