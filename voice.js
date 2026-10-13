// Your own voice: every spoken line is cut into pieces (a fixed phrase like "What
// does" or "start with?", or one changing word like "pot", "seven" or the letter t),
// each recorded in Grown-ups, Settings, Your own voice, and kept on that device (or
// shipped for everyone as voice.json in the repo). A line plays in
// the recorded voice only when every one of its pieces is recorded; otherwise the
// device voice reads it, so nothing is ever left silent.
import { WORDS, OPENERS } from './words.js';
import { NUMBER_WORDS, COUNTERS, SHAPE_NAMES } from './vocab.js';
import { MONEY } from './money.js';

const NUMBERS = new Set(NUMBER_WORDS);
const NOUNS = new Set([...WORDS.map(w => w.word), ...OPENERS.map(w => w.word), ...COUNTERS.map(c => c.many), ...COUNTERS.map(c => c.one),
  ...Object.values(SHAPE_NAMES), 'cube', 'prism', 'pyramid', 'sphere', 'cone', 'cylinder',
  ...Object.values(MONEY).filter(m => m.kind === 'coin').map(m => m.name)]);

const bare = t => t.toLowerCase().replace(/[.,?!:]+$/, '');
const DIGRAPHS = new Set(['sh', 'ch', 'th', 'wh', 'qu', 'ck']);

// Pieces for one line, in order. Each piece is { key, say }.
export function speechPieces(text) {
  const tokens = text.trim().split(/\s+/);
  const out = [];
  let run = [];
  let afterColon = false;
  const flush = () => { if (run.length) { const say = run.join(' '); out.push({ key: `p:${say.toLowerCase()}`, say }); run = []; } };
  tokens.forEach((tok, i) => {
    const w = bare(tok);
    const punct = /[.,?!:]$/.test(tok);
    const next = tokens[i + 1];
    const prev = bare(tokens[i - 1] ?? '');
    // A single letter, or a two-letter sound such as sh, is a letter piece. "a" and "I"
    // in the middle of a sentence are ordinary words.
    const isLetter = (/^[a-z]$/i.test(w) && (punct || !next || prev === 'letter' || !['a', 'i'].includes(w))) || DIGRAPHS.has(w);
    // "one" in "Which one" or "the right one" is not the number.
    const isNumber = NUMBERS.has(w) && !(w === 'one' && ['which', 'right'].includes(prev));
    // "can" is the tin can, except in "Can you".
    const isNoun = NOUNS.has(w) && !(w === 'can' && bare(next ?? '') === 'you');
    let key = null;
    if (afterColon) key = `w:${w}`;
    else if (isLetter) key = `l:${w}`;
    else if (isNumber) key = `n:${w}`;
    else if (isNoun) key = `w:${w}`;
    if (key) { flush(); out.push({ key, say: w }); } else run.push(tok);
    if (/:$/.test(tok)) { flush(); afterColon = true; }
    if (/[.?!]$/.test(tok)) { flush(); afterColon = false; }
  });
  flush();
  return out;
}

// What to say after a wrong answer, so she hears the right one. Lines with no short
// spoken answer (a pattern, a sentence) use one fixed phrase instead.
export function spokenAnswer(item) {
  const a = item.answer;
  switch (item.template) {
    case 'spell-cvc': return `It is spelled ${a.join(', ')}.`;
    case 'sight-word': return `The word is: ${a}.`;
    case 'read-cvc': case 'blend-word': case 'hear-first-sound': case 'name-shape': case 'belongs': return `It is ${a}.`;
    case 'count-set': case 'number-facts': return `It is ${NUMBER_WORDS[a]}.`;
    case 'compare': return typeof a === 'number' ? `It is ${NUMBER_WORDS[a]}.` : 'Here is the right one.';
    case 'money': return `It is the ${MONEY[a].name}.`;
    case 'measure': return item.facts.mode === 'length' ? `It is the ${a} ribbon.` : `It is the ${a}.`;
    default: return 'Here is the right one.';
  }
}

// The lines the app says outside the questions. Kept here so the recording list has them.
export const APP_LINES = [
  'Move it, make it bigger or smaller, or tap the tick when you are done.',
  'Tap the tick when you are done.',
  'Your worksheet got stars! Pick a sticker.',
  'Put it in your yard.',
  'You did your quests today!',
  'Here is the right one.',
  'Where do you want to play?',
  'Yard', 'Beach', 'Farm', 'Snowy woods', 'Under the sea', 'Outer space', 'Campsite', 'City park',
  ...[1, 2, 3].flatMap(n => {
    const words = `${NUMBER_WORDS[n][0].toUpperCase()}${NUMBER_WORDS[n].slice(1)} star${n > 1 ? 's' : ''}!`;
    return [`${words} Pick a sticker.`, `${words} That's all the stickers for today. Great practice!`, `${words} Get six right to earn a sticker. Try again!`];
  })
];

// The recorded voice, from voice.json in the repo, then anything recorded on this device.
let bundle = null;
export async function voiceBundle(deviceClips = {}) {
  if (!bundle) {
    try { const r = await fetch('voice.json'); bundle = r.ok ? (await r.json()).clips ?? {} : {}; } catch { bundle = {}; }
  }
  return { ...bundle, ...deviceClips };
}
export const resetVoiceBundle = () => { bundle = null; };

// The recorded clips for a line, or null if any piece is missing.
export function clipsFor(text, clips) {
  const keys = speechPieces(text).map(p => p.key);
  return keys.every(k => clips[k]) ? keys.map(k => clips[k]) : null;
}
