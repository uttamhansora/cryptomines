import { BOOK_SCALE, CELL_COUNT, TARGET_RTP, RTP_SIGNOFF_TOLERANCE, MAX_WIN_MULTIPLIER, } from '@crypto-mines/shared';
import { RTP_CHAIN, RTP_VAULT, survivalProbability, fairMultiplierAtPick } from '../multipliers.js';
import { CHAIN_STREAK_REWARD_PICK3_BOOK, CHAIN_STREAK_REWARD_PICK5_INCREMENTAL_BOOK, } from '@crypto-mines/shared';
/** Base ladder RTP slice — chain + vault budgets funded from TARGET_RTP. */
export function effectiveBaseRtpSlice() {
    return Math.max(0.01, TARGET_RTP - RTP_CHAIN - RTP_VAULT);
}
export function chainBonusBookAtCashoutDepth(safePicks, cfg = defaultChainRewardConfig()) {
    let bonus = 0;
    if (safePicks >= 3)
        bonus += cfg.streakRewardPick3Book;
    if (safePicks >= 5)
        bonus += cfg.streakRewardPick5IncrementalBook;
    return bonus;
}
export function baseMultiplierBookAtDepth(mineCount, depth, baseRtpSlice = effectiveBaseRtpSlice()) {
    let mult = fairMultiplierAtPick(mineCount, depth, baseRtpSlice);
    mult = Math.min(mult, MAX_WIN_MULTIPLIER);
    return Math.min(MAX_WIN_MULTIPLIER * BOOK_SCALE, Math.round(mult * BOOK_SCALE));
}
export function theoreticalRtpIfCashAtDepth(mineCount, depth, cfg = defaultChainRewardConfig()) {
    const p = survivalProbability(mineCount, depth);
    const base = baseMultiplierBookAtDepth(mineCount, depth, cfg.baseRtpSlice);
    const chain = chainBonusBookAtCashoutDepth(depth, cfg);
    return (p * (base + chain)) / BOOK_SCALE;
}
export function defaultChainRewardConfig() {
    return {
        streakRewardPick3Book: CHAIN_STREAK_REWARD_PICK3_BOOK,
        streakRewardPick5IncrementalBook: CHAIN_STREAK_REWARD_PICK5_INCREMENTAL_BOOK,
        baseRtpSlice: effectiveBaseRtpSlice(),
    };
}
export function calibrateMaxChainRewards(mineCount = 5) {
    const baseRtpSlice = effectiveBaseRtpSlice();
    const maxSafe = CELL_COUNT - mineCount;
    const cap = TARGET_RTP + RTP_SIGNOFF_TOLERANCE;
    let bestR3 = 0;
    let bestR5 = 0;
    for (let r3 = 0; r3 <= 150; r3 += 1) {
        for (let r5 = 0; r5 <= 150; r5 += 1) {
            const cfg = {
                streakRewardPick3Book: r3,
                streakRewardPick5IncrementalBook: r5,
                baseRtpSlice,
            };
            let ok = true;
            for (let d = 1; d <= maxSafe; d += 1) {
                if (theoreticalRtpIfCashAtDepth(mineCount, d, cfg) > cap) {
                    ok = false;
                    break;
                }
            }
            if (ok && r3 + r5 > bestR3 + bestR5) {
                bestR3 = r3;
                bestR5 = r5;
            }
        }
    }
    return { streakRewardPick3Book: bestR3, streakRewardPick5IncrementalBook: bestR5, baseRtpSlice };
}
export function verifyAllDepthsWithinCap(mineCount, cfg = defaultChainRewardConfig()) {
    const maxSafe = CELL_COUNT - mineCount;
    const cap = TARGET_RTP + RTP_SIGNOFF_TOLERANCE;
    const rows = [];
    let worstRtp = 0;
    let worstDepth = 1;
    for (let d = 1; d <= maxSafe; d += 1) {
        const rtp = theoreticalRtpIfCashAtDepth(mineCount, d, cfg);
        rows.push({ depth: d, rtp });
        if (rtp > worstRtp) {
            worstRtp = rtp;
            worstDepth = d;
        }
    }
    return { ok: worstRtp <= cap, worstDepth, worstRtp, rows };
}
