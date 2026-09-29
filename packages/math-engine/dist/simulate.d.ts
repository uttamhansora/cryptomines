export type SimStrategy = 'random' | 'cashoutFirstSafe' | 'optimalGreedy';
export interface SimConfig {
    rounds: number;
    mineCount: number;
    seed: string;
    /** 0-1 probability to cash out after each safe pick (random strategy) */
    cashoutAggression: number;
    strategy?: SimStrategy;
}
export interface SimResult {
    rounds: number;
    totalBet: number;
    totalWin: number;
    rtp: number;
    hitRate: number;
    vaultTriggers: number;
    chainCompletes: number;
    maxObservedWinBook: number;
    standardError: number;
    ci95Low: number;
    ci95High: number;
}
export declare function runSimulation(config: SimConfig): SimResult;
