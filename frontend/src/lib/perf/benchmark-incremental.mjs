import { performance } from 'node:perf_hooks';
import { createRound, pickCell, cashOut } from '../../../../packages/math-engine/dist/index.js';

const animMs = { tileSafe: 420, tileMine: 430, enterbonus: 550, default: 0 };

function deltaDelay(events, from) {
  let t = 0;
  for (let i = from; i < events.length; i += 1) {
    const ev = events[i];
    const type = String(ev.type).toLowerCase();
    if (type === 'reveal') {
      const rt = String(ev.revealType ?? '');
      if (rt === 'tileSafe') t += animMs.tileSafe;
      else if (rt === 'tileMine') t += animMs.tileMine;
    } else if (type === 'enterbonus') t += animMs.enterbonus;
  }
  return t;
}

let cumulative = 0;
let state = createRound({ mineCount: 5, seed: 'perf-inc' });
const picks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
let prevLen = 0;
for (const idx of picks) {
  const r = pickCell(state, idx);
  if (!r.ok || r.state.terminal) break;
  state = r.state;
  cumulative += deltaDelay(state.events, prevLen);
  prevLen = state.events.length;
}
if (!state.terminal && state.safePicks > 0) cashOut(state);

console.log(
  JSON.stringify(
    {
      incrementalAnimationMsEstimated: Math.round(cumulative),
      finalEventCount: state.events.length,
      perPickAvgMs: Math.round(cumulative / picks.length),
    },
    null,
    2,
  ),
);
