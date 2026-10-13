// Outline drawings for worksheets: black strokes on white, nothing filled, so a
// child can colour them in. Picture words live in pictures.js.

const SHAPES = {
  circle: '<circle cx="50" cy="50" r="42"/>',
  triangle: '<polygon points="50,8 94,90 6,90"/>',
  square: '<rect x="10" y="10" width="80" height="80"/>',
  rectangle: '<rect x="4" y="24" width="92" height="52"/>',
  hexagon: '<polygon points="27,10 73,10 96,50 73,90 27,90 4,50"/>',
  rhombus: '<polygon points="50,4 92,50 50,96 8,50"/>',
  trapezoid: '<polygon points="28,20 72,20 96,84 4,84"/>',
  star: '<polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38"/>',
  heart: '<path d="M50 88 C10 60 4 34 22 20 C36 9 48 18 50 28 C52 18 64 9 78 20 C96 34 90 60 50 88 Z"/>'
};

export function shapeSvg(name, size = '0.9in') {
  const body = SHAPES[name];
  if (!body) throw new Error(`no outline for shape ${name}`);
  return `<svg class="outline" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;
}

export function counterSvg(size = '0.42in') {
  return `<svg class="outline" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><circle cx="50" cy="50" r="40"/></svg>`;
}

// Sizes are classes rather than inline styles, so the page's security policy can
// refuse inline styles entirely.
export function blankBox(size = 'md') {
  return `<span class="blank blank-${size}"></span>`;
}
