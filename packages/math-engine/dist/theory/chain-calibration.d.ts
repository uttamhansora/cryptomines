/** Base ladder RTP slice — chain + vault budgets funded from TARGET_RTP. */
export declare function effectiveBaseRtpSlice(): number;
export interface ChainRewardConfig {
    streakRewardPick3Book: number;
    streakRewardPick5IncrementalBook: number;
    baseRtpSlice: number;
}
export declare function chainBonusBookAtCashoutDepth(safePicks: number, cfg?: ChainRewardConfig): number;
export declare function baseMultiplierBookAtDepth(mineCount: number, depth: number, baseRtpSlice?: number): number;
export declare function theoreticalRtpIfCashAtDepth(mineCount: number, depth: number, cfg?: ChainRewardConfig): number;
export declare function defaultChainRewardConfig(): ChainRewardConfig;
export declare function calibrateMaxChainRewards(mineCount?: number): ChainRewardConfig;
export declare function verifyAllDepthsWithinCap(mineCount: number, cfg?: ChainRewardConfig): {
    ok: boolean;
    worstDepth: number;
    worstRtp: number;
    rows: {
        depth: number;
        rtp: number;
    }[];
};
