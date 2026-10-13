// Unit checks for the game rules. Run: node test-rules.mjs
import { readFileSync } from 'node:fs';
import { starsFor, isMastered, pickNode, nodeKey, recordRead, dayKey, growTaught, masteredFor, GROW_NODE } from './rules.js';
import { migrate } from './store.js';
import { goalMet, goalProgress, today } from './rules.js';
import { newProfile } from './store.js';
let passed = 0; const failures = [];
const check = (ok, msg) => { if (ok) passed++; else failures.push(msg); };
const packs = Object.fromEntries(['on-1-language', 'on-1-math', 'on-k-language', 'on-k-math'].map(n => [n, JSON.parse(readFileSync(new URL(`./${n}.json`, import.meta.url)))]));
try {
  const expect = { 8: 3, 7: 3, 6: 2, 5: 2, 4: 1, 0: 1 };
  for (const [r, s] of Object.entries(expect)) check(starsFor(Number(r), 8) === s, `${r} of 8 should give ${s} stars`);
  check(starsFor(9, 10) === 3 && starsFor(8, 10) === 2, 'worksheet of 10: 9 right is 3 stars, 8 right is 2');
  const a = (right, total = 8) => ({ right, total });
  check(!isMastered([a(8)]), 'one quest is not mastery');
  check(isMastered([a(7), a(8)]), 'two in a row at 7+ is mastery');
  check(!isMastered([a(8), a(6)]), 'a weak last quest undoes mastery');
  check(isMastered([a(3), a(7), a(7)]), 'only the last two count');
  check(isMastered([a(7), a(9, 10)]), 'a worksheet at 9 of 10 counts like a quest');
  const all = () => true;
  const p = newProfile({ name: 'A', grade: 'k', startCount: 4, dailyGoal: 3 });
  const first = pickNode(p, packs, all);
  check(first && first.exp.prerequisites.length === 0, 'the first node has no prerequisites');
  p.attempts[nodeKey('on-k-language', 'A2.1')] = [a(8), a(8)];
  const after = pickNode(p, packs, (pk, e) => pk.subject === 'language');
  check(after.exp.code !== 'A2.1', 'a mastered node is not picked again');
  check(['A2.2', 'A2.3', 'A2.4'].includes(after.exp.code), `after A2.1 the map offers ${after.exp.code}`);
  const g1 = newProfile({ name: 'B', grade: '1', startCount: 32, dailyGoal: 3 });
  check(pickNode(g1, packs, (pk, e) => pk.grade === '1').exp.code === 'B2.4', 'a Grade 1 profile can start on B2.4');
  p.chosenNode = 'on-k-math/A9.1';
  check(pickNode(p, packs, all).exp.code === 'A9.1', 'the parent-chosen node wins');
  const r = newProfile({ name: 'C', grade: 'k', startCount: 4 });
  recordRead(r, 'cat', new Date(2026, 9, 1)); recordRead(r, 'cat', new Date(2026, 9, 1));
  check(!r.readWords.includes('cat'), 'two right on the same day is not yet reading');
  recordRead(r, 'cat', new Date(2026, 9, 2));
  check(r.readWords.includes('cat'), 'right on two days counts as reading');
  check(dayKey(new Date(2026, 0, 5)) === '2026-01-05', 'day key format');
  // Taught sounds grow by 4 when A2.4 is learned with the current sounds.
  const g = newProfile({ name: 'G', grade: 'k', startCount: 4 });
  const at = (right, taught) => ({ right, total: 8, taught });
  g.attempts[GROW_NODE] = [at(8, 4)];
  check(!growTaught(g, GROW_NODE, 32) && g.taughtCount === 4, 'one good quest does not grow the sounds');
  g.attempts[GROW_NODE].push(at(7, 4));
  check(growTaught(g, GROW_NODE, 32) && g.taughtCount === 8, 'learning A2.4 adds 4 sounds');
  check(!masteredFor(g, GROW_NODE), 'A2.4 opens again for the new sounds');
  g.attempts[GROW_NODE].push(at(8, 8), at(8, 8));
  g.taughtLocked = true;
  check(!growTaught(g, GROW_NODE, 32) && g.taughtCount === 8, 'a locked set does not grow');
  g.taughtLocked = false; g.taughtCount = 30;
  g.attempts[GROW_NODE].push(at(8, 30), at(8, 30));
  check(growTaught(g, GROW_NODE, 32) && g.taughtCount === 32, 'growth stops at the last sound');
  check(!growTaught(g, nodeKey('on-k-math', 'A6.3'), 32), 'other skills never grow the sounds');
  // Saved data from every older version opens.
  const m1 = migrate({ version: 1, sheets: { 'W-2345': {} }, results: {} });
  check(m1.version === 3 && m1.sheets['W-2345'] && m1.settings.pin === null, 'version 1 data migrates to 3');
  const m2 = migrate({ version: 2, sheets: {}, results: {}, profiles: [{ id: 'x', name: 'A' }], activeProfile: 'x' });
  check(m2.profiles[0].taughtLocked === false && Array.isArray(m2.profiles[0].sheetRewards), 'version 2 profiles gain the new fields');
  let threw = false; try { migrate({ version: 99 }); } catch { threw = true; }
  check(threw, 'unknown future versions are refused, not guessed');
  // Daily goal by quests or by minutes.
  const gq = newProfile({ name: 'Q', grade: 'k', startCount: 4, dailyGoal: 2 });
  const dq = today(gq, new Date(2026, 9, 1));
  dq.quests = 1; check(!goalMet(gq, dq), 'one of two quests is not the goal');
  dq.quests = 2; check(goalMet(gq, dq), 'two of two quests meets the goal');
  const gm = { ...newProfile({ name: 'M', grade: 'k', startCount: 4, dailyGoal: 15 }), goalType: 'minutes' };
  const dm = today(gm, new Date(2026, 9, 1));
  dm.quests = 9; dm.seconds = 14 * 60 + 59; check(!goalMet(gm, dm), 'a minutes goal ignores how many quests');
  dm.seconds = 15 * 60; check(goalMet(gm, dm) && goalProgress(gm, dm).unit === 'minutes', '15 minutes meets a 15-minute goal');
  console.log(`checks passed: ${passed}, failed: ${failures.length}`);
  for (const f of failures) console.log(`FAIL ${f}`);
  process.exit(failures.length ? 1 : 0);
} catch (e) { console.log(`DID NOT COMPLETE: ${e.stack}`); process.exit(2); }
