import { describe, expect, it } from 'vitest';
import { createRound, pickCell, cashOut, pickVault } from './round-engine.js';
import { MAX_WIN_MULTIPLIER, BOOK_SCALE } from '@crypto-mines/shared';
describe('round-engine', () => {
    it('deterministic mine layout from seed', () => {
        const a = createRound({ mineCount: 5, seed: 'test-seed-1' });
        const b = createRound({ mineCount: 5, seed: 'test-seed-1' });
        expect([...a.mineCells].sort()).toEqual([...b.mineCells].sort());
    });
    it('replay produces identical event stream', () => {
        let state = createRound({ mineCount: 3, seed: 'replay' });
        const picks = [0, 1, 2, 3, 4];
        for (const p of picks) {
            const r = pickCell(state, p);
            if (!r.ok)
                break;
            state = r.state;
            if (state.terminal)
                break;
        }
        const first = JSON.stringify(state.events);
        let state2 = createRound({ mineCount: 3, seed: 'replay' });
        for (const p of picks) {
            const r = pickCell(state2, p);
            if (!r.ok)
                break;
            state2 = r.state;
            if (state2.terminal)
                break;
        }
        expect(JSON.stringify(state2.events)).toBe(first);
    });
    it('cashout respects max win cap', () => {
        let state = createRound({ mineCount: 1, seed: 'cap-test' });
        for (const cell of state.symbolByCell.keys()) {
            if (state.revealed.has(cell))
                continue;
            const r = pickCell(state, cell);
            if (!r.ok)
                break;
            state = r.state;
            if (state.vault && !state.vaultResolved)
                pickVault(state, 0);
            if (state.terminal)
                break;
        }
        if (!state.terminal && state.safePicks > 0) {
            const co = cashOut(state);
            expect(co.ok).toBe(true);
            if (co.ok) {
                expect(co.state.payoutBook).toBeLessThanOrEqual(MAX_WIN_MULTIPLIER * BOOK_SCALE);
            }
        }
    });
});
