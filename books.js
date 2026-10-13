// Little books: short stories she reads page by page, each page one sentence and one
// picture. A book opens only when she can read every word in it: every letter-sound has
// been taught (silent-e words need the silent-e sounds), or the word is a sight word she
// has learned. Tapping a word reads it aloud; Read to me reads the page.
export const BOOKS = [
  { id: 'cat', title: 'The Cat', cover: 'cat', pages: [['I see a cat.', 'cat'], ['The cat is on a rug.', 'rug'], ['The cat has a hat.', 'hat'], ['The cat naps in a box.', 'box'], ['Pat the cat!', 'cat']] },
  { id: 'dog', title: 'Dot the Dog', cover: 'dog', pages: [['I see a dog.', 'dog'], ['Dot is a big dog.', 'dog'], ['Dot can dig.', 'dog'], ['Dot has a pot.', 'pot'], ['Run, Dot, run!', 'dog']] },
  { id: 'bus', title: 'The Red Bus', cover: 'bus', pages: [['I see a bus.', 'bus'], ['The bus is red.', 'bus'], ['A pig is on the bus.', 'pig'], ['A hen is on the bus.', 'hen'], ['The bus is fast!', 'bus']] },
  { id: 'pig', title: 'Big Pig', cover: 'pig', pages: [['A big pig.', 'pig'], ['The pig is in the mud.', 'pig'], ['The pig has a wig.', 'wig'], ['The pig sat on a log.', 'log'], ['The pig is a big mess!', 'pig']] },
  { id: 'hens', title: 'Ten Hens', cover: 'hen', pages: [['I see ten hens.', 'hen'], ['A hen sat on a net.', 'net'], ['A hen got a bug.', 'bug'], ['The hens ran to the shed.', 'shed'], ['The hens nap.', 'hen']] },
  { id: 'fox', title: 'The Fox', cover: 'fox', pages: [['A fox ran.', 'fox'], ['The fox hid in a box.', 'box'], ['The fox got a sock.', 'sock'], ['The fox is in bed.', 'bed'], ['Shh! The fox naps.', 'fox']] },
  { id: 'ship', title: 'The Ship', cover: 'ship', pages: [['We see a ship.', 'ship'], ['The ship is big.', 'ship'], ['A crab is on the ship.', 'crab'], ['A fish is on the ship!', 'fish'], ['We like the ship.', 'ship']] },
  { id: 'frog', title: 'Frog in the Pond', cover: 'frog', pages: [['A frog is in the pond.', 'pond'], ['The frog can jump.', 'frog'], ['A slug is on a twig.', 'slug'], ['The frog said, hop!', 'frog'], ['Look, the frog is on a log!', 'log']] },
  { id: 'kite', title: 'My Kite', cover: 'kite', pages: [['I have a kite.', 'kite'], ['My kite is red and white.', 'kite'], ['It can ride on the wind.', 'kite'], ['Look at my kite go!', 'kite'], ['I like my kite.', 'kite']] },
  { id: 'cake', title: 'The Cake', cover: 'cake', pages: [['Mom made a cake.', 'cake'], ['It has a plum on top.', 'plum'], ['We had cake on a plate.', 'plate'], ['Yum, yum!', 'cake'], ['I like cake.', 'cake']] }
];

const DIGRAPHS = ['ck', 'sh', 'th', 'ch', 'wh', 'qu'];
const VCE = /^[^aeiou]*[aeiou][^aeiou]e$/;

// The letter-sounds a word needs, read left to right (digraphs first; a doubled letter
// is one sound).
export function graphemesOf(word) {
  const w = word.toLowerCase();
  const out = [];
  for (let i = 0; i < w.length;) {
    const two = w.slice(i, i + 2);
    if (DIGRAPHS.includes(two)) { out.push(two); i += 2; continue; }
    if (w[i] === w[i + 1]) { out.push(w[i]); i += 2; continue; }
    out.push(w[i]); i += 1;
  }
  return out;
}

export const wordsIn = sentence => sentence.split(/\s+/).map(t => t.replace(/[^A-Za-z]/g, '')).filter(Boolean);

// Sight words cannot be sounded out, so they count only once she has learned them as
// sight words, however many letter-sounds she knows.
const SIGHT = new Set(['a', 'i', 'is', 'the', 'see', 'to', 'and', 'you', 'we', 'he', 'she', 'me', 'my', 'was', 'are', 'said', 'of', 'have', 'they', 'do', 'go', 'no', 'look', 'like', 'come', 'here']);

export function canRead(word, ctx) {
  const w = word.toLowerCase();
  if ((ctx.taughtWords ?? []).some(t => t.toLowerCase() === w)) return true;
  if (SIGHT.has(w)) return w === 'a';
  const taught = ctx.taughtOrder.slice(0, ctx.taughtCount);
  const letters = new Set(taught.map(g => g.grapheme));
  if (VCE.test(w)) {
    // Silent e: the vowel's silent-e sound must be taught.
    if (!taught.some(g => g.phoneme === '')) return false;
    return graphemesOf(w.slice(0, -1)).every(g => letters.has(g));
  }
  return graphemesOf(w).every(g => letters.has(g));
}

export const canReadBook = (book, ctx) => book.pages.every(([text]) => wordsIn(text).every(w => canRead(w, ctx)));
