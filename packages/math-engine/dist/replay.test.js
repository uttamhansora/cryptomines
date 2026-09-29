import { describe, expect, it } from 'vitest';
import { createRound, pickCell, pickVault, cashOut, createBuyVaultRound, replayFromEvents } from './round-engine.js';
describe('replay integrity', () => {
    it('normal round events are stable under replayFromEvents', () => {
        let state = createRound({ mineCount: 5, seed: 'replay-normal' });
        for (let i = 0; i < 8; i += 1) {
            const r = pickCell(state, i);
            if (!r.ok)
                break;
            state = r.state;
            if (state.vault && !state.vaultResolved)
                pickVault(state, 1);
            if (state.terminal)
                break;
        }
        if (!state.terminal && state.safePicks > 0)
            cashOut(state);
        expect(replayFromEvents(state.events)).toEqual(state.events);
    });
    it('buy vault round terminal payout matches events', () => {
        let state = createBuyVaultRound({ seed: 'replay-buy' });
        const r = pickVault(state, 2);
        expect(r.ok).toBe(true);
        if (r.ok)
            state = r.state;
        const final = state.events.find((e) => String(e.type).toLowerCase() === 'finalwin');
        expect(final?.amount).toBe(state.payoutBook);
        expect(state.terminal).toBe(true);
    });
});
