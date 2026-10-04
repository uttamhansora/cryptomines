<script lang="ts">
  import { fly } from 'svelte/transition';
  import Icon from './Icon.svelte';

  interface Props {
    active: boolean;
    bet: number;
    potential: number;
    minesHit?: number;
    onPlayAgain: () => void;
  }
  let { active, bet, potential, minesHit = 1, onPlayAgain }: Props = $props();
</script>

<svelte:window onkeydown={(e) => active && e.key === 'Escape' && onPlayAgain()} />

{#if active}
  <div class="scrim" role="dialog" aria-modal="true" aria-label="Round lost" data-result-panel in:fly={{ y: 26, duration: 280 }} out:fly={{ y: 14, duration: 180 }}>
  <div class="card">
    <span class="topline" aria-hidden="true"></span>
    <div class="head">
      <span class="badge"><Icon name="mine" size={30} /></span>
      <h2>Round Lost</h2>
      <p class="sub">{minesHit === 1 ? 'Mine hit' : `${minesHit} mines hit`}</p>
    </div>
    <dl class="stats">
      <div><dt>Bet</dt><dd>{bet.toFixed(2)}</dd></div>
      <div><dt>Potential win</dt><dd class="lost">{potential.toFixed(2)}</dd></div>
    </dl>
    <button type="button" class="again" onclick={onPlayAgain}>Play Again</button>
  </div>
  </div>
{/if}

<style>
  .scrim {
    position: fixed;
    inset: 0;
    z-index: 70;
    display: grid;
    place-items: center;
    background: radial-gradient(circle at 50% 40%, rgba(42, 20, 4, 0.5), rgba(0, 0, 0, 0.7));
    backdrop-filter: blur(2px);
  }
  .card {
    width: min(92vw, 340px);
    border-radius: var(--radius-lg);
    padding: 1.1rem 1.1rem 1.2rem;
    text-align: center;
    color: var(--text-primary);
    background: linear-gradient(165deg, #1a1114 0%, #100c0e 55%, #0a0708 100%);
    border: 1px solid rgba(239, 68, 68, 0.4);
    box-shadow:
      0 0 0 1px rgba(239, 68, 68, 0.12),
      0 24px 60px rgba(0, 0, 0, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
    position: relative;
    overflow: hidden;
  }
  .topline {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--danger), transparent);
    animation: topline 2.4s ease-in-out infinite;
  }
  @keyframes topline {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  .head h2 {
    margin: 0.35rem 0 0.1rem;
    font-family: var(--font-display);
    font-size: 1.35rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #fee2e2;
  }
  .sub {
    margin: 0 0 0.8rem;
    font-size: 0.8rem;
    color: var(--text-secondary);
    letter-spacing: 0.06em;
  }
  .badge {
    display: inline-grid;
    place-items: center;
    width: 58px;
    height: 58px;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 35%, rgba(239, 68, 68, 0.2), rgba(20, 8, 10, 0.9) 70%);
    border: 1px solid rgba(239, 68, 68, 0.5);
    box-shadow: 0 0 22px rgba(239, 68, 68, 0.3);
    animation: badge-in 0.4s var(--ease-out-soft);
  }
  @keyframes badge-in {
    0% { transform: scale(0.4); opacity: 0; }
    70% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }
  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin: 0 0 1rem;
  }
  .stats div {
    background: rgba(0, 0, 0, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: var(--radius-sm);
    padding: 0.5rem;
  }
  dt {
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--text-muted);
    margin-bottom: 0.2rem;
  }
  dd {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-variant-numeric: tabular-nums;
  }
  dd.lost {
    color: var(--danger);
    text-decoration: line-through;
    text-decoration-color: rgba(239, 68, 68, 0.5);
  }
  .again {
    width: 100%;
    min-height: 48px;
    border-radius: var(--radius-md);
    border: 1px solid rgba(239, 68, 68, 0.45);
    background: linear-gradient(180deg, #7f1d1d, #450a0a);
    color: #fef2f2;
    font-weight: 700;
    font-size: 0.95rem;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: transform 0.12s, box-shadow 0.2s;
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.4);
  }
  .again:hover {
    box-shadow: 0 0 18px rgba(239, 68, 68, 0.3);
  }
  .again:active {
    transform: scale(0.97);
  }
</style>
