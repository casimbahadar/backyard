// Things the math templates can show. Every entry needs sticker art before ship.
// Plurals are written out, never built by adding s, because leaf becomes leaves.

export const COUNTERS = [
  { id: 'apple', one: 'apple', many: 'apples' },
  { id: 'bee', one: 'bee', many: 'bees' },
  { id: 'bird', one: 'bird', many: 'birds' },
  { id: 'flower', one: 'flower', many: 'flowers' },
  { id: 'leaf', one: 'leaf', many: 'leaves' },
  { id: 'star', one: 'star', many: 'stars' }
];

// Pattern pieces. Each piece has its own shape as well as its own colour,
// so colour never carries the meaning alone.
export const PATTERN_PIECES = [
  { id: 'red-circle', shape: 'circle', colour: 'red', name: 'red circle' },
  { id: 'blue-square', shape: 'square', colour: 'blue', name: 'blue square' },
  { id: 'yellow-triangle', shape: 'triangle', colour: 'yellow', name: 'yellow triangle' },
  { id: 'green-star', shape: 'star', colour: 'green', name: 'green star' },
  { id: 'orange-heart', shape: 'heart', colour: 'orange', name: 'orange heart' }
];

export const SHAPE_NAMES = {
  circle: 'circle', triangle: 'triangle', square: 'square', rectangle: 'rectangle',
  hexagon: 'hexagon', rhombus: 'rhombus', trapezoid: 'trapezoid'
};

// Number words for speech, so the voice never has to guess how to read a digit.
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = { 2: 'twenty', 3: 'thirty', 4: 'forty', 5: 'fifty', 6: 'sixty', 7: 'seventy', 8: 'eighty', 9: 'ninety' };
export const NUMBER_WORDS = Array.from({ length: 101 }, (_, n) =>
  n < 20 ? ONES[n] : n === 100 ? 'one hundred' : TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : ''));
