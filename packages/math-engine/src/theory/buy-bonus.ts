import {
  BOOK_SCALE,
  BUY_VAULT_COST_MULTIPLIER,
  VAULT_BUY_CHEST_PAYOUT_BOOK,
} from '@crypto-mines/shared';

/** Expected payout book when player picks a uniform random chest (buy mode). */
export function expectedBuyVaultPayoutBookRandomChest(): number {
  const vals = VAULT_BUY_CHEST_PAYOUT_BOOK;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function theoreticalBuyBonusRtp(normalizedBet = 1): {
  buyCost: number;
  expectedPayout: number;
  buyRtp: number;
  payoutConvention: string;
  chestDistribution: { payoutBook: number; payoutTimesBet: number; probability: number }[];
} {
  const buyCost = normalizedBet * BUY_VAULT_COST_MULTIPLIER;
  const chestDistribution = VAULT_BUY_CHEST_PAYOUT_BOOK.map((payoutBook) => ({
    payoutBook,
    payoutTimesBet: payoutBook / BOOK_SCALE,
    probability: 1 / VAULT_BUY_CHEST_PAYOUT_BOOK.length,
  }));
  const expectedPayoutBook = expectedBuyVaultPayoutBookRandomChest();
  const expectedPayout = (normalizedBet * expectedPayoutBook) / BOOK_SCALE;
  const buyRtp = expectedPayout / buyCost;
  return {
    buyCost,
    expectedPayout,
    buyRtp,
    payoutConvention:
      'Buy chest values are absolute payoutBook multiples of base bet (win = bet × payoutBook / 100).',
    chestDistribution,
  };
}
