import { BOUNDS } from './bounds.js';

// Picture words, drawn as flat shapes. One drawing gives both versions: coloured with
// an ink outline for the app, and black outline on white for worksheets to colour in.
// Each drawing sits in a 100 by 100 box. Batch 1 approved 2026-10-11 (style accepted); batch 2 approved with leg and bag redrawn; batch 3 drawn 2026-10-12; batch 4 drawn 2026-10-12; batch 5 drawn 2026-10-12, completing all 76.

const P = {
  map: `<path d="M12 26 L36 18 L64 26 L88 18 V76 L64 84 L36 76 L12 84 Z" fill="#f3e2b3"/>
    <path d="M36 18 V76 M64 26 V84" fill="none"/>
    <path d="M22 66 Q34 44 48 54 T74 40" fill="none" stroke-dasharray="5 5" class="detail" style-color="#d4441f"/>
    <path d="M70 32 L80 42 M80 32 L70 42" fill="none" class="detail" style-color="#d4441f"/>`,
  fan: `<rect x="40" y="70" width="20" height="10" fill="#9aa7b4"/><rect x="26" y="80" width="48" height="10" rx="5" fill="#6f7d8c"/>
    <circle cx="50" cy="42" r="32" fill="#e8f4fb"/>
    <path d="M50 42 C40 22 56 14 58 30 Z M50 42 C70 36 74 54 58 54 Z M50 42 C44 62 26 56 36 44 Z" fill="#3a86d8"/>
    <circle cx="50" cy="42" r="5" fill="#23304a"/>`,
  pan: `<rect x="62" y="44" width="34" height="10" rx="5" fill="#8a5a2b"/>
    <ellipse cx="38" cy="50" rx="30" ry="22" fill="#3d4654"/><ellipse cx="38" cy="48" rx="22" ry="15" fill="#5c6878"/>`,
  cat: `<path d="M22 44 L26 14 L42 30 Z M78 44 L74 14 L58 30 Z" fill="#f08a24"/>
    <ellipse cx="50" cy="54" rx="34" ry="30" fill="#f08a24"/>
    <ellipse cx="38" cy="50" rx="5" ry="7" fill="#23304a"/><ellipse cx="62" cy="50" rx="5" ry="7" fill="#23304a"/>
    <path d="M45 62 L55 62 L50 68 Z" fill="#f15bb5"/>
    <path d="M30 64 H12 M30 70 L14 76 M70 64 H88 M70 70 L86 76" fill="none"/>`,
  can: `<rect x="26" y="20" width="48" height="64" fill="#c9d3dd"/>
    <rect x="26" y="34" width="48" height="36" fill="#e5484d"/>
    <ellipse cx="50" cy="20" rx="24" ry="7" fill="#e8eef3"/><path d="M26 84 A24 7 0 0 0 74 84" fill="#c9d3dd"/>`,
  pot: `<path d="M16 38 H84 V72 Q84 86 70 86 H30 Q16 86 16 72 Z" fill="#6f7d8c"/>
    <rect x="4" y="44" width="14" height="8" rx="4" fill="#3d4654"/><rect x="82" y="44" width="14" height="8" rx="4" fill="#3d4654"/>
    <path d="M12 38 Q50 18 88 38 Z" fill="#9aa7b4"/><rect x="44" y="18" width="12" height="9" rx="4" fill="#3d4654"/>`,
  mop: `<rect x="47" y="2" width="7" height="60" rx="3" fill="#a56a35"/>
    <rect x="38" y="58" width="25" height="9" rx="3" fill="#3a86d8"/>
    <g fill="#e8eef3"><ellipse cx="34" cy="80" rx="9" ry="13"/><ellipse cx="66" cy="80" rx="9" ry="13"/><ellipse cx="42" cy="84" rx="9" ry="12"/><ellipse cx="58" cy="84" rx="9" ry="12"/><ellipse cx="50" cy="80" rx="10" ry="14"/></g>`,
  sun: `<g fill="none" class="thick" style-color="#f6a40e"><path d="M50 4 V18 M50 82 V96 M4 50 H18 M82 50 H96 M17 17 L27 27 M73 73 L83 83 M83 17 L73 27 M27 73 L17 83"/></g>
    <circle cx="50" cy="50" r="24" fill="#ffc845"/>`,
  bug: `<circle cx="50" cy="56" r="32" fill="#e5484d"/><path d="M50 24 V88" fill="none"/>
    <circle cx="50" cy="26" r="13" fill="#23304a"/>
    <circle cx="36" cy="50" r="6" fill="#23304a"/><circle cx="64" cy="50" r="6" fill="#23304a"/><circle cx="38" cy="72" r="5" fill="#23304a"/><circle cx="62" cy="72" r="5" fill="#23304a"/>
    <path d="M44 16 L38 6 M56 16 L62 6" fill="none"/>`,
  cup: `<ellipse cx="50" cy="84" rx="38" ry="8" fill="#e8f4fb"/>
    <path d="M24 34 H76 L70 78 Q50 86 30 78 Z" fill="#f15bb5"/>
    <path d="M74 44 Q92 44 90 58 Q88 70 72 68" fill="none" class="thick" style-color="#f15bb5"/>
    <ellipse cx="50" cy="34" rx="26" ry="6" fill="#fbd3ea"/>`,
  bus: `<rect x="6" y="26" width="88" height="46" rx="8" fill="#ffc845"/>
    <rect x="14" y="34" width="16" height="14" fill="#cfe8f7"/><rect x="34" y="34" width="16" height="14" fill="#cfe8f7"/><rect x="54" y="34" width="16" height="14" fill="#cfe8f7"/><rect x="76" y="34" width="12" height="24" fill="#cfe8f7"/>
    <path d="M6 56 H74" fill="none"/>
    <circle cx="26" cy="74" r="9" fill="#23304a"/><circle cx="74" cy="74" r="9" fill="#23304a"/>`,
  nut: `<path d="M30 20 C46 16 54 30 50 42 C46 52 58 58 62 66 C70 82 52 94 38 86 C26 80 30 68 34 60 C38 52 24 46 22 36 C20 26 24 22 30 20 Z" fill="#d9a35f" transform="rotate(-20 46 56)"/>
    <path d="M30 34 Q36 36 40 32 M36 48 Q42 50 46 46 M44 66 Q50 68 54 64 M50 78 Q56 80 60 76" fill="none" transform="rotate(-20 46 56)"/>`,
  dog: `<ellipse cx="50" cy="52" rx="28" ry="30" fill="#c9a26b"/>
    <path d="M24 30 Q8 34 12 62 Q18 70 26 58 Z M76 30 Q92 34 88 62 Q82 70 74 58 Z" fill="#7a4a1d"/>
    <circle cx="40" cy="46" r="5" fill="#23304a"/><circle cx="60" cy="46" r="5" fill="#23304a"/>
    <ellipse cx="50" cy="60" rx="8" ry="6" fill="#23304a"/>
    <path d="M44 72 Q50 84 56 72 Z" fill="#f15bb5"/>`,
  pig: `<path d="M22 30 L30 10 L42 26 Z M78 30 L70 10 L58 26 Z" fill="#f4a3b8"/>
    <circle cx="50" cy="52" r="34" fill="#f8bfd0"/>
    <circle cx="38" cy="42" r="5" fill="#23304a"/><circle cx="62" cy="42" r="5" fill="#23304a"/>
    <ellipse cx="50" cy="62" rx="15" ry="11" fill="#f4a3b8"/>
    <ellipse cx="45" cy="62" rx="3" ry="4" fill="#23304a"/><ellipse cx="55" cy="62" rx="3" ry="4" fill="#23304a"/>`,
  bed: `<rect x="8" y="26" width="12" height="62" rx="3" fill="#a56a35"/>
    <rect x="80" y="46" width="12" height="42" rx="3" fill="#a56a35"/>
    <rect x="18" y="54" width="64" height="18" fill="#e8f4fb"/>
    <rect x="22" y="42" width="22" height="14" rx="6" fill="#ffffff"/>
    <path d="M40 50 H82 V72 H40 Z" fill="#3a86d8"/>`,
  hat: `<ellipse cx="50" cy="74" rx="44" ry="10" fill="#3a86d8"/>
    <path d="M24 72 V40 Q24 22 50 22 Q76 22 76 40 V72 Z" fill="#3a86d8"/>
    <rect x="24" y="56" width="52" height="10" fill="#ffc845"/>`,
  bag: `<path d="M28 42 Q28 14 40 14 Q52 14 52 42" fill="none" class="detail" style-color="#2f7a2a"/>
    <path d="M48 42 Q48 14 60 14 Q72 14 72 42" fill="none" class="detail" style-color="#2f7a2a"/>
    <rect x="30" y="20" width="10" height="30" rx="4" fill="#f0d79c" transform="rotate(-12 35 35)"/>
    <circle cx="50" cy="36" r="9" fill="#e5484d"/>
    <path d="M62 40 Q60 28 66 22 Q68 30 72 34 Q66 36 62 40 Z" fill="#4fa53e"/>
    <path d="M16 40 H84 L78 92 H22 Z" fill="#4fa53e"/>
    <path d="M16 40 H84 L83 48 H17 Z" fill="#3e8a32"/>`,
  jam: `<rect x="26" y="34" width="48" height="56" rx="8" fill="#b3261e"/>
    <rect x="24" y="18" width="52" height="16" rx="4" fill="#f4f1ea"/>
    <path d="M24 30 L30 22 L36 30 L42 22 L48 30 L54 22 L60 30 L66 22 L72 30 L76 26" fill="none" style-color="#e5484d"/>
    <rect x="32" y="48" width="36" height="28" rx="4" fill="#fbf7ef"/>
    <path d="M50 54 Q60 54 58 64 Q54 72 50 74 Q46 72 42 64 Q40 54 50 54 Z" fill="#e5484d"/>
    <path d="M44 54 L50 50 L56 54" fill="none" style-color="#2f7a2a"/>`,
  hen: `<path d="M28 60 Q20 40 30 30 Q36 18 50 22 Q62 26 60 40 Q84 34 88 52 Q90 78 62 84 Q34 88 28 60 Z" fill="#f4f1ea"/>
    <path d="M40 22 Q42 10 48 16 Q52 8 56 18 Q62 14 58 26 Z" fill="#e5484d"/>
    <path d="M30 34 L18 38 L30 42 Z" fill="#f6a40e"/>
    <circle cx="40" cy="32" r="4" fill="#23304a"/>
    <path d="M30 44 Q28 54 36 54 Q38 46 30 44 Z" fill="#e5484d"/>
    <path d="M52 86 V96 M66 86 V96" fill="none" style-color="#f6a40e"/>`,
  pen: `<rect x="44" y="10" width="14" height="66" rx="4" fill="#3a86d8" transform="rotate(30 50 50)"/>
    <path d="M44 76 L51 92 L58 76 Z" fill="#f1e4c8" transform="rotate(30 50 50)"/>
    <rect x="40" y="16" width="5" height="26" rx="2" fill="#23304a" transform="rotate(30 50 50)"/>`,
  net: `<rect x="8" y="10" width="7" height="44" rx="3" fill="#8a5a2b" transform="rotate(-40 12 32)"/>
    <ellipse cx="58" cy="40" rx="30" ry="22" fill="none" class="thick" style-color="#6f7d8c"/>
    <path d="M30 44 Q40 92 58 88 Q78 86 86 44" fill="#e8f4fb"/>
    <path d="M38 56 L78 56 M42 70 L74 70 M50 46 L54 86 M66 46 L64 86" fill="none"/>`,
  jet: `<path d="M8 52 Q8 44 18 44 H78 Q94 46 96 52 Q94 58 78 60 H18 Q8 60 8 52 Z" fill="#e8f4fb"/>
    <path d="M44 46 L30 18 H40 L62 46 Z M44 58 L30 86 H40 L62 58 Z" fill="#3a86d8"/>
    <path d="M14 46 L6 30 H14 L24 46 Z" fill="#3a86d8"/>
    <circle cx="82" cy="52" r="3" fill="#23304a"/><circle cx="72" cy="52" r="3" fill="#23304a"/>`,
  web: `<g fill="none" style-color="#6f7d8c"><path d="M50 10 V90 M10 50 H90 M22 22 L78 78 M78 22 L22 78"/>
    <path d="M50 22 L70 30 L78 50 L70 70 L50 78 L30 70 L22 50 L30 30 Z"/>
    <path d="M50 36 L60 40 L64 50 L60 60 L50 64 L40 60 L36 50 L40 40 Z"/></g>
    <circle cx="66" cy="66" r="6" fill="#23304a"/>`,
  leg: `<path d="M10 26 Q10 18 18 18 H52 Q60 18 62 26 L66 40 Q70 48 66 56 L62 82 Q61 88 66 89 L86 90 Q94 91 94 95 Q94 98 88 98 H52 Q46 98 47 90 L48 60 Q44 54 34 52 L18 50 Q10 48 10 40 Z" fill="#e8b48a"/>
    <path d="M10 26 Q10 18 18 18 H52 Q60 18 62 26 L64 36 Q40 42 10 38 Z" fill="#3a86d8"/>
    <path d="M56 46 Q62 50 60 58" fill="none"/>
    <path d="M50 84 Q54 88 58 86" fill="none"/>
    <path d="M80 90 V94 M86 90.5 V94" fill="none"/>`,
  bib: `<path d="M30 18 Q50 36 70 18 L80 26 Q86 34 84 50 Q82 84 50 88 Q18 84 16 50 Q14 34 20 26 Z" fill="#a7dcf7"/>
    <path d="M34 30 Q50 46 66 30" fill="none" style-color="#3a86d8"/>
    <circle cx="50" cy="64" r="10" fill="#ffc845"/>`,
  wig: `<path d="M18 62 Q10 30 30 18 Q50 6 70 18 Q90 30 82 62 Q86 82 74 88 L70 60 Q50 44 30 60 L26 88 Q14 82 18 62 Z" fill="#f6c90e"/>
    <path d="M30 26 Q40 36 50 28 Q60 36 70 26" fill="none" style-color="#c99a00"/>`,
  lid: `<ellipse cx="50" cy="66" rx="42" ry="14" fill="#9aa7b4"/>
    <path d="M10 64 Q50 30 90 64 Q50 76 10 64 Z" fill="#c9d3dd"/>
    <rect x="42" y="34" width="16" height="12" rx="5" fill="#3d4654"/>`,
  box: `<path d="M14 40 L50 26 L86 40 V80 L50 94 L14 80 Z" fill="#d9934a"/>
    <path d="M14 40 L50 54 L86 40 M50 54 V94" fill="none"/>
    <path d="M14 40 L4 26 L40 12 L50 26 Z M86 40 L96 26 L60 12 L50 26 Z" fill="#e8b47e"/>`,
  fox: `<path d="M16 22 L36 34 L28 52 Z M84 22 L64 34 L72 52 Z" fill="#e2622e"/>
    <path d="M18 30 Q50 26 82 30 Q86 58 50 88 Q14 58 18 30 Z" fill="#f08a24"/>
    <path d="M30 58 Q50 54 70 58 Q62 76 50 88 Q38 76 30 58 Z" fill="#fff"/>
    <circle cx="38" cy="48" r="4" fill="#23304a"/><circle cx="62" cy="48" r="4" fill="#23304a"/>
    <circle cx="50" cy="80" r="5" fill="#23304a"/>`,
  log: `<rect x="14" y="38" width="64" height="34" fill="#a56a35"/>
    <ellipse cx="78" cy="55" rx="12" ry="17" fill="#e8b47e"/>
    <ellipse cx="78" cy="55" rx="6" ry="9" fill="none" style-color="#a56a35"/>
    <ellipse cx="14" cy="55" rx="12" ry="17" fill="#8a5a2b"/>
    <path d="M30 46 H56 M24 62 H48" fill="none" style-color="#7a4a1d"/>`,
  van: `<path d="M6 38 Q6 26 18 26 H66 Q74 26 80 34 L92 50 V72 H6 Z" fill="#e5484d"/>
    <path d="M66 32 H74 L84 48 H66 Z" fill="#cfe8f7"/>
    <rect x="16" y="34" width="20" height="14" fill="#cfe8f7"/><rect x="40" y="34" width="20" height="14" fill="#cfe8f7"/>
    <path d="M62 52 V70" fill="none"/>
    <circle cx="26" cy="74" r="9" fill="#23304a"/><circle cx="74" cy="74" r="9" fill="#23304a"/>`,
  rug: `<rect x="12" y="24" width="76" height="52" rx="4" fill="#9b5de5"/>
    <rect x="20" y="32" width="60" height="36" rx="3" fill="#ffc845"/>
    <path d="M50 38 L64 50 L50 62 L36 50 Z" fill="#e5484d"/>
    <path d="M12 30 H4 M12 40 H4 M12 50 H4 M12 60 H4 M12 70 H4 M88 30 H96 M88 40 H96 M88 50 H96 M88 60 H96 M88 70 H96" fill="none"/>`,
  tub: `<path d="M8 44 H92 V58 Q92 80 70 82 H30 Q8 80 8 58 Z" fill="#f4f1ea"/>
    <path d="M12 82 L8 92 M88 82 L92 92" fill="none" class="detail" style-color="#9aa7b4"/>
    <rect x="4" y="40" width="92" height="8" rx="4" fill="#e8eef3"/>
    <path d="M78 40 V18 Q78 12 70 12 H64" fill="none" class="detail" style-color="#9aa7b4"/>
    <g fill="#a7dcf7"><circle cx="30" cy="38" r="7"/><circle cx="42" cy="34" r="9"/><circle cx="56" cy="38" r="6"/></g>`,
  gum: `<rect x="14" y="44" width="56" height="22" rx="3" fill="#c9d3dd" transform="rotate(-18 42 55)"/>
    <rect x="44" y="30" width="44" height="20" rx="3" fill="#f15bb5" transform="rotate(-18 66 40)"/>
    <path d="M50 40 L62 36 M54 48 L72 42" fill="none" style-color="#fbd3ea" transform="rotate(-2 60 42)"/>
    <rect x="18" y="56" width="40" height="8" fill="#e5484d" transform="rotate(-18 38 60)"/>`,
  jug: `<path d="M30 20 H62 L64 32 Q78 40 76 64 Q74 90 46 90 Q18 90 18 64 Q16 40 30 32 Z" fill="#a7dcf7"/>
    <path d="M70 40 Q92 44 88 64 Q84 78 72 74" fill="none" class="thick" style-color="#3a86d8"/>
    <path d="M30 20 L22 14 H62" fill="#a7dcf7"/>
    <path d="M22 58 Q46 64 72 58 V64 Q72 86 46 86 Q22 86 22 64 Z" fill="#ffffff"/>`,
  fish: `<path d="M14 50 Q34 22 62 30 Q76 34 82 50 Q76 66 62 70 Q34 78 14 50 Z" fill="#f08a24"/>
    <path d="M78 50 L96 34 V66 Z" fill="#f6a40e"/>
    <circle cx="30" cy="46" r="4" fill="#23304a"/>
    <path d="M44 36 Q50 50 44 64 M56 36 Q62 50 56 64" fill="none"/>`,
  ship: `<path d="M6 60 H94 L82 82 H18 Z" fill="#e5484d"/>
    <rect x="22" y="44" width="50" height="16" fill="#f4f1ea"/>
    <rect x="34" y="30" width="28" height="14" fill="#f4f1ea"/>
    <rect x="44" y="12" width="10" height="18" fill="#23304a"/>
    <circle cx="32" cy="52" r="3" fill="#3a86d8"/><circle cx="46" cy="52" r="3" fill="#3a86d8"/><circle cx="60" cy="52" r="3" fill="#3a86d8"/>
    <path d="M4 88 Q16 82 28 88 T52 88 T76 88 T100 88" fill="none" style-color="#3a86d8"/>`,
  shed: `<path d="M14 46 L50 20 L86 46 Z" fill="#a3221a"/>
    <rect x="20" y="46" width="60" height="42" fill="#d9934a"/>
    <path d="M30 46 V88 M40 46 V88 M60 46 V88 M70 46 V88" fill="none" style-color="#b5803f"/>
    <rect x="40" y="58" width="20" height="30" fill="#8a5a2b"/>
    <circle cx="56" cy="74" r="2" fill="#ffc845"/>
    <path d="M86 92 L94 40" fill="none" class="detail" style-color="#8a5a2b"/>
    <path d="M86 40 H100 M88 40 V48 M93 40 V48 M98 40 V48" fill="none" style-color="#6f7d8c"/>`,
  duck: `<path d="M20 58 Q20 44 36 44 H54 Q64 44 70 52 Q88 50 90 62 Q90 84 58 86 H36 Q18 84 20 58 Z" fill="#ffc845"/>
    <circle cx="36" cy="32" r="16" fill="#ffc845"/>
    <path d="M18 32 L4 36 L18 40 Z" fill="#f08a24"/>
    <circle cx="32" cy="28" r="3" fill="#23304a"/>
    <path d="M48 62 Q60 56 70 64" fill="none" style-color="#c99a00"/>`,
  sock: `<path d="M34 8 H66 V58 Q66 66 72 72 Q84 80 80 90 Q76 98 62 94 L36 84 Q24 78 28 66 L34 54 Z" fill="#e5484d"/>
    <rect x="34" y="8" width="32" height="12" fill="#f4f1ea"/>
    <path d="M34 30 H66 M34 40 H66" fill="none" class="detail" style-color="#f4f1ea"/>
    <path d="M62 94 Q74 92 78 84" fill="none" class="detail" style-color="#f4f1ea"/>`,
  rock: `<path d="M12 78 Q8 56 24 44 Q34 26 54 28 Q76 26 86 46 Q96 64 88 78 Z" fill="#9aa7b4"/>
    <path d="M30 50 Q40 44 46 52 M60 40 Q68 42 70 50" fill="none" style-color="#6f7d8c"/>
    <path d="M6 80 H94" fill="none" style-color="#6dbb4f"/>`,
  chick: `<circle cx="50" cy="60" r="28" fill="#ffd84d"/>
    <circle cx="50" cy="30" r="18" fill="#ffd84d"/>
    <path d="M46 34 L54 34 L50 42 Z" fill="#f08a24"/>
    <circle cx="43" cy="27" r="3" fill="#23304a"/><circle cx="57" cy="27" r="3" fill="#23304a"/>
    <path d="M44 12 Q50 4 52 12 Q56 6 56 14" fill="none" style-color="#c99a00"/>
    <path d="M42 88 V96 M58 88 V96" fill="none" style-color="#f08a24"/>
    <path d="M22 56 Q14 62 22 70" fill="#ffd84d"/>`,
  flag: `<rect x="16" y="8" width="6" height="88" rx="3" fill="#8a5a2b"/>
    <path d="M22 14 Q46 4 62 14 T88 14 V52 Q72 42 58 52 T22 52 Z" fill="#e5484d"/>
    <path d="M48 24 L52 33 L61 33 L54 39 L57 48 L48 42 L40 48 L43 39 L36 33 L45 33 Z" fill="#ffffff"/>`,
  crab: `<ellipse cx="50" cy="60" rx="30" ry="20" fill="#e5484d"/>
    <path d="M22 42 Q10 26 22 18 Q26 30 34 26 Q30 36 26 44 Z M78 42 Q90 26 78 18 Q74 30 66 26 Q70 36 74 44 Z" fill="#e5484d"/>
    <path d="M40 42 V32 M60 42 V32" fill="none"/>
    <circle cx="40" cy="30" r="5" fill="#ffffff"/><circle cx="60" cy="30" r="5" fill="#ffffff"/>
    <circle cx="40" cy="30" r="2.4" fill="#23304a"/><circle cx="60" cy="30" r="2.4" fill="#23304a"/>
    <path d="M24 64 L8 72 M26 72 L12 84 M76 64 L92 72 M74 72 L88 84" fill="none" class="detail" style-color="#b3261e"/>`,
  hand: `<path d="M30 92 V54 Q22 46 18 36 Q16 30 22 30 Q28 30 34 42 V18 Q34 12 40 12 Q46 12 46 18 V40 V12 Q46 6 52 6 Q58 6 58 12 V40 V16 Q58 10 64 10 Q70 10 70 16 V44 V26 Q70 20 76 20 Q82 20 82 26 V60 Q82 80 72 92 Z" fill="#e8b48a"/>
    <path d="M46 40 V30 M58 40 V30 M70 44 V36" fill="none"/>`,
  lamp: `<path d="M30 14 H70 L82 50 H18 Z" fill="#ffc845"/>
    <rect x="46" y="50" width="8" height="32" fill="#8a5a2b"/>
    <rect x="28" y="82" width="44" height="10" rx="5" fill="#a56a35"/>
    <path d="M60 58 V70" fill="none" style-color="#23304a"/>`,
  clam: `<path d="M10 58 Q12 22 50 20 Q88 22 90 58 Z" fill="#f2c9a0"/>
    <path d="M10 58 Q50 92 90 58 Z" fill="#e8b48a"/>
    <path d="M50 22 V58 M30 28 L40 58 M70 28 L60 58 M18 40 L28 58 M82 40 L72 58" fill="none" style-color="#b5803f"/>
    <circle cx="50" cy="66" r="7" fill="#ffffff"/>`,
  mask: `<path d="M8 40 Q8 28 22 28 H78 Q92 28 92 40 Q92 64 72 66 Q60 66 54 56 Q50 52 46 56 Q40 66 28 66 Q8 64 8 40 Z" fill="#9b5de5"/>
    <ellipse cx="30" cy="46" rx="11" ry="8" fill="#ffffff"/><ellipse cx="70" cy="46" rx="11" ry="8" fill="#ffffff"/>
    <path d="M8 40 L2 34 M92 40 L98 34" fill="none"/>
    <path d="M20 30 L16 16 L28 28 M80 30 L84 16 L72 28" fill="#f15bb5"/>`,
  raft: `<path d="M2 80 Q14 74 26 80 T50 80 T74 80 T98 80" fill="none" class="detail" style-color="#3a86d8"/>
    <rect x="10" y="62" width="80" height="12" rx="6" fill="#a56a35"/>
    <path d="M30 62 V74 M50 62 V74 M70 62 V74" fill="none"/>
    <rect x="47" y="14" width="6" height="48" fill="#8a5a2b"/>
    <path d="M53 18 L82 46 H53 Z" fill="#f4f1ea"/>`,
  nest: `<path d="M10 52 Q50 98 90 52 Z" fill="#a56a35"/>
    <ellipse cx="34" cy="48" rx="10" ry="12" fill="#a7dcf7"/><ellipse cx="50" cy="44" rx="10" ry="13" fill="#a7dcf7"/><ellipse cx="66" cy="48" rx="10" ry="12" fill="#a7dcf7"/>
    <path d="M10 52 H90" fill="none"/>
    <path d="M18 60 Q40 66 62 58 M26 70 Q50 78 76 66 M16 54 Q34 62 54 56" fill="none" style-color="#7a4a1d"/>`,
  tent: `<path d="M50 14 L90 86 H10 Z" fill="#2f7a2a"/>
    <path d="M50 14 L36 86 H64 Z" fill="#ffc845"/>
    <path d="M50 14 L50 86" fill="none"/>
    <path d="M50 8 V14" fill="none"/>
    <path d="M4 88 H96" fill="none" style-color="#6dbb4f"/>`,
  desk: `<rect x="6" y="38" width="88" height="10" rx="2" fill="#a56a35"/>
    <rect x="12" y="48" width="8" height="42" fill="#8a5a2b"/>
    <rect x="58" y="48" width="30" height="42" fill="#d9934a"/>
    <path d="M58 62 H88 M58 76 H88" fill="none"/>
    <circle cx="73" cy="56" r="2" fill="#23304a"/><circle cx="73" cy="70" r="2" fill="#23304a"/>
    <rect x="22" y="24" width="16" height="14" fill="#3a86d8"/><rect x="42" y="28" width="20" height="10" rx="2" fill="#f4f1ea"/>`,
  belt: `<path d="M4 40 H96 V58 H4 Z" fill="#8a5a2b"/>
    <rect x="34" y="34" width="26" height="30" rx="4" fill="none" class="detail" style-color="#ffc845"/>
    <path d="M46 34 V64" fill="none" class="detail" style-color="#ffc845"/>
    <circle cx="72" cy="49" r="2.5" fill="#23304a"/><circle cx="82" cy="49" r="2.5" fill="#23304a"/><circle cx="92" cy="49" r="2.5" fill="#23304a"/>`,
  sled: `<path d="M8 68 H82 Q96 68 94 54" fill="none" class="thick" style-color="#6f7d8c"/>
    <path d="M24 68 V58 M66 68 V58" fill="none" class="detail" style-color="#6f7d8c"/>
    <rect x="14" y="44" width="70" height="14" rx="4" fill="#e5484d"/>
    <path d="M30 44 V58 M46 44 V58 M62 44 V58" fill="none"/>
    <path d="M14 46 Q4 40 10 32" fill="none" class="detail" style-color="#8a5a2b"/>`,
  vest: `<path d="M26 10 L40 10 L50 30 L60 10 L74 10 L88 28 V86 H58 L50 70 L42 86 H12 V28 Z" fill="#3a86d8"/>
    <path d="M50 30 V70" fill="none"/>
    <circle cx="44" cy="44" r="2.5" fill="#ffc845"/><circle cx="44" cy="58" r="2.5" fill="#ffc845"/>
    <path d="M22 30 Q20 44 26 48 M78 30 Q80 44 74 48" fill="none"/>`,
  gift: `<rect x="14" y="40" width="72" height="50" fill="#e5484d"/>
    <rect x="10" y="30" width="80" height="14" fill="#f15bb5"/>
    <rect x="44" y="30" width="12" height="60" fill="#ffc845"/>
    <path d="M50 30 Q32 6 26 18 Q22 28 50 30 Q68 6 74 18 Q78 28 50 30 Z" fill="#ffc845"/>`,
  milk: `<path d="M28 34 L36 20 H64 L72 34 V90 H28 Z" fill="#f4f1ea"/>
    <path d="M36 20 L40 10 H60 L64 20 Z" fill="#3a86d8"/>
    <rect x="28" y="50" width="44" height="26" fill="#3a86d8"/>
    <path d="M36 66 Q42 56 50 62 Q58 68 64 58" fill="none" style-color="#f4f1ea"/>`,
  crib: `<rect x="8" y="22" width="8" height="70" rx="3" fill="#a56a35"/><rect x="84" y="22" width="8" height="70" rx="3" fill="#a56a35"/>
    <rect x="16" y="26" width="68" height="6" fill="#d9934a"/><rect x="16" y="66" width="68" height="8" fill="#d9934a"/>
    <path d="M26 32 V66 M36 32 V66 M46 32 V66 M56 32 V66 M66 32 V66 M76 32 V66" fill="none" style-color="#a56a35"/>
    <rect x="18" y="58" width="64" height="8" fill="#a7dcf7"/>`,
  twig: `<path d="M10 82 Q40 66 60 44 Q72 30 90 22" fill="none" class="thick" style-color="#8a5a2b"/>
    <path d="M40 64 Q34 50 38 40 M62 42 Q72 46 80 44" fill="none" class="detail" style-color="#8a5a2b"/>
    <path d="M38 40 Q30 30 38 22 Q46 30 38 40 Z M80 44 Q90 36 96 44 Q88 52 80 44 Z M90 22 Q96 12 100 18 Q98 26 90 22 Z" fill="#4fa53e"/>`,
  frog: `<ellipse cx="50" cy="64" rx="36" ry="24" fill="#4fa53e"/>
    <circle cx="32" cy="40" r="13" fill="#4fa53e"/><circle cx="68" cy="40" r="13" fill="#4fa53e"/>
    <circle cx="32" cy="38" r="7" fill="#ffffff"/><circle cx="68" cy="38" r="7" fill="#ffffff"/>
    <circle cx="32" cy="38" r="3.5" fill="#23304a"/><circle cx="68" cy="38" r="3.5" fill="#23304a"/>
    <path d="M34 66 Q50 78 66 66" fill="none"/>
    <path d="M14 82 Q6 88 12 92 H28 M86 82 Q94 88 88 92 H72" fill="#3e8a32"/>`,
  pond: `<ellipse cx="50" cy="66" rx="46" ry="24" fill="#9aa7b4"/>
    <ellipse cx="50" cy="64" rx="40" ry="19" fill="#3a86d8"/>
    <path d="M24 64 Q34 60 44 64 M56 70 Q66 66 76 70" fill="none" style-color="#a7dcf7"/>
    <path d="M58 56 A9 5 0 1 0 72 58 L65 57 Z" fill="#4fa53e"/>
    <path d="M28 72 A8 4 0 1 0 42 73 L35 72 Z" fill="#4fa53e"/>
    <g fill="#f15bb5"><ellipse cx="64" cy="51" rx="3" ry="5" transform="rotate(-30 64 51)"/><ellipse cx="68" cy="51" rx="3" ry="5" transform="rotate(30 68 51)"/><ellipse cx="66" cy="50" rx="2.6" ry="5.5"/></g>
    <path d="M10 56 V18 M16 54 V26 M86 56 V22 M92 58 V32" fill="none" class="detail" style-color="#2f7a2a"/>
    <ellipse cx="10" cy="16" rx="3" ry="8" fill="#8a5a2b"/><ellipse cx="16" cy="24" rx="3" ry="7" fill="#8a5a2b"/><ellipse cx="86" cy="20" rx="3" ry="8" fill="#8a5a2b"/>
    <g fill="#c9d3dd"><ellipse cx="22" cy="86" rx="7" ry="4"/><ellipse cx="78" cy="86" rx="8" ry="4"/><ellipse cx="50" cy="90" rx="6" ry="3"/></g>`,
  stop: `<rect x="47" y="58" width="6" height="38" fill="#9aa7b4"/>
    <polygon points="34,6 66,6 88,28 88,52 66,74 34,74 12,52 12,28" fill="#d4441f"/>
    <polygon points="36,12 64,12 82,30 82,50 64,68 36,68 18,50 18,30" fill="none" style-color="#ffffff"/>
    <rect x="28" y="34" width="44" height="12" rx="2" fill="#ffffff"/>`,
  drum: `<ellipse cx="50" cy="34" rx="32" ry="10" fill="#f4f1ea"/>
    <path d="M18 34 V74 Q50 90 82 74 V34 Q50 48 18 34 Z" fill="#e5484d"/>
    <path d="M18 40 L34 78 L50 44 L66 82 L82 40" fill="none" style-color="#ffc845"/>
    <path d="M30 6 L48 30 M74 6 L56 30" fill="none" class="detail" style-color="#a56a35"/>`,
  plum: `<path d="M50 24 Q82 22 82 56 Q82 90 50 90 Q18 90 18 56 Q18 22 50 24 Z" fill="#7b3fa0"/>
    <path d="M50 24 Q46 52 52 88" fill="none" style-color="#5b2a78"/>
    <path d="M50 24 Q50 12 56 6" fill="none" class="detail" style-color="#8a5a2b"/>
    <path d="M54 14 Q70 4 76 16 Q64 22 54 14 Z" fill="#4fa53e"/>
    <ellipse cx="34" cy="44" rx="5" ry="9" fill="#a26cc4"/>`,
  slug: `<path d="M8 78 Q8 64 26 62 Q44 58 60 52 Q72 46 80 50 Q92 56 90 70 Q88 80 76 80 Z" fill="#c9a26b"/>
    <path d="M78 50 L74 30 M86 54 L90 34" fill="none" class="detail" style-color="#b5803f"/>
    <circle cx="74" cy="28" r="3.5" fill="#23304a"/><circle cx="90" cy="32" r="3.5" fill="#23304a"/>
    <path d="M24 70 Q40 66 56 62" fill="none" style-color="#a37a45"/>`,
  apple: `<path d="M50 30 Q72 18 84 38 Q94 62 74 84 Q62 94 50 86 Q38 94 26 84 Q6 62 16 38 Q28 18 50 30 Z" fill="#e5484d"/>
    <path d="M50 30 Q50 18 56 10" fill="none" class="detail" style-color="#8a5a2b"/>
    <path d="M54 18 Q68 6 76 16 Q66 26 54 18 Z" fill="#4fa53e"/>
    <ellipse cx="32" cy="46" rx="5" ry="9" fill="#f08080"/>`,
  egg: `<path d="M50 10 Q78 12 82 56 Q84 90 50 90 Q16 90 18 56 Q22 12 50 10 Z" fill="#f4f1ea"/>
    <ellipse cx="38" cy="38" rx="5" ry="9" fill="#ffffff"/>`,
  igloo: `<path d="M8 82 Q8 26 50 26 Q92 26 92 82 Z" fill="#e8f4fb"/>
    <path d="M38 82 Q38 58 50 58 Q62 58 62 82 Z" fill="#23304a"/>
    <path d="M12 66 H38 M62 66 H88 M18 50 H82 M30 36 H70 M30 50 V66 M50 36 V50 M70 50 V66 M22 66 V82 M78 66 V82" fill="none" style-color="#9aa7b4"/>
    <path d="M2 84 H98" fill="none" style-color="#9aa7b4"/>`,
  octopus: `<g fill="none" class="detail" style-color="#f15bb5" stroke-width="6">
      <path d="M30 54 Q16 60 10 72 Q8 80 16 80"/><path d="M34 58 Q24 72 22 84 Q22 92 30 90"/>
      <path d="M40 60 Q36 76 38 90 Q40 96 46 92"/><path d="M47 61 Q46 78 50 94"/>
      <path d="M53 61 Q56 78 54 94"/><path d="M60 60 Q64 76 62 90 Q60 96 54 92"/>
      <path d="M66 58 Q76 72 78 84 Q78 92 70 90"/><path d="M70 54 Q84 60 90 72 Q92 80 84 80"/></g>
    <path d="M22 44 Q22 10 50 10 Q78 10 78 44 Q78 60 64 62 H36 Q22 60 22 44 Z" fill="#f15bb5"/>
    <circle cx="40" cy="38" r="5" fill="#23304a"/><circle cx="60" cy="38" r="5" fill="#23304a"/>
    <path d="M44 50 Q50 54 56 50" fill="none"/>
    <ellipse cx="36" cy="24" rx="5" ry="3" fill="#fbd3ea"/>`,
  umbrella: `<path d="M8 50 Q10 12 50 10 Q90 12 92 50 Q84 44 76 50 Q68 44 58 50 Q50 44 42 50 Q32 44 24 50 Q16 44 8 50 Z" fill="#9b5de5"/>
    <path d="M50 10 Q40 30 42 50 M50 10 Q60 30 58 50 M50 10 Q22 26 24 50 M50 10 Q78 26 76 50" fill="none" style-color="#7b3fa0"/>
    <path d="M50 50 V84 Q50 94 40 92 Q34 90 36 84" fill="none" class="thick" style-color="#23304a"/>`,
  kite: `<polygon points="50,6 80,40 50,74 20,40" fill="#ffc845"/>
    <polygon points="50,6 50,74 20,40" fill="#e5484d"/>
    <path d="M20 40 H80 M50 6 V74" fill="none"/>
    <path d="M50 74 Q60 84 50 90 Q40 96 52 100" fill="none" style-color="#23304a"/>
    <path d="M54 82 L62 78 L60 86 Z M44 92 L36 90 L40 98 Z" fill="#3a86d8"/>`,
  'yo-yo': `<path d="M58 4 Q70 4 68 14 Q66 22 58 18 Q52 14 58 10" fill="none" style-color="#23304a"/>
    <path d="M58 18 L50 52" fill="none" style-color="#23304a"/>
    <ellipse cx="40" cy="64" rx="13" ry="30" fill="#e5484d" transform="rotate(-10 40 64)"/>
    <ellipse cx="60" cy="64" rx="13" ry="30" fill="#e5484d" transform="rotate(-10 60 64)"/>
    <rect x="44" y="56" width="12" height="16" fill="#ffc845" transform="rotate(-10 50 64)"/>
    <ellipse cx="66" cy="62" rx="5" ry="14" fill="#f08080" transform="rotate(-10 66 62)"/>`,
  zebra: `<path d="M22 44 Q24 36 34 36 H70 Q80 36 80 46 V64 Q80 70 74 70 H30 Q22 70 22 62 Z" fill="#ffffff"/>
    <path d="M28 70 V92 M38 70 V92 M64 70 V92 M74 70 V92" fill="none" class="thick" style-color="#23304a"/>
    <path d="M70 40 L84 18 Q88 12 94 16 Q98 22 94 30 L84 46 Z" fill="#ffffff"/>
    <path d="M68 36 L72 32 M72 31 L76 26 M76 25 L80 20" fill="none" class="detail" style-color="#23304a"/>
    <circle cx="88" cy="20" r="2.5" fill="#23304a"/>
    <path d="M86 12 L84 4" fill="none"/>
    <path d="M30 38 V68 M40 36 V70 M50 36 V70 M60 36 V70 M78 40 L86 30 M82 46 L92 34" fill="none" class="detail" style-color="#23304a"/>
    <path d="M22 46 Q12 50 14 62" fill="none" style-color="#23304a"/>`,
  queen: `<path d="M22 40 L30 14 L40 32 L50 8 L60 32 L70 14 L78 40 Z" fill="#ffc845"/>
    <circle cx="50" cy="8" r="4" fill="#e5484d"/><circle cx="30" cy="14" r="3.5" fill="#3a86d8"/><circle cx="70" cy="14" r="3.5" fill="#3a86d8"/>
    <circle cx="50" cy="58" r="22" fill="#e8b48a"/>
    <path d="M28 52 Q24 82 34 92 M72 52 Q76 82 66 92" fill="none" class="thick" style-color="#7a4a1d"/>
    <circle cx="42" cy="56" r="3" fill="#23304a"/><circle cx="58" cy="56" r="3" fill="#23304a"/>
    <path d="M44 68 Q50 72 56 68" fill="none"/>`,
  thumb: `<path d="M22 50 Q22 40 34 40 H46 L42 22 Q40 10 50 10 Q58 10 60 22 L64 40 H76 Q86 40 86 50 V82 Q86 92 76 92 H34 Q22 92 22 82 Z" fill="#e8b48a"/>
    <path d="M22 56 H64 M22 68 H64 M22 80 H64" fill="none"/>
    <path d="M46 16 Q50 14 54 16" fill="none"/>`,
  wheel: `<circle cx="50" cy="50" r="42" fill="#3d4654"/>
    <circle cx="50" cy="50" r="28" fill="#c9d3dd"/>
    <path d="M50 22 V78 M22 50 H78 M30 30 L70 70 M70 30 L30 70" fill="none"/>
    <circle cx="50" cy="50" r="8" fill="#6f7d8c"/>`,
  cake: `<rect x="16" y="50" width="68" height="36" rx="4" fill="#f8bfd0"/>
    <path d="M16 54 Q24 62 32 54 Q40 62 48 54 Q56 62 64 54 Q72 62 84 54 V48 H16 Z" fill="#ffffff"/>
    <rect x="10" y="84" width="80" height="8" rx="4" fill="#c9d3dd"/>
    <rect x="46" y="28" width="8" height="20" rx="2" fill="#3a86d8"/>
    <path d="M50 14 Q56 22 50 28 Q44 22 50 14 Z" fill="#ffc845"/>
    <circle cx="30" cy="70" r="3" fill="#e5484d"/><circle cx="50" cy="74" r="3" fill="#e5484d"/><circle cx="70" cy="70" r="3" fill="#e5484d"/>`,
  rake: `<rect x="47" y="4" width="6" height="66" rx="3" fill="#a56a35"/>
    <rect x="22" y="68" width="56" height="8" rx="3" fill="#6f7d8c"/>
    <path d="M26 76 V94 M36 76 V94 M46 76 V94 M54 76 V94 M64 76 V94 M74 76 V94" fill="none" class="detail" style-color="#6f7d8c"/>`,
  gate: `<rect x="6" y="20" width="10" height="72" fill="#a56a35"/><rect x="84" y="20" width="10" height="72" fill="#a56a35"/>
    <rect x="16" y="32" width="68" height="7" fill="#d9934a"/><rect x="16" y="72" width="68" height="7" fill="#d9934a"/>
    <rect x="25" y="26" width="7" height="60" fill="#e8b47e"/><rect x="39" y="26" width="7" height="60" fill="#e8b47e"/><rect x="53" y="26" width="7" height="60" fill="#e8b47e"/><rect x="67" y="26" width="7" height="60" fill="#e8b47e"/>
    <circle cx="80" cy="56" r="3" fill="#23304a"/>`,
  snake: `<ellipse cx="50" cy="82" rx="40" ry="12" fill="#4fa53e"/>
    <ellipse cx="50" cy="70" rx="32" ry="10" fill="#5bbd56"/>
    <ellipse cx="50" cy="59" rx="24" ry="8" fill="#4fa53e"/>
    <path d="M62 56 Q72 48 66 34 Q60 22 66 14 L74 12 Q82 18 76 30 Q70 42 74 52 Z" fill="#5bbd56"/>
    <ellipse cx="70" cy="13" rx="11" ry="8" fill="#4fa53e" transform="rotate(-15 70 13)"/>
    <circle cx="72" cy="10" r="2.6" fill="#23304a"/>
    <path d="M80 15 L90 17 M87 16.5 L92 13 M87 16.5 L92 20" fill="none" style-color="#e5484d"/>
    <g fill="#ffc845"><circle cx="24" cy="82" r="3"/><circle cx="40" cy="86" r="3"/><circle cx="60" cy="86" r="3"/><circle cx="76" cy="82" r="3"/><circle cx="32" cy="70" r="2.6"/><circle cx="50" cy="73" r="2.6"/><circle cx="68" cy="70" r="2.6"/><circle cx="42" cy="59" r="2.2"/><circle cx="58" cy="60" r="2.2"/><circle cx="70" cy="40" r="2.2"/></g>`,
  plate: `<ellipse cx="50" cy="56" rx="44" ry="26" fill="#ffffff"/>
    <ellipse cx="50" cy="56" rx="30" ry="16" fill="#e8f4fb"/>
    <path d="M14 54 Q50 76 86 54" fill="none" style-color="#a7dcf7"/>`,
  bike: `<circle cx="24" cy="66" r="18" fill="none" class="detail" style-color="#23304a"/><circle cx="76" cy="66" r="18" fill="none" class="detail" style-color="#23304a"/>
    <path d="M24 66 L42 40 H66 L76 66 M42 40 L52 66 L66 40 M24 66 H52" fill="none" class="detail" style-color="#e5484d"/>
    <path d="M38 34 H48" fill="none" class="detail" style-color="#23304a"/>
    <path d="M66 40 L62 28 H72" fill="none" class="detail" style-color="#23304a"/>`,
  hive: `<path d="M50 10 V18" fill="none"/>
    <ellipse cx="50" cy="28" rx="18" ry="10" fill="#ffc845"/><ellipse cx="50" cy="44" rx="28" ry="11" fill="#f6a40e"/>
    <ellipse cx="50" cy="60" rx="32" ry="12" fill="#ffc845"/><ellipse cx="50" cy="76" rx="28" ry="11" fill="#f6a40e"/>
    <path d="M42 84 Q50 74 58 84 Z" fill="#7a4a1d"/>
    <ellipse cx="82" cy="30" rx="6" ry="4" fill="#ffc845"/><path d="M80 27 V33 M84 27 V33" fill="none"/>`,
  slide: `<path d="M18 92 V26 M34 92 V26" fill="none" class="detail" style-color="#3a86d8"/>
    <path d="M18 36 H34 M18 52 H34 M18 68 H34 M18 84 H34" fill="none" class="detail" style-color="#3a86d8"/>
    <path d="M26 22 H42 Q50 22 56 32 L88 84 Q92 92 84 92 H78 L46 40 Q42 34 34 34 H26 Z" fill="#ffc845"/>`,
  rope: `<path d="M20 30 Q50 10 78 30 Q92 44 76 56 Q58 68 42 56 Q30 46 44 38 Q58 32 66 42 Q72 52 60 56" fill="none" class="thick" stroke-width="9" style-color="#d9a35f"/>
    <path d="M20 30 Q10 52 18 78 Q22 90 14 96" fill="none" class="thick" stroke-width="9" style-color="#d9a35f"/>
    <path d="M24 28 L28 34 M40 20 L44 26 M58 18 L60 24 M74 26 L72 32 M16 46 L22 48 M16 64 L22 64" fill="none" style-color="#a37a45"/>`,
  bone: `<path d="M24 38 Q12 28 18 18 Q26 10 34 20 Q40 12 48 18 Q52 26 44 34 L66 56 Q76 50 82 58 Q90 66 82 74 Q88 82 80 88 Q70 92 66 80 Q58 84 54 74 Q52 66 58 62 L36 40 Q28 46 24 38 Z" fill="#f4f1ea"/>`,
  nose: `<path d="M44 10 Q50 10 52 22 L60 58 Q72 62 74 72 Q76 84 62 86 Q56 88 50 82 Q44 88 38 86 Q24 84 26 72 Q28 62 40 58 Z" fill="#e8b48a"/>
    <ellipse cx="40" cy="76" rx="4" ry="3" fill="#7a4a1d"/><ellipse cx="60" cy="76" rx="4" ry="3" fill="#7a4a1d"/>`,
  rose: `<path d="M50 52 Q46 72 50 94" fill="none" class="detail" style-color="#2f7a2a"/>
    <path d="M50 72 Q34 62 30 72 Q40 80 50 74 Z M50 82 Q66 74 70 84 Q60 90 50 84 Z" fill="#4fa53e"/>
    <path d="M28 30 Q28 12 50 12 Q72 12 72 30 Q72 52 50 54 Q28 52 28 30 Z" fill="#e5484d"/>
    <path d="M38 22 Q50 14 62 24 Q60 38 50 40 Q40 38 40 30 Q44 24 52 28" fill="none" style-color="#b3261e"/>`,
  cube: `<path d="M18 34 L50 20 L82 34 L50 48 Z" fill="#a7dcf7"/>
    <path d="M18 34 V72 L50 86 V48 Z" fill="#3a86d8"/>
    <path d="M82 34 V72 L50 86 V48 Z" fill="#2a6db3"/>`
};

