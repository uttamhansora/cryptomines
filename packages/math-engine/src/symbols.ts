import type { CryptoSymbolId } from '@crypto-mines/shared';
import { CRYPTO_SYMBOLS } from '@crypto-mines/shared';
import type { SeededRng } from './rng.js';

/** Relative weights for safe-cell symbol assignment (excluding mines) */
export const SYMBOL_WEIGHTS: Record<CryptoSymbolId, number> = {
  BTC: 22,
  ETH: 22,
  SOL: 18,
  USDT: 18,
  DIAMOND: 12,
  VAULT: 8,
};

export function assignSymbolsToSafeCells(
  safeIndices: number[],
  rng: SeededRng,
): Map<number, CryptoSymbolId> {
  const map = new Map<number, CryptoSymbolId>();
  const ids = CRYPTO_SYMBOLS;
  const weights = ids.map((id) => SYMBOL_WEIGHTS[id]);
  for (const idx of safeIndices) {
    map.set(idx, rng.pickWeighted(ids, weights));
  }
  return map;
}
