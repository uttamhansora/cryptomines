import {
  BOOK_SCALE,
  BUY_VAULT_COST_MULTIPLIER,
  CELL_COUNT,
  CHAIN_DEFINITIONS,
  type CryptoSymbolId,
  VAULT_CHEST_COUNT,
} from '@crypto-mines/shared';
import { SeededRng } from './rng.js';
import {
  createRound,
  createBuyVaultRound,
  pickCell,
  pickVault,
  cashOut,
  type RoundState,
} from './round-engine.js';
import { mathConfigurationHash } from './theory/config-hash.js';

export type FeatureSimStrategy =
  | 'cashoutFirstSafe'
  | 'continueUntilMine'
  | 'continueUntilN'
  | 'cashoutDepth2'
  | 'cashoutDepth3'
  | 'cashoutDepth5'
  | 'cashoutDepth10'
  | 'vaultSeeking'
  | 'chainSeeking'
  | 'buyVault';

function strategyTargetDepth(strategy: FeatureSimStrategy): number | null {
  if (strategy === 'cashoutFirstSafe') return 1;
  if (strategy === 'cashoutDepth2') return 2;
  if (strategy === 'cashoutDepth3') return 3;
  if (strategy === 'cashoutDepth5') return 5;
  if (strategy === 'cashoutDepth10') return 10;
  if (strategy === 'continueUntilN') return null;
  return null;
}

export interface FeatureSimConfig {
  rounds: number;
  mineCount: number;
  seed: string;
  strategy: FeatureSimStrategy;
  /** For continueUntilN */
  targetSafePicks?: number;
  /** For random cashout slices */
  cashoutAggression?: number;
}

export interface FeatureSimResult {
  strategy: FeatureSimStrategy;
  rounds: number;
  seed: string;
  configurationHash: string;
  mineCount: number;
  totalBet: number;
  totalWin: number;
  rtp: number;
  meanPayout: number;
  stdDev: number;
  standardError: number;
  ci95Low: number;
  ci95High: number;
  hitRate: number;
  mineRate: number;
  vaultTriggerRate: number;
  chainCompleteRate: number;
  chainStreakCompleteRate: number;
  chainStreakRates: Record<string, number>;
  averagePicks: number;
  averageMultiplierBook: number;
  averagePayoutBook: number;
  maxObservedPayoutBook: number;
  buyCost?: number;
  buyRtp?: number;
  payoutHistogram?: Record<string, number>;
}

function stdStats(samples: number[]): { mean: number; stdDev: number } {
  if (samples.length === 0) return { mean: 0, stdDev: 0 };
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const var_ = samples.reduce((s, x) => s + (x - mean) ** 2, 0) / samples.length;
  return { mean, stdDev: Math.sqrt(var_) };
}

function orderVaultSeeking(state: RoundState, order: number[]): number[] {
  const vaultCells: number[] = [];
  const rest: number[] = [];
  for (const c of order) {
    if (state.symbolByCell.get(c) === 'VAULT') vaultCells.push(c);
    else rest.push(c);
  }
  return [...vaultCells, ...rest];
}

function nextChainSymbol(progress: CryptoSymbolId[]): CryptoSymbolId | null {
  for (const def of CHAIN_DEFINITIONS) {
    const need = def.sequence[progress.length];
    if (need) return need;
  }
  return null;
}

