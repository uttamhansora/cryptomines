<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { BoardViewCell } from '../game/snapshot';
  import { symbolIcon, iconSrc } from '../icons';


  interface Props {
    cell: BoardViewCell;
    disabled: boolean;
    onpick: (index: number) => void;
  }
  let { cell, disabled, onpick }: Props = $props();

  /**
   * IMPORTANT: the server's `symbol` field is a free-text flavour string
   * (e.g. "Bitcoin"), NOT the registry key. The canonical CryptoSymbolId
   * (BTC / ETH / SOL / USDT / DIAMOND / VAULT) lives in `data-symbol`, which
   * apply-event.ts always writes uppercase. We normalize defensively here so
   * any casing / naming variant still resolves to a local SVG.
   */
  function normalizeSymbol(raw: string | null | undefined): string {
    const s = String(raw ?? '').toUpperCase().replace(/[^A-Z]/g, '');
    if (!s) return '';
    if (s.startsWith('BTC') || s.startsWith('BITCOIN')) return 'BTC';
    if (s.startsWith('ETH') || s.startsWith('ETHEREUM')) return 'ETH';
    if (s.startsWith('SOL')) return 'SOL';
    if (s.startsWith('USDT') || s.startsWith('TETHER')) return 'USDT';
    if (s.startsWith('DIAMOND')) return 'DIAMOND';
    if (s.startsWith('VAULT')) return 'VAULT';
    if (s.startsWith('MINE')) return 'MINE';
    return s;
  }

  const symId = $derived(normalizeSymbol(cell.symbol));
  // ALWAYS resolve through the registry to an imported SVG asset URL.
  // `icon` can never be a bare name like "bitcoin" — iconSrc() returns the
  // Vite-imported URL (or undefined, in which case no <img> renders at all).
  const icon = $derived(iconSrc(cell.state === 'mine' ? 'mine' : symbolIcon(symId)));

  let pressing = $state(false);

  const symClass = $derived.by(() => {
    switch (symId) {
      case 'BTC': return 'sym-btc';
      case 'ETH': return 'sym-eth';
      case 'SOL': return 'sym-sol';
      case 'USDT': return 'sym-usdt';
      case 'VAULT': return 'sym-vault';
      case 'DIAMOND': return 'sym-diamond';
      default: return '';
    }
  });

  /** True when this tile just flipped open — drives the lid flip + glow settle. */
  let justRevealed = $state(false);
  let revealTimer: ReturnType<typeof setTimeout> | undefined;
  let firstRun = true;
  // Cache the last observed state so this effect performs zero work on every
  // snapshot emission (the parent re-renders all tiles per event; previously
  // each of the 25 tiles ran `cell.state !== 'hidden'` bookkeeping each time).
  let lastState: BoardViewCell['state'] | null = null;
  $effect(() => {
    const revealed = cell.state !== 'hidden';
    if (firstRun) {
      firstRun = false;
      lastState = cell.state;
      // Hydrated/resumed rounds should not replay entrance animations.
      return;
    }
    if (cell.state === lastState) return;
    lastState = cell.state;
    if (revealed && !justRevealed) {
      justRevealed = true;
      clearTimeout(revealTimer);
      revealTimer = setTimeout(() => (justRevealed = false), 700);
    } else if (!revealed) {
      justRevealed = false;
      clearTimeout(revealTimer);
    }
  });
  onDestroy(() => clearTimeout(revealTimer));

  function handleClick() {
    if (import.meta.env.DEV) console.info('[TILE] click', cell.index);
    if (disabled || cell.state !== 'hidden') return;
    onpick(cell.index);
  }

  function handlePointerDown() {
    if (import.meta.env.DEV) console.info('[TILE] pointerdown', cell.index);
    pressing = true;
  }
</script>

<button
  type="button"
  class="tile {symClass}"
  class:revealed={cell.state !== 'hidden'}
  class:safe={cell.state === 'safe'}
  class:mine={cell.state === 'mine'}
  class:ghost={cell.ghost === true}
  class:vault={symId === 'VAULT' && cell.state === 'safe'}
  class:just-revealed={justRevealed}
  data-tile-index={cell.index}
  data-symbol={symId || (cell.symbol ?? '')}
  disabled={disabled || cell.state !== 'hidden'}
  aria-label={cell.state === 'hidden' ? `Reveal tile ${cell.index + 1}` : `Tile ${cell.index + 1}`}
  onpointerdown={handlePointerDown}
  onpointerup={() => (pressing = false)}
  onpointerleave={() => (pressing = false)}
  onclick={handleClick}
