import { createHash } from 'node:crypto';
import {
  BOOK_SCALE,
  BUY_VAULT_COST_MULTIPLIER,
  CELL_COUNT,
  CHAIN_DEFINITIONS,
  CHAIN_STREAK_MAX,
  CHAIN_STREAK_REWARD_PICK3_BOOK,
  CHAIN_STREAK_REWARD_PICK5_INCREMENTAL_BOOK,
  GAME_VERSION,
  MAX_WIN_MULTIPLIER,
  TARGET_RTP,
  VAULT_CHEST_COUNT,
  VAULT_TOKENS_TO_TRIGGER,
  VAULT_BUY_CHEST_PAYOUT_BOOK,
  VAULT_ORGANIC_CHEST_FACTOR_BOOK,
} from '@crypto-mines/shared';
import { RTP_BASE_SURVIVAL, RTP_CHAIN, RTP_VAULT } from '../multipliers.js';
import { SYMBOL_WEIGHTS } from '../symbols.js';

export function mathConfigurationPayload(mineCount = 5): Record<string, unknown> {
  return {
    gameVersion: GAME_VERSION,
    mineCount,
    cellCount: CELL_COUNT,
    bookScale: BOOK_SCALE,
    targetRtp: TARGET_RTP,
    maxWinMultiplier: MAX_WIN_MULTIPLIER,
    rtpBaseSurvival: RTP_BASE_SURVIVAL,
    rtpChainBudget: RTP_CHAIN,
    rtpVaultBudget: RTP_VAULT,
    chainStreakMax: CHAIN_STREAK_MAX,
    chainStreakRewardPick3Book: CHAIN_STREAK_REWARD_PICK3_BOOK,
    chainStreakRewardPick5IncrementalBook: CHAIN_STREAK_REWARD_PICK5_INCREMENTAL_BOOK,
    vaultTokensToTrigger: VAULT_TOKENS_TO_TRIGGER,
    vaultChestCount: VAULT_CHEST_COUNT,
    vaultBuyChestPayoutBook: [...VAULT_BUY_CHEST_PAYOUT_BOOK],
    vaultOrganicChestFactorBook: [...VAULT_ORGANIC_CHEST_FACTOR_BOOK],
    buyVaultCostMultiplier: BUY_VAULT_COST_MULTIPLIER,
    chainDefinitions: CHAIN_DEFINITIONS,
    symbolWeights: SYMBOL_WEIGHTS,
  };
}

export function mathConfigurationHash(mineCount = 5): string {
  const json = JSON.stringify(mathConfigurationPayload(mineCount));
  return createHash('sha256').update(json).digest('hex').slice(0, 16);
}
