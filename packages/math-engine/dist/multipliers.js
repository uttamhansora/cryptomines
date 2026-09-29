import { CELL_COUNT, TARGET_RTP, BOOK_SCALE, MAX_WIN_MULTIPLIER, } from '@crypto-mines/shared';
/** Documented chain streak + symbol EV budget (chainBonusBook). */
export const RTP_CHAIN = 0.02;
/** Documented organic vault EV budget. */
export const RTP_VAULT = 0.02;
/**
 * Base survival ladder slice — funds the fair multiplier ladder only.
 * Chain streak/symbol bonuses and organic vault EV sit on top (Phase 5D); they are NOT folded into multiplierBook.
 * Calibrated so published base books (cashout-at-3 generator) meet Stake cross-mode RTP vs buy vault (~95.77%).
 * Derived from 10k book-gen sim: slice 0.92 → 94.21% RTP; 0.9345 → ~95.69% (ladder rounding is stepwise at book units).
 */
export const RTP_BASE_SURVIVAL = 0.9345;
export function survivalProbability(mineCount, safePicks) {
    if (safePicks <= 0)
        return 1;
    let p = 1;
    for (let i = 0; i < safePicks; i += 1) {
        p *= (CELL_COUNT - mineCount - i) / (CELL_COUNT - i);
    }
    return p;
}
export function fairMultiplierAtPick(mineCount, safePicks, rtpSlice) {
    const p = survivalProbability(mineCount, safePicks);
    if (p <= 0)
        return 0;
    return (rtpSlice / p);
}
export function buildMultiplierLadder(mineCount) {
    const ladder = [];
    const maxSafe = CELL_COUNT - mineCount;
    for (let k = 1; k <= maxSafe; k += 1) {
        let mult = fairMultiplierAtPick(mineCount, k, RTP_BASE_SURVIVAL);
        mult = Math.min(mult, MAX_WIN_MULTIPLIER);
        ladder.push(Math.min(MAX_WIN_MULTIPLIER * BOOK_SCALE, Math.round(mult * BOOK_SCALE)));
    }
    return ladder;
}
export function getMultiplierBook(mineCount, safePicks) {
    if (safePicks <= 0)
        return BOOK_SCALE;
    const ladder = buildMultiplierLadder(mineCount);
    const idx = Math.min(safePicks, ladder.length) - 1;
    return ladder[idx] ?? BOOK_SCALE;
}
export function applyChainBoost(multiplierBook, boostBook) {
    const boosted = multiplierBook + boostBook;
    const cap = MAX_WIN_MULTIPLIER * BOOK_SCALE;
    return Math.min(boosted, cap);
}
export function capMultiplierBook(multiplierBook) {
    return Math.min(multiplierBook, MAX_WIN_MULTIPLIER * BOOK_SCALE);
}
/** Theoretical RTP if player cashes at random depth uniformly (diagnostic) */
export function theoreticalInstantLossRtp(mineCount) {
    const maxSafe = CELL_COUNT - mineCount;
    let ev = 0;
    for (let k = 1; k <= maxSafe; k += 1) {
        const pReach = survivalProbability(mineCount, k);
        const pStopHere = k === maxSafe ? pReach : pReach - survivalProbability(mineCount, k + 1);
        const mult = getMultiplierBook(mineCount, k) / BOOK_SCALE;
        ev += pStopHere * mult;
    }
    const pLoss = 1 - survivalProbability(mineCount, 1);
    return ev + pLoss * 0;
}
export function targetRtpNote() {
    return { TARGET_RTP, RTP_BASE_SURVIVAL, RTP_CHAIN, RTP_VAULT };
}
