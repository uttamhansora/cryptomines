export declare const GRID_SIZE = 5;
export declare const CELL_COUNT: number;
export declare const MIN_MINES = 1;
export declare const MAX_MINES = 24;
export declare const TARGET_RTP = 0.96;
export declare const RTP_SIGNOFF_TOLERANCE = 0.002;
/** Book / math multiplier scale (Stake) */
export declare const BOOK_SCALE = 100;
/** API wallet scale (Stake) */
export declare const API_SCALE = 1000000;
/** Max win as multiplier (book scale = this * 100) */
export declare const MAX_WIN_MULTIPLIER = 5000;
export declare const GAME_ID = "crypto-mines";
export declare const GAME_VERSION = "1.0.0";
export declare const DEFAULT_MODE = "base";
export declare const CHAIN_STREAK_MAX = 5;
/**
 * Phase 5D — Chain streak rewards are separate bonus book units (NOT added to base multiplierBook).
 * Unlocked at safe pick 3 / 5; claimed on cashout with base (+ vault component if resolved).
 */
/** Separate chain bonus @ pick 3 (0.05× bet) — does not modify base multiplierBook. */
export declare const CHAIN_STREAK_REWARD_PICK3_BOOK = 5;
/** Additional chain bonus @ pick 5 (0.05× bet). */
export declare const CHAIN_STREAK_REWARD_PICK5_INCREMENTAL_BOOK = 5;
export declare const VAULT_TOKENS_TO_TRIGGER = 3;
export declare const VAULT_CHEST_COUNT = 5;
/** Cost to buy vault bonus = base bet × this multiplier */
export declare const BUY_VAULT_COST_MULTIPLIER = 50;
/**
 * Buy Vault chest payouts in BOOK_SCALE units = payout × base bet.
 * Example: 4800 → 48.00× base bet win (cost is 50× → 96% buy RTP at uniform pick).
 * Organic in-round vault uses VAULT_ORGANIC_CHEST_FACTOR_BOOK (multiplicative on current mult).
 */
export declare const VAULT_BUY_CHEST_PAYOUT_BOOK: readonly [4000, 4400, 4800, 5200, 5600];
/** Organic vault: multiplicative factors (÷ BOOK_SCALE) applied to current multiplierBook */
export declare const VAULT_ORGANIC_CHEST_FACTOR_BOOK: readonly [110, 125, 150, 175, 200];
/** Win tier thresholds (display multiplier) */
export declare const WIN_TIER_GOOD = 3;
export declare const WIN_TIER_BIG = 10;
export declare const WIN_TIER_MEGA = 50;
export type CryptoSymbolId = 'BTC' | 'ETH' | 'SOL' | 'USDT' | 'DIAMOND' | 'VAULT';
export declare const CRYPTO_SYMBOLS: CryptoSymbolId[];
/** Ordered chain definitions: completing last symbol in sequence applies boost (book scale %) */
/** Symbol sequence rewards — separate chainBonusBook (Phase 5D calibrated). */
export declare const CHAIN_DEFINITIONS: {
    id: string;
    sequence: CryptoSymbolId[];
    boostBook: number;
}[];
