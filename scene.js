// The yard, drawn as flat shapes: sky, sun, clouds, two hills, a fence, the big tree
// with its treehouse, and the path. Stickers sit on top of this.
export const YARD_SVG = `<svg class="scene-art" viewBox="0 0 400 600" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
  <rect x="-1200" width="2800" height="600" fill="var(--sky)"/>
  <circle cx="338" cy="78" r="38" fill="var(--sun)"/>
  <g fill="#fff"><ellipse cx="88" cy="92" rx="46" ry="18"/><ellipse cx="116" cy="80" rx="28" ry="18"/><ellipse cx="246" cy="140" rx="36" ry="14"/><ellipse cx="266" cy="131" rx="20" ry="13"/></g>
  <path d="M-1200 320 Q-600 260 -300 330 T0 330 Q110 270 230 318 T400 300 Q700 250 1000 320 T1600 310 V600 H-1200 Z" fill="var(--hill)"/>
  <path d="M-1200 380 Q-500 340 0 380 Q140 340 260 370 T400 360 Q800 330 1600 370 V600 H-1200 Z" fill="var(--meadow)"/>
  <g fill="#fff8f0" stroke="var(--ink)" stroke-width="2"><rect x="-1200" y="372" width="2800" height="8"/><rect x="-1200" y="396" width="2800" height="8"/>
    ${Array.from({ length: 74 }, (_, i) => `<path d="M${-1210 + i * 38} 410 V362 l7 -9 l7 9 V410 Z"/>`).join('')}</g>
  <path d="M176 600 C186 520 214 470 206 404 H232 C238 470 262 530 272 600 Z" fill="var(--path)"/>
  <rect x="70" y="250" width="26" height="170" rx="6" fill="var(--bark)"/>
  <circle cx="83" cy="214" r="78" fill="var(--leaf)"/><circle cx="34" cy="250" r="44" fill="var(--leaf)"/><circle cx="138" cy="246" r="48" fill="var(--leaf)"/>
  <g stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round">
    <rect x="44" y="232" width="84" height="56" fill="var(--wood)"/>
    <path d="M36 234 L86 196 L136 234 Z" fill="var(--roof)"/>
    <rect x="74" y="246" width="22" height="22" fill="var(--sky)"/>
    <path d="M58 288 V420 M74 288 V420 M58 314 H74 M58 340 H74 M58 366 H74 M58 392 H74" fill="none"/>
  </g>
</svg>`;

// First run shows just the tree and treehouse, cropped from the same drawing.
export const TREEHOUSE_SVG = YARD_SVG.replace('viewBox="0 0 400 600" preserveAspectRatio="xMidYMax meet"', 'viewBox="0 140 400 290" preserveAspectRatio="xMidYMid slice"');
