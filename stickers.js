// Yard stickers: the rewards she picks and places. Drawn in the same flat, ink-outlined
// style as the 76 picture words (three of them reuse those drawings), then given a
// white die-cut edge so they read as stickers on the yard.
import { pictureShapes } from './pictures.js';
import { BEACH_SEA } from './stickers-beach-sea.js';
import { FARM_SNOW } from './stickers-farm-snow.js';
import { SPACE_CAMP } from './stickers-space-camp.js';
import { CITY_GARDEN } from './stickers-city-garden.js';

const INK = '#23304a';
const OWN = {
  sunflower: `<path d="M50 56 V96" fill="none" class="thick" style-color="#3f8f3a"/>
    <path d="M50 78 Q34 66 26 74 Q36 86 50 82 Z M50 86 Q66 74 74 82 Q64 94 50 90 Z" fill="#4fa53e"/>
    <g fill="#ffc845">${Array.from({ length: 12 }, (_, i) => `<ellipse cx="50" cy="14" rx="7" ry="13" transform="rotate(${i * 30} 50 34)"/>`).join('')}</g>
    <circle cx="50" cy="34" r="14" fill="#7a4a1d"/>
    <g fill="#5a3412"><circle cx="45" cy="30" r="2"/><circle cx="55" cy="30" r="2"/><circle cx="50" cy="38" r="2"/><circle cx="44" cy="38" r="1.6"/><circle cx="56" cy="38" r="1.6"/></g>`,
  tulip: `<path d="M50 52 Q48 74 50 96" fill="none" class="thick" style-color="#3f8f3a"/>
    <path d="M50 80 Q30 62 24 72 Q34 90 50 88 Z" fill="#4fa53e"/>
    <path d="M28 18 Q30 50 50 56 Q70 50 72 18 L62 30 L50 12 L38 30 Z" fill="#e5484d"/>
    <path d="M50 12 Q44 32 50 56 Q56 32 50 12 Z" fill="#f08080"/>`,
  bush: `<g fill="#3f8f3a"><circle cx="28" cy="62" r="22"/><circle cx="72" cy="62" r="22"/><circle cx="50" cy="44" r="26"/><rect x="18" y="62" width="64" height="26" rx="10"/></g>
    <g fill="#5bbd56"><circle cx="40" cy="40" r="8"/><circle cx="64" cy="52" r="7"/><circle cx="30" cy="64" r="6"/></g>
    <g fill="#9b5de5"><circle cx="50" cy="56" r="4"/><circle cx="58" cy="44" r="4"/><circle cx="36" cy="54" r="4"/><circle cx="68" cy="68" r="4"/><circle cx="42" cy="74" r="4"/></g>`,
  tree: `<path d="M44 58 H56 L58 94 H42 Z" fill="#8a5a2b"/>
    <path d="M46 70 Q50 66 54 72" fill="none" style-color="#6b4320"/>
    <g fill="#4fa53e"><circle cx="50" cy="32" r="26"/><circle cx="28" cy="46" r="18"/><circle cx="72" cy="46" r="18"/></g>
    <g fill="#e5484d"><circle cx="38" cy="30" r="5"/><circle cx="62" cy="36" r="5"/><circle cx="50" cy="50" r="5"/><circle cx="30" cy="52" r="4"/><circle cx="72" cy="52" r="4"/></g>`,
  mushroom: `<path d="M38 56 Q36 80 40 92 H60 Q64 80 62 56 Z" fill="#f4f1ea"/>
    <path d="M42 66 H58" fill="none" style-color="#c9b89a"/>
    <path d="M8 58 Q8 16 50 14 Q92 16 92 58 Q50 66 8 58 Z" fill="#e5484d"/>
    <g fill="#ffffff"><circle cx="30" cy="38" r="7"/><circle cx="54" cy="28" r="8"/><circle cx="72" cy="44" r="6"/><circle cx="42" cy="52" r="4"/></g>`,
  butterfly: `<path d="M48 50 Q20 10 10 30 Q2 50 46 54 Z M52 50 Q80 10 90 30 Q98 50 54 54 Z" fill="#9b5de5"/>
    <path d="M46 56 Q16 60 20 78 Q28 92 48 62 Z M54 56 Q84 60 80 78 Q72 92 52 62 Z" fill="#f15bb5"/>
    <g fill="#ffc845"><circle cx="26" cy="34" r="6"/><circle cx="74" cy="34" r="6"/><circle cx="30" cy="72" r="4"/><circle cx="70" cy="72" r="4"/></g>
    <rect x="46" y="36" width="8" height="44" rx="4" fill="${INK}"/>
    <path d="M48 38 Q42 24 36 20 M52 38 Q58 24 64 20" fill="none"/><circle cx="36" cy="20" r="2.4" fill="${INK}"/><circle cx="64" cy="20" r="2.4" fill="${INK}"/>`,
  bird: `<path d="M18 60 Q16 34 40 30 Q54 26 64 36 Q74 46 70 62 Q64 80 40 80 Q22 78 18 60 Z" fill="#3a86d8"/>
    <path d="M30 60 Q30 74 44 76 Q58 74 62 62 Q46 70 30 60 Z" fill="#f6a40e"/>
    <path d="M36 46 Q50 40 56 56 Q44 54 36 46 Z" fill="#2a6db3"/>
    <path d="M66 40 L84 44 L68 50 Z" fill="#ffc845"/>
    <circle cx="58" cy="38" r="4" fill="#ffffff"/><circle cx="59" cy="38" r="2" fill="${INK}"/>
    <path d="M18 56 L4 50 L8 64 Z" fill="#2a6db3"/>
    <path d="M38 80 V90 M48 80 V90" fill="none" style-color="#f6a40e"/>`,
  snail: `<path d="M8 84 Q8 74 20 74 H72 Q82 70 84 58 Q86 48 92 50 Q96 54 92 64 Q88 84 72 86 H12 Z" fill="#e0c39a"/>
    <path d="M86 50 L84 36 M92 52 L96 38" fill="none" class="detail" style-color="#c9a26b"/>
    <circle cx="84" cy="34" r="3" fill="${INK}"/><circle cx="96" cy="36" r="3" fill="${INK}"/>
    <circle cx="46" cy="52" r="26" fill="#e08a3c"/>
    <path d="M46 52 m-4 0 a4 4 0 1 1 8 0 a8 8 0 1 1 -16 0 a12 12 0 1 1 24 0 a16 16 0 1 1 -32 0" fill="none" class="detail" style-color="#a0522d"/>`,
  bunny: `<path d="M34 34 Q24 4 32 2 Q42 2 42 32 Z M58 32 Q58 2 68 2 Q76 4 66 34 Z" fill="#f4f1ea"/>
    <path d="M34 28 Q30 12 33 8 Q38 10 38 28 Z M62 28 Q62 10 67 8 Q70 12 66 28 Z" fill="#f8bfd0"/>
    <ellipse cx="50" cy="76" rx="30" ry="20" fill="#f4f1ea"/>
    <circle cx="50" cy="48" r="20" fill="#f4f1ea"/>
    <circle cx="42" cy="46" r="3" fill="${INK}"/><circle cx="58" cy="46" r="3" fill="${INK}"/>
    <path d="M47 54 L53 54 L50 58 Z" fill="#f15bb5"/>
    <path d="M50 58 Q46 62 42 60 M50 58 Q54 62 58 60" fill="none"/>
    <circle cx="80" cy="80" r="7" fill="#ffffff"/>`,
  rainbow: `<path d="M8 80 A42 42 0 0 1 92 80 H80 A30 30 0 0 0 20 80 Z" fill="#e5484d"/>
    <path d="M20 80 A30 30 0 0 1 80 80 H70 A20 20 0 0 0 30 80 Z" fill="#ffc845"/>
    <path d="M30 80 A20 20 0 0 1 70 80 H60 A10 10 0 0 0 40 80 Z" fill="#4fa53e"/>
    <g fill="#ffffff"><ellipse cx="14" cy="82" rx="12" ry="8"/><ellipse cx="86" cy="82" rx="12" ry="8"/></g>`,
  cloud: `<g fill="#ffffff"><circle cx="34" cy="56" r="18"/><circle cx="54" cy="46" r="22"/><circle cx="72" cy="58" r="16"/><rect x="18" y="56" width="68" height="20" rx="10"/></g>
    <path d="M30 60 Q40 66 50 60" fill="none" style-color="#a7dcf7"/>
    <circle cx="40" cy="58" r="2.4" fill="#23304a"/><circle cx="60" cy="58" r="2.4" fill="#23304a"/>`,
  'watering-can': `<path d="M22 42 H66 V82 Q66 88 60 88 H28 Q22 88 22 82 Z" fill="#3a86d8"/>
    <path d="M66 52 L90 32 L94 38 L70 62 Z" fill="#2a6db3"/>
    <path d="M28 42 Q28 22 44 22 Q60 22 60 42" fill="none" class="thick" style-color="#2a6db3"/>
    <g fill="#a7dcf7"><circle cx="96" cy="44" r="2.4"/><circle cx="92" cy="50" r="2.4"/><circle cx="98" cy="54" r="2.4"/></g>`,
  birdhouse: `<rect x="47" y="70" width="6" height="26" fill="#8a5a2b"/>
    <path d="M24 44 L50 20 L76 44 Z" fill="#e5484d"/>
    <rect x="28" y="44" width="44" height="30" fill="#ffc845"/>
    <circle cx="50" cy="56" r="7" fill="#23304a"/>
    <rect x="46" y="66" width="8" height="3" fill="#8a5a2b"/>`,
  carrot: `<path d="M44 30 L56 30 Q60 50 50 92 Q40 50 44 30 Z" fill="#f08a24"/>
    <path d="M46 44 H52 M47 56 H53 M48 68 H52" fill="none" style-color="#c96a10"/>
    <path d="M50 30 Q40 18 34 8 Q46 12 50 26 Q54 10 64 6 Q60 18 50 30 Z" fill="#4fa53e"/>`
};
// Picture-word drawings that also make good yard stickers.
const BORROWED = Object.fromEntries(['frog', 'pond', 'cat', 'dog', 'duck', 'chick', 'hen', 'pig', 'fox', 'crab', 'fish', 'slug', 'zebra',
  'octopus', 'snake', 'sun', 'apple', 'plum', 'rose', 'kite', 'hive', 'nest', 'tent', 'cake'].map(w => [w, w]));
