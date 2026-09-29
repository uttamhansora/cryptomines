/** Organic vault: factor × current base multiplierBook */
export declare function organicVaultChestDistribution(baseBook?: number): {
    factorBook: number;
    probability: number;
    payoutBook: number;
    contributionToExpectedPayout: number;
}[];
export declare function verifyOrganicVaultProbabilitiesSum(): boolean;
