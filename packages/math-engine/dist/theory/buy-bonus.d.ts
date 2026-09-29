/** Expected payout book when player picks a uniform random chest (buy mode). */
export declare function expectedBuyVaultPayoutBookRandomChest(): number;
export declare function theoreticalBuyBonusRtp(normalizedBet?: number): {
    buyCost: number;
    expectedPayout: number;
    buyRtp: number;
    payoutConvention: string;
    chestDistribution: {
        payoutBook: number;
        payoutTimesBet: number;
        probability: number;
    }[];
};
