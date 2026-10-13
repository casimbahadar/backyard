// Seasons: Ramadan, Eid (both Eids), winter, and a child's birthday week. During a
// season the sticker picker offers a seasonal sticker, and the season's place appears in
// the places list (it stays once she has decorated it). Ramadan and Eid follow the
// Islamic calendar from the browser (Umm al-Qura), so the dates move every year by
// themselves; the browser's calendar can be a day off from a local moon sighting.
function hijri(date) {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { month: 'numeric', day: 'numeric' }).formatToParts(date);
    return { month: Number(parts.find(p => p.type === 'month').value), day: Number(parts.find(p => p.type === 'day').value) };
  } catch { return null; }
}

export function seasonsOn(date = new Date(), profile = null) {
  const out = [];
  const h = hijri(date);
  if (h?.month === 9) out.push('ramadan');
  if ((h?.month === 10 && h.day <= 3) || (h?.month === 12 && h.day >= 10 && h.day <= 13)) out.push('eid');
  const m = date.getMonth() + 1;
  if (m === 12 || m <= 2) out.push('winter');
  if (profile?.birthday) {
    const [bm, bd] = profile.birthday;
    const thisYear = new Date(date.getFullYear(), bm - 1, bd);
    const days = Math.round((date - thisYear) / 86400000);
    if (days >= -3 && days <= 3) out.push('birthday');
  }
  return out;
}

