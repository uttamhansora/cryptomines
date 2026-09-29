<script lang="ts">
  import Tile from './Tile.svelte';
  import type { BoardViewCell } from '../game/snapshot';

  interface Props {
    cells: BoardViewCell[];
    disabled: boolean;
    pickingCell: number | null;
    onpick: (index: number) => void;
  }
  let { cells, disabled, pickingCell, onpick }: Props = $props();
</script>

<div class="board-wrap" data-game-board>
  <div class="floor-shadow" aria-hidden="true"></div>
  <div class="board-rim">
    <img class="frame-art" src="./assets/game/board/frame.svg" alt="" aria-hidden="true" />
    <div class="board-inset">
      <div class="board" role="grid" aria-label="Crypto vault grid">
        <div class="mine-flash" data-mine-flash aria-hidden="true"></div>
        <div class="shockwave" data-shockwave aria-hidden="true"></div>
        <div class="vault-portal" data-vault-portal aria-hidden="true"></div>
        {#each cells as cell (cell.index)}
          <Tile
            {cell}
            disabled={disabled || (pickingCell !== null && pickingCell === cell.index)}
            onpick={onpick}
          />
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .board-wrap {
    width: 100%;
    display: flex;
    justify-content: center;
    position: relative;
    padding: var(--space-sm) 0 var(--space-md);
  }
  .floor-shadow {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: min(92%, var(--board-max));
    height: 24px;
    background: radial-gradient(ellipse 80% 100% at 50% 0%, rgba(0, 0, 0, 0.55), transparent 70%);
    pointer-events: none;
  }
  .board-rim {
    position: relative;
    width: min(100%, var(--board-max));
    padding: 10px;
    border-radius: calc(var(--radius-lg) + 4px);
    background: linear-gradient(155deg, rgba(26, 107, 85, 0.22), rgba(8, 12, 10, 0.98));
    border: 1px solid rgba(201, 162, 39, 0.18);
    box-shadow:
      0 16px 40px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
  .frame-art {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    opacity: 0.35;
    pointer-events: none;
    border-radius: inherit;
  }
  .board-inset {
    position: relative;
    padding: var(--space-md);
    border-radius: var(--radius-lg);
    background:
      linear-gradient(180deg, rgba(15, 32, 25, 0.55) 0%, rgba(5, 8, 7, 0.92) 100%),
      radial-gradient(ellipse 80% 60% at 50% 0%, rgba(61, 214, 181, 0.06), transparent 70%);
    border: 1px solid rgba(61, 214, 181, 0.18);
    box-shadow:
      inset 0 12px 32px rgba(0, 0, 0, 0.48),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }
  .board-inset::before {
    content: '';
    position: absolute;
    inset: 8px;
    border-radius: calc(var(--radius-lg) - 4px);
    border: 1px solid rgba(201, 162, 39, 0.08);
    pointer-events: none;
  }
  .board {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: clamp(5px, 1.6vw, 9px);
    position: relative;
    transform: translate3d(0, 0, 0);
  }
  .mine-flash {
    position: absolute;
    inset: 0;
    background: rgba(46, 196, 214, 0.22);
    opacity: 0;
    pointer-events: none;
    border-radius: var(--radius-md);
    z-index: 3;
  }
  .shockwave {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 40%;
    height: 40%;
    margin: -20% 0 0 -20%;
    border-radius: 50%;
    border: 2px solid rgba(61, 214, 181, 0.45);
    opacity: 0;
    pointer-events: none;
    z-index: 4;
  }
  .vault-portal {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 40%;
    height: 40%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1px solid rgba(255, 176, 32, 0.35);
    opacity: 0;
    pointer-events: none;
    z-index: 2;
    box-shadow: 0 0 24px rgba(255, 176, 32, 0.15);
  }
</style>
