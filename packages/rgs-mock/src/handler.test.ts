import { describe, expect, it } from 'vitest';
import { BOOK_SCALE, BUY_VAULT_COST_MULTIPLIER } from '@crypto-mines/shared';
import { handleRgsRequest } from './handler.js';

describe('RGS handler math parity', () => {
  it('buy vault debits 50× bet and credits payout on vault pick', async () => {
    const session = `test-buy-${Date.now()}`;
    const auth = await handleRgsRequest('/wallet/authenticate', 'POST', { sessionID: session });
    const startBal = (auth.json as { balance: { amount: number } }).balance.amount;
    const bet = BOOK_SCALE;
    const play = await handleRgsRequest('/wallet/play', 'POST', {
      sessionID: session,
      amount: bet,
      params: { mode: 'buyVault', mineCount: 5 },
    });
    expect(play.status).toBe(200);
    const afterPlay = (play.json as { balance: { amount: number } }).balance.amount;
    expect(afterPlay).toBe(startBal - bet * BUY_VAULT_COST_MULTIPLIER);
    const pick = await handleRgsRequest('/bet/action', 'POST', {
      sessionID: session,
      action: 'DECISION',
      params: { action: 'vaultPick', vaultIndex: 0 },
    });
    expect(pick.status).toBe(200);
    const body = pick.json as { balance: { amount: number } };
    expect(body.balance.amount).toBeGreaterThan(afterPlay);
  });
});
