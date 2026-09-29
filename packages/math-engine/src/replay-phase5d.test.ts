import { describe, expect, it } from 'vitest';
import { createRound, pickCell, pickVault, cashOut, createBuyVaultRound } from './round-engine.js';

describe('Phase 5D replay scenarios', () => {
  it('chain stage 3 cashout is deterministic', () => {
    const play = () => {
      let state = createRound({ mineCount: 1, seed: 'replay-chain-3' });
      const safeCells = [...state.symbolByCell.keys()].filter((c) => !state.mineCells.has(c));
      for (let i = 0; i < 3; i += 1) {
        const r = pickCell(state, safeCells[i]!);
        expect(r.ok).toBe(true);
        if (r.ok) state = r.state;
      }
      cashOut(state);
      return state;
    };
    const a = play();
    const b = play();
    expect(b.payoutBook).toBe(a.payoutBook);
    expect(a.chainBonusBook).toBeGreaterThan(0);
  });

  it('buy vault unchanged', () => {
    let state = createBuyVaultRound({ seed: 'replay-buy-5d' });
    pickVault(state, 2);
    const final = state.events.find((e) => e.type === 'finalWin');
    expect(final?.amount).toBe(state.payoutBook);
  });
});
