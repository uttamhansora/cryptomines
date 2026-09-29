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

export function applyEventToSnapshot(snap: PlayerSnapshot, ev: GameEvent): void {
  const type = String(ev.type).toLowerCase();
  if (type === 'reveal') {
    const rt = String(ev.revealType ?? '');
    if (rt === 'roundStart' || rt === 'boardReady') {
      if (typeof ev.mineCount === 'number') snap.mineCount = ev.mineCount;
      if (ev.buyVault) snap.buyMode = true;
    }
    if (rt === 'tileSafe' && typeof ev.cellIndex === 'number') {
      const next = [...snap.cells];
      next[ev.cellIndex] = {
        ...next[ev.cellIndex],
        state: 'safe',
        symbol: String(ev.symbol ?? ''),
        ghost: false,
      };
      snap.cells = next;
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
    }
    if (rt === 'tileMine' && typeof ev.cellIndex === 'number') {
      const next = [...snap.cells];
      next[ev.cellIndex] = { ...next[ev.cellIndex], state: 'mine', ghost: false };
      snap.cells = next;
      snap.terminal = true;
      snap.payoutBook = 0;
    }
    if (rt === 'tileFinal' && typeof ev.cellIndex === 'number') {
      const next = [...snap.cells];
      applyFinalCell(next, ev.cellIndex, String(ev.finalState ?? 'mine'), ev.symbol as string | undefined);
      snap.cells = next;
    }
  }
  if (type === 'multiplierupdate') {
    if (typeof ev.multiplierBook === 'number') snap.multiplierBook = ev.multiplierBook;
    if (typeof ev.chainBonusBook === 'number') snap.chainBonusBook = ev.chainBonusBook;
    if (typeof ev.chainStreak === 'number') snap.chainStreak = ev.chainStreak;
    if (ev.source === 'vaultBonus' || ev.source === 'vaultPick') snap.inVaultBonus = false;
  }
  if (type === 'enterbonus') {
    snap.inVaultBonus = true;
    snap.vault = ev.vault;
  }
  if (type === 'settotalwin' && typeof ev.amount === 'number') snap.payoutBook = ev.amount;
  if (type === 'finalwin' && typeof ev.amount === 'number') {
    snap.payoutBook = ev.amount;
    snap.terminal = true;
  }
}

export function snapshotFromEvents(events: GameEvent[]): PlayerSnapshot {
  const snap = emptySnapshot();
  for (const ev of events) applyEventToSnapshot(snap, ev);
  return snap;
}

/** True when every cell is resolved (loss disclosure complete). */
export function isBoardFullyRevealed(snap: PlayerSnapshot): boolean {
  return snap.cells.every((c) => c.state !== 'hidden');
}
