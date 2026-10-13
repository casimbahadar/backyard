// Places a child can decorate, each its own drawing with its own scenery. The yard is
// the first; the others are drawn here in the same flat, ink-outlined style. Every
// drawing is 400 wide and 600 tall, with sky and ground reaching far to both sides so
// wide screens never show an edge.
import { YARD_SVG } from './scene.js';

const wrap = body => `<svg class="scene-art" viewBox="0 0 400 600" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><g stroke="#23304a" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
const wide = (y, h, fill) => `<rect x="-1200" y="${y}" width="2800" height="${h}" fill="${fill}" stroke="none"/>`;
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');

const BEACH = wrap(`${wide(0, 600, '#9fdcf7')}
  <circle cx="330" cy="80" r="36" fill="#ffd84d"/>
  <path d="M60 110 l12 8 l12 -8 M100 90 l9 6 l9 -6 M250 150 l10 7 l10 -7" fill="none"/>
  ${wide(290, 120, '#3a9ad9')}
  ${rep(14, i => `<path d="M${-260 + i * 60} 318 q15 -10 30 0 t30 0" fill="none" stroke="#bfe6fb"/>`)}
  ${rep(14, i => `<path d="M${-230 + i * 60} 356 q15 -10 30 0 t30 0" fill="none" stroke="#bfe6fb"/>`)}
  <path d="M-1200 400 Q-300 380 0 400 Q200 386 400 400 Q900 384 1600 400 V600 H-1200 Z" fill="#f3d9a4"/>
  <path d="M-1200 404 Q0 396 200 408 T1600 404" fill="none" stroke="#ffffff" stroke-width="5"/>
  <path d="M58 410 Q50 330 70 250" fill="none" stroke="#8a5a2b" stroke-width="12"/>
  <path d="M70 250 Q30 230 6 252 Q40 246 66 258 Z M70 250 Q110 222 140 242 Q104 240 74 258 Z M70 250 Q60 210 30 200 Q62 220 68 254 Z M70 250 Q90 206 122 200 Q92 222 72 254 Z" fill="#4fa53e"/>
  <circle cx="76" cy="258" r="6" fill="#8a5a2b"/><circle cx="64" cy="262" r="6" fill="#8a5a2b"/>
  <path d="M300 470 V352" fill="none" stroke-width="4"/>
  <path d="M240 372 Q300 316 360 372 Z" fill="#e5484d"/><path d="M270 372 Q300 330 300 352 M330 372 Q300 330 300 352" fill="#ffffff"/>
  <path d="M168 520 V478 H186 V490 H198 V478 H216 V490 H228 V478 H246 V520 Z" fill="#e8c27a"/>
  <path d="M190 520 V500 Q207 488 224 500 V520" fill="#c9a050"/>
  <path d="M207 478 V458 L222 464 L207 470" fill="#e5484d"/>
  <path d="M100 540 l6 -12 l6 12 l12 4 l-10 8 l2 12 l-10 -6 l-10 6 l2 -12 l-10 -8 Z" fill="#f08a24"/>
  <ellipse cx="330" cy="540" rx="16" ry="10" fill="#f8bfd0"/>`);

const FARM = wrap(`${wide(0, 600, '#a7dcf7')}
  <circle cx="70" cy="80" r="34" fill="#ffd84d"/>
  <g fill="#fff" stroke="none"><ellipse cx="260" cy="90" rx="44" ry="16"/><ellipse cx="284" cy="78" rx="26" ry="16"/></g>
  <path d="M-1200 300 Q-400 250 0 300 Q200 250 400 296 Q900 250 1600 300 V600 H-1200 Z" fill="#8fce6f"/>
  <path d="M-1200 380 Q0 350 400 380 T1600 380 V600 H-1200 Z" fill="#6dbb4f"/>
  ${rep(7, i => `<path d="M${-60 + i * 70} 600 L${150 + i * 18} 392" fill="none" stroke="#9c6b3c" stroke-width="10"/>`)}
  <rect x="210" y="210" width="130" height="110" fill="#c8362b"/>
  <path d="M196 214 L275 150 L354 214 Z" fill="#8f2a21"/>
  <rect x="250" y="250" width="50" height="70" fill="#ffffff"/><path d="M250 250 L300 320 M300 250 L250 320" fill="none" stroke="#c8362b" stroke-width="5"/>
  <rect x="262" y="178" width="26" height="22" fill="#ffffff"/>
  <rect x="348" y="170" width="40" height="150" fill="#c9d3dd"/><path d="M348 170 Q368 140 388 170 Z" fill="#9aa7b4"/>
  <path d="M354 200 H382 M354 240 H382 M354 280 H382" fill="none"/>
  <g fill="#d9a35f">${rep(9, i => `<rect x="${-6 + i * 20}" y="320" width="8" height="52"/>`)}</g>
  <path d="M-10 334 H180 M-10 356 H180" fill="none" stroke="#d9a35f" stroke-width="7"/>
  <g fill="#f2c94c"><rect x="40" y="420" width="56" height="40" rx="8"/><rect x="104" y="430" width="44" height="32" rx="7"/></g>
  <path d="M48 432 H88 M48 446 H88 M112 440 H140" fill="none" stroke="#c99a00"/>`);

const SNOW = wrap(`${wide(0, 600, '#cfe6f5')}
  ${rep(40, i => `<circle cx="${(i * 97) % 420 - 10}" cy="${(i * 53) % 300 + 10}" r="${2 + (i % 3)}" fill="#ffffff" stroke="none"/>`)}
  <path d="M-1200 300 Q-300 230 60 290 Q220 240 400 286 Q900 230 1600 300 V600 H-1200 Z" fill="#f4f9fd"/>
  <path d="M-1200 390 Q0 360 400 392 T1600 390 V600 H-1200 Z" fill="#ffffff"/>
  ${[[30, 300], [110, 280], [330, 290]].map(([x, y]) => `<path d="M${x} ${y - 120} L${x - 40} ${y} H${x + 40} Z" fill="#2f7a2a"/><path d="M${x} ${y - 120} L${x - 16} ${y - 74} H${x + 16} Z M${x - 26} ${y - 40} L${x - 40} ${y} H${x - 10} Z" fill="#ffffff"/><rect x="${x - 6}" y="${y}" width="12" height="18" fill="#8a5a2b"/>`).join('')}
  <rect x="190" y="250" width="110" height="80" fill="#a56a35"/>
  <path d="M178 254 L245 200 L312 254 Z" fill="#ffffff"/>
  <rect x="275" y="206" width="18" height="34" fill="#8f2a21"/>
  <path d="M284 196 q-10 -14 2 -26 q12 -12 0 -26" fill="none" stroke="#9aa7b4" stroke-width="4"/>
  <rect x="232" y="284" width="26" height="46" fill="#6b4320"/><rect x="200" y="272" width="22" height="20" fill="#ffd84d"/>
  <circle cx="110" cy="470" r="34" fill="#ffffff"/><circle cx="110" cy="418" r="24" fill="#ffffff"/>
  <path d="M110 418 L132 424 L110 428 Z" fill="#f08a24"/><circle cx="102" cy="410" r="3" fill="#23304a"/><circle cx="116" cy="410" r="3" fill="#23304a"/>
  <path d="M90 438 Q110 448 130 438 L134 446 Q110 456 86 446 Z" fill="#e5484d"/>
  <path d="M78 460 L52 444 M142 460 L168 444" fill="none" stroke="#8a5a2b" stroke-width="4"/>
  <circle cx="110" cy="462" r="3" fill="#23304a"/><circle cx="110" cy="476" r="3" fill="#23304a"/>`);

const SEA = wrap(`${wide(0, 200, '#4fb3e8')}${wide(200, 200, '#3a9ad9')}${wide(400, 200, '#2f86c4')}
  <g fill="#ffffff" opacity="0.25" stroke="none"><path d="M60 0 L100 0 L40 420 L10 420 Z"/><path d="M220 0 L250 0 L210 420 L184 420 Z"/></g>
  ${rep(12, i => `<circle cx="${(i * 71) % 400}" cy="${80 + (i * 37) % 300}" r="${4 + (i % 4) * 2}" fill="none" stroke="#dff3fd"/>`)}
  <path d="M-1200 500 Q-300 470 0 500 Q200 476 400 500 Q900 470 1600 500 V600 H-1200 Z" fill="#e8c88a"/>
  ${[[40, 500, 150], [70, 500, 110], [350, 500, 140], [376, 500, 100]].map(([x, y, h]) => `<path d="M${x} ${y} q-14 ${-h / 4} 0 ${-h / 2} q14 ${-h / 4} 0 ${-h / 2}" fill="none" stroke="#2f7a2a" stroke-width="9"/>`).join('')}
  <path d="M150 504 Q140 470 160 456 Q156 440 172 436 Q184 444 178 460 Q198 470 186 504 Z" fill="#f15bb5"/>
  <path d="M250 504 Q246 478 262 470 Q266 452 284 456 Q296 470 286 484 Q300 494 292 504 Z" fill="#f08a24"/>
  <rect x="196" y="520" width="58" height="36" rx="4" fill="#a56a35"/><path d="M196 532 Q225 506 254 532 Z" fill="#8a5a2b"/>
  <rect x="219" y="528" width="12" height="12" fill="#ffd84d"/>
  <ellipse cx="320" cy="560" rx="30" ry="14" fill="#9aa7b4"/><ellipse cx="96" cy="566" rx="22" ry="10" fill="#9aa7b4"/>`);

const SPACE = wrap(`${wide(0, 600, '#1d2747')}
  ${rep(60, i => `<circle cx="${(i * 89) % 420 - 10}" cy="${(i * 47) % 420}" r="${1 + (i % 3) * 0.8}" fill="#ffffff" stroke="none"/>`)}
  <circle cx="84" cy="84" r="36" fill="#ffe9a3"/><circle cx="102" cy="72" r="31" fill="#1d2747" stroke="none"/>
  <circle cx="300" cy="170" r="44" fill="#f08a24"/><ellipse cx="300" cy="170" rx="74" ry="16" fill="none" stroke="#ffd84d" stroke-width="6"/>
  <path d="M256 168 Q300 150 344 168" fill="none" stroke="#c96a10"/>
  <circle cx="120" cy="300" r="18" fill="#3a86d8"/><path d="M110 294 q6 -6 12 0 q4 8 -4 12" fill="#4fa53e"/>
  <path d="M-1200 430 Q-300 400 0 430 Q200 400 400 430 Q900 400 1600 430 V600 H-1200 Z" fill="#9aa7b4"/>
  <g fill="#7d8a97"><ellipse cx="80" cy="500" rx="40" ry="12"/><ellipse cx="260" cy="470" rx="26" ry="8"/><ellipse cx="320" cy="550" rx="48" ry="14"/><ellipse cx="160" cy="570" rx="22" ry="7"/></g>
  <path d="M200 470 V420" fill="none" stroke-width="4"/><path d="M200 420 H236 V440 H200" fill="#e5484d"/>`);

const CAMP = wrap(`${wide(0, 600, '#f6c08a')}${wide(0, 160, '#f3a77a')}
  <circle cx="200" cy="230" r="44" fill="#ffd84d"/>
  <path d="M-1200 300 L-60 300 L40 170 L130 270 L220 150 L330 280 L420 190 L1600 300 V600 H-1200 Z" fill="#7a6f9b"/>
  <path d="M40 170 L64 202 L20 196 Z M220 150 L250 190 L196 186 Z M420 190 L440 214 L400 214 Z" fill="#ffffff"/>
  ${wide(300, 300, '#5bbd56')}
  <ellipse cx="290" cy="380" rx="120" ry="34" fill="#3a9ad9"/><path d="M220 376 q15 -6 30 0 M290 392 q15 -6 30 0" fill="none" stroke="#bfe6fb"/>
  ${[[20, 330], [60, 300], [380, 320]].map(([x, y]) => `<path d="M${x} ${y - 150} L${x - 34} ${y - 60} H${x - 14} L${x - 40} ${y} H${x + 40} L${x + 14} ${y - 60} H${x + 34} Z" fill="#2f7a2a"/><rect x="${x - 6}" y="${y}" width="12" height="20" fill="#6b4320"/>`).join('')}
  <path d="M100 480 L160 380 L220 480 Z" fill="#f08a24"/><path d="M160 380 L146 480 H174 Z" fill="#c96a10"/>
  <g transform="translate(270 500)"><path d="M-30 18 L30 6 M-30 6 L30 18" fill="none" stroke="#8a5a2b" stroke-width="9"/>
  <path d="M-16 6 Q-20 -18 0 -36 Q4 -18 12 -24 Q22 -6 16 6 Z" fill="#f6a40e"/><path d="M-6 6 Q-8 -8 2 -18 Q8 -6 8 6 Z" fill="#ffd84d"/></g>
  <rect x="40" y="510" width="60" height="14" rx="7" fill="#8a5a2b"/>`);

const PARK = wrap(`${wide(0, 600, '#a7dcf7')}
  ${[[0, 150, 60], [58, 110, 70], [126, 170, 50], [178, 90, 60], [236, 140, 54], [292, 120, 64], [354, 160, 56]].map(([x, top, w], i) => `<rect x="${x}" y="${top}" width="${w}" height="${310 - top}" fill="${['#c9d3dd', '#9aa7b4', '#b5c1cc'][i % 3]}"/>${rep(Math.floor((290 - top) / 30), r => rep(Math.floor(w / 20), c => `<rect x="${x + 6 + c * 20}" y="${top + 12 + r * 30}" width="10" height="14" fill="#ffe9a3" stroke="none"/>`))}`).join('')}
  ${wide(300, 300, '#6dbb4f')}
  <path d="M120 600 Q170 470 260 300 H290 Q220 470 200 600 Z" fill="#ece2c9"/>
  <g transform="translate(40 410)"><rect x="0" y="0" width="70" height="10" fill="#a56a35"/><rect x="0" y="-22" width="70" height="8" fill="#a56a35"/><path d="M8 10 V30 M62 10 V30" fill="none" stroke-width="5"/></g>
  <path d="M330 470 V330" fill="none" stroke-width="6"/><circle cx="330" cy="324" r="12" fill="#ffd84d"/><path d="M316 336 H344" fill="none" stroke-width="5"/>
  <path d="M290 540 V440 M290 450 H340 L380 540" fill="none" stroke="#e5484d" stroke-width="7"/>
  <path d="M290 470 H322" fill="none" stroke="#e5484d" stroke-width="5"/>
  <ellipse cx="80" cy="540" rx="44" ry="14" fill="#3a9ad9"/><path d="M80 540 V510 M70 516 q10 -16 20 0" fill="none" stroke="#bfe6fb" stroke-width="4"/>`);

export const PLACES = [
  { id: 'yard', top: 'var(--sky)', name: 'Yard', svg: YARD_SVG },
  { id: 'beach', top: '#9fdcf7', name: 'Beach', svg: BEACH },
  { id: 'farm', top: '#a7dcf7', name: 'Farm', svg: FARM },
  { id: 'snow', top: '#cfe6f5', name: 'Snowy woods', svg: SNOW },
  { id: 'sea', top: '#4fb3e8', name: 'Under the sea', svg: SEA },
  { id: 'space', top: '#1d2747', name: 'Outer space', svg: SPACE },
  { id: 'camp', top: '#f3a77a', name: 'Campsite', svg: CAMP },
  { id: 'park', top: '#a7dcf7', name: 'City park', svg: PARK }
];
export const placeOf = id => PLACES.find(p => p.id === id) ?? PLACES[0];
