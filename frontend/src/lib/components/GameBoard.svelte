<script lang="ts">
  import Tile from './Tile.svelte';
  import type { BoardViewCell } from '../game/snapshot';

  interface Props {
    cells: BoardViewCell[];
    disabled: boolean;
    /**
     * Cell index awaiting its RGS pick response. Presentation-only affordance:
     * it must NOT feed into `disabled` — gating interaction on the network
     * round-trip is exactly what made rapid tile clicks feel laggy/queued.
     */
    pickingCell: number | null;
    onpick: (index: number) => void;
  }
  let { cells, disabled, pickingCell, onpick }: Props = $props();
  // Stable per-cell handler factory created ONCE for the component's lifetime:
  // no new closures are allocated per snapshot emission / re-render, so tiles
  // keep referentially identical props and Svelte skips their updates entirely
  // when only one cell changed.
  const pickHandlers = new Map<number, () => void>();
  const pickHandlerFor = (index: number): (() => void) => {
    let fn = pickHandlers.get(index);
    if (!fn) {
      fn = () => onpick(index);
      pickHandlers.set(index, fn);
    }
    return fn;
  };
</script>

<div class="board-wrap" data-game-board id="game">
  <div class="floor-shadow" aria-hidden="true"></div>
  <div class="board-rim">
    <span class="rim-sheen" aria-hidden="true"></span>
    <span class="corner tl" aria-hidden="true"></span>
    <span class="corner tr" aria-hidden="true"></span>
    <span class="corner bl" aria-hidden="true"></span>
    <span class="corner br" aria-hidden="true"></span>
    <span class="bolt-bl" aria-hidden="true"></span>
    <span class="bolt-br" aria-hidden="true"></span>
    <div class="board-inset">
      <div class="grid-lines" aria-hidden="true"></div>
      <div class="board" role="grid" aria-label="CryptoMines 5 by 5 grid">
        <div class="mine-flash" data-mine-flash aria-hidden="true"></div>
        <div class="shockwave" data-shockwave aria-hidden="true"></div>
        <div class="vault-portal" data-vault-portal aria-hidden="true"></div>
        {#each cells as cell (cell.index)}
          <Tile
            {cell}
            disabled={disabled}
            onpick={pickHandlerFor(cell.index)}
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
  /* metallic outer frame — THIN compared to the tiles (reference proportion),
     so the tiles fill almost the whole board. Corner bolts kept. */
  .board-rim {
    position: relative;
    width: min(100%, var(--board-max));
    aspect-ratio: 1 / 1;
    margin: 0 auto;
    padding: 12px;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    background: var(--metal-frame);          /* #7f98a3 → #3f5560 → #16262e */
    border: 1px solid rgba(127, 152, 163, 0.35);
    box-shadow:
      0 24px 60px rgba(0, 0, 0, 0.6),
      0 4px 14px rgba(0, 0, 0, 0.5),
      0 0 22px rgba(25, 227, 227, 0.10),     /* subtle cyan aura        */
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      inset 0 -2px 0 rgba(0, 0, 0, 0.55);
  }
  /* four small corner bolts (pure CSS, zero extra DOM) */
  .board-rim::before,
  .board-rim::after {
    content: '';
    position: absolute;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, var(--metal-light), var(--metal-dark) 70%);
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.4), 0 1px 2px rgba(0, 0, 0, 0.7);
    pointer-events: none;
  }
  .board-rim::before { top: 6px; left: 6px; }
  .board-rim::after { top: 6px; right: 6px; }
  .bolt-bl,
  .bolt-br {
    position: absolute;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, var(--metal-light), var(--metal-dark) 70%);
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.4), 0 1px 2px rgba(0, 0, 0, 0.7);
    pointer-events: none;
  }
  .bolt-bl { bottom: 6px; left: 6px; }
  .bolt-br { bottom: 6px; right: 6px; }
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
    border-color: rgba(35, 144, 155, 0.55);
    border-style: solid;
    border-width: 0;
    pointer-events: none;
  }
  .corner.tl { top: 5px; left: 5px; border-top-width: 2px; border-left-width: 2px; border-top-left-radius: 14px; }
  .corner.tr { top: 5px; right: 5px; border-top-width: 2px; border-right-width: 2px; border-top-right-radius: 14px; }
  .corner.bl { bottom: 5px; left: 5px; border-bottom-width: 2px; border-left-width: 2px; border-bottom-left-radius: 14px; }
  .corner.br { bottom: 5px; right: 5px; border-bottom-width: 2px; border-right-width: 2px; border-bottom-right-radius: 14px; }
  /* inner playfield — very dark RECESSED area so tiles read as raised boxes.
     Small padding keeps the tiles filling the frame (reference look). */
  .board-inset {
    position: relative;
    flex: 1;
    padding: 12px;
    border-radius: 12px;
    background: #04141a;
    border: 1px solid rgba(25, 227, 227, 0.16);
    box-shadow:
      inset 0 6px 18px rgba(0, 0, 0, 0.9),
      inset 0 -2px 6px rgba(0, 0, 0, 0.6),
      inset 0 0 0 1px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
  }
  /* faint crypto-grid texture */
  .grid-lines {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.5;
    background-image:
      linear-gradient(rgba(25, 227, 227, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(25, 227, 227, 0.05) 1px, transparent 1px);
    background-size: 26px 26px;
    mask-image: radial-gradient(ellipse 75% 70% at 50% 45%, #000 20%, transparent 78%);
  }
  .board {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    /* Tiles almost touch (gap ≈ 12–14% of tile size) — reference proportion */
    gap: 8px;
    position: relative;
    flex: 1;
    transform: translate3d(0, 0, 0);
    /* leave room at the bottom of each row for the tiles' extruded 3D edge */
    padding-bottom: 6px;
  }
  /* Tablet: slightly smaller board + tighter gaps */
  @media (max-width: 1023px) {
    .board-rim {
      width: min(100%, 520px, 90vw);
    }
    .board {
      gap: 7px;
    }
  }
  /* Phone: full-bleed feel, thin frame, compact gaps */
  @media (max-width: 600px) {
    .board-rim {
      width: min(100%, 94vw);
      padding: 8px;
    }
    .board-inset {
      padding: 8px;
    }
    .board {
      gap: 6px;
    }
  }
  .mine-flash {
    position: absolute;
    inset: 0;
    background: rgba(229, 48, 63, 0.24);
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
    border: 2px solid rgba(229, 48, 63, 0.5);
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
    border: 1px solid rgba(35, 144, 155, 0.4);
    opacity: 0;
    pointer-events: none;
    z-index: 2;
    box-shadow: 0 0 24px rgba(35, 144, 155, 0.16);
  }
</style>
