/** Documented chain streak + symbol EV budget (chainBonusBook). */
export declare const RTP_CHAIN = 0.02;
/** Documented organic vault EV budget. */
export declare const RTP_VAULT = 0.02;
/**
 * Base survival ladder slice — funds the fair multiplier ladder only.
 * Chain streak/symbol bonuses and organic vault EV sit on top (Phase 5D); they are NOT folded into multiplierBook.
 * Calibrated so published base books (cashout-at-3 generator) meet Stake cross-mode RTP vs buy vault (~95.77%).
 * Derived from 10k book-gen sim: slice 0.92 → 94.21% RTP; 0.9345 → ~95.69% (ladder rounding is stepwise at book units).
 */
export declare const RTP_BASE_SURVIVAL = 0.9345;
export declare function survivalProbability(mineCount: number, safePicks: number): number;
export declare function fairMultiplierAtPick(mineCount: number, safePicks: number, rtpSlice: number): number;
export declare function buildMultiplierLadder(mineCount: number): number[];
export declare function getMultiplierBook(mineCount: number, safePicks: number): number;
export declare function applyChainBoost(multiplierBook: number, boostBook: number): number;
export declare function capMultiplierBook(multiplierBook: number): number;
/** Theoretical RTP if player cashes at random depth uniformly (diagnostic) */
export declare function theoreticalInstantLossRtp(mineCount: number): number;
export declare function targetRtpNote(): {
    TARGET_RTP: number;
    RTP_BASE_SURVIVAL: number;
    RTP_CHAIN: number;
    RTP_VAULT: number;
};
