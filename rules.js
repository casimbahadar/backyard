// Game rules as plain functions, so tests can check them without a browser.

// Stars by share right: 3 at 7 of 8 or better, 2 at 5 of 8 or better, else 1.
export function starsFor(right, total) {
  const share = right / total;
  if (share >= 7 / 8) return 3;
  if (share >= 5 / 8) return 2;
  return 1;
}

// A skill is learned after two attempts in a row (quests or marked worksheets)
// each with at least 7 of 8 right, or the same share.
export function isMastered(attempts = []) {
  if (attempts.length < 2) return false;
  return attempts.slice(-2).every(a => a.right / a.total >= 7 / 8);
}

export const nodeKey = (packName, code) => `${packName}/${code}`;

// The letter-sounds skill grows the taught set. Its mastery only counts attempts made
// with the sounds she has now, so it opens again each time new sounds are added.
export const GROW_NODE = 'on-k-language/A2.4';
export const GROW_STEP = 4;

export function attemptsFor(profile, key) {
  const list = profile.attempts[key] ?? [];
  return key === GROW_NODE ? list.filter(a => a.taught === profile.taughtCount) : list;
}

export function masteredFor(profile, key) {
  return isMastered(attemptsFor(profile, key));
}

// Called after every attempt. Adds the next sounds when the letter-sounds skill is
// learned, unless a parent has locked the set or every sound is already taught.
export function growTaught(profile, key, maxSounds) {
  if (key !== GROW_NODE || profile.taughtLocked || profile.taughtCount >= maxSounds) return false;
  if (!masteredFor(profile, key)) return false;
  profile.taughtCount = Math.min(maxSounds, profile.taughtCount + GROW_STEP);
  return true;
}

export function dayKey(date = new Date()) {
  const y = date.getFullYear(), m = String(date.getMonth() + 1).padStart(2, '0'), d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function today(profile, date) {
  const k = dayKey(date);
  profile.days[k] ??= { quests: 0, goalShown: false };
  profile.days[k].seconds ??= 0;
  return profile.days[k];
}

// The daily goal is a number of quests or a number of minutes of practice.
// A marked worksheet counts as one quest, or as 5 minutes.
export const SHEET_MINUTES = 5;
export function goalProgress(profile, day) {
  if (profile.goalType === 'minutes') return { done: Math.floor(day.seconds / 60), target: profile.dailyGoal, unit: 'minutes' };
  return { done: day.quests, target: profile.dailyGoal, unit: 'quests' };
}
export const goalMet = (profile, day) => { const g = goalProgress(profile, day); return g.done >= g.target; };

// A word counts as one she can read after two right answers on two different days.
export function recordRead(profile, word, date) {
  const k = dayKey(date);
  const days = profile.readLog[word] ?? [];
  if (!days.includes(k)) days.push(k);
  profile.readLog[word] = days;
  if (days.length >= 2 && !profile.readWords.includes(word)) profile.readWords.push(word);
}

// Packs a profile works through, in the order the map offers them.
export function packsForGrade(grade) {
  return grade === '1' ? ['on-1-language', 'on-1-math', 'on-k-language', 'on-k-math'] : ['on-k-language', 'on-k-math'];
}

function unlocked(profile, packs, packName, exp) {
  const key = nodeKey(packName, exp.code);
  if (profile.unlocked.includes(key)) return true;
  const pre = exp.prerequisites.map(c => nodeKey(packName, c));
  if (exp.follows) {
    const [p, c] = exp.follows.split('/');
    // A Grade 1 profile starts past kindergarten, so the link back is already met.
    if (profile.grade !== '1') pre.push(nodeKey(p, c));
  }
  return pre.every(k => masteredFor(profile, k));
}

// The next node to practise: the parent's chosen node if set, otherwise the first
// unlocked, unlearned, playable node in the subject she has practised least today.
export function pickNode(profile, packs, playable) {
  if (profile.chosenNode) {
    const [p, c] = profile.chosenNode.split('/');
    const exp = packs[p]?.expectations.find(e => e.code === c);
    if (exp && playable(packs[p], exp)) return { packName: p, exp };
  }
  const candidates = [];
  for (const packName of packsForGrade(profile.grade)) {
    const pack = packs[packName];
    for (const exp of pack.expectations) {
      if (!playable(pack, exp)) continue;
      if (masteredFor(profile, nodeKey(packName, exp.code))) continue;
      if (!unlocked(profile, packs, packName, exp)) continue;
      candidates.push({ packName, exp, subject: pack.subject });
    }
  }
  if (!candidates.length) return null;
  const counts = {};
  for (const [k, list] of Object.entries(profile.attempts)) {
    const subject = packs[k.split('/')[0]]?.subject;
    counts[subject] = (counts[subject] ?? 0) + list.filter(a => a.day === dayKey()).length;
  }
  const first = {};
  for (const c of candidates) first[c.subject] ??= c;
  return Object.values(first).sort((a, b) => (counts[a.subject] ?? 0) - (counts[b.subject] ?? 0))[0];
}