export const PICTURE_WORDS = Object.keys(P);

const INK = '#23304a';

// The drawing's shapes alone, ready to place inside another drawing.
function shapes(word, outline) {
  const body = P[word];
  if (!body) return null;
  let s = body.replace(/\sstyle-color="([^"]*)"/g, (_, c) => (outline ? '' : ` stroke="${c}"`));
  if (outline) s = s.replace(/fill="#[0-9a-fA-F]{3,6}"/g, 'fill="#fff"');
  s = s.replace(/\sclass="thick"/g, ' stroke-width="7"').replace(/\sclass="detail"/g, ' stroke-width="4"');
  return `<g stroke="${outline ? '#000' : INK}" stroke-width="${outline ? 3 : 2.5}" stroke-linejoin="round" stroke-linecap="round">${s}</g>`;
}

// The coloured or outline shapes of a drawing, for other art (stickers) to build on.
export const pictureShapes = (word, outline = false) => shapes(word, outline);

// A sentence picture from its facts: "the cat is in the box" puts a small cat over the
// middle of the box; "on the box" sits it above the box. The wrong picture for a
// sentence swaps in for on, so the two must look plainly different.
export function sceneSvg(scene, { outline = false, size = 140, label = false } = {}) {
  const words = scene.rel ? `${scene.a} ${scene.rel} ${scene.b}` : scene.a;
  const aria = label ? ` role="img" aria-label="${words}"` : ' aria-hidden="true"';
  const place = (word, k, tx, ty) => `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${k.toFixed(3)})">${shapes(word, outline)}</g>`;
  let body;
  if (!scene.rel) body = shapes(scene.a, outline);
  else {
    const [bx, by, bw, bh] = BOUNDS[scene.b], [ax, ay, aw, ah] = BOUNDS[scene.a];
    if (scene.rel === 'in') {
      // The holder fills the box; the small thing sits over its middle, a little low.
      const kb = Math.min(92 / bw, 92 / bh);
      const cx = 50, cy = 50 + 0.08 * bh * kb;
      const ka = Math.min((0.45 * bw * kb) / aw, (0.45 * bh * kb) / ah);
      body = place(scene.b, kb, 50 - (bx + bw / 2) * kb, 50 - (by + bh / 2) * kb)
        + place(scene.a, ka, cx - (ax + aw / 2) * ka, cy - (ay + ah / 2) * ka);
    } else {
      // The support sits on the bottom edge; the thing on it rests on its top edge.
      const kb = Math.min(76 / bw, 50 / bh);
      const tyB = 96 - (by + bh) * kb;
      const top = tyB + by * kb;
      const ka = Math.min(44 / aw, (top - 4) / ah, 0.6);
      body = place(scene.b, kb, 50 - (bx + bw / 2) * kb, tyB)
        + place(scene.a, ka, 50 - (ax + aw / 2) * ka, top + 2 - (ay + ah) * ka);
    }
  }
  return `<svg class="picture scene" viewBox="0 0 100 100" width="${size}" height="${size}"${aria}>${body}</svg>`;
}

export function pictureSvg(word, { outline = false, size = 96, label = false } = {}) {
  const g = shapes(word, outline);
  if (!g) return null;
  const aria = label ? ` role="img" aria-label="${word}"` : ' aria-hidden="true"';
  return `<svg class="picture" viewBox="0 0 100 100" width="${size}" height="${size}"${aria}>${g}</svg>`;
}
