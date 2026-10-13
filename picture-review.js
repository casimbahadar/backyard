import { PICTURE_WORDS, pictureSvg } from './pictures.js';
const grid = document.getElementById('grid');
for (const w of PICTURE_WORDS) {
  const li = document.createElement('li');
  li.className = 'pic-card';
  const pair = document.createElement('div');
  pair.className = 'pic-pair';
  pair.innerHTML = pictureSvg(w, { size: 64 }) + pictureSvg(w, { size: 64, outline: true });
  const name = document.createElement('span');
  name.className = 'pic-word';
  name.textContent = w;
  li.append(pair, name);
  grid.append(li);
}
window.__picturesReady = true;
