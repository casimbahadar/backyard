// ui-tell-audit.js: paste into page.evaluate(). Returns findings for AI-UI tells.
// Measures the rendered page, so run it at a mobile viewport first (390x844), then desktop.
() => {
  const vw = window.innerWidth, out = { viewport: vw, findings: [], quality: [] };
  const vis = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const px = v => parseFloat(v) || 0;
  const sel = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
    (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : '');
  const add = (id, cls, detail) => out[cls === 'quality' ? 'quality' : 'findings'].push({ id, detail });
  const all = [...document.querySelectorAll('body *')].filter(vis);

  // 1. Horizontal overflow at this viewport
  if (document.documentElement.scrollWidth > vw + 1)
    add('horizontal-overflow', 'quality', `page is ${document.documentElement.scrollWidth}px wide at ${vw}px viewport`);

  // 2. Buttons: size floor/target and width consistency within a group
  const btns = [...document.querySelectorAll('button, [role=button], input[type=submit], input[type=button], a.btn, .button')].filter(vis);
  const small = btns.filter(b => { const r = b.getBoundingClientRect(); return r.height < 44 || r.width < 44; });
  const tiny = small.filter(b => { const r = b.getBoundingClientRect(); return r.height < 24 || r.width < 24; });
  if (tiny.length) add('target-under-24px', 'quality', tiny.slice(0,6).map(sel));
  if (small.length) add('target-under-44px', 'slop', `${small.length} of ${btns.length} controls below the 44px build target: ` + small.slice(0,6).map(sel).join(', '));
  const groups = new Map();
  btns.forEach(b => { const p = b.parentElement; groups.set(p, [...(groups.get(p)||[]), b]); });
  groups.forEach((g, parent) => {
    if (g.length < 2) return;
    const rs = g.map(b => b.getBoundingClientRect());
    const widths = rs.map(r => Math.round(r.width)), heights = rs.map(r => Math.round(r.height));
    const stacked = new Set(rs.map(r => Math.round(r.top))).size === g.length;
    if (Math.max(...widths) - Math.min(...widths) > 4)
      add(stacked ? 'ragged-button-stack' : 'uneven-button-row', 'slop', `${sel(parent)}: widths ${widths.join('/')}px`);
    if (Math.max(...heights) - Math.min(...heights) > 4)
      add('mixed-button-heights', 'slop', `${sel(parent)}: heights ${heights.join('/')}px`);
  });

  // 3. Side-tab accent border: thick left border on a non-status element
  const status = el => el.closest('blockquote,[role=alert],[role=status],[aria-current],.alert,.callout,.warning,.error');
  const sideTabs = all.filter(el => { const s = getComputedStyle(el);
    return px(s.borderLeftWidth) >= 3 && s.borderLeftStyle !== 'none' && px(s.borderRightWidth) < 1 && !status(el); });
  if (sideTabs.length) add('side-tab-border', 'slop', `${sideTabs.length} elements: ` + sideTabs.slice(0,6).map(sel).join(', '));

  // 4. Typography: single neutral sans, italic serif display, eyebrows, small text, input zoom
  const fam = el => getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g,'').trim().toLowerCase();
  const h = document.querySelector('h1,h2'), p = document.querySelector('p,li');
  const neutral = ['inter','roboto','arial','helvetica','system-ui','-apple-system','segoe ui','geist'];
  if (h && p && fam(h) === fam(p) && neutral.includes(fam(h)))
    add('single-neutral-sans', 'slop', `headings and body both ${fam(h)}`);
  const h1 = document.querySelector('h1');
  if (h1) { const s = getComputedStyle(h1);
    if (s.fontStyle === 'italic' && /serif|playfair|garamond|georgia|times|lora|dm serif|fraunces/i.test(s.fontFamily) && !/sans/i.test(fam(h1)))
      add('italic-serif-display', 'slop', fam(h1)); }
  const eyebrows = [...document.querySelectorAll('h1,h2,h3')].map(hd => hd.previousElementSibling).filter(e => {
    if (!e || !vis(e)) return false; const s = getComputedStyle(e);
    return s.textTransform === 'uppercase' && px(s.letterSpacing) > 0.5 && e.textContent.trim().split(/\s+/).length <= 4; });
  if (eyebrows.length) add('eyebrow-label', 'slop', eyebrows.map(e => `"${e.textContent.trim()}"`).slice(0,6).join(', '));
  const textEls = all.filter(el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 2));
  // SVG text is sized in drawing units, so judge it by its drawn height instead (local change to the kit's audit).
  const smallText = textEls.filter(el => (el instanceof SVGElement ? el.getBoundingClientRect().height : px(getComputedStyle(el).fontSize)) < 14);
  if (smallText.length) add('tiny-text', 'quality', `${smallText.length} text elements under 14px`);
  const zoomInputs = [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=range]),select,textarea')].filter(vis).filter(i => px(getComputedStyle(i).fontSize) < 16);
  if (zoomInputs.length) add('input-under-16px', 'quality', `${zoomInputs.length} fields under 16px (iOS Safari zooms on focus)`);

  // 5. Text touching the viewport edge
  const edge = textEls.filter(el => { const r = el.getBoundingClientRect(); return r.left < 8 || r.right > vw - 8; });
  if (edge.length) add('text-at-viewport-edge', 'quality', edge.slice(0,6).map(sel).join(', '));

  // 6. Copy tells in rendered text
  const text = document.body.innerText;
  const em = (text.match(/\u2014/g)||[]).length, en = (text.match(/ \u2013 /g)||[]).length;
  if (em) add('em-dash', 'slop', `${em} em dashes`);
  if (en) add('en-dash-as-dash', 'slop', `${en} spaced en dashes`);
  const emojiUI = [...document.querySelectorAll('button,a,h1,h2,h3,h4,[class*=icon],[class*=badge],label')].filter(vis)
    .filter(e => /\p{Extended_Pictographic}/u.test(e.textContent));
  if (emojiUI.length) add('emoji-as-icon', 'slop', emojiUI.slice(0,6).map(sel).join(', '));
  const numbering = all.filter(e => e.children.length === 0 && /^0\d\.?$/.test(e.textContent.trim()));
  if (numbering.length) add('decorative-numbering', 'slop', `${numbering.length} "0N" labels (fine only if order matters)`);

  // 7. Colour: gradient text, purple/violet gradients
  const hue = (r,g,b) => { r/=255; g/=255; b/=255; const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn;
    if (!d) return -1; let h = mx===r ? ((g-b)/d)%6 : mx===g ? (b-r)/d+2 : (r-g)/d+4; return (h*60+360)%360; };
  const gradText = all.filter(el => { const s = getComputedStyle(el);
    return /text/.test(s.webkitBackgroundClip || s.backgroundClip) && /gradient/.test(s.backgroundImage); });
  if (gradText.length) add('gradient-text', 'slop', gradText.slice(0,4).map(sel).join(', '));
  const purple = all.filter(el => { const bi = getComputedStyle(el).backgroundImage; if (!/gradient/.test(bi)) return false;
    return (bi.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)||[]).some(c => { const [r,g,b] = c.match(/\d+/g).map(Number); const hh = hue(r,g,b); return hh >= 245 && hh <= 290; }); });
  if (purple.length) add('purple-gradient', 'slop', purple.slice(0,4).map(sel).join(', '));

  // 8. Spacing and radius: off-scale values and one-value monotony
  const sp = new Map(), rad = new Set();
  all.forEach(el => { const s = getComputedStyle(el);
    ['marginTop','marginBottom','paddingTop','paddingBottom','paddingLeft','paddingRight','rowGap','columnGap'].forEach(k => {
      const v = Math.round(px(s[k])); if (v > 0) sp.set(v, (sp.get(v)||0) + 1); });
    const r = px(s.borderTopLeftRadius); if (r > 0) rad.add(Math.round(r)); });
  const off = [...sp.keys()].filter(v => v % 4 !== 0 && v > 2);
  if (off.length >= 4) add('off-scale-spacing', 'slop', `values not on a 4px scale: ${off.sort((a,b)=>a-b).slice(0,10).join(', ')}`);
  const total = [...sp.values()].reduce((a,b)=>a+b,0), top = [...sp.entries()].sort((a,b)=>b[1]-a[1])[0];
  if (top && total > 20 && top[1] / total > 0.6) add('monotonous-spacing', 'slop', `${top[0]}px is ${Math.round(100*top[1]/total)}% of all spacing`);
  if (rad.size > 5) add('radius-sprawl', 'slop', `${rad.size} distinct radii: ${[...rad].sort((a,b)=>a-b).join(', ')}`);

  // 9. Quality leaks
  const noAlt = [...document.querySelectorAll('img:not([alt])')].length; if (noAlt) add('img-no-alt', 'quality', noAlt);
  const bareSvg = [...document.querySelectorAll('svg:not([aria-hidden]):not([aria-label]):not([role=presentation])')].filter(s => !s.closest('button[aria-label],a[aria-label]')).length;
  if (bareSvg) add('svg-no-aria', 'quality', bareSvg);
  let last = 0; [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].forEach(hd => { const l = +hd.tagName[1];
    if (last && l > last + 1) add('heading-skip', 'quality', `h${last} to h${l}`); last = l; });
  const hidden = textEls.filter(el => getComputedStyle(el).opacity === '0').length;
  if (hidden) add('content-stuck-invisible', 'quality', `${hidden} text elements at opacity 0`);

  out.slopCount = new Set(out.findings.map(f => f.id)).size;
  out.verdict = out.slopCount <= 1 ? 'no cluster' : out.slopCount <= 3 ? 'lightly edited default' : 'centroid look: unedited AI defaults';
  return out;
}
