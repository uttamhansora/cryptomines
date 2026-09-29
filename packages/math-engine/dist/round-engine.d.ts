import { type CryptoSymbolId } from '@crypto-mines/shared';
import type { GameEvent, VaultBonusState } from '@crypto-mines/shared';
export interface RoundConfig {
    mineCount: number;
    seed: string;
}
export interface RoundState {
    mineCount: number;
    mineCells: Set<number>;
    symbolByCell: Map<number, CryptoSymbolId>;
    revealed: Set<number>;
    safePicks: number;
    /** Base mines ladder only — never modified by chain or vault. */
    multiplierBook: number;
    /** Separate CRYPTO CHAIN bonus book (claimed on cashout). */
    chainBonusBook: number;
    chainProgress: CryptoSymbolId[];
    vault?: VaultBonusState;
    vaultResolved: boolean;
    /** Organic/buy vault payout on base component only (0 until resolved). */
    vaultPayoutBook: number;
    vaultTokensCollected: number;
    chainStreak: number;
    buyMode: boolean;
    terminal: boolean;
    payoutBook: number;
    events: GameEvent[];
}
export declare function createRound(config: RoundConfig): RoundState;
/** Paid entry — authoritative 50× bet handled in RGS; round is vault-only */
export declare function createBuyVaultRound(config: {
    seed: string;
}): RoundState;
export type PickResult = {
    ok: true;
    state: RoundState;
} | {
    ok: false;
    reason: string;
};
export declare function pickCell(state: RoundState, cellIndex: number): PickResult;
export declare function pickVault(state: RoundState, vaultIndex: number): PickResult;
export declare function cashOut(state: RoundState): PickResult;
export declare function replayFromEvents(events: GameEvent[]): GameEvent[];
