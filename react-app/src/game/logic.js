/**
 * CryptoMines — pure game logic (no React, no DOM).
 * All math matches the spec exactly so RTP behaviour is reproducible.
 */

export const GRID = 5;
export const TILES = GRID * GRID; // 25
export const MIN_BET = 0.1;
export const BET_STEP = 0.1;
export const MIN_MINES = 1;
export const MAX_MINES = 24;
export const DEFAULT_MINES = 5;
export const HOUSE_EDGE = 0.99;
export const CHAIN_STEPS = 5;
export const CHAIN_BOOST = 0.25;      // +0.25x added when step 5 completes
export const VAULT_SLOTS = 3;
export const VAULT_CHANCE = 0.08;     // ~8% of safe tiles carry a vault symbol
export const VAULT_COST_MULT = 50;    // Buy Crypto Vault = 50x bet
export const STARTING_BALANCE = 99.0;

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Multiplier after k safe reveals with m mines on 25 tiles.
 * mult = 0.99 * Π_{i=0..k-1} (25 - i) / (25 - m - i)
 */
export function multiplierFor(k, m) {
  let mult = 1;
  for (let i = 0; i < k; i++) {
    mult *= (TILES - i) / (TILES - m - i);
  }
  return HOUSE_EDGE * mult;
}

/** Effective multiplier including completed-chain boosts. */
export function effectiveMultiplier(k, m, chainBoosts) {
  return multiplierFor(k, m) + chainBoosts * CHAIN_BOOST;
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a fresh board: array of 25 tile descriptors.
 * { mine: boolean, vault: boolean } — vault symbols only ever land on safe tiles.
 */
export function buildBoard(minesCount, rng = Math.random) {
  const positions = shuffle(Array.from({ length: TILES }, (_, i) => i), rng);
  const mineSet = new Set(positions.slice(0, minesCount));
  return Array.from({ length: TILES }, (_, i) => ({
    mine: mineSet.has(i),
    vault: !mineSet.has(i) && rng() < VAULT_CHANCE,
  }));
}

/** Clamp helper used by every bet control. */
export function clampBet(value, balance) {
  const max = Math.max(MIN_BET, round2(balance));
  return Math.min(max, Math.max(MIN_BET, round2(value)));
}

export function clampMines(value) {
  return Math.min(MAX_MINES, Math.max(MIN_MINES, Math.round(value)));
}

export { round2 };
