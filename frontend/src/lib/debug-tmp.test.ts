import { describe, it } from 'vitest';
import { betRangeFromConfig, snapBetDisplayToConfig, type WalletConfig } from './rgs';
import { API_SCALE } from '@crypto-mines/shared';

function mockConfig(): WalletConfig {
  return {
    minBet: API_SCALE / 10, maxBet: 100 * API_SCALE, stepBet: API_SCALE / 10, minStep: API_SCALE / 10,
    defaultBetLevel: 1, betLevels: [API_SCALE / 10, API_SCALE, 5 * API_SCALE, 10 * API_SCALE],
  };
}
describe('debug', () => {
  it('prints', () => {
    const cfg = { ...mockConfig(), betLevels: [] as number[] };
    console.log('NO-LADDER 47.55 ->', JSON.stringify(betRangeFromConfig(cfg, 47.55)));
    console.log('LADDER 0.05 ->', JSON.stringify(betRangeFromConfig(mockConfig(), 0.05)));
    console.log('LADDER 3.2 ->', JSON.stringify(betRangeFromConfig(mockConfig(), 3.2)));
    console.log('SNAP 47.55 noloadder ->', snapBetDisplayToConfig(47.55, cfg));
  });
});
