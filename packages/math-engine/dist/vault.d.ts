import type { VaultBonusState } from '@crypto-mines/shared';
import type { SeededRng } from './rng.js';
/** @deprecated use VAULT_ORGANIC_CHEST_FACTOR_BOOK — organic factor chests */
export declare const VAULT_CHEST_MULTIPLIERS_BOOK: readonly [110, 125, 150, 175, 200];
export declare function createVaultBonusState(baseMultiplierBook: number, rng: SeededRng, opts?: {
    fullScene?: boolean;
    buyMode?: boolean;
}): VaultBonusState;
/**
 * Payout convention (single currency path: win = bet × payoutBook / BOOK_SCALE):
 * - **Buy mode:** vaultMultipliersBook[slot] IS payoutBook (absolute × base bet).
 * - **Organic:** vaultMultipliersBook[slot] is factor on **base** multiplier only; chain bonus is separate.
 */
export declare function resolveVaultPayout(state: VaultBonusState, selectedVaultIndex: number): {
    payoutBook: number;
    multiplierBook: number;
};