// Stickers drawn for the seasons, in the same style as the rest.
export const SEASONAL = {
  fanoos: { season: ['ramadan', 'eid'], body: `<path d="M50 4 V14" fill="none" class="detail" style-color="#23304a"/><path d="M36 14 H64 L60 22 H40 Z" fill="#c99a00"/><path d="M34 22 H66 Q74 50 66 78 H34 Q26 50 34 22 Z" fill="#f2c94c"/><path d="M42 26 Q38 50 42 74 M58 26 Q62 50 58 74 M50 24 V76" fill="none" style-color="#c99a00"/><ellipse cx="50" cy="50" rx="8" ry="14" fill="#fff4b8"/><path d="M38 78 H62 L56 88 H44 Z" fill="#c99a00"/>` },
  mosque: { season: ['ramadan', 'eid'], body: `<rect x="20" y="52" width="60" height="38" fill="#f4f1ea"/><path d="M28 54 Q28 26 50 22 Q72 26 72 54 Z" fill="#4fb3a0"/><path d="M50 22 V10" fill="none" class="detail" style-color="#c99a00"/><path d="M46 10 A5 5 0 1 0 54 8 A4 4 0 1 1 46 10 Z" fill="#ffd84d"/><rect x="6" y="30" width="10" height="60" fill="#f4f1ea"/><rect x="84" y="30" width="10" height="60" fill="#f4f1ea"/><path d="M6 30 L11 18 L16 30 Z M84 30 L89 18 L94 30 Z" fill="#4fb3a0"/><path d="M42 90 V70 Q50 60 58 70 V90 Z" fill="#23304a"/>` },
  dates: { season: ['ramadan', 'eid'], body: `<ellipse cx="50" cy="70" rx="42" ry="16" fill="#e8b47e"/><g fill="#7a3b12"><ellipse cx="34" cy="58" rx="10" ry="15" transform="rotate(-20 34 58)"/><ellipse cx="54" cy="56" rx="10" ry="15"/><ellipse cx="72" cy="60" rx="10" ry="15" transform="rotate(20 72 60)"/></g><path d="M32 50 Q36 52 34 60 M54 46 Q58 50 56 58" fill="none" style-color="#a45a2a"/>` },
  'prayer-mat': { season: ['ramadan', 'eid'], body: `<rect x="22" y="8" width="56" height="84" rx="4" fill="#2f7a2a"/><rect x="28" y="14" width="44" height="72" rx="2" fill="#e5484d"/><path d="M36 40 Q36 22 50 20 Q64 22 64 40 V70 H36 Z" fill="#ffd84d"/><path d="M22 92 V98 M30 92 V98 M38 92 V98 M46 92 V98 M54 92 V98 M62 92 V98 M70 92 V98 M78 92 V98" fill="none" style-color="#ffd84d"/>` },
  'eid-gift': { season: ['eid'], body: `<rect x="14" y="40" width="72" height="50" fill="#3a9ad9"/><rect x="10" y="30" width="80" height="14" fill="#a7dcf7"/><rect x="44" y="30" width="12" height="60" fill="#ffd84d"/><path d="M50 30 Q32 6 26 18 Q22 28 50 30 Q68 6 74 18 Q78 28 50 30 Z" fill="#ffd84d"/><path d="M28 70 A8 8 0 1 0 38 62 A6 6 0 1 1 28 70 Z" fill="#ffffff"/>` },
  mithai: { season: ['eid', 'birthday'], body: `<rect x="10" y="40" width="80" height="48" rx="4" fill="#f15bb5"/><rect x="16" y="46" width="68" height="36" fill="#fff4f9"/><g><circle cx="30" cy="58" r="8" fill="#f6a40e"/><circle cx="50" cy="58" r="8" fill="#ffd84d"/><circle cx="70" cy="58" r="8" fill="#f6a40e"/><rect x="22" y="70" width="16" height="9" rx="2" fill="#f8bfd0"/><rect x="42" y="70" width="16" height="9" rx="2" fill="#a7e0c8"/><rect x="62" y="70" width="16" height="9" rx="2" fill="#f8bfd0"/></g>` },
  'mehndi-hand': { season: ['eid'], body: `<path d="M30 92 V50 Q30 44 34 44 Q38 44 38 50 V30 Q38 24 43 24 Q48 24 48 30 V22 Q48 16 53 16 Q58 16 58 22 V30 Q58 26 63 26 Q68 26 68 32 V62 Q72 52 78 54 Q84 58 78 68 L64 92 Z" fill="#f2c9a0"/><g fill="none" style-color="#a5432a"><circle cx="50" cy="66" r="7"/><path d="M50 59 V52 M43 66 H36 M57 66 H62 M44 80 Q50 86 56 80"/><path d="M43 32 V40 M53 24 V34 M63 34 V42"/></g>` },
  'party-hat': { season: ['birthday'], body: `<path d="M50 6 L80 88 H20 Z" fill="#9b5de5"/><path d="M38 40 L62 40 M30 62 L70 62" fill="none" class="detail" style-color="#ffd84d"/><circle cx="50" cy="6" r="7" fill="#ffd84d"/><path d="M20 88 Q50 98 80 88" fill="none" class="detail" style-color="#f15bb5"/>` },
  candles: { season: ['birthday'], body: `<g><rect x="22" y="40" width="12" height="50" rx="3" fill="#3a9ad9"/><rect x="44" y="34" width="12" height="56" rx="3" fill="#f15bb5"/><rect x="66" y="40" width="12" height="50" rx="3" fill="#4fa53e"/></g><path d="M28 40 V32 M50 34 V26 M72 40 V32" fill="none" style-color="#23304a"/><g fill="#ffd84d"><path d="M28 30 Q22 22 28 12 Q34 22 28 30 Z"/><path d="M50 24 Q44 16 50 6 Q56 16 50 24 Z"/><path d="M72 30 Q66 22 72 12 Q78 22 72 30 Z"/></g>` },
  'party-popper': { season: ['birthday'], body: `<path d="M10 92 L32 40 L60 68 Z" fill="#ffc845"/><path d="M18 74 L44 52 M24 60 L36 70" fill="none" style-color="#f08a24"/><g><circle cx="58" cy="26" r="5" fill="#e5484d"/><circle cx="78" cy="40" r="5" fill="#3a86d8"/><rect x="66" y="12" width="6" height="12" rx="2" fill="#4fa53e" transform="rotate(30 69 18)"/><rect x="82" y="58" width="6" height="12" rx="2" fill="#9b5de5" transform="rotate(-30 85 64)"/><circle cx="44" cy="16" r="4" fill="#f15bb5"/></g>` },
  'birthday-banner': { season: ['birthday'], body: `<path d="M4 20 Q50 40 96 20" fill="none" class="detail" style-color="#23304a"/><g><path d="M12 24 L22 28 L14 52 Z" fill="#e5484d"/><path d="M30 30 L42 33 L34 58 Z" fill="#ffc845"/><path d="M50 34 L62 34 L56 60 Z" fill="#3a86d8"/><path d="M70 32 L82 28 L78 56 Z" fill="#4fa53e"/><path d="M86 26 L94 22 L94 46 Z" fill="#9b5de5"/></g>` },
  'snow-mug': { season: ['winter'], body: `<path d="M18 34 H72 L66 88 H24 Z" fill="#3a86d8"/><path d="M72 44 Q90 44 88 58 Q86 72 70 72" fill="none" class="thick" style-color="#3a86d8"/><g fill="#ffffff"><circle cx="36" cy="58" r="4"/><circle cx="54" cy="70" r="4"/><circle cx="50" cy="50" r="3"/></g><path d="M36 22 q-6 -8 0 -16 M52 20 q-6 -8 0 -16" fill="none" style-color="#9aa7b4"/>` }
};

export const seasonalFor = seasons => Object.keys(SEASONAL).filter(id => SEASONAL[id].season.some(s => seasons.includes(s)));
