<script lang="ts">
  import type { BoardViewCell } from '../game/snapshot';

  interface Props {
    cell: BoardViewCell;
    disabled: boolean;
    onpick: (index: number) => void;
  }
  let { cell, disabled, onpick }: Props = $props();

  /** Icons8 Fluency/Color icon set — bundled locally for a consistent style. */
  const ICONS = {
    BTC: 'btc',
    ETH: 'eth',
    SOL: 'sol',
    USDT: 'usdt',
    VAULT: 'vault-symbol',
    DIAMOND: 'diamond',
    MINE: 'mine',
  } as const;

  const symbolIcon = (sym: string | undefined) =>
    sym ? ICONS[sym.toUpperCase() as keyof typeof ICONS] ?? 'btc' : null;

  let pressing = $state(false);

  const symClass = $derived.by(() => {
    const s = (cell.symbol ?? '').toUpperCase();
    if (s === 'BTC') return 'sym-btc';
    if (s === 'ETH') return 'sym-eth';
    if (s === 'SOL') return 'sym-sol';
    if (s === 'USDT') return 'sym-usdt';
    if (s === 'VAULT') return 'sym-vault';
    if (s === 'DIAMOND') return 'sym-diamond';
    return '';
  });

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
  class:vault={cell.symbol === 'VAULT' && cell.state === 'safe'}
  data-tile-index={cell.index}
  data-symbol={cell.symbol ?? ''}
  disabled={disabled || cell.state !== 'hidden'}
  aria-label={cell.state === 'hidden' ? `Reveal tile ${cell.index + 1}` : `Tile ${cell.index + 1}`}
  onpointerdown={handlePointerDown}
  onpointerup={() => (pressing = false)}
  onpointerleave={() => (pressing = false)}
  onclick={handleClick}
>
  <span class="tile-well"></span>
  <canvas class="tile-fx" aria-hidden="true"></canvas>
  <span class="tile-inner" class:press={pressing}>
    <span class="tile-lid" aria-hidden="true"></span>
    <span class="tile-inner-light" aria-hidden="true"></span>
    <span class="tile-glow" aria-hidden="true"></span>
    <span class="tile-burst" aria-hidden="true"></span>
    {#if cell.state === 'hidden'}
      <img class="face back" src="./assets/game/tiles/tile-back.svg" alt="" width="64" height="64" />
    {:else if cell.state === 'mine'}
      <img
        src="./assets/game/ui/icons/mine.png"
        alt="Mine"
        class="sym mine-sym"
        width="56"
        height="56"
        decoding="async"
      />
    {:else if symbolIcon(cell.symbol)}
      <img
        src="./assets/game/ui/icons/{symbolIcon(cell.symbol)}.png"
        alt={cell.symbol ?? ''}
        class="sym"
        class:vault-sym={cell.symbol === 'VAULT'}
        width="56"
        height="56"
        decoding="async"
      />
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
    border-radius: var(--radius-sm);
    position: relative;
    -webkit-tap-highlight-color: transparent;
  }
  .tile:disabled {
    cursor: default;
  }
  .tile-well {
    position: absolute;
    inset: 3px;
    border-radius: 9px;
    background: #040706;
    box-shadow: inset 0 4px 10px var(--shadow-key);
    pointer-events: none;
  }
  .tile-inner {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    border-radius: var(--radius-sm);
    position: relative;
    overflow: hidden;
    transform: translate3d(0, -1px, 0);
    transition: transform 0.14s ease, border-color 0.15s ease;
    backface-visibility: hidden;
    border: 1px solid var(--light-rim);
    background: linear-gradient(165deg, var(--graphite-light) 0%, var(--graphite) 55%, #0a0f0d 100%);
    box-shadow:
      0 2px 0 rgba(0, 0, 0, 0.35),
      inset 0 1px 0 var(--light-key);
  }
  .tile:not(:disabled):hover .tile-inner {
    transform: translate3d(0, -3px, 0);
    border-color: rgba(61, 214, 181, 0.28);
  }
  .tile-inner.press {
    transform: translate3d(0, 2px, 0) scale(0.97);
    box-shadow: inset 0 3px 8px rgba(0, 0, 0, 0.45);
  }
  .tile-inner-light {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    background: radial-gradient(circle at 50% 35%, rgba(94, 236, 196, 0.35), transparent 68%);
  }
  .tile.vault .tile-inner-light {
    background: radial-gradient(circle at 50% 35%, rgba(232, 197, 71, 0.28), transparent 68%);
  }
  .tile-glow {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    background: radial-gradient(circle at 50% 30%, var(--glow-emerald), transparent 70%);
  }
  .tile.vault .tile-glow {
    background: radial-gradient(circle at 50% 30%, var(--glow-gold), transparent 70%);
  }
  .tile.mine .tile-glow {
    background: radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.45), transparent 70%);
    opacity: 0.85;
  }
  .tile-fx {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 5;
  }
  .tile-lid {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(165deg, var(--graphite-light), var(--graphite));
    transform-origin: 50% 0%;
    pointer-events: none;
    opacity: 0;
  }
  .tile-burst {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    background: radial-gradient(circle, rgba(61, 214, 181, 0.28), transparent 65%);
  }
  .tile.sym-btc .tile-glow,
  .tile.sym-btc .tile-burst {
    background: radial-gradient(circle, rgba(245, 158, 11, 0.45), transparent 68%);
  }
  .tile.sym-eth .tile-glow,
  .tile.sym-eth .tile-burst {
    background: radial-gradient(circle, rgba(59, 130, 246, 0.45), transparent 68%);
  }
  .tile.sym-sol .tile-glow,
  .tile.sym-sol .tile-burst {
    background: radial-gradient(circle, rgba(168, 85, 247, 0.45), transparent 68%);
  }
  .tile.sym-usdt .tile-glow,
  .tile.sym-usdt .tile-burst {
    background: radial-gradient(circle, rgba(52, 211, 153, 0.45), transparent 68%);
  }
  .tile.sym-diamond .tile-glow,
  .tile.sym-diamond .tile-burst {
    background: radial-gradient(circle, rgba(103, 232, 249, 0.5), transparent 68%);
  }
  .tile.sym-vault .tile-glow,
  .tile.sym-vault .tile-burst {
    background: radial-gradient(circle, rgba(201, 162, 39, 0.5), transparent 68%);
  }
  .face.back {
    width: 78%;
    height: 78%;
    object-fit: contain;
    pointer-events: none;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45));
  }
  .sym {
    width: 68%;
    height: 68%;
    object-fit: contain;
    pointer-events: none;
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4));
  }
  .sym.vault-sym {
    filter: drop-shadow(0 4px 12px rgba(201, 162, 39, 0.45));
  }
  .mine-sym {
    filter: drop-shadow(0 4px 14px rgba(239, 68, 68, 0.5));
  }
  .tile.revealed.safe .tile-inner {
    border-color: rgba(61, 214, 181, 0.32);
    background: linear-gradient(165deg, #152019 0%, #0a100e 100%);
  }
  .tile.mine .tile-inner {
    border-color: rgba(46, 196, 214, 0.45);
    background: linear-gradient(155deg, #121a18, #0a0f0d);
  }
  .tile.ghost .tile-inner {
    opacity: 0.78;
  }
  .tile.ghost.mine .tile-inner {
    opacity: 0.92;
    border-color: rgba(46, 196, 214, 0.22);
  }
  .tile.ghost.safe .tile-inner {
    border-color: rgba(61, 214, 181, 0.1);
  }
  .tile.mine:not(.ghost) .tile-inner {
    z-index: 2;
  }
</style>
