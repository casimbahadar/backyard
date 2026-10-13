// On-screen drawings for quest items. Counters, shapes and pattern pieces are
// simple geometric drawings; picture words wait for sticker art.
import { PATTERN_PIECES } from './vocab.js';

const SHAPE = {
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
const COLOUR = { red: '#e5484d', blue: '#3a86d8', yellow: '#f6c90e', green: '#3f8f3a', orange: '#f08a24' };

export function shape(name, { fill = '#fde9a8', size = 64 } = {}) {
  return `<svg class="vis-shape" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><g fill="${fill}" stroke="#1d1b16" stroke-width="4" stroke-linejoin="round">${SHAPE[name]}</g></svg>`;
}

export function piece(id, size = 48) {
  const p = PATTERN_PIECES.find(x => x.id === id);
  return shape(p.shape, { fill: COLOUR[p.colour], size });
}

const COUNTER = {
  apple: '<circle cx="50" cy="56" r="34" fill="#e5484d"/><rect x="47" y="12" width="6" height="16" fill="#7a4a1d"/><ellipse cx="64" cy="20" rx="12" ry="6" fill="#3f8f3a"/>',
  bee: '<ellipse cx="50" cy="56" rx="36" ry="26" fill="#f6c90e"/><rect x="38" y="31" width="8" height="50" fill="#1d1b16"/><rect x="56" y="31" width="8" height="50" fill="#1d1b16"/><ellipse cx="40" cy="26" rx="14" ry="10" fill="#cfe8f7"/><ellipse cx="62" cy="26" rx="14" ry="10" fill="#cfe8f7"/>',
  bird: '<circle cx="46" cy="54" r="32" fill="#3a86d8"/><circle cx="58" cy="44" r="5" fill="#fff"/><polygon points="76,48 94,54 76,60" fill="#f6a40e"/>',
  flower: '<circle cx="50" cy="26" r="16" fill="#f15bb5"/><circle cx="74" cy="50" r="16" fill="#f15bb5"/><circle cx="50" cy="74" r="16" fill="#f15bb5"/><circle cx="26" cy="50" r="16" fill="#f15bb5"/><circle cx="50" cy="50" r="12" fill="#f6c90e"/>',
  leaf: '<path d="M14 86 Q14 20 86 14 Q80 86 14 86 Z" fill="#3f8f3a"/><path d="M18 82 L70 30" stroke="#2d6b29" stroke-width="4"/>',
  star: '<polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38" fill="#f6c90e" stroke="#c99a00" stroke-width="3"/>'
};

export function counter(id, size = 40) {
  return `<svg class="vis-counter" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${COUNTER[id]}</svg>`;
}

export function counters(id, n, size = 40) {
  return `<span class="counters">${Array.from({ length: n }, () => counter(id, size)).join('')}</span>`;
}

// Tens as rods of ten squares, ones as single squares: the base-ten blocks Grade 1 uses.
export function tensOnes(tens, ones, { unit = 9, outline = false } = {}) {
  const fill = outline ? '#fff' : '#3a86d8', single = outline ? '#fff' : '#ffc845', ink = outline ? '#000' : '#23304a';
  const w = tens * (unit + 6) + (ones ? 8 + Math.ceil(ones / 5) * (unit + 3) : 0) + 4;
  const h = 10 * unit + 4;
  let g = '';
  for (let t = 0; t < tens; t++) for (let i = 0; i < 10; i++) g += `<rect x="${2 + t * (unit + 6)}" y="${2 + i * unit}" width="${unit}" height="${unit}" fill="${fill}"/>`;
  const ox = 2 + tens * (unit + 6) + 8;
  for (let i = 0; i < ones; i++) g += `<rect x="${ox + Math.floor(i / 5) * (unit + 3)}" y="${2 + (h - 4) - (i % 5 + 1) * (unit + 3)}" width="${unit}" height="${unit}" fill="${single}"/>`;
  return `<svg class="tens-ones" viewBox="0 0 ${w} ${h}" width="${w * 2}" height="${h * 2}" aria-hidden="true"><g stroke="${ink}" stroke-width="1.2">${g}</g></svg>`;
}

// Solid objects for sorting (Grade 1 E1.1). Each has a light top face and a darker
// side so it reads as solid, not flat. outline gives the white version for worksheets.
const SOLID = {
  cube: c => `<path d="M18 34 L50 20 L82 34 L50 48 Z" fill="${c[0]}"/><path d="M18 34 V72 L50 86 V48 Z" fill="${c[1]}"/><path d="M82 34 V72 L50 86 V48 Z" fill="${c[2]}"/>`,
  prism: c => `<path d="M8 40 L30 28 L92 28 L70 40 Z" fill="${c[0]}"/><path d="M8 40 V74 H70 V40 Z" fill="${c[1]}"/><path d="M70 40 L92 28 V62 L70 74 Z" fill="${c[2]}"/>`,
  pyramid: c => `<path d="M50 12 L16 78 L58 88 Z" fill="${c[1]}"/><path d="M50 12 L58 88 L86 70 Z" fill="${c[2]}"/>`,
  sphere: c => `<circle cx="50" cy="52" r="36" fill="${c[1]}"/><ellipse cx="38" cy="38" rx="12" ry="8" fill="${c[0]}"/>`,
  cone: c => `<path d="M50 10 L18 76 Q50 92 82 76 Z" fill="${c[1]}"/><ellipse cx="50" cy="76" rx="32" ry="10" fill="${c[2]}"/>`,
  cylinder: c => `<path d="M22 24 V76 Q50 90 78 76 V24 Z" fill="${c[1]}"/><ellipse cx="50" cy="24" rx="28" ry="9" fill="${c[0]}"/>`
};
const SOLID_COLOURS = { cube: ['#a7dcf7', '#3a86d8', '#2a6db3'], prism: ['#fde9a8', '#f6c90e', '#c99a00'], pyramid: ['#f8bfd0', '#f15bb5', '#c2378a'],
  sphere: ['#fbd3c4', '#ef5a3c', '#b3261e'], cone: ['#c8f0bf', '#4fa53e', '#2f7a2a'], cylinder: ['#e8d4f7', '#9b5de5', '#6c3ab0'] };

export const SOLID_NAMES = Object.keys(SOLID);

export function solid(name, { outline = false, size = 64 } = {}) {
  const c = outline ? ['#fff', '#fff', '#fff'] : SOLID_COLOURS[name];
  return `<svg class="vis-solid" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true"><g stroke="${outline ? '#000' : '#23304a'}" stroke-width="${outline ? 3 : 2.5}" stroke-linejoin="round">${SOLID[name](c)}</g></svg>`;
}

// A flat shape or a solid object, whichever the name is.
export function thing(name, opts = {}) {
  return SOLID[name] ? solid(name, opts) : shape(name, { size: opts.size ?? 64, fill: opts.outline ? '#fff' : '#fde9a8' });
}

// A ribbon of a given length in units, for comparing lengths.
export function ribbon(units, { outline = false, unit = 26 } = {}) {
  const w = units * unit;
  return `<svg class="ribbon" viewBox="0 0 ${w + 8} 28" width="${w + 8}" height="28" aria-hidden="true"><rect x="4" y="6" width="${w}" height="16" rx="8" fill="${outline ? '#fff' : '#ef5a3c'}" stroke="${outline ? '#000' : '#23304a'}" stroke-width="2.5"/></svg>`;
}

// Canadian money. Each coin is drawn at its real size relative to the others, in its
// real metal, with a raised rim, a beaded edge, its value as on the real coin and my
// own drawing of its animal or symbol. Bills are coloured by value, with a portrait
// window, a clear strip and the number in the corners. Not copies of the Mint's or
// the Bank of Canada's artwork.
const COIN = {
  nickel: { r: 21, metal: ['#d5dce3', '#a9b5c1'], label: '5¢', art: 'beaver' },
  dime: { r: 18, metal: ['#d5dce3', '#a9b5c1'], label: '10¢', art: 'boat' },
  quarter: { r: 24, metal: ['#d5dce3', '#a9b5c1'], label: '25¢', art: 'caribou' },
  fifty: { r: 27, metal: ['#d5dce3', '#a9b5c1'], label: '50¢', art: 'arms' },
  loonie: { r: 26.5, metal: ['#f1c95a', '#c9962a'], label: '$1', art: 'loon', sides: 11 },
  toonie: { r: 28, metal: ['#d5dce3', '#a9b5c1'], inner: ['#f1c95a', '#c9962a'], label: '$2', art: 'bear' }
};
// Drawings sit in a box about 40 wide, centred on 0,0. "f" is the relief colour.
const ART = {
  beaver: f => `<g transform="translate(-2 0) scale(0.84)"><path d="M-14 6 Q-16 -6 -4 -8 Q8 -10 12 -2 Q14 4 8 6 Z" fill="${f}"/><circle cx="-12" cy="-4" r="5.5" fill="${f}"/><circle cx="-9" cy="-9" r="1.6" fill="${f}"/>
    <circle cx="-13.5" cy="-5" r="0.9" fill="#23304a" stroke="none"/><rect x="-18" y="-1" width="2.2" height="3" fill="#fff" stroke-width="0.4"/>
    <ellipse cx="17" cy="4" rx="7" ry="3.4" fill="${f}" transform="rotate(-18 17 4)"/><path d="M13 3 L21 1 M14 6 L22 4 M16 1 L18 7 M19 0 L21 6" fill="none" stroke-width="0.5"/>
    <path d="M-20 9 H22" fill="none" stroke-width="0.9"/><path d="M-6 6 V9 M4 6 V9" fill="none" stroke-width="1.2"/></g>`,
  boat: f => `<path d="M-16 6 H16 L12 11 H-13 Z" fill="${f}"/><path d="M-4 6 V-14 M6 6 V-12" fill="none" stroke-width="1"/>
    <path d="M-5 4 L-5 -13 L-15 4 Z" fill="${f}"/><path d="M-3 4 V-12 L4 4 Z" fill="${f}"/><path d="M7 4 V-11 L14 4 Z" fill="${f}"/>
    <path d="M-19 13 Q-14 11 -9 13 T1 13 T11 13 T21 13" fill="none" stroke-width="0.8"/>`,
  caribou: f => `<g transform="translate(-1 4) scale(0.78)"><path d="M-2 14 Q-4 4 0 -2 Q4 -6 8 -4 L12 -2 Q13 1 10 2 L6 2 Q4 8 6 14 Z" fill="${f}"/><circle cx="9" cy="-2.5" r="0.9" fill="#23304a" stroke="none"/>
    <path d="M2 -4 Q-2 -12 -8 -16 M-2 -10 L-9 -10 M-5 -14 L-8 -19 M4 -5 Q6 -14 12 -18 M7 -11 L14 -12 M9 -15 L11 -20" fill="none" stroke-width="1.3"/></g>`,
  arms: f => `<path d="M-9 -5 H9 V4 Q9 12 0 15 Q-9 12 -9 4 Z" fill="${f}"/><path d="M0 -5 V15 M-9 4 H9" fill="none" stroke-width="0.6"/>
    <path d="M-7 -8 L-4 -14 L0 -10 L4 -14 L7 -8 Z" fill="${f}"/><path d="M-5 9 L-3 7 L-1 9 L-3 11 Z M1 9 L3 7 L5 9 L3 11 Z" fill="#fff" stroke-width="0.4"/>`,
  loon: f => `<path d="M-16 6 Q-14 -2 -2 -2 Q4 -2 8 -6 Q10 -10 14 -9 L19 -8 L14 -6 Q12 -2 10 2 Q4 8 -16 6 Z" fill="${f}"/><circle cx="13" cy="-8" r="0.9" fill="#d4441f" stroke="none"/>
    <g fill="#fff" stroke="none"><circle cx="-8" cy="1" r="0.8"/><circle cx="-5" cy="2" r="0.8"/><circle cx="-2" cy="1" r="0.8"/><circle cx="1" cy="2" r="0.8"/><circle cx="-6" cy="4" r="0.8"/><circle cx="-3" cy="4" r="0.8"/></g>
    <path d="M-20 9 Q-14 7 -8 9 T4 9 T16 9 T22 9" fill="none" stroke-width="0.8"/><path d="M18 9 V-2 M20 9 V0 M16 9 V2" fill="none" stroke-width="0.7"/>`,
  bear: f => `<path d="M-16 4 Q-17 -6 -6 -7 Q4 -8 9 -5 L15 -6 Q19 -5 18 -2 L13 0 Q12 4 9 5 V10 H6 V5 H-6 V10 H-9 V5 Q-12 6 -16 4 Z" fill="${f}"/><circle cx="14" cy="-4" r="0.8" fill="#23304a" stroke="none"/><circle cx="11" cy="-7" r="1.4" fill="${f}"/>
    <path d="M-20 11 H22" fill="none" stroke-width="0.9"/>`
};
const BILL = { five: ['#3a86d8', '#a7dcf7', '5'], ten: ['#7b3fa0', '#d8bdf0', '10'], twenty: ['#2f7a2a', '#bfe3b5', '20'], fiftyBill: ['#b3261e', '#f5b8ae', '50'] };
const poly = (n, r) => Array.from({ length: n }, (_, i) => { const t = (i / n) * Math.PI * 2 - Math.PI / 2; return `${(Math.cos(t) * r).toFixed(2)},${(Math.sin(t) * r).toFixed(2)}`; }).join(' ');
const beads = (r, n) => Array.from({ length: n }, (_, i) => { const t = (i / n) * Math.PI * 2; return `<circle cx="${(Math.cos(t) * r).toFixed(2)}" cy="${(Math.sin(t) * r).toFixed(2)}" r="0.55"/>`; }).join('');

export function money(idName, { outline = false, scale = 2.4 } = {}) {
  const ink = outline ? '#000' : '#23304a';
  if (BILL[idName]) {
    const [deep, light, n] = BILL[idName];
    const w = 70, h = 34;
    const fill = c => (outline ? '#fff' : c);
    return `<svg class="money bill" viewBox="0 0 ${w} ${h}" width="${w * scale}" height="${h * scale}" aria-hidden="true"><g stroke="${ink}" stroke-width="1.1">`
      + `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="2.5" fill="${fill(deep)}"/>`
      + `<rect x="15" y="4" width="34" height="${h - 8}" rx="2" fill="${fill(light)}"/>`
      + `<ellipse cx="32" cy="17" rx="8" ry="10" fill="${fill(deep)}"/>`
      + `<path d="M26 26 Q26 19 32 19 Q38 19 38 26 Z M29 13 A3.4 3.6 0 1 1 35 13 A3.4 3.6 0 1 1 29 13" fill="${fill(light)}" stroke-width="0.7"/>`
      + `<rect x="53" y="4" width="11" height="${h - 8}" rx="1.5" fill="${outline ? '#fff' : '#e8f4fb'}" stroke-width="0.7"/>`
      + `<path d="M58.5 9 L59.6 12 L62 11 L61 14 L63 15 L60 16 L60.6 18.5 H56.4 L57 16 L54 15 L56 14 L55 11 L57.4 12 Z" fill="${outline ? '#fff' : light}" stroke-width="0.5"/></g>`
      + `<text x="8" y="14" font-family="Andika, sans-serif" font-size="11" text-anchor="middle" fill="${outline ? '#000' : '#fff'}">${n}</text>`
      + `<text x="8" y="${h - 5}" font-family="Andika, sans-serif" font-size="9.5" text-anchor="middle" fill="${outline ? '#000' : '#fff'}">${n}</text></svg>`;
  }
  const c = COIN[idName];
  const box = 60;
  const [hi, lo] = outline ? ['#fff', '#fff'] : c.metal;
  const shape = (r, fill) => (c.sides ? `<polygon points="${poly(c.sides, r)}" fill="${fill}"/>` : `<circle r="${r}" fill="${fill}"/>`);
  const core = c.inner ? (outline ? ['#fff', '#fff'] : c.inner) : [hi, lo];
  const ir = c.inner ? c.r * 0.62 : c.r - 2.6;
  const artScale = (ir / 22).toFixed(3);
  const relief = outline ? '#fff' : core[1];
  return `<svg class="money coin" viewBox="${-box / 2} ${-box / 2} ${box} ${box}" width="${box * scale}" height="${box * scale}" aria-hidden="true"><g stroke="${ink}" stroke-width="1">`
    + shape(c.r, lo)
    + (c.inner ? `<circle r="${ir}" fill="${core[0]}"/>` : shape(c.r - 2.6, hi))
    + `<g fill="${ink}" stroke="none">${beads(c.r - 1.3, Math.round(c.r * 2.2))}</g>`
    + (outline ? '' : `<path d="M${(-ir * 0.75).toFixed(1)} ${(-ir * 0.45).toFixed(1)} A${ir} ${ir} 0 0 1 ${(ir * 0.3).toFixed(1)} ${(-ir * 0.85).toFixed(1)}" fill="none" stroke="#fff" stroke-width="1.2" opacity="0.7"/>`)
    + `<g transform="translate(0 ${(-ir * 0.24).toFixed(1)}) scale(${artScale})" stroke-width="0.9">${ART[c.art](relief)}</g></g>`
    + `<text y="${(ir * 0.84).toFixed(1)}" font-family="Andika, sans-serif" font-size="${Math.max(ir * 0.36, 8.6).toFixed(1)}" text-anchor="middle" fill="${ink}">${c.label}</text></svg>`;
}
