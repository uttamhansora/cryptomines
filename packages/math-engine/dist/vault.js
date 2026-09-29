import { BOOK_SCALE, VAULT_CHEST_COUNT, VAULT_BUY_CHEST_PAYOUT_BOOK, VAULT_ORGANIC_CHEST_FACTOR_BOOK, } from '@crypto-mines/shared';
import { capMultiplierBook } from './multipliers.js';
/** @deprecated use VAULT_ORGANIC_CHEST_FACTOR_BOOK — organic factor chests */
export const VAULT_CHEST_MULTIPLIERS_BOOK = VAULT_ORGANIC_CHEST_FACTOR_BOOK;
export function createVaultBonusState(baseMultiplierBook, rng, opts) {
    const buyMode = opts?.buyMode ?? false;
    const source = buyMode ? [...VAULT_BUY_CHEST_PAYOUT_BOOK] : [...VAULT_ORGANIC_CHEST_FACTOR_BOOK];
    const indices = rng.shuffle(Array.from({ length: VAULT_CHEST_COUNT }, (_, i) => i));
    const vaultMultipliersBook = indices.map((i) => source[i] ?? source[0]);
    const vaultLabels = vaultMultipliersBook.map((_, i) => String(i + 1));
    const winningVaultIndex = rng.nextUint32() % VAULT_CHEST_COUNT;
    return {
        vaultLabels,
        vaultMultipliersBook,
        winningVaultIndex,
        baseMultiplierBook,
        fullScene: opts?.fullScene ?? true,
        buyMode,
    };
}
/**
 * Payout convention (single currency path: win = bet × payoutBook / BOOK_SCALE):
 * - **Buy mode:** vaultMultipliersBook[slot] IS payoutBook (absolute × base bet).
 * - **Organic:** vaultMultipliersBook[slot] is factor on **base** multiplier only; chain bonus is separate.
 */
export function resolveVaultPayout(state, selectedVaultIndex) {
    const chest = state.vaultMultipliersBook[selectedVaultIndex] ?? BOOK_SCALE;
    if (state.buyMode) {
        const payoutBook = capMultiplierBook(chest);
        return { payoutBook, multiplierBook: state.baseMultiplierBook };
    }
    const vaultPayout = capMultiplierBook(Math.floor((state.baseMultiplierBook * chest) / BOOK_SCALE));
    return { payoutBook: vaultPayout, multiplierBook: state.baseMultiplierBook };
}
