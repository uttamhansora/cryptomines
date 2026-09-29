import { describe, expect, it } from 'vitest';
import { createRound, pickCell } from '@crypto-mines/math-engine';
import { snapshotFromEvents, isBoardFullyRevealed } from './game/apply-event';

describe('loss reveal (client)', () => {
  it('snapshot fully reveals board from authoritative events only', () => {
    let state = createRound({ mineCount: 5, seed: 'client-loss-v1' });
    for (let i = 0; i < 25; i += 1) {
      const r = pickCell(state, i);
      if (!r.ok) break;
      state = r.state;
      if (state.terminal) break;
    }
    const snap = snapshotFromEvents(state.events);
    expect(isBoardFullyRevealed(snap)).toBe(true);
    expect(snap.cells.filter((c) => c.state === 'hidden').length).toBe(0);
  });

  it('tileFinal cells are marked ghost', () => {
    let state = createRound({ mineCount: 5, seed: 'client-loss-ghost' });
    for (let i = 0; i < 25; i += 1) {
      const r = pickCell(state, i);
      if (!r.ok) break;
      state = r.state;
      if (state.terminal) break;
    }
    const snap = snapshotFromEvents(state.events);
    const ghosts = snap.cells.filter((c) => c.ghost);
    expect(ghosts.length).toBeGreaterThan(0);
  });
});
