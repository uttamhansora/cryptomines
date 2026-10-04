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
    <span class="rim-sheen" aria-hidden="true"></span>
    <span class="corner tl" aria-hidden="true"></span>
    <span class="corner tr" aria-hidden="true"></span>
    <span class="corner bl" aria-hidden="true"></span>
    <span class="corner br" aria-hidden="true"></span>
    <div class="board-inset">
      <div class="grid-lines" aria-hidden="true"></div>
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
    width: min(94%, calc(var(--board-max) + 28px));
    height: 30px;
    background: radial-gradient(ellipse 80% 100% at 50% 0%, rgba(0, 0, 0, 0.6), transparent 70%);
    pointer-events: none;
  }
  /* metallic outer frame */
  .board-rim {
    position: relative;
    width: min(100%, var(--board-max));
    padding: 12px;
    border-radius: 20px;
    background: var(--metal-frame);
    border: 1px solid rgba(251, 113, 133, 0.22);
    box-shadow:
      0 24px 60px rgba(0, 0, 0, 0.6),
      0 4px 14px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(0, 0, 0, 0.6);
  }
  .rim-sheen {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: linear-gradient(
      115deg,
      transparent 18%,
      rgba(255, 255, 255, 0.06) 38%,
      rgba(255, 255, 255, 0.1) 46%,
      rgba(255, 255, 255, 0.06) 54%,
      transparent 74%
    );
  }
  .corner {
    position: absolute;
    width: 14px;
    height: 14px;
    border-color: rgba(251, 113, 133, 0.55);
    border-style: solid;
    border-width: 0;
    pointer-events: none;
  }
  .corner.tl { top: 5px; left: 5px; border-top-width: 2px; border-left-width: 2px; border-top-left-radius: 14px; }
  .corner.tr { top: 5px; right: 5px; border-top-width: 2px; border-right-width: 2px; border-top-right-radius: 14px; }
  .corner.bl { bottom: 5px; left: 5px; border-bottom-width: 2px; border-left-width: 2px; border-bottom-left-radius: 14px; }
  .corner.br { bottom: 5px; right: 5px; border-bottom-width: 2px; border-right-width: 2px; border-bottom-right-radius: 14px; }
  /* inner playfield */
  .board-inset {
    position: relative;
    padding: clamp(8px, 2.4vw, 14px);
    border-radius: 12px;
    background:
      radial-gradient(ellipse 90% 70% at 50% -10%, rgba(239, 68, 68, 0.07), transparent 65%),
      linear-gradient(180deg, #1a0f11 0%, #090705 100%);
    border: 1px solid rgba(239, 68, 68, 0.16);
    box-shadow:
      inset 0 14px 34px rgba(0, 0, 0, 0.55),
      inset 0 0 0 1px rgba(0, 0, 0, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
    overflow: hidden;
  }
  /* faint crypto-grid texture */
  .grid-lines {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.5;
    background-image:
      linear-gradient(rgba(239, 68, 68, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(239, 68, 68, 0.05) 1px, transparent 1px);
    background-size: 26px 26px;
    mask-image: radial-gradient(ellipse 75% 70% at 50% 45%, #000 20%, transparent 78%);
  }
  .board {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: clamp(6px, 1.8vw, 10px);
    position: relative;
    transform: translate3d(0, 0, 0);
  }
  .mine-flash {
    position: absolute;
    inset: 0;
    background: rgba(239, 68, 68, 0.22);
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
    border: 2px solid rgba(239, 68, 68, 0.45);
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
    border: 1px solid rgba(251, 113, 133, 0.4);
    opacity: 0;
    pointer-events: none;
    z-index: 2;
    box-shadow: 0 0 24px rgba(251, 113, 133, 0.16);
  }
</style>
