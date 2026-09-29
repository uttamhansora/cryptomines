/** Measures EventPlayer full-replay cost (legacy syncEvents pattern) */
import { readFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { createRound, pickCell, cashOut } from '../../../../packages/math-engine/dist/index.js';

function legacyReplayDelayMs(ev) {
  const type = String(ev.type).toLowerCase();
  if (type === 'reveal') {
    const rt = String(ev.revealType ?? '');
    if (rt === 'tileMine') return 500;
    if (rt === 'tileSafe') return 280;
  }
  if (type === 'enterbonus') return 400;
  return 120;
}

async function legacySyncAllEvents(events, reducedMotion = false) {
  let emitCount = 0;
  for (const ev of events) {
    emitCount += 1;
    const delay = reducedMotion ? 0 : legacyReplayDelayMs(ev);
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
  }
  return emitCount;
}

let state = createRound({ mineCount: 5, seed: 'perf-audit' });
const pickIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
for (const i of pickIndices) {
  const r = pickCell(state, i);
  if (!r.ok || r.state.terminal) break;
  state = r.state;
}
if (!state.terminal && state.safePicks > 0) cashOut(state);

const events = state.events;
const t0 = performance.now();
await legacySyncAllEvents(events, false);
const fullReplayMs = performance.now() - t0;

let cumulativeLegacy = 0;
let simState = createRound({ mineCount: 5, seed: 'perf-audit' });
for (let p = 0; p < pickIndices.length; p++) {
  const r = pickCell(simState, pickIndices[p]);
  if (!r.ok) break;
  simState = r.state;
  const t1 = performance.now();
  await legacySyncAllEvents(simState.events, false);
  cumulativeLegacy += performance.now() - t1;
  if (simState.terminal) break;
}

const report = {
  finalEventCount: events.length,
  singleFullReplayMs: Math.round(fullReplayMs),
  cumulativePerPickReplayMs: Math.round(cumulativeLegacy),
  estimatedEmitRendersPerPick: simState.events.length,
  note: 'Each legacy syncEvents resets and replays all events with setTimeout; emit() per event re-renders full board in Svelte.',
};

console.log(JSON.stringify(report, null, 2));