function orderChainSeeking(state: RoundState, order: number[]): number[] {
  const progress = state.chainProgress;
  const want = nextChainSymbol(progress);
  const scored = order.map((c) => {
    const sym = state.symbolByCell.get(c)!;
    let score = 0;
    if (want && sym === want) score += 10;
    if (sym === 'VAULT') score += 1;
    return { c, score, sym };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.c);
}

function playBaseRound(
  state: RoundState,
  rng: SeededRng,
  config: FeatureSimConfig,
): {
  state: RoundState;
  vaultTriggered: boolean;
  chainSymbolComplete: boolean;
  chainStreakMax: number;
  chainStreakComplete: boolean;
  picks: number;
  hitMine: boolean;
} {
  let pickOrder = rng.shuffle(Array.from({ length: CELL_COUNT }, (_, i) => i));
  let vaultTriggered = false;
  let chainSymbolComplete = false;
  let chainStreakMax = 0;
  let chainStreakComplete = false;
  let picks = 0;
  let hitMine = false;

  for (let step = 0; step < CELL_COUNT; step += 1) {
    if (config.strategy === 'vaultSeeking') pickOrder = orderVaultSeeking(state, pickOrder);
    if (config.strategy === 'chainSeeking') pickOrder = orderChainSeeking(state, pickOrder);

    const cell = pickOrder[step];
    if (state.revealed.has(cell)) continue;
    const res = pickCell(state, cell);
    if (!res.ok) break;
    state = res.state;
    picks += 1;

    const last = state.events[state.events.length - 1];
    if (last?.revealType === 'tileMine') {
      hitMine = true;
      break;
    }
    if (last?.chainCompletedId) chainSymbolComplete = true;
    if (last?.vaultTriggered) {
      vaultTriggered = true;
      const vaultIdx = rng.nextUint32() % VAULT_CHEST_COUNT;
      const vr = pickVault(state, vaultIdx);
      if (vr.ok) state = vr.state;
    }
    if (typeof last?.chainStreak === 'number') {
      chainStreakMax = Math.max(chainStreakMax, last.chainStreak);
    }
    if (last?.chainStreakComplete) chainStreakComplete = true;

    const strat = config.strategy;
    let shouldCash = false;
    const depthTarget = strategyTargetDepth(strat);
    if (depthTarget !== null) {
      shouldCash = state.safePicks >= depthTarget;
    } else if (strat === 'continueUntilMine') {
      shouldCash = false;
    } else if (strat === 'chainSeeking') {
      shouldCash = last?.chainStreakComplete === true || state.safePicks >= 5;
    } else if (strat === 'vaultSeeking') {
      shouldCash =
        (state.vaultResolved && state.safePicks >= 5) ||
        (state.vaultResolved && state.vaultTokensCollected >= 3) ||
        state.safePicks >= 12;
    } else if (strat === 'continueUntilN') {
      shouldCash = state.safePicks >= (config.targetSafePicks ?? 5);
    }
    if (shouldCash) {
      const co = cashOut(state);
      if (co.ok) {
        state = co.state;
        break;
      }
    }
  }

  const maxSafe = CELL_COUNT - state.mineCount;
  if (!state.terminal && state.safePicks >= maxSafe) {
    const co = cashOut(state);
    if (co.ok) state = co.state;
  }

  return {
    state,
    vaultTriggered,
    chainSymbolComplete,
    chainStreakMax,
    chainStreakComplete,
    picks,
    hitMine,
  };
}

export function runFeatureSimulation(config: FeatureSimConfig): FeatureSimResult {
  const rng = new SeededRng(config.seed);
  const configurationHash = mathConfigurationHash(config.mineCount);
  const payouts: number[] = [];
  const picksSamples: number[] = [];
  const multSamples: number[] = [];
  let hits = 0;
  let mines = 0;
  let vaultTriggers = 0;
  let chainCompletes = 0;
  let chainStreakCompletes = 0;
  const chainStreakCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let maxBook = 0;
  const histogram: Record<string, number> = {};

  let totalBet = 0;

  for (let r = 0; r < config.rounds; r += 1) {
    const roundSeed = `${config.seed}:round:${r}`;

    if (config.strategy === 'buyVault') {
      totalBet += BUY_VAULT_COST_MULTIPLIER;
      let state = createBuyVaultRound({ seed: roundSeed });
      const vaultIdx = rng.nextUint32() % VAULT_CHEST_COUNT;
      const vr = pickVault(state, vaultIdx);
      if (vr.ok) state = vr.state;
      const payout = state.payoutBook / BOOK_SCALE;
      payouts.push(payout);
      multSamples.push(state.payoutBook);
      if (payout > 0) hits += 1;
      maxBook = Math.max(maxBook, state.payoutBook);
      const key = String(state.payoutBook);
      histogram[key] = (histogram[key] ?? 0) + 1;
      continue;
    }

    totalBet += 1;
    let state = createRound({ mineCount: config.mineCount, seed: roundSeed });
    const played = playBaseRound(state, rng, config);
    state = played.state;
    if (played.hitMine) mines += 1;
    if (played.vaultTriggered) vaultTriggers += 1;
    if (played.chainSymbolComplete) chainCompletes += 1;
    if (played.chainStreakComplete) chainCompletes += 0; // streak tracked separately
    for (let s = 1; s <= 5; s += 1) {
      if (played.chainStreakMax >= s) chainStreakCounts[s] += 1;
    }
    if (played.chainStreakComplete) chainStreakCompletes += 1;
    picksSamples.push(played.picks);

    const payout = state.payoutBook / BOOK_SCALE;
    payouts.push(payout);
    multSamples.push(state.multiplierBook);
    if (payout > 0) hits += 1;
    maxBook = Math.max(maxBook, state.payoutBook);
  }

  const totalWin = payouts.reduce((a, b) => a + b, 0);
  const betUnit = config.strategy === 'buyVault' ? BUY_VAULT_COST_MULTIPLIER : 1;
  const returns = payouts.map((p) => p / betUnit);
  const { mean: meanPayout, stdDev } = stdStats(payouts);
  const { stdDev: stdDevReturn } = stdStats(returns);
  const rtp = totalWin / totalBet;
  const rtpSe = stdDevReturn / Math.sqrt(config.rounds);
  const chainStreakRates: Record<string, number> = {};
  for (const [k, v] of Object.entries(chainStreakCounts)) {
    chainStreakRates[`stage${k}`] = v / config.rounds;
  }

  const result: FeatureSimResult = {
    strategy: config.strategy,
    rounds: config.rounds,
    seed: config.seed,
    configurationHash,
    mineCount: config.mineCount,
    totalBet,
    totalWin,
    rtp,
    meanPayout,
    stdDev,
    standardError: rtpSe,
    ci95Low: rtp - 1.96 * rtpSe,
    ci95High: rtp + 1.96 * rtpSe,
    hitRate: hits / config.rounds,
    mineRate: mines / config.rounds,
    vaultTriggerRate: vaultTriggers / config.rounds,
    chainCompleteRate: chainCompletes / config.rounds,
    chainStreakCompleteRate: chainStreakCompletes / config.rounds,
    chainStreakRates,
    averagePicks: picksSamples.length ? picksSamples.reduce((a, b) => a + b, 0) / picksSamples.length : 0,
    averageMultiplierBook: multSamples.reduce((a, b) => a + b, 0) / multSamples.length,
    averagePayoutBook: (totalWin / config.rounds) * BOOK_SCALE,
    maxObservedPayoutBook: maxBook,
  };

  if (config.strategy === 'buyVault') {
    result.buyCost = BUY_VAULT_COST_MULTIPLIER;
    result.buyRtp = rtp;
    result.payoutHistogram = histogram;
  }

  return result;
}
