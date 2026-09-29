import type { CryptoSymbolId } from './constants.js';
export type StakeEventType = 'reveal' | 'multiplierUpdate' | 'enterBonus' | 'bonusPick' | 'setTotalWin' | 'setWin' | 'finalWin' | 'roundResult';
export interface GameEvent {
    index: number;
    type: StakeEventType;
    /** Flat payload for Stake compatibility */
    [key: string]: unknown;
}
export type RevealType = 'roundStart' | 'tileSafe' | 'tileMine' | 'boardReady';
export interface RoundStartFields {
    revealType: RevealType;
    mineCount: number;
    boardSize: number;
    /** Server-only in production; omitted from client replay display in live mode until picks */
    serverSeedHash?: string;
}
export interface TileSafeFields {
    revealType: RevealType;
    cellIndex: number;
    symbol: CryptoSymbolId;
    picksSafe: number;
    multiplierBook: number;
    chainProgress: CryptoSymbolId[];
    chainCompletedId?: string;
    vaultTriggered?: boolean;
}
export interface TileMineFields {
    revealType: RevealType;
    cellIndex: number;
    mineIndex: number;
}
export interface VaultBonusState {
    vaultLabels: string[];
    vaultMultipliersBook: number[];
    winningVaultIndex: number;
    baseMultiplierBook: number;
    /** Full-screen bonus scene (not board modal) */
    fullScene?: boolean;
    buyMode?: boolean;
}
export interface BonusPickFields {
    selectedVaultIndex: number;
    winningVaultIndex: number;
    payout: number;
    multiplierBook: number;
}