>
  <span class="tile-well" aria-hidden="true"></span>
  <canvas class="tile-fx" aria-hidden="true"></canvas>
  <span class="tile-inner" class:press={pressing}>
    <span class="tile-bevel" aria-hidden="true"></span>
    <span class="tile-glow" aria-hidden="true"></span>
    <span class="tile-burst" aria-hidden="true"></span>
    <!-- Lid: the premium Crypto Mines tile back. Stays mounted while revealing so
         GSAP can flip it away; hidden only once fully revealed. -->
    <span class="tile-lid" aria-hidden="true" style:visibility={cell.state === 'hidden' ? 'visible' : 'hidden'}>
      <span class="back-mark">
        <svg viewBox="0 0 64 64" width="58%" height="58%">
          <g fill="none" stroke="#3b82f6" stroke-width="2.2" opacity=".55">
            <polygon points="32,10 52,22 52,42 32,54 12,42 12,22" />
            <polygon points="32,20 43,27 43,37 32,44 21,37 21,27" opacity=".7" />
          </g>
          <circle cx="32" cy="32" r="4.2" fill="#3b82f6" opacity=".5" />
          <path d="M32 10v10M32 44v10M12 22l9 5M43 27l9-5M12 42l9-5M43 37l9 5" stroke="#3b82f6" stroke-width="1.4" opacity=".35" />
        </svg>
      </span>
    </span>
    {#if cell.state !== 'hidden' && icon}
      <span class="sym-wrap" class:vault-sym={symId === 'VAULT'} class:mine-sym={cell.state === 'mine'}>
        <img class="sym" src={icon} alt={cell.state === 'mine' ? 'Mine' : symId} decoding="async" />
      </span>
    {/if}
  </span>
</button>

<style>
  .tile {
    aspect-ratio: 1;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 10px;
    position: relative;
    -webkit-tap-highlight-color: transparent;
  }
  .tile:disabled {
    cursor: default;
  }
  /* the recessed socket each tile sits in — makes the board read as one unit */
  .tile-well {
    position: absolute;
    inset: 2px;
    border-radius: 12px;
    background: #05080d;
    box-shadow:
      inset 0 3px 8px rgba(0, 0, 0, 0.7),
      inset 0 -1px 0 rgba(255, 255, 255, 0.03);
    pointer-events: none;
  }
  .tile-inner {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    border-radius: 10px;
    position: relative;
    overflow: hidden;
    transform: translate3d(0, -1px, 0);
    /* Only compositor-friendly properties animate here. box-shadow/border are
       intentionally NOT transitioned: with GSAP already driving the reveal and
       hover lift per frame, their transitions forced extra paint work during
       gameplay (identical resting appearance, no lost motion). */
    transition: transform 0.16s var(--ease-out-soft);
    backface-visibility: hidden;
    border: 1px solid rgba(112, 132, 165, 0.16);
    background: var(--tile-face);
    box-shadow:
      0 3px 0 rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.09),
      inset 0 -6px 12px rgba(0, 0, 0, 0.35);
  }
  .tile:not(:disabled):hover .tile-inner {
    transform: translate3d(0, -3px, 0);
    border-color: rgba(59, 130, 246, 0.4);
    box-shadow:
      0 6px 14px rgba(0, 0, 0, 0.5),
      0 0 16px rgba(59, 130, 246, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
  }
  .tile:not(:disabled):hover .back-mark {
    opacity: 0.95;
  }
  .tile-inner.press {
    transform: translate3d(0, 2px, 0) scale(0.97);
    box-shadow: inset 0 3px 10px rgba(0, 0, 0, 0.55);
  }
  /* thin top bevel highlight for physical depth */
  .tile-bevel {
    position: absolute;
    inset: 0 0 auto 0;
    height: 42%;
    border-radius: 10px 10px 40% 40%;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.07), transparent 85%);
    pointer-events: none;
  }
  .tile-glow {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    background: radial-gradient(circle at 50% 30%, var(--glow-blue), transparent 70%);
  }
  .tile.vault .tile-glow {
    background: radial-gradient(circle at 50% 30%, var(--glow-hot), transparent 70%);
  }
  .tile.mine .tile-glow {
    background: radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.45), transparent 72%);
    opacity: 0.9;
  }
  .tile-fx {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 5;
  }
  .tile-burst {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.3), transparent 65%);
  }
  .tile.sym-btc .tile-glow,
  .tile.sym-btc .tile-burst {
    background: radial-gradient(circle, rgba(59, 130, 246, 0.42), transparent 68%);
  }
  .tile.sym-eth .tile-glow,
  .tile.sym-eth .tile-burst {
    background: radial-gradient(circle, rgba(147, 197, 253, 0.28), transparent 68%);
  }
  .tile.sym-sol .tile-glow,
  .tile.sym-sol .tile-burst {
    background: radial-gradient(circle, rgba(59, 130, 246, 0.4), transparent 68%);
  }
  .tile.sym-usdt .tile-glow,
  .tile.sym-usdt .tile-burst {
    background: radial-gradient(circle, rgba(96, 165, 250, 0.42), transparent 68%);
  }
  .tile.sym-diamond .tile-glow,
  .tile.sym-diamond .tile-burst {
    background: radial-gradient(circle, rgba(147, 197, 253, 0.45), transparent 68%);
  }
  .tile.sym-vault .tile-glow,
  .tile.sym-vault .tile-burst {
    background: radial-gradient(circle, rgba(37, 99, 235, 0.48), transparent 68%);
  }
  /* unrevealed lid emblem */
  .tile-lid {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    border-radius: inherit;
    z-index: 3;
    transform-style: preserve-3d;
    backface-visibility: hidden;
  }
  .back-mark {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    opacity: 0.6;
    transition: opacity 0.16s ease;
    pointer-events: none;
  }
  /* CSS fallback flip when the tile flips open (GSAP timeline also drives this
     during playback; both are transform/opacity-only and GPU-friendly). */
  .tile.just-revealed .tile-lid {
    animation: lid-flip 0.24s var(--ease-out-soft, cubic-bezier(0.22, 1, 0.36, 1)) both;
  }
  @keyframes lid-flip {
    from { transform: rotateX(0deg); opacity: 1; }
    to { transform: rotateX(-78deg); opacity: 0; }
  }
  .sym-wrap {
    display: grid;
    place-items: center;
    width: 70%;
    height: 70%;
    perspective: 300px;
  }
  .tile.just-revealed .sym-wrap {
    animation: sym-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
  }
  /* one-shot reveal glow: peaks ~250ms then settles — never left glowing forever */
  .tile.just-revealed.safe .tile-glow {
    animation: glow-settle 0.6s ease-out both;
  }
  .tile.just-revealed.mine .tile-glow {
    animation: danger-flash 0.45s ease-out both;
  }
  @keyframes glow-settle {
    0% { opacity: 0; transform: scale(0.85); }
    40% { opacity: 0.6; transform: scale(1.05); }
    100% { opacity: 0.14; transform: scale(1); }
  }
  @keyframes danger-flash {
    0% { opacity: 0; }
    25% { opacity: 1; }
    100% { opacity: 0.55; }
  }
  .sym {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
  }
  .sym-wrap.vault-sym .sym {
    filter: drop-shadow(0 4px 12px rgba(37, 99, 235, 0.5));
  }
  .sym-wrap.mine-sym .sym {
    filter: drop-shadow(0 4px 14px rgba(59, 130, 246, 0.55));
  }
  @keyframes sym-in {
    from {
      opacity: 0;
      transform: scale(0.55) rotateY(70deg);
    }
    60% {
      opacity: 1;
      transform: scale(1.06) rotateY(-8deg);
    }
    to {
      opacity: 1;
      transform: scale(1) rotateY(0deg);
    }
  }
  .tile.revealed.safe .tile-inner {
    border-color: rgba(59, 130, 246, 0.38);
    background: linear-gradient(168deg, #182234 0%, #0a101c 100%);
    box-shadow:
      0 0 0 1px rgba(59, 130, 246, 0.1),
      0 4px 12px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(96, 165, 250, 0.1);
  }
  .tile.mine .tile-inner {
    border-color: rgba(59, 130, 246, 0.55);
    background: linear-gradient(160deg, #141d2c, #0a0f18);
    box-shadow:
      0 0 18px rgba(59, 130, 246, 0.25),
      inset 0 1px 0 rgba(147, 197, 253, 0.12);
    animation: mine-shake 0.3s ease-out;
  }
  @keyframes mine-shake {
    0% { transform: translate3d(0, 0, 0); }
    25% { transform: translate3d(-3px, 1px, 0); }
    50% { transform: translate3d(3px, -1px, 0); }
    75% { transform: translate3d(-2px, 0, 0); }
    100% { transform: translate3d(0, 0, 0); }
  }
  .tile.ghost .tile-inner {
    opacity: 0.8;
  }
  .tile.ghost.mine .tile-inner {
    opacity: 0.92;
    border-color: rgba(59, 130, 246, 0.28);
  }
  .tile.ghost.safe .tile-inner {
    border-color: rgba(59, 130, 246, 0.12);
  }
  .tile.mine:not(.ghost) .tile-inner {
    z-index: 2;
  }
</style>
