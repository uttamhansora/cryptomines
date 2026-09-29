import { describe, expect, it } from 'vitest';
import { BOOK_SCALE, MAX_WIN_MULTIPLIER, VAULT_BUY_CHEST_PAYOUT_BOOK } from '@crypto-mines/shared';
import { createBuyVaultRound, pickVault, createRound, pickCell, cashOut } from './round-engine.js';
import { capMultiplierBook } from './multipliers.js';
import { maxWinPathAudit } from './theory/stacking-audit.js';
import { theoreticalBuyBonusRtp } from './theory/buy-bonus.js';

describe('max win bounds', () => {
  it('buy vault payout book respects global cap', () => {
    const maxBuy = Math.max(...VAULT_BUY_CHEST_PAYOUT_BOOK);
    expect(maxBuy).toBeLessThanOrEqual(MAX_WIN_MULTIPLIER * BOOK_SCALE);
    let maxSeen = 0;
    for (let i = 0; i < 200; i += 1) {
      let s = createBuyVaultRound({ seed: `max-buy-${i}` });
      for (let v = 0; v < 5; v += 1) {
        const r = pickVault(s, v);
        if (r.ok) s = r.state;
        maxSeen = Math.max(maxSeen, s.payoutBook);
      }
    }
    expect(maxSeen).toBe(maxBuy);
  });

  it('theoretical max paths respect global cap', () => {
    const audit = maxWinPathAudit(5);
    expect(audit.maxBook).toBeLessThanOrEqual(MAX_WIN_MULTIPLIER * BOOK_SCALE);
    const buy = theoreticalBuyBonusRtp(1);
    expect(Math.max(...buy.chestDistribution.map((c) => c.payoutBook))).toBeLessThanOrEqual(
      MAX_WIN_MULTIPLIER * BOOK_SCALE,
    );
  });

  it('cashout respects global cap', () => {
    let state = createRound({ mineCount: 1, seed: 'max-base' });
    for (const cell of state.symbolByCell.keys()) {
      if (state.revealed.has(cell)) continue;
      const r = pickCell(state, cell);
      if (!r.ok) break;
      state = r.state;
    }
    if (!state.terminal) cashOut(state);
    expect(state.payoutBook).toBeLessThanOrEqual(MAX_WIN_MULTIPLIER * BOOK_SCALE);
    expect(capMultiplierBook(state.multiplierBook)).toBe(state.multiplierBook);
  });
});
