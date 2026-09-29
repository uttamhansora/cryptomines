export const GRID_SIZE = 5;
export const CELL_COUNT = GRID_SIZE * GRID_SIZE;
export const MIN_MINES = 1;
export const MAX_MINES = 24;
export const TARGET_RTP = 0.96;
export const RTP_SIGNOFF_TOLERANCE = 0.002;
/** Book / math multiplier scale (Stake) */
export const BOOK_SCALE = 100;
/** API wallet scale (Stake) */
export const API_SCALE = 1_000_000;
/** Max win as multiplier (book scale = this * 100) */
export const MAX_WIN_MULTIPLIER = 5000;
export const GAME_ID = 'crypto-mines';
export const GAME_VERSION = '1.0.0';
export const DEFAULT_MODE = 'base';
export const CHAIN_STREAK_MAX = 5;
/**
 * Phase 5D — Chain streak rewards are separate bonus book units (NOT added to base multiplierBook).
 * Unlocked at safe pick 3 / 5; claimed on cashout with base (+ vault component if resolved).
 */
/** Separate chain bonus @ pick 3 (0.05× bet) — does not modify base multiplierBook. */
export const CHAIN_STREAK_REWARD_PICK3_BOOK = 5;
/** Additional chain bonus @ pick 5 (0.05× bet). */
export const CHAIN_STREAK_REWARD_PICK5_INCREMENTAL_BOOK = 5;
export const VAULT_TOKENS_TO_TRIGGER = 3;
export const VAULT_CHEST_COUNT = 5;
/** Cost to buy vault bonus = base bet × this multiplier */
export const BUY_VAULT_COST_MULTIPLIER = 50;
/**
 * Buy Vault chest payouts in BOOK_SCALE units = payout × base bet.
 * Example: 4800 → 48.00× base bet win (cost is 50× → 96% buy RTP at uniform pick).
 * Organic in-round vault uses VAULT_ORGANIC_CHEST_FACTOR_BOOK (multiplicative on current mult).
 */
export const VAULT_BUY_CHEST_PAYOUT_BOOK = [4000, 4400, 4800, 5200, 5600];
/** Organic vault: multiplicative factors (÷ BOOK_SCALE) applied to current multiplierBook */
export const VAULT_ORGANIC_CHEST_FACTOR_BOOK = [110, 125, 150, 175, 200];
/** Win tier thresholds (display multiplier) */
export const WIN_TIER_GOOD = 3;
export const WIN_TIER_BIG = 10;
export const WIN_TIER_MEGA = 50;
export const CRYPTO_SYMBOLS = [
    'BTC',
    'ETH',
    'SOL',
    'USDT',
    'DIAMOND',
    'VAULT',
];
/** Ordered chain definitions: completing last symbol in sequence applies boost (book scale %) */
/** Symbol sequence rewards — separate chainBonusBook (Phase 5D calibrated). */
export const CHAIN_DEFINITIONS = [
    { id: 'alpha', sequence: ['BTC', 'ETH', 'SOL'], boostBook: 4 },
    { id: 'beta', sequence: ['ETH', 'SOL', 'USDT'], boostBook: 5 },
    { id: 'gamma', sequence: ['SOL', 'USDT', 'DIAMOND'], boostBook: 6 },
];
