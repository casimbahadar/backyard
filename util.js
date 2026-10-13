// Helpers shared by templates.

// Up to k numbers from lo to hi, none equal to answer, nearest first so the
// wrong choices are believable rather than silly.
export function nearNumbers(answer, lo, hi, k, rng) {
  const pool = [];
  for (let d = 1; d <= hi - lo; d++) {
    const ring = [];
    if (answer - d >= lo) ring.push(answer - d);
    if (answer + d <= hi) ring.push(answer + d);
    pool.push(...rng.shuffle(ring));
    if (pool.length >= k + 2) break;
  }
  return rng.shuffle(pool.slice(0, k + 2)).slice(0, k);
}

