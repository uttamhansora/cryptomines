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
