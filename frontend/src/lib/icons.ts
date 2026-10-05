/**
 * Central icon registry — single source of truth for all game & UI icons.
 * All assets are custom, locally-authored SVGs under src/assets/icons.
 * Importing through Vite gives hashed, cache-busted URLs in the build output.
 */
// NOTE: paths are relative to THIS file (src/lib/icons.ts) -> ../assets/icons
import bitcoin from '../assets/icons/bitcoin.svg';
import ethereum from '../assets/icons/ethereum.svg';
import tether from '../assets/icons/tether.svg';
import solana from '../assets/icons/solana.svg';
import diamond from '../assets/icons/diamond.svg';
import vault from '../assets/icons/vault.svg';
import mine from '../assets/icons/mine.svg';
import mines from '../assets/icons/mines.svg';
import chain from '../assets/icons/chain.svg';
import multiplier from '../assets/icons/multiplier.svg';
import bet from '../assets/icons/bet.svg';
import trophy from '../assets/icons/trophy.svg';
import balance from '../assets/icons/balance.svg';
import sound from '../assets/icons/sound.svg';
import mute from '../assets/icons/mute.svg';
import info from '../assets/icons/info.svg';
import close from '../assets/icons/close.svg';
import minus from '../assets/icons/minus.svg';
import plus from '../assets/icons/plus.svg';
import cashout from '../assets/icons/cashout.svg';
import play from '../assets/icons/play.svg';
import refresh from '../assets/icons/refresh.svg';
import warning from '../assets/icons/warning.svg';

export const ICONS = {
  bitcoin,
  ethereum,
  tether,
  solana,
  diamond,
  vault,
  mine,
  mines,
  chain,
  multiplier,
  bet,
  trophy,
  balance,
  sound,
  mute,
  info,
  close,
  minus,
  plus,
  cashout,
  play,
  refresh,
  warning,
} as const;

export type IconName = keyof typeof ICONS;

/** Maps a board cell symbol (game payload) to an icon name. */
const SYMBOL_TO_ICON: Record<string, IconName> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  USDT: 'tether',
  DIAMOND: 'diamond',
  VAULT: 'vault',
  MINE: 'mine',
};

export function symbolIcon(symbol: string | null | undefined): IconName | null {
  if (!symbol) return null;
  return SYMBOL_TO_ICON[symbol.toUpperCase()] ?? null;
}

/**
 * Resolve an icon NAME (registry key, e.g. "bitcoin") to its actual imported
 * SVG asset URL. Returns undefined for unknown names so callers can detect a
 * mapping failure instead of silently rendering <img src="bitcoin">.
 */
export function iconSrc(name: string | null | undefined): string | undefined {
  if (!name) return undefined;
  return ICONS[name as IconName];
}

/**
 * One-shot game-symbol → asset-URL resolution. This is the ONLY sanctioned way
 * to feed an <img src> from board data. Never put a raw symbol or icon name in
 * a src attribute directly.
 */
export function symbolAsset(symbol: string | null | undefined): string | undefined {
  return iconSrc(symbolIcon(symbol));
}

/**
 * Warm the browser's image cache for every glyph that can appear inside a
 * board tile, so the first reveal of any symbol never triggers a network
 * fetch/decode at click time (zero-latency icon rendering). Safe to call more
 * than once — subsequent calls hit the HTTP cache; decode() additionally warms
 * the SVG raster cache off the main thread where supported.
 */
let iconsPreloaded = false;
export function preloadGameIcons(): void {
  if (iconsPreloaded || typeof document === 'undefined') return;
  iconsPreloaded = true;
  const names: IconName[] = [
    'bitcoin', 'ethereum', 'solana', 'tether', 'diamond', 'vault', 'mine',
  ];
  for (const n of names) {
    const url = ICONS[n];
    if (!url) continue;
    const img = new Image();
    img.decoding = 'sync';
    img.fetchPriority = 'high';
    img.src = url;
    if (typeof img.decode === 'function') img.decode().catch(() => {});
  }
}
