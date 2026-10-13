// Short IDs a parent can read off paper and type back in. No 0, O, 1, I or L,
// so nothing can be misread. 31 symbols, 4 places: about 920,000 IDs.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export function newSheetId(taken, randomInts = n => crypto.getRandomValues(new Uint32Array(n))) {
  for (let tries = 0; tries < 100; tries++) {
    const r = randomInts(4);
    const id = 'W-' + Array.from(r, x => ALPHABET[x % ALPHABET.length]).join('');
    if (!taken.has(id)) return id;
  }
  throw new Error('could not find a free sheet ID');
}

// Accepts what a parent might type: lower case, spaces, a missing "W-".
export function normaliseSheetId(text) {
  const clean = String(text).toUpperCase().replace(/[^0-9A-Z]/g, '');
  const body = clean.startsWith('W') && clean.length === 5 ? clean.slice(1) : clean;
  return body.length === 4 ? `W-${body}` : null;
}
