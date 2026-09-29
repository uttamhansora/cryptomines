import type { CryptoSymbolId } from '@crypto-mines/shared';
import { CHAIN_DEFINITIONS } from '@crypto-mines/shared';

export function updateChainProgress(
  progress: CryptoSymbolId[],
  symbol: CryptoSymbolId,
): { progress: CryptoSymbolId[]; completedId?: string; boostBook?: number } {
  const next = [...progress, symbol].slice(-3);
  for (const def of CHAIN_DEFINITIONS) {
    if (next.length === 3 && def.sequence.every((s, i) => next[i] === s)) {
      return { progress: [], completedId: def.id, boostBook: def.boostBook };
    }
  }
  return { progress: next };
}
