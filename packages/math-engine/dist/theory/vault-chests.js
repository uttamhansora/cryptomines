import { BOOK_SCALE, VAULT_ORGANIC_CHEST_FACTOR_BOOK } from '@crypto-mines/shared';
/** Organic vault: factor × current base multiplierBook */
export function organicVaultChestDistribution(baseBook = BOOK_SCALE) {
    const n = VAULT_ORGANIC_CHEST_FACTOR_BOOK.length;
    const p = 1 / n;
    return VAULT_ORGANIC_CHEST_FACTOR_BOOK.map((factorBook) => {
        const payoutBook = Math.floor((baseBook * factorBook) / BOOK_SCALE);
        return {
            factorBook,
            probability: p,
            payoutBook,
            contributionToExpectedPayout: p * payoutBook,
        };
    });
}
export function verifyOrganicVaultProbabilitiesSum() {
    const rows = organicVaultChestDistribution();
    const sumP = rows.reduce((s, r) => s + r.probability, 0);
    return Math.abs(sumP - 1) < 1e-9;
}
