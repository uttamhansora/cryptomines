<script lang="ts">
  import { CHAIN_STREAK_MAX } from '@crypto-mines/shared';
  import Icon from './Icon.svelte';

  interface Props {
    chainStreak: number;
    pulseGen?: number;
  }
  let { chainStreak, pulseGen = 0 }: Props = $props();
  const steps = Array.from({ length: CHAIN_STREAK_MAX }, (_, i) => i + 1);
</script>

<section class="chain" aria-label="Crypto Chain" data-chain-meter class:pulse={pulseGen > 0}>
  <div class="head">
    <div class="title-wrap">
      <Icon name="chain" size={16} class="title-icon" />
      <h3>Crypto Chain</h3>
    </div>
    <span class="count">{chainStreak}<i>/{CHAIN_STREAK_MAX}</i></span>
  </div>
  <div class="track">
    {#each steps as step, i}
      <div class="link" class:lit={step <= chainStreak} class:current={step === chainStreak + 1}>
        <span class="node" class:active={step <= chainStreak} class:next={step === chainStreak + 1}>
          <span class="node-num">{step}</span>
          <span class="node-core" aria-hidden="true"></span>
        </span>
      </div>
      {#if i < CHAIN_STREAK_MAX - 1}
        <div class="wire" class:lit={step < chainStreak} aria-hidden="true"></div>
      {/if}
    {/each}
  </div>
  <div class="burst" data-chain-burst>Chain Complete!</div>
  <div class="energy" data-chain-energy aria-hidden="true"></div>
</section>

<style>
  .chain {
    background: linear-gradient(180deg, rgba(16, 21, 31, 0.9), rgba(10, 16, 21, 0.95));
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md) 0.85rem;
    position: relative;
    overflow: hidden;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }
  .chain.pulse {
    animation: chain-pulse 0.45s ease-out;
  }
  @keyframes chain-pulse {
    0% { box-shadow: 0 0 0 rgba(0, 240, 255, 0), inset 0 1px 0 rgba(255, 255, 255, 0.04); }
    40% { box-shadow: 0 0 0 2px rgba(0, 240, 255, 0.32), inset 0 0 24px rgba(0, 240, 255, 0.12); }
    100% { box-shadow: 0 0 0 rgba(0, 240, 255, 0), inset 0 1px 0 rgba(255, 255, 255, 0.04); }
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: 0.6rem;
  }
  .title-wrap {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }
  h3 {
    margin: 0;
    font-size: 0.66rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--text-secondary);
    font-weight: 600;
  }
  .count {
    font-family: var(--font-display);
    font-size: 0.95rem;
    color: var(--highlight-soft);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .count i {
    font-style: normal;
    color: var(--text-muted);
    font-size: 0.72rem;
  }
  .track {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .link {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
  }
  .node {
    position: relative;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    border: 1.5px solid rgba(112, 132, 165, 0.3);
    background: radial-gradient(circle at 50% 30%, #0f141d, #080d16);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.6);
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s var(--ease-out-soft);
  }
  .node-num {
    font-size: 0.55rem;
    font-weight: 700;
    color: var(--text-muted);
    transition: color 0.2s;
    z-index: 1;
  }
  .node-core {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    opacity: 0;
    background: radial-gradient(circle at 40% 32%, #9BFBFF, #00D2D3 60%, #003B44);
    transition: opacity 0.2s;
  }
  .node.active {
    border-color: rgba(0, 240, 255, 0.8);
    transform: scale(1.08);
    box-shadow:
      0 0 12px rgba(0, 240, 255, 0.45),
      0 0 4px rgba(0, 240, 255, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
    animation: node-charge 0.35s var(--ease-out-soft);
  }
  .node.active .node-core { opacity: 1; }
  .node.active .node-num { color: #050a14; }
  @keyframes node-charge {
    0% { transform: scale(0.7); filter: brightness(1.8); }
    60% { transform: scale(1.18); }
    100% { transform: scale(1.08); }
  }
  .node.next {
    border-color: rgba(0, 210, 211, 0.6);
    animation: node-next 1.3s ease-in-out infinite;
  }
  @keyframes node-next {
    0%, 100% { box-shadow: inset 0 2px 4px rgba(0,0,0,.6), 0 0 0 rgba(0, 210, 211, 0); }
    50% { box-shadow: inset 0 2px 4px rgba(0,0,0,.6), 0 0 10px rgba(0, 210, 211, .35); }
  }
  .wire {
    flex: 1;
    height: 4px;
    margin: 0 1px;
    border-radius: 2px;
    background: rgba(112, 132, 165, 0.14);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.5);
    position: relative;
    overflow: hidden;
  }
  .wire.lit {
    background: rgba(0, 240, 255, 0.3);
    animation: wire-fill 0.28s var(--ease-out-soft) both;
    transform-origin: left center;
  }
  /* energy travels through the connector as the chain advances */
  @keyframes wire-fill {
    from { transform: scaleX(0.05); filter: brightness(1.9); }
    to { transform: scaleX(1); filter: brightness(1); }
  }
  .wire.lit::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(103, 232, 249, 0.9), transparent);
    animation: energy-slide 1.4s linear infinite;
  }
  @keyframes energy-slide {
    from { transform: translateX(-100%); }
    to { transform: translateX(100%); }
  }
  .burst {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-family: var(--font-display);
    letter-spacing: 0.14em;
    font-size: 0.78rem;
    color: var(--accent-primary);
    opacity: 0;
    pointer-events: none;
    background: rgba(6, 11, 18, 0.78);
  }
  .energy {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at 50% 50%, rgba(0, 240, 255, 0.12), transparent 65%);
    opacity: 0;
  }
</style>
