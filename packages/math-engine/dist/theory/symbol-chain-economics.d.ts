import { type CryptoSymbolId } from '@crypto-mines/shared';
/**
 * Symbol chains: completing a 3-symbol sequence adds boostBook to multiplierBook (additive).
 * Single interpretation: **additive multiplier book units**, same as streak chain.
 */
export declare function symbolChainInterpretation(): string;
export interface SymbolChainDefRow {
    id: string;
    sequence: CryptoSymbolId[];
    boostBook: number;
    boostDisplay: number;
}
export declare function symbolChainDefinitionTable(): SymbolChainDefRow[];
export interface SymbolChainMonteCarloRow {
    depth: number;
    samples: number;
    /** Mean symbol-chain boost book accumulated by depth k (random safe picks, no mines) */
    meanBoostBook: number;
    pAnyChainComplete: number;
    pAlpha: number;
    pBeta: number;
    pGamma: number;
}
/** Monte Carlo: random symbol stream weighted like safe-cell assignment (mines ignored). */
export declare function estimateSymbolChainByDepth(depthMax: number, samples?: number, seed?: string): SymbolChainMonteCarloRow[];