BORROWED.ladybug = 'bug';
const ANIMALS = new Set(['bird', 'snail', 'ladybug', 'bunny', 'frog', 'butterfly', 'cat', 'dog', 'duck', 'chick', 'hen', 'pig', 'fox', 'crab', 'fish', 'slug', 'zebra', 'octopus', 'snake']);

// Drawn sticker sets, grouped by the place they suit best. Every sticker can go anywhere.
const SETS = { beachSea: BEACH_SEA, farmSnow: FARM_SNOW, spaceCamp: SPACE_CAMP, cityGarden: CITY_GARDEN };
const FIRST = [...Object.keys(OWN), ...Object.keys(BORROWED)];
for (const set of Object.values(SETS)) Object.assign(OWN, set);
// Which place each sticker suits, so the picker can offer stickers that fit where she
// is. Each set file lists its first place's stickers, then its second's, starting at
// the sticker named here.
const SPLIT = { beachSea: ['beach', 'sea', 'whale'], farmSnow: ['farm', 'snow', 'snowman'], spaceCamp: ['space', 'camp', 'tent2'], cityGarden: ['park', 'yard', 'pizza-slice'] };
const PLACE_OF = {};
for (const [set, [first, second, from]] of Object.entries(SPLIT)) {
  let place = first;
  for (const id of Object.keys(SETS[set])) { if (id === from) place = second; PLACE_OF[id] = place; }
}
const placesOf = id => [PLACE_OF[id] ?? 'yard'];
export const STICKERS = [...FIRST, ...Object.values(SETS).flatMap(set => Object.keys(set))].map(id => ({ id, set: ANIMALS.has(id) ? 'animal' : 'garden', places: placesOf(id) }));

