export declare function buildStreakChainStageTable(mineCount: number): {
    stage: number;
    safePicksAtStage: number;
    incrementalBoostBook: number;
    incrementalBoostDisplay: number;
    reachProbability: number;
    incrementalRtpContribution: number;
}[];
export interface DepthCashoutRow {
    depth: number;
    survivalProbability: number;
    baseMultiplierBook: number;
    chainBonusBook: number;
    combinedPayoutBook: number;
    combinedDisplay: number;
    chainStage: string;
    theoreticalRtpIfCashHere: number;
    houseEdgeIfCashHere: number;
    excessRtpVsTarget: number;
}
export declare function buildDepthCashoutWithChainTable(mineCount: number, targetRtp?: number): DepthCashoutRow[];
/** @deprecated use buildDepthCashoutWithChainTable */
export declare function buildDepthCashoutWithStreakTable(mineCount: number, targetRtp?: number): DepthCashoutRow[];
