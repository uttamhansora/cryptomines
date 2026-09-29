export interface BoardViewCell {
  index: number;
  state: 'hidden' | 'safe' | 'mine';
  symbol?: string;
  /** Post-loss disclosure tile (not player-picked). */
  ghost?: boolean;
}

export type GamePhase = 'idle' | 'playing' | 'vaultBonus' | 'terminal';

export interface PlayerSnapshot {
  multiplierBook: number;
  chainBonusBook: number;
  safePicks: number;
  chainStreak: number;
  chainProgress: string[];
  vaultTokensCollected: number;
  inVaultBonus: boolean;
  vault?: unknown;
  buyMode: boolean;
  terminal: boolean;
  payoutBook: number;
  cells: BoardViewCell[];
  mineCount: number;
}