function colouredShapes(id) {
  if (BORROWED[id]) return pictureShapes(BORROWED[id]);
  const body = OWN[id]
    .replace(/\sstyle-color="([^"]*)"/g, (_, c) => ` stroke="${c}"`)
    .replace(/\sclass="thick"/g, ' stroke-width="7"').replace(/\sclass="detail"/g, ' stroke-width="4"');
  return `<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">${body}</g>`;
}

// The die-cut edge: the same shapes drawn wider behind the colours. A shiny sticker
// (all answers right) gets a gold edge and two sparkles instead of the white edge.
const edge = (g, colour) => g.replace(/fill="(?!none)[^"]*"/g, `fill="${colour}"`).replace(/stroke="[^"]*"/g, `stroke="${colour}"`)
  .replace(/stroke-width="[\d.]+"/g, 'stroke-width="9"');
const SPARKLE = (x, y, r) => `<path d="M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z" fill="#fff4b8" stroke="#c99a00" stroke-width="1.5"/>`;

export function stickerSvg(id, { shiny = false, size = 72 } = {}) {
  const g = colouredShapes(id);
  const extra = shiny ? SPARKLE(90, 6, 9) + SPARKLE(4, 90, 6) : '';
  return `<svg class="sticker${shiny ? ' shiny' : ''}" viewBox="-8 -8 116 116" width="${size}" height="${size}" aria-hidden="true">${edge(g, shiny ? '#ffd84d' : '#fff')}${g}${extra}</svg>`;
}

// Three different stickers to choose from: two that suit the place she is decorating
// and one from anywhere. randomInts lets tests pin the choice.
export function offerThree(randomInts = n => crypto.getRandomValues(new Uint32Array(n)), place = null) {
  const r = randomInts(3);
  const fits = STICKERS.filter(s => !place || s.places.includes(place)).map(s => s.id);
  const out = [];
  for (let i = 0; i < 2; i++) out.push(fits.splice(r[i] % fits.length, 1)[0]);
  const rest = STICKERS.map(s => s.id).filter(id => !out.includes(id));
  out.push(rest[r[2] % rest.length]);
  return out;
}
