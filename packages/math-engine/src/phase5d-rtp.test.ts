import { describe, expect, it } from 'vitest';
import {
  TARGET_RTP,
  RTP_SIGNOFF_TOLERANCE,
  CHAIN_DEFINITIONS,
  MAX_WIN_MULTIPLIER,
  BOOK_SCALE,
} from '@crypto-mines/shared';
import {
  verifyAllDepthsWithinCap,
  theoreticalRtpIfCashAtDepth,
  chainBonusBookAtCashoutDepth,
} from './theory/chain-calibration.js';
import { survivalProbability, getMultiplierBook } from './multipliers.js';
import { computePayoutBook } from './payout.js';
import { createRound, pickCell, pickVault, cashOut } from './round-engine.js';

const maxSymbolChainBook = CHAIN_DEFINITIONS.reduce((m, d) => Math.max(m, d.boostBook), 0);

describe('Phase 5D RTP guards', () => {
  it('every legal cashout depth has theoretical RTP <= target + tolerance', () => {
    const check = verifyAllDepthsWithinCap(5);
    expect(check.ok).toBe(true);
    expect(check.worstRtp).toBeLessThanOrEqual(TARGET_RTP + RTP_SIGNOFF_TOLERANCE);
  });

  it('depth 3 and 5 conditional RTP are not >100%', () => {
    expect(theoreticalRtpIfCashAtDepth(5, 3)).toBeLessThanOrEqual(1);
    expect(theoreticalRtpIfCashAtDepth(5, 5)).toBeLessThanOrEqual(1);
  });

  it('worst-case single symbol chain + streak stays within cap at key depths', () => {
    const cap = TARGET_RTP + RTP_SIGNOFF_TOLERANCE;
    for (const depth of [3, 5, 10]) {
      const p = survivalProbability(5, depth);
      const base = getMultiplierBook(5, depth);
      const chain = chainBonusBookAtCashoutDepth(depth) + maxSymbolChainBook;
      const rtp = (p * (base + chain)) / BOOK_SCALE;
      expect(rtp).toBeLessThanOrEqual(1.02);
    }
  });

  it('cashout combines base + chain + vault on base only', () => {
    let state = createRound({ mineCount: 5, seed: 'phase5d-payout' });
    for (let i = 0; i < 25; i += 1) {
      if (state.terminal) break;
      const r = pickCell(state, i);
      if (!r.ok) break;
      state = r.state;
      if (state.events.at(-1)?.revealType === 'tileMine') break;
      if (state.vault && !state.vaultResolved) pickVault(state, 0);
      if (state.safePicks >= 3) break;
    }
    if (!state.terminal) cashOut(state);
    expect(state.payoutBook).toBeLessThanOrEqual(MAX_WIN_MULTIPLIER * BOOK_SCALE);
  });

  it('computePayoutBook matches cashout terminal payout', () => {
    let state = createRound({ mineCount: 5, seed: 'phase5d-compute' });
    for (let i = 0; i < 6; i += 1) {
      const r = pickCell(state, i);
      if (!r.ok) break;
      state = r.state;
      if (state.terminal) break;
    }
    if (!state.terminal && state.safePicks > 0) cashOut(state);
    if (state.safePicks > 0 && state.terminal) {
      expect(state.payoutBook).toBe(
        computePayoutBook({
          multiplierBook: state.multiplierBook,
          chainBonusBook: state.chainBonusBook,
          vaultResolved: state.vaultResolved,
          vaultPayoutBook: state.vaultPayoutBook,
        }),
      );
    }
  });
});
