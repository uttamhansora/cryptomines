import { describe, expect, it } from 'vitest';
import { BOOK_SCALE, MAX_WIN_MULTIPLIER, TARGET_RTP, RTP_SIGNOFF_TOLERANCE } from '@crypto-mines/shared';
import { buildDepthCashoutWithStreakTable } from './theory/streak-chain-economics.js';
import { RTP_BASE_SURVIVAL } from './multipliers.js';
import { maxWinPathAudit, stackingSummary } from './theory/stacking-audit.js';
import { theoreticalBuyBonusRtp } from './theory/buy-bonus.js';

describe('Phase 5C theoretical audit', () => {
  it('base-only cashout at depth 1 matches target RTP within rounding', () => {
    const rows = buildDepthCashoutWithStreakTable(5, TARGET_RTP);
    const d1 = rows.find((r) => r.depth === 1)!;
    expect(d1.chainBonusBook).toBe(0);
    expect(Math.abs(d1.theoreticalRtpIfCashHere - RTP_BASE_SURVIVAL)).toBeLessThan(0.02);
  });

  it('depth 5 with separate chain bonus stays within RTP cap (Phase 5D)', () => {
    const rows = buildDepthCashoutWithStreakTable(5, TARGET_RTP);
    const d5 = rows.find((r) => r.depth === 5)!;
    expect(d5.theoreticalRtpIfCashHere).toBeLessThanOrEqual(TARGET_RTP + RTP_SIGNOFF_TOLERANCE);
  });

  it('buy bonus theoretical RTP is 96%', () => {
    const buy = theoreticalBuyBonusRtp(1);
    expect(buy.buyRtp).toBeCloseTo(0.96, 5);
  });

  it('max win paths stay at or below cap', () => {
    const audit = maxWinPathAudit(5);
    expect(audit.maxBook).toBeLessThanOrEqual(MAX_WIN_MULTIPLIER * BOOK_SCALE);
    expect(audit.buyMaxBook).toBeLessThanOrEqual(MAX_WIN_MULTIPLIER * BOOK_SCALE);
  });

  it('stacking grid respects target after chain separation', () => {
    const sum = stackingSummary(5, TARGET_RTP);
    const cap = TARGET_RTP + RTP_SIGNOFF_TOLERANCE;
    const streakOnly = sum.pathsAboveTarget.filter(
      (p) => !p.includesVault && !p.id.includes('Symbol'),
    );
    const ladderRoundingSlack = 0.001;
    for (const path of streakOnly) {
      expect(path.theoreticalRtp).toBeLessThanOrEqual(cap + ladderRoundingSlack);
    }
  });
});
