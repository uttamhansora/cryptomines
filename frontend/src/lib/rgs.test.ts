import { describe, expect, it } from 'vitest';
import {
  normalizeRgsBaseUrl,
  normalizeWalletConfig,
  parseBalance,
  extractRoundEvents,
  logLaunchDiagnostics,
  roundProgressEventString,
} from './rgs';
import type { GameEvent } from '@crypto-mines/shared';

describe('RGS URL normalization', () => {
  it('prepends https to hostname-only rgs_url', () => {
    expect(normalizeRgsBaseUrl('rgs.stake-engine.com')).toBe('https://rgs.stake-engine.com');
  });

  it('strips trailing slashes and /wallet suffix', () => {
    expect(normalizeRgsBaseUrl('https://rgs.example.com/wallet/')).toBe('https://rgs.example.com');
  });

  it('parses Stake balance object', () => {
    expect(parseBalance({ amount: 1_000_000, currency: 'USD' }).amount).toBe(1_000_000);
  });

  it('normalizes minStep alias to stepBet', () => {
    const cfg = normalizeWalletConfig({ minBet: 100, maxBet: 1000, minStep: 50, betLevels: [100] });
    expect(cfg.stepBet).toBe(50);
    expect(cfg.minStep).toBe(50);
  });

  it('roundProgressEventString prefers server round.event', () => {
    const events = [{ index: 2, type: 'reveal' }] as GameEvent[];
    expect(roundProgressEventString(events, '5')).toBe('5');
  });

  it('extractRoundEvents accepts round.state as event array', () => {
    const events = [{ index: 0, type: 'reveal' }] as GameEvent[];
    expect(extractRoundEvents({ active: true, state: events })).toEqual(events);
  });

  it('logLaunchDiagnostics does not throw', () => {
    expect(() =>
      logLaunchDiagnostics({ rgs_url: 'rgs.example.com', sessionID: 'x', lang: 'en', device: 'desktop' }),
    ).not.toThrow();
  });

  it('roundProgressEventString uses max bookEvent index', () => {
    const events = [
      { index: 0, type: 'reveal' },
      { index: 4, type: 'finalWin', amount: 0 },
    ] as GameEvent[];
    expect(roundProgressEventString(events)).toBe('4');
  });
});

import { betRangeFromConfig, snapBetDisplayToConfig } from './rgs';
import type { WalletConfig } from './rgs';
import { API_SCALE } from '@crypto-mines/shared';

/** Wallet config exactly as served by packages/rgs-mock /wallet/authenticate. */
function mockConfig(): WalletConfig {
  return {
    minBet: API_SCALE / 10, // 0.1
    maxBet: 100 * API_SCALE, // 100
    stepBet: API_SCALE / 10, // 0.1
    minStep: API_SCALE / 10,
    defaultBetLevel: 1,
    betLevels: [API_SCALE / 10, API_SCALE, 5 * API_SCALE, 10 * API_SCALE], // 0.1, 1, 5, 10
  };
}

/** True when `display` lands on the wallet step grid inside [minBet, maxBet]. */
function isValidOnStepGrid(display: number, cfg: WalletConfig): boolean {
  const api = Math.round(display * API_SCALE);
  if (api < cfg.minBet || api > cfg.maxBet) return false;
  const step = cfg.stepBet > 0 ? cfg.stepBet : cfg.minStep;
  if (step <= 0) return true;
  const m = api % step;
  return Math.min(m, step - m) <= 1e-3;
}

describe('MIN/MAX bet buttons (regression: unresponsive controls)', () => {
  it('ladder mode: MIN is the lowest rung and survives snapBetDisplayToConfig unchanged', () => {
    const cfg = mockConfig();
    const { min } = betRangeFromConfig(cfg, 100);
    expect(min).toBe(0.1);
    expect(snapBetDisplayToConfig(min, cfg)).toBe(min);
  });

  it('MAX sets the full available balance when it is server-valid; otherwise the largest valid amount below it', () => {
    const cfg = { ...mockConfig(), betLevels: [] as number[] };
    // Balance 47.55 is NOT a multiple of the wallet step (0.1 micro-grid): the strict
    // client gate mirrors `validateBetAmount` (`amount % stepBet === 0`), so MAX must
    // floor to 47.5 instead of offering an amount the server would reject outright.
    const { max } = betRangeFromConfig(cfg, 47.55);
    expect(max).toBeCloseTo(47.5, 10);
    // The App handler pipes every change through snapBetDisplayToConfig — if MAX were
    // rewritten here the button would look dead. It must round-trip exactly.
    expect(snapBetDisplayToConfig(max, cfg)).toBeCloseTo(47.5, 10);
    // A cent-aligned balance that IS a step multiple stays untouched — "wager all I have".
    expect(betRangeFromConfig(cfg, 47.6).max).toBeCloseTo(47.6, 10);
  });

  it('MAX clamps to the configured cap when the balance exceeds it', () => {
    const cfg = { ...mockConfig(), betLevels: [] as number[] };
    expect(betRangeFromConfig(cfg, 250).max).toBe(100);
  });

  it('MAX with a ladder picks the highest affordable rung; never rewrites on snap', () => {
    const cfg = mockConfig();
    for (const balance of [100, 47.55, 3.2, 0.05]) {
      const { min, max } = betRangeFromConfig(cfg, balance);
      expect(snapBetDisplayToConfig(min, cfg)).toBe(min);
      expect(snapBetDisplayToConfig(max, cfg)).toBe(max);
    }
    expect(betRangeFromConfig(cfg, 3.2).max).toBe(1); // between rungs 1 and 5 → floor to 1
    expect(betRangeFromConfig(cfg, 100).max).toBe(10); // ladder top
    // Balance below every rung: the wallet only accepts exact rungs, so MAX stays at
    // the lowest rung (server rejects insufficient funds on start) — never a value
    // above the player's balance that snap would silently rewrite.
    const broke = betRangeFromConfig(cfg, 0.05);
    expect(broke.max).toBe(0.1);
    expect(broke.min).toBe(0.1);
    expect(snapBetDisplayToConfig(broke.max, cfg)).toBe(broke.max);
  });

  it('MIN equals the minimum allowed value (1.00) when the ladder starts at 1.00', () => {
    const cfg = {
      ...mockConfig(),
      minBet: API_SCALE, // 1.00
      betLevels: [API_SCALE, 5 * API_SCALE, 10 * API_SCALE],
    };
    const { min } = betRangeFromConfig(cfg, 100);
    expect(min).toBe(1);
    expect(snapBetDisplayToConfig(min, cfg)).toBe(1);
  });

  it('no-config fallback keeps legacy defaults', () => {
    expect(betRangeFromConfig(null, 500)).toEqual({ min: 0.1, max: 100 });
  });

  it('off-grid requests still snap to a server-valid amount', () => {
    const cfg = { ...mockConfig(), betLevels: [] as number[] };
    const snapped = snapBetDisplayToConfig(47.567, cfg);
    // Nearest multiple of the configured 0.1 step: |47.567 − 47.6| < |47.567 − 47.5|.
    expect(snapped).toBeCloseTo(47.6, 10);
    expect(isValidOnStepGrid(snapped, cfg)).toBe(true);
    // Exact step multiples always round-trip unchanged (no silent rewrite → buttons live).
    for (const v of [0.1, 1, 5, 10, 47.5, 47.6, 99.9, 100]) {
      expect(snapBetDisplayToConfig(v, cfg)).toBe(v);
    }
  });
});
