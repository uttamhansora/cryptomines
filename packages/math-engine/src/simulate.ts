import { CELL_COUNT, VAULT_CHEST_COUNT } from '@crypto-mines/shared';
import { SeededRng } from './rng.js';
import { createRound, pickCell, cashOut, pickVault } from './round-engine.js';

export type SimStrategy = 'random' | 'cashoutFirstSafe' | 'optimalGreedy';

export interface SimConfig {
  rounds: number;
  mineCount: number;
  seed: string;
  /** 0-1 probability to cash out after each safe pick (random strategy) */
  cashoutAggression: number;
  strategy?: SimStrategy;
}

export interface SimResult {
  rounds: number;
  totalBet: number;
  totalWin: number;
  rtp: number;
  hitRate: number;
  vaultTriggers: number;
  chainCompletes: number;
  maxObservedWinBook: number;
  standardError: number;
  ci95Low: number;
  ci95High: number;
}

export function runSimulation(config: SimConfig): SimResult {
  const rng = new SeededRng(config.seed);
  let totalWin = 0;
  let hits = 0;
  let vaultTriggers = 0;
  let chainCompletes = 0;
  let maxWin = 0;

  for (let r = 0; r < config.rounds; r += 1) {
    const roundSeed = `${config.seed}:round:${r}`;
    let state = createRound({ mineCount: config.mineCount, seed: roundSeed });
    const pickOrder = rng.shuffle(Array.from({ length: CELL_COUNT }, (_, i) => i));

    for (const cell of pickOrder) {
      const res = pickCell(state, cell);
      if (!res.ok) break;
      state = res.state;
      const last = state.events[state.events.length - 1];
      if (last?.revealType === 'tileMine') {
        break;
      }
      if (last?.chainCompletedId) chainCompletes += 1;
      if (last?.vaultTriggered) {
        vaultTriggers += 1;
        const vaultIdx = rng.nextUint32() % VAULT_CHEST_COUNT;
        const vr = pickVault(state, vaultIdx);
        if (vr.ok) state = vr.state;
      }
      const strategy = config.strategy ?? 'random';
      let shouldCash =
        strategy === 'cashoutFirstSafe'
          ? state.safePicks >= 1
          : strategy === 'optimalGreedy'
            ? false
            : rng.nextFloat() < config.cashoutAggression;
      if (strategy === 'optimalGreedy' && state.safePicks >= CELL_COUNT - config.mineCount) {
        shouldCash = true;
      }
      if (shouldCash) {
        const co = cashOut(state);
        if (co.ok) {
          state = co.state;
          break;
        }
      }
    }

    if (!state.terminal && state.safePicks > 0) {
      const co = cashOut(state);
      if (co.ok) state = co.state;
    }

    const win = state.payoutBook / 100;
    if (win > 0) hits += 1;
    totalWin += win;
    maxWin = Math.max(maxWin, state.payoutBook);
  }

  const rtp = totalWin / config.rounds;
  const hitRate = hits / config.rounds;
  const variance =
    config.rounds > 1
      ? rtp * (1 - rtp) / config.rounds
      : 0;
  const se = Math.sqrt(variance);
  const ci95Low = rtp - 1.96 * se;
  const ci95High = rtp + 1.96 * se;

  return {
    rounds: config.rounds,
    totalBet: config.rounds,
    totalWin,
    rtp,
    hitRate,
    vaultTriggers,
    chainCompletes,
    maxObservedWinBook: maxWin,
    standardError: se,
    ci95Low,
    ci95High,
  };
}
