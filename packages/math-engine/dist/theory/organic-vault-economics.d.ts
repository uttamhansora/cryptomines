export declare function expectedOrganicVaultPayoutBook(baseMultiplierBook: number): number;
export interface OrganicVaultDepthRow {
    depth: number;
    survivalProbability: number;
    /** P(≥3 VAULT symbols in first k safe reveals | k safe picks, random symbol stream) */
    pVaultTriggerByDepth: number;
    baseMultiplierBookAtDepth: number;
    streakBoostBook: number;
    multiplierBookBeforeVault: number;
    expectedVaultPayoutBook: number;
    /** E[payout | reach depth k, random symbols, cash after vault if triggered] — diagnostic */
    expectedPayoutBookIfVaultResolved: number;
    incrementalEvFromVault: number;
}
export declare function estimateOrganicVaultByDepth(mineCount: number, depthMax: number, samples?: number, seed?: string): OrganicVaultDepthRow[];
