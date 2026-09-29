import type { GameEvent } from '@crypto-mines/shared';
import { playSound, type SoundId } from '../sound/sound-manager.js';

export function soundsForDelta(delta: GameEvent[]): SoundId[] {
  const ids: SoundId[] = [];
  for (const ev of delta) {
    const type = String(ev.type).toLowerCase();
    if (type === 'reveal') {
      const rt = String(ev.revealType ?? '');
      if (rt === 'tileSafe') {
        ids.push(ev.symbol === 'VAULT' ? 'vault' : 'crypto-reveal');
        if (Array.isArray(ev.chainProgress) && ev.chainProgress.length > 0) {
          ids.push('chain-step');
        }
        if (ev.chainCompletedId) ids.push('chain-complete');
      }
      if (rt === 'tileMine') ids.push('mine');
    }
    if (type === 'multiplierupdate') {
      if (ev.source === 'chainStreak' && ev.chainStreakComplete) ids.push('chain-complete');
      else if (ev.source === 'chain' || ev.source === 'chainStreak') ids.push('multiplier-up');
      else if (ev.source === 'vaultBonus') ids.push('bonus-reveal');
      else ids.push('multiplier-up');
    }
    if (type === 'reveal' && ev.chainStreakComplete) ids.push('chain-complete');
    if (type === 'enterbonus') ids.push('bonus-enter');
    if (type === 'finalwin') ids.push('round-end');
  }
  return ids;
}

export function playDeltaSounds(delta: GameEvent[]): void {
  for (const id of soundsForDelta(delta)) playSound(id);
}
