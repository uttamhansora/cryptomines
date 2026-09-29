import {
  synthBigWin,
  synthBonusEnter,
  synthBonusReveal,
  synthCashout,
  synthChainComplete,
  synthChainStep,
  synthCryptoReveal,
  synthMine,
  synthMultiplierUp,
  synthRoundEnd,
  synthSafeReveal,
  synthTilePress,
  synthUiClick,
  synthVault,
} from './synth.js';

export type SoundId =
  | 'ui-click'
  | 'tile-press'
  | 'safe-reveal'
  | 'crypto-reveal'
  | 'mine'
  | 'multiplier-up'
  | 'chain-step'
  | 'chain-complete'
  | 'vault'
  | 'bonus-enter'
  | 'bonus-reveal'
  | 'cashout'
  | 'big-win'
  | 'round-end';

const STORAGE_KEY = 'crypto-mines-sound';

let enabled = true;
let volume = 0.65;

function loadSettings(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const p = JSON.parse(raw) as { enabled?: boolean; volume?: number };
    if (typeof p.enabled === 'boolean') enabled = p.enabled;
    if (typeof p.volume === 'number') volume = Math.max(0, Math.min(1, p.volume));
  } catch {
    /* ignore */
  }
}

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled, volume }));
  } catch {
    /* ignore */
  }
}

loadSettings();

export function getSoundSettings(): { enabled: boolean; volume: number } {
  return { enabled, volume };
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  persist();
}

export function setVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v));
  persist();
}

export function playSound(id: SoundId): void {
  if (!enabled || volume <= 0) return;
  switch (id) {
    case 'ui-click':
      synthUiClick(volume);
      break;
    case 'tile-press':
      synthTilePress(volume);
      break;
    case 'safe-reveal':
      synthSafeReveal(volume);
      break;
    case 'crypto-reveal':
      synthCryptoReveal(volume);
      break;
    case 'mine':
      synthMine(volume);
      break;
    case 'multiplier-up':
      synthMultiplierUp(volume);
      break;
    case 'chain-step':
      synthChainStep(volume);
      break;
    case 'chain-complete':
      synthChainComplete(volume);
      break;
    case 'vault':
      synthVault(volume);
      break;
    case 'bonus-enter':
      synthBonusEnter(volume);
      break;
    case 'bonus-reveal':
      synthBonusReveal(volume);
      break;
    case 'cashout':
      synthCashout(volume);
      break;
    case 'big-win':
      synthBigWin(volume);
      break;
    case 'round-end':
      synthRoundEnd(volume);
      break;
    default:
      break;
  }
}
