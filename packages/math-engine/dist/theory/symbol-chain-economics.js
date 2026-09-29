import { BOOK_SCALE, CHAIN_DEFINITIONS } from '@crypto-mines/shared';
import { SeededRng } from '../rng.js';
import { SYMBOL_WEIGHTS } from '../symbols.js';
import { updateChainProgress } from '../chain.js';
/**
 * Symbol chains: completing a 3-symbol sequence adds boostBook to multiplierBook (additive).
 * Single interpretation: **additive multiplier book units**, same as streak chain.
 */
export function symbolChainInterpretation() {
    return 'Symbol chain rewards are additive book units on multiplierBook (applyChainBoost), not separate payouts.';
}
export function symbolChainDefinitionTable() {
    return CHAIN_DEFINITIONS.map((d) => ({
        id: d.id,
        sequence: [...d.sequence],
        boostBook: d.boostBook,
        boostDisplay: d.boostBook / BOOK_SCALE,
    }));
}
/** Monte Carlo: random symbol stream weighted like safe-cell assignment (mines ignored). */
export function estimateSymbolChainByDepth(depthMax, samples = 500_000, seed = 'phase5c-symbol-chain') {
    const ids = Object.keys(SYMBOL_WEIGHTS);
    const weights = ids.map((id) => SYMBOL_WEIGHTS[id]);
    const rng = new SeededRng(seed);
    const sumBoost = new Array(depthMax + 1).fill(0);
    const anyComplete = new Array(depthMax + 1).fill(0);
    for (let s = 0; s < samples; s += 1) {
        let progress = [];
        let boost = 0;
        for (let pick = 1; pick <= depthMax; pick += 1) {
            const sym = rng.pickWeighted(ids, weights);
            const ch = updateChainProgress(progress, sym);
            progress = ch.progress;
            if (ch.boostBook)
                boost += ch.boostBook;
            sumBoost[pick] += boost;
            if (boost > 0)
                anyComplete[pick] += 1;
        }
    }
    const byDepth = [];
    for (let k = 1; k <= depthMax; k += 1) {
        byDepth.push({
            depth: k,
            samples,
            meanBoostBook: sumBoost[k] / samples,
            pAnyChainComplete: anyComplete[k] / samples,
            pAlpha: 0,
            pBeta: 0,
            pGamma: 0,
        });
    }
    return byDepth;
}
