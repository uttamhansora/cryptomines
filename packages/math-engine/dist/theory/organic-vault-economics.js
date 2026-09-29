import { BOOK_SCALE, VAULT_TOKENS_TO_TRIGGER } from '@crypto-mines/shared';
import { SeededRng } from '../rng.js';
import { SYMBOL_WEIGHTS } from '../symbols.js';
import { organicVaultChestDistribution } from './vault-chests.js';
import { survivalProbability, getMultiplierBook } from '../multipliers.js';
import { chainBonusBookAtCashoutDepth } from './chain-calibration.js';
export function expectedOrganicVaultPayoutBook(baseMultiplierBook) {
    const rows = organicVaultChestDistribution(baseMultiplierBook);
    return rows.reduce((s, r) => s + r.contributionToExpectedPayout, 0);
}
export function estimateOrganicVaultByDepth(mineCount, depthMax, samples = 500_000, seed = 'phase5c-vault-mc') {
    const ids = Object.keys(SYMBOL_WEIGHTS);
    const weights = ids.map((id) => SYMBOL_WEIGHTS[id]);
    const rng = new SeededRng(seed);
    const triggers = new Array(depthMax + 1).fill(0);
    const sumPayout = new Array(depthMax + 1).fill(0);
    for (let s = 0; s < samples; s += 1) {
        let vaultCount = 0;
        for (let pick = 1; pick <= depthMax; pick += 1) {
            const sym = rng.pickWeighted(ids, weights);
            if (sym === 'VAULT')
                vaultCount += 1;
            const base = getMultiplierBook(mineCount, pick);
            const streak = chainBonusBookAtCashoutDepth(pick);
            const multBefore = base + streak;
            if (vaultCount >= VAULT_TOKENS_TO_TRIGGER) {
                triggers[pick] += 1;
                sumPayout[pick] += expectedOrganicVaultPayoutBook(multBefore);
            }
            else {
                sumPayout[pick] += multBefore;
            }
        }
    }
    const rows = [];
    for (let k = 1; k <= depthMax; k += 1) {
        const pReach = survivalProbability(mineCount, k);
        const meanPayoutBook = sumPayout[k] / samples;
        const multBefore = getMultiplierBook(mineCount, k) + chainBonusBookAtCashoutDepth(k);
        rows.push({
            depth: k,
            survivalProbability: pReach,
            pVaultTriggerByDepth: triggers[k] / samples,
            baseMultiplierBookAtDepth: getMultiplierBook(mineCount, k),
            streakBoostBook: chainBonusBookAtCashoutDepth(k),
            multiplierBookBeforeVault: multBefore,
            expectedVaultPayoutBook: expectedOrganicVaultPayoutBook(multBefore),
            expectedPayoutBookIfVaultResolved: meanPayoutBook,
            incrementalEvFromVault: pReach * (meanPayoutBook / BOOK_SCALE) - pReach * (multBefore / BOOK_SCALE),
        });
    }
    return rows;
}
