import { describe, expect, it } from 'vitest';
import { CELL_COUNT } from '@crypto-mines/shared';
import { createRound, pickCell } from './round-engine.js';
describe('loss board disclosure', () => {
    it('emits authoritative tileFinal events for all remaining cells on mine hit', () => {
        let state = createRound({ mineCount: 5, seed: 'loss-disclosure-v1' });
        let hit = false;
        for (let i = 0; i < CELL_COUNT && !hit; i += 1) {
            const before = state.revealed.size;
            const r = pickCell(state, i);
            expect(r.ok).toBe(true);
            if (!r.ok)
                break;
            state = r.state;
            const mineEv = state.events.find((e) => e.revealType === 'tileMine');
            if (mineEv) {
                hit = true;
                const finals = state.events.filter((e) => e.revealType === 'tileFinal');
                expect(finals.length).toBe(CELL_COUNT - state.revealed.size);
                for (const f of finals) {
                    expect(typeof f.cellIndex).toBe('number');
                    expect(['mine', 'safe']).toContain(f.finalState);
                    if (f.finalState === 'safe')
                        expect(f.symbol).toBeTruthy();
                }
            }
        }
        expect(hit).toBe(true);
    });
    it('replay event stream is deterministic for mine loss', () => {
        const run = () => {
            let state = createRound({ mineCount: 3, seed: 'loss-replay' });
            for (let i = 0; i < CELL_COUNT; i += 1) {
                const r = pickCell(state, i);
                if (!r.ok)
                    break;
                state = r.state;
                if (state.terminal)
                    break;
            }
            return JSON.stringify(state.events);
        };
        expect(run()).toBe(run());
    });
});
