#!/usr/bin/env node
/**
 * Measure base-mode book RTP using the same play logic as generate-books.mjs.
 * Used to calibrate RTP_BASE_SURVIVAL without publishing full books.
 */
import { createRound, pickCell, pickVault, cashOut } from '../packages/math-engine/dist/round-engine.js';
import { SeededRng } from '../packages/math-engine/dist/rng.js';
import { VAULT_CHEST_COUNT, BOOK_SCALE } from '../packages/shared/dist/index.js';

const seed = 'book-gen-v1';
const rounds = 10_000;

function playBaseRound(r) {
  let state = createRound({ mineCount: 5, seed: `${seed}:b:${r}` });
  const order = new SeededRng(`${seed}:o:${r}`).shuffle(Array.from({ length: 25 }, (_, i) => i));
  const vaultRng = new SeededRng(`${seed}:v:${r}`);
  for (const cell of order) {
    const res = pickCell(state, cell);
    if (!res.ok) break;
    state = res.state;
    if (state.events.at(-1)?.revealType === 'tileMine') break;
    if (state.vault && !state.vaultResolved) {
      pickVault(state, vaultRng.nextUint32() % VAULT_CHEST_COUNT);
    }
    if (state.safePicks >= 3) {
      cashOut(state);
      break;
    }
  }
  if (state.vault && !state.vaultResolved) {
    pickVault(state, vaultRng.nextUint32() % VAULT_CHEST_COUNT);
  }
  if (!state.terminal && state.safePicks > 0) cashOut(state);
  return state;
}

let sum = 0;
let hits = 0;
let max = 0;
for (let r = 0; r < rounds; r += 1) {
  const state = playBaseRound(r);
  sum += state.payoutBook;
  if (state.payoutBook > 0) hits += 1;
  max = Math.max(max, state.payoutBook);
}

const rtpPct = (sum / rounds / BOOK_SCALE) * 100;
console.log(
  JSON.stringify(
    {
      rounds,
      rtpPct,
      hitRatePct: (hits / rounds) * 100,
      maxPayoutX: max / BOOK_SCALE,
    },
    null,
    2,
  ),
);
