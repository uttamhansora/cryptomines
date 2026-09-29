import { capMultiplierBook } from './multipliers.js';

/** Authoritative round payout in book units (win = bet × book / 100). */
export function computePayoutBook(state: {
  multiplierBook: number;
  chainBonusBook: number;
  vaultResolved: boolean;
  vaultPayoutBook: number;
}): number {
  const baseComponent = state.vaultResolved ? state.vaultPayoutBook : state.multiplierBook;
  return capMultiplierBook(baseComponent + state.chainBonusBook);
}
