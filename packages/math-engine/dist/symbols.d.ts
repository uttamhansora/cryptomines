import type { CryptoSymbolId } from '@crypto-mines/shared';
import type { SeededRng } from './rng.js';
/** Relative weights for safe-cell symbol assignment (excluding mines) */
export declare const SYMBOL_WEIGHTS: Record<CryptoSymbolId, number>;
export declare function assignSymbolsToSafeCells(safeIndices: number[], rng: SeededRng): Map<number, CryptoSymbolId>;
