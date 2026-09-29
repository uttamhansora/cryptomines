import { describe, expect, it } from 'vitest';
import { snapshotFromEvents } from './game/apply-event';
import { PlaybackCoordinator } from './game/playback-coordinator';

describe('playback', () => {
  it('replays identical snapshot hash', async () => {
    const events = [
      { index: 0, type: 'reveal' as const, revealType: 'roundStart', mineCount: 3, boardSize: 25 },
      {
        index: 1,
        type: 'reveal' as const,
        revealType: 'tileSafe',
        cellIndex: 0,
        symbol: 'BTC',
        picksSafe: 1,
        multiplierBook: 120,
        chainProgress: ['BTC'],
      },
      { index: 2, type: 'finalWin' as const, amount: 120 },
    ];
    const a = snapshotFromEvents(events);
    const b = snapshotFromEvents(events);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('incremental ingest preserves prefix', async () => {
    const p = new PlaybackCoordinator();
    const e1 = [
      { index: 0, type: 'reveal' as const, revealType: 'roundStart', mineCount: 3, boardSize: 25 },
    ];
    await p.ingest(e1, { animate: false, reducedMotion: true });
    const e2 = [
      ...e1,
      {
        index: 1,
        type: 'reveal' as const,
        revealType: 'tileSafe',
        cellIndex: 2,
        symbol: 'ETH',
        picksSafe: 1,
        multiplierBook: 110,
        chainProgress: ['ETH'],
      },
    ];
    await p.ingest(e2, { animate: false, reducedMotion: true });
    expect(p.getSnapshot().cells[2].symbol).toBe('ETH');
  });
});
