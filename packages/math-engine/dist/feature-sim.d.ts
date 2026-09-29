export type FeatureSimStrategy = 'cashoutFirstSafe' | 'continueUntilMine' | 'continueUntilN' | 'cashoutDepth2' | 'cashoutDepth3' | 'cashoutDepth5' | 'cashoutDepth10' | 'vaultSeeking' | 'chainSeeking' | 'buyVault';
export interface FeatureSimConfig {
    rounds: number;
    mineCount: number;
    seed: string;
    strategy: FeatureSimStrategy;
    /** For continueUntilN */
    targetSafePicks?: number;
    /** For random cashout slices */
    cashoutAggression?: number;
}
export interface FeatureSimResult {
    strategy: FeatureSimStrategy;
    rounds: number;
    seed: string;
    configurationHash: string;
    mineCount: number;
    totalBet: number;
    totalWin: number;
    rtp: number;
    meanPayout: number;
    stdDev: number;
    standardError: number;
    ci95Low: number;
    ci95High: number;
    hitRate: number;
    mineRate: number;
    vaultTriggerRate: number;
    chainCompleteRate: number;
    chainStreakCompleteRate: number;
    chainStreakRates: Record<string, number>;
    averagePicks: number;
    averageMultiplierBook: number;
    averagePayoutBook: number;
    maxObservedPayoutBook: number;
    buyCost?: number;
    buyRtp?: number;
    payoutHistogram?: Record<string, number>;
}
export declare function runFeatureSimulation(config: FeatureSimConfig): FeatureSimResult;
