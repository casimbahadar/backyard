// Seeded random numbers that give the same results on every JavaScript engine.
// Only 32-bit integer math (Math.imul, >>>, ^) is used, so V8 and JavaScriptCore
// cannot round differently. No floating point feeds any choice.

// FNV-1a hash of a string to a 32-bit unsigned seed.
export function hashString(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// mulberry32: small, fast, and integer-only.
export function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (t ^ (t >>> 14)) >>> 0;
  };
  // Whole number from lo to hi, both included.
  const int = (lo, hi) => lo + (next() % (hi - lo + 1));
  const pick = (arr) => arr[next() % arr.length];
  const shuffle = (arr) => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = next() % (i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  return { next, int, pick, shuffle };
}
