import {
  CHAIN_STREAK_REWARD_PICK3_BOOK,
  CHAIN_STREAK_REWARD_PICK5_INCREMENTAL_BOOK,
} from '@crypto-mines/shared';

/** Safe-reveal streak chain — milestones unlock separate chain bonus book (Phase 5D). */
export function applyStreakChain(
  safePicks: number,
  chainBonusBook: number,
): {
  chainStreak: number;
  chainStreakComplete: boolean;
  chainBonusBook: number;
  chainRewardUnlockedBook?: number;
  chainRewardStage?: 3 | 5;
} {
  const chainStreak = Math.min(safePicks, 5);
  let bonus = chainBonusBook;
  let chainRewardUnlockedBook: number | undefined;
  let chainRewardStage: 3 | 5 | undefined;
  let chainStreakComplete = false;

  if (safePicks === 3) {
    bonus += CHAIN_STREAK_REWARD_PICK3_BOOK;
    chainRewardUnlockedBook = CHAIN_STREAK_REWARD_PICK3_BOOK;
    chainRewardStage = 3;
  }
  if (safePicks === 5) {
    bonus += CHAIN_STREAK_REWARD_PICK5_INCREMENTAL_BOOK;
    chainRewardUnlockedBook = CHAIN_STREAK_REWARD_PICK5_INCREMENTAL_BOOK;
    chainRewardStage = 5;
    chainStreakComplete = true;
  }

  return {
    chainStreak,
    chainStreakComplete,
    chainBonusBook: bonus,
    chainRewardUnlockedBook,
    chainRewardStage,
  };
}
