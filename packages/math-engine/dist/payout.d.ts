/** Authoritative round payout in book units (win = bet × book / 100). */
export declare function computePayoutBook(state: {
    multiplierBook: number;
    chainBonusBook: number;
    vaultResolved: boolean;
    vaultPayoutBook: number;
}): number;
