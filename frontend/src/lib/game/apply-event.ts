import type { GameEvent } from '@crypto-mines/shared';
import type { BoardViewCell, PlayerSnapshot } from './snapshot.js';

export function createEmptyCells(): BoardViewCell[] {
  return Array.from({ length: 25 }, (_, index) => ({
    index,
    state: 'hidden' as const,
  }));
}

export function emptySnapshot(): PlayerSnapshot {
  return {
    multiplierBook: 100,
    chainBonusBook: 0,
    safePicks: 0,
    chainStreak: 0,
    chainProgress: [],
    vaultTokensCollected: 0,
    inVaultBonus: false,
    buyMode: false,
    terminal: false,
    payoutBook: 0,
    cells: createEmptyCells(),
    mineCount: 5,
  };
}

function applyFinalCell(next: BoardViewCell[], cellIndex: number, finalState: string, symbol?: string): void {
  if (finalState === 'mine') {
    next[cellIndex] = { ...next[cellIndex], state: 'mine', ghost: true };
  } else {
    next[cellIndex] = {
      ...next[cellIndex],
      state: 'safe',
      symbol: String(symbol ?? ''),
      ghost: true,
    };
  }
}

/**
 * Apply a WHOLE delta of events to the snapshot in one pass.
 *
 * Cell-array copies are coalesced: a loss disclosure emits up to ~24 `tileFinal`
 * events at once — the per-event variant previously rebuilt the entire 25-cell
 * array AND every cell object 24 times before Svelte ever rendered. Now the
 * board is copied once per batch and only the touched cells get new objects, so
 * untouched Tile components keep referentially identical props and Svelte skips
 * re-rendering them entirely.
 */
export function applyEventsToSnapshot(snap: PlayerSnapshot, events: readonly GameEvent[]): void {
  let cellsCopy: BoardViewCell[] | null = null;
  const cellTarget = (): BoardViewCell[] => {
    if (!cellsCopy) {
      cellsCopy = [...snap.cells];
      snap.cells = cellsCopy;
    }
    return cellsCopy;
  };

  for (const ev of events) {
    const type = String(ev.type).toLowerCase();
    if (type === 'reveal') {
      const rt = String(ev.revealType ?? '');
      if (rt === 'roundStart' || rt === 'boardReady') {
        if (typeof ev.mineCount === 'number') snap.mineCount = ev.mineCount;
        if (ev.buyVault) snap.buyMode = true;
      }
      if (rt === 'tileSafe' && typeof ev.cellIndex === 'number') {
        const next = cellTarget();
        next[ev.cellIndex] = {
          ...next[ev.cellIndex],
          state: 'safe',
          symbol: String(ev.symbol ?? ''),
          ghost: false,
        };
        if (typeof ev.picksSafe === 'number') snap.safePicks = ev.picksSafe;
        if (typeof ev.chainStreak === 'number') snap.chainStreak = ev.chainStreak;
        if (typeof ev.vaultTokensCollected === 'number') {
          snap.vaultTokensCollected = ev.vaultTokensCollected;
        }
        if (Array.isArray(ev.chainProgress)) {
          snap.chainProgress = ev.chainProgress.map(String);
        }
        if (typeof ev.multiplierBook === 'number') snap.multiplierBook = ev.multiplierBook;
        if (typeof ev.chainBonusBook === 'number') snap.chainBonusBook = ev.chainBonusBook;
      } else if (rt === 'tileMine' && typeof ev.cellIndex === 'number') {
        const next = cellTarget();
        next[ev.cellIndex] = { ...next[ev.cellIndex], state: 'mine', ghost: false };
        snap.terminal = true;
        snap.payoutBook = 0;
      } else if (rt === 'tileFinal' && typeof ev.cellIndex === 'number') {
        applyFinalCell(cellTarget(), ev.cellIndex, String(ev.finalState ?? 'mine'), ev.symbol as string | undefined);
      }
      continue;
    }
    if (type === 'multiplierupdate') {
      if (typeof ev.multiplierBook === 'number') snap.multiplierBook = ev.multiplierBook;
      if (typeof ev.chainBonusBook === 'number') snap.chainBonusBook = ev.chainBonusBook;
      if (typeof ev.chainStreak === 'number') snap.chainStreak = ev.chainStreak;
      if (ev.source === 'vaultBonus' || ev.source === 'vaultPick') snap.inVaultBonus = false;
      continue;
    }
    if (type === 'enterbonus') {
      snap.inVaultBonus = true;
      snap.vault = ev.vault;
      continue;
    }
    if (type === 'settotalwin' && typeof ev.amount === 'number') snap.payoutBook = ev.amount;
    else if (type === 'finalwin' && typeof ev.amount === 'number') {
      snap.payoutBook = ev.amount;
      snap.terminal = true;
    }
  }
}

export function applyEventToSnapshot(snap: PlayerSnapshot, ev: GameEvent): void {
  applyEventsToSnapshot(snap, [ev]);
}

export function snapshotFromEvents(events: GameEvent[]): PlayerSnapshot {
  const snap = emptySnapshot();
  // One batched pass — one board copy instead of one per event.
  applyEventsToSnapshot(snap, events);
  return snap;
}

/** True when every cell is resolved (loss disclosure complete). */
export function isBoardFullyRevealed(snap: PlayerSnapshot): boolean {
  return snap.cells.every((c) => c.state !== 'hidden');
}
