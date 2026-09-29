import { describe, expect, it } from 'vitest';
import { handleRgsRequest } from './handler.js';

describe('RGS wallet flow', () => {
  it('authenticate → play → pick (bet/action) → bet/event checkpoint → end-round on win path', async () => {
    const session = `flow-${Date.now()}`;
    const auth = await handleRgsRequest('/wallet/authenticate', 'POST', {
      sessionID: session,
      language: 'en',
    });
    expect(auth.status).toBe(200);
    expect((auth.json as { balance: { amount: number } }).balance.amount).toBeGreaterThan(0);

    const play = await handleRgsRequest('/wallet/play', 'POST', {
      sessionID: session,
      amount: 1_000_000,
      mode: 'base',
      params: { mineCount: 5, mode: 'base' },
    });
    expect(play.status).toBe(200);
    expect((play.json as { round: { active: boolean } }).round.active).toBe(true);

    const pick = await handleRgsRequest('/bet/action', 'POST', {
      sessionID: session,
      action: 'DECISION',
      params: { action: 'pick', cellIndex: 0 },
    });
    expect(pick.status).toBe(200);

    const checkpoint = await handleRgsRequest('/bet/event', 'POST', {
      sessionID: session,
      event: '2',
    });
    expect(checkpoint.status).toBe(200);
    expect((checkpoint.json as { event: string }).event).toBe('2');
  });

  it('zero-win terminal round does not stay active for end-round', async () => {
    const session = `loss-${Date.now()}`;
    await handleRgsRequest('/wallet/authenticate', 'POST', { sessionID: session, language: 'en' });
    await handleRgsRequest('/wallet/play', 'POST', {
      sessionID: session,
      amount: 1_000_000,
      mode: 'base',
      params: { mineCount: 24, mode: 'base' },
    });
    let last: { round: { active: boolean; payoutMultiplier: number } } | null = null;
    for (let i = 0; i < 25; i += 1) {
      const pick = await handleRgsRequest('/bet/action', 'POST', {
        sessionID: session,
        action: 'DECISION',
        params: { action: 'pick', cellIndex: i },
      });
      last = pick.json as typeof last;
      if (!last?.round.active) break;
    }
    expect(last?.round.payoutMultiplier ?? 0).toBe(0);
    expect(last?.round.active).toBe(false);
  });
});

describe('POST /bet/event contract', () => {
  it('accepts valid sessionID + event string', async () => {
    const session = `evt-${Date.now()}`;
    await handleRgsRequest('/wallet/authenticate', 'POST', { sessionID: session, language: 'en' });
    await handleRgsRequest('/wallet/play', 'POST', {
      sessionID: session,
      amount: 1_000_000,
      params: { mineCount: 5, mode: 'base' },
    });
    const res = await handleRgsRequest('/bet/event', 'POST', {
      sessionID: session,
      event: '1',
    });
    expect(res.status).toBe(200);
  });

  it('rejects missing sessionID', async () => {
    const res = await handleRgsRequest('/bet/event', 'POST', { event: '1' });
    expect(res.status).toBe(400);
  });

  it('rejects missing event', async () => {
    const res = await handleRgsRequest('/bet/event', 'POST', { sessionID: 'x' });
    expect(res.status).toBe(400);
  });

  it('rejects legacy game fields (action, cellIndex)', async () => {
    const session = `legacy-${Date.now()}`;
    await handleRgsRequest('/wallet/authenticate', 'POST', { sessionID: session, language: 'en' });
    await handleRgsRequest('/wallet/play', 'POST', {
      sessionID: session,
      amount: 1_000_000,
      params: { mineCount: 5, mode: 'base' },
    });
    const res = await handleRgsRequest('/bet/event', 'POST', {
      sessionID: session,
      action: 'pick',
      cellIndex: 0,
    });
    expect(res.status).toBe(400);
  });

  it('rejects event as object', async () => {
    const session = `obj-${Date.now()}`;
    await handleRgsRequest('/wallet/authenticate', 'POST', { sessionID: session, language: 'en' });
    await handleRgsRequest('/wallet/play', 'POST', {
      sessionID: session,
      amount: 1_000_000,
      params: { mineCount: 5, mode: 'base' },
    });
    const res = await handleRgsRequest('/bet/event', 'POST', {
      sessionID: session,
      event: { type: 'pick' } as unknown as string,
    });
    expect(res.status).toBe(400);
  });
});
