<script lang="ts">
  import type { BoardViewCell } from '../game/snapshot';
  import { symbolIcon, ICONS } from '../icons';


  interface Props {
    cell: BoardViewCell;
    disabled: boolean;
    onpick: (index: number) => void;
  }
  let { cell, disabled, onpick }: Props = $props();

  const icon = $derived(cell.state === 'mine' ? ICONS.mine : symbolIcon(cell.symbol));

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
  <span class="tile-well" aria-hidden="true"></span>
  <canvas class="tile-fx" aria-hidden="true"></canvas>
  <span class="tile-inner" class:press={pressing}>
    <span class="tile-bevel" aria-hidden="true"></span>
    <span class="tile-glow" aria-hidden="true"></span>
    <span class="tile-burst" aria-hidden="true"></span>
    {#if cell.state === 'hidden'}
      <span class="back-mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="58%" height="58%">
          <g fill="none" stroke="#3dd6b5" stroke-width="2.2" opacity=".55">
            <polygon points="32,10 52,22 52,42 32,54 12,42 12,22" />
            <polygon points="32,20 43,27 43,37 32,44 21,37 21,27" opacity=".7" />
          </g>
          <circle cx="32" cy="32" r="4.2" fill="#3dd6b5" opacity=".5" />
          <path d="M32 10v10M32 44v10M12 22l9 5M43 27l9-5M12 42l9-5M43 37l9 5" stroke="#d4af5a" stroke-width="1.4" opacity=".35" />
        </svg>
      </span>
    {:else if icon}
      <span class="sym-wrap" class:vault-sym={cell.symbol === 'VAULT'} class:mine-sym={cell.state === 'mine'}>
        <img class="sym" {src} alt={cell.state === 'mine' ? 'Mine' : cell.symbol ?? ''} decoding="async" />
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
    background: #03070a;
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
    transition:
      transform 0.16s var(--ease-out-soft),
      border-color 0.16s ease,
      box-shadow 0.16s ease;
    backface-visibility: hidden;
    border: 1px solid rgba(120, 150, 165, 0.16);
    background: var(--tile-face);
    box-shadow:
      0 3px 0 rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.09),
      inset 0 -6px 12px rgba(0, 0, 0, 0.35);
  }
  .tile:not(:disabled):hover .tile-inner {
    transform: translate3d(0, -3px, 0);
    border-color: rgba(61, 214, 181, 0.4);
    box-shadow:
      0 6px 14px rgba(0, 0, 0, 0.5),
      0 0 16px rgba(61, 214, 181, 0.12),
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
    background: radial-gradient(circle at 50% 30%, var(--glow-emerald), transparent 70%);
  }
  .tile.vault .tile-glow {
    background: radial-gradient(circle at 50% 30%, var(--glow-gold), transparent 70%);
  }
  .tile.mine .tile-glow {
    background: radial-gradient(circle at 50% 50%, rgba(255, 91, 110, 0.45), transparent 72%);
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
    background: radial-gradient(circle, rgba(61, 214, 181, 0.3), transparent 65%);
  }
  .tile.sym-btc .tile-glow,
  .tile.sym-btc .tile-burst {
    background: radial-gradient(circle, rgba(245, 158, 11, 0.42), transparent 68%);
  }
  .tile.sym-eth .tile-glow,
  .tile.sym-eth .tile-burst {
    background: radial-gradient(circle, rgba(120, 170, 230, 0.42), transparent 68%);
  }
  .tile.sym-sol .tile-glow,
  .tile.sym-sol .tile-burst {
    background: radial-gradient(circle, rgba(168, 85, 247, 0.4), transparent 68%);
  }
  .tile.sym-usdt .tile-glow,
  .tile.sym-usdt .tile-burst {
    background: radial-gradient(circle, rgba(52, 211, 153, 0.42), transparent 68%);
  }
  .tile.sym-diamond .tile-glow,
  .tile.sym-diamond .tile-burst {
    background: radial-gradient(circle, rgba(103, 232, 249, 0.45), transparent 68%);
  }
  .tile.sym-vault .tile-glow,
  .tile.sym-vault .tile-burst {
    background: radial-gradient(circle, rgba(212, 175, 90, 0.48), transparent 68%);
  }
  /* unrevealed lid emblem */
  .back-mark {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    opacity: 0.6;
    transition: opacity 0.16s ease;
    pointer-events: none;
  }
  .sym-wrap {
    display: grid;
    place-items: center;
    width: 70%;
    height: 70%;
    animation: sym-in 0.26s var(--ease-out-soft) both;
  }
  .sym {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
  }
  .sym-wrap.vault-sym .sym {
    filter: drop-shadow(0 4px 12px rgba(212, 175, 90, 0.5));
  }
  .sym-wrap.mine-sym .sym {
    filter: drop-shadow(0 4px 14px rgba(255, 91, 110, 0.55));
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
    border-color: rgba(61, 214, 181, 0.38);
    background: linear-gradient(168deg, #14231f 0%, #0a1512 100%);
    box-shadow:
      0 0 0 1px rgba(61, 214, 181, 0.1),
      0 4px 12px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(140, 255, 225, 0.1);
  }
  .tile.mine .tile-inner {
    border-color: rgba(255, 91, 110, 0.55);
    background: linear-gradient(160deg, #241418, #0c0a0c);
    box-shadow:
      0 0 18px rgba(255, 91, 110, 0.25),
      inset 0 1px 0 rgba(255, 160, 170, 0.12);
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
    border-color: rgba(255, 91, 110, 0.28);
  }
  .tile.ghost.safe .tile-inner {
    border-color: rgba(61, 214, 181, 0.12);
  }
  .tile.mine:not(.ghost) .tile-inner {
    z-index: 2;
  }
</style>
