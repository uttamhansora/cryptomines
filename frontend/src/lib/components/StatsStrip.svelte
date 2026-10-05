<script lang="ts">
  /**
   * StatsStrip — compact live telemetry rail that sits directly above the
   * board. Every value is DERIVED from existing game state (no new logic):
   *   profit         = potential win − stake
   *   gems left      = safe tiles still hidden on the board
   *   mines          = configured mine count for the round
   * Tabular numerals + fixed cell widths keep the strip from jittering as
   * numbers tick during a round.
   */
  import Icon from './Icon.svelte';

  interface Props {
    bet: number;
    potential: number;
    safePicks: number;
    mines: number;
    active: boolean;
  }
  let { bet, potential, safePicks, mines, active }: Props = $props();

  const profit = $derived(potential - bet);
  const gemsLeft = $derived(Math.max(0, 25 - mines - safePicks));
</script>

<div class="stats-strip" role="group" aria-label="Round statistics">
  <div class="stat" class:live={active && profit > 0}>
    <span class="k"><Icon name="trophy" size={13} />Profit</span>
    <span class="v num">{profit >= 0 ? '+' : ''}{profit.toFixed(2)}</span>
  </div>
  <span class="sep" aria-hidden="true"></span>
  <div class="stat">
    <span class="k"><Icon name="diamond" size={13} />Gems left</span>
    <span class="v num">{gemsLeft}</span>
  </div>
  <span class="sep" aria-hidden="true"></span>
  <div class="stat">
    <span class="k"><Icon name="mine" size={13} />Mines</span>
    <span class="v num">{mines}</span>
  </div>
</div>

<style>
  .stats-strip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-pill);
    /* glass pill matching the panel system */
    background: linear-gradient(180deg, rgba(16, 24, 40, 0.72), rgba(9, 14, 24, 0.82));
    border: 1px solid var(--border);
    box-shadow: inset 0 1px 0 var(--hairline-top), var(--shadow-sm);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    width: fit-content;
    margin: 0 auto;
  }
  .stat {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 86px; /* fixed-ish width → no layout jitter while ticking */
  }
  .k {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: var(--fs-2xs);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-secondary);
    white-space: nowrap;
  }
  .v {
    font-family: var(--font-display);
    font-size: var(--fs-sm);
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
    margin-left: auto;
  }
  /* positive live profit glows green — instant reward feedback */
  .stat.live .v {
    color: #6ee7b7; /* success-bright — positive live profit glows green */
    text-shadow: 0 0 12px rgba(52, 211, 153, 0.45);
  }
  .sep {
    width: 1px;
    height: 16px;
    background: var(--border);
  }
  @media (max-width: 480px) {
    .stats-strip {
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
    }
    .stat {
      min-width: 64px;
    }
    .k {
      letter-spacing: 0.06em;
    }
  }
</style>
