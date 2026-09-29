import { BOOK_SCALE, CHAIN_STREAK_MAX } from '@crypto-mines/shared';
import { capMultiplierBook, getMultiplierBook, survivalProbability } from '../multipliers.js';
import { chainBonusBookAtCashoutDepth, theoreticalRtpIfCashAtDepth, defaultChainRewardConfig, } from './chain-calibration.js';
export function buildStreakChainStageTable(mineCount) {
    const cfg = defaultChainRewardConfig();
    const rows = [];
    for (let stage = 1; stage <= CHAIN_STREAK_MAX; stage += 1) {
        const boostThisStage = stage === 3 ? cfg.streakRewardPick3Book : stage === 5 ? cfg.streakRewardPick5IncrementalBook : 0;
        const pReach = survivalProbability(mineCount, stage);
        rows.push({
            stage,
            safePicksAtStage: stage,
            incrementalBoostBook: boostThisStage,
            incrementalBoostDisplay: boostThisStage / BOOK_SCALE,
            reachProbability: pReach,
            incrementalRtpContribution: (boostThisStage / BOOK_SCALE) * pReach,
        });
    }
    return rows;
}
export function buildDepthCashoutWithChainTable(mineCount, targetRtp = 0.96) {
    const maxSafe = 25 - mineCount;
    const cfg = defaultChainRewardConfig();
    const rows = [];
    for (let k = 1; k <= maxSafe; k += 1) {
        const p = survivalProbability(mineCount, k);
        const base = getMultiplierBook(mineCount, k);
        const chain = chainBonusBookAtCashoutDepth(k, cfg);
        const combined = capMultiplierBook(base + chain);
        const rtp = theoreticalRtpIfCashAtDepth(mineCount, k, cfg);
        const stage = k >= 5 ? '5+' : k >= 3 ? '3-4' : '—';
        rows.push({
            depth: k,
            survivalProbability: p,
            baseMultiplierBook: base,
            chainBonusBook: chain,
            combinedPayoutBook: combined,
            combinedDisplay: combined / BOOK_SCALE,
            chainStage: stage,
            theoreticalRtpIfCashHere: rtp,
            houseEdgeIfCashHere: 1 - rtp,
            excessRtpVsTarget: rtp - targetRtp,
        });
    }
    return rows;
}
/** @deprecated use buildDepthCashoutWithChainTable */
export function buildDepthCashoutWithStreakTable(mineCount, targetRtp = 0.96) {
    return buildDepthCashoutWithChainTable(mineCount, targetRtp);
}
