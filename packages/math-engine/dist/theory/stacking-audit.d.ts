export interface StackingScenario {
    id: string;
    description: string;
    depth: number;
    symbolChainBoostBook: number;
    includesVault: boolean;
    baseMultiplierBook: number;
    chainBonusBook: number;
    vaultPayoutBook: number;
    totalPayoutBook: number;
    survivalProbability: number;
    theoreticalRtp: number;
}
export declare function buildStackingScenarioGrid(mineCount: number): StackingScenario[];
export declare function stackingSummary(mineCount: number, targetRtp?: number): {
    highestEv: StackingScenario;
    lowestEv: StackingScenario;
    maxPayout: StackingScenario;
    pathsAboveTarget: StackingScenario[];
};
export declare function featureBudgetTable(): {
    component: string;
    rtpContribution: string;
    note: string;
}[];
export declare function maxWinPathAudit(mineCount: number): {
    maxBook: number;
    maxDisplay: number;
    atCap: boolean;
    buyMaxBook: number;
};
