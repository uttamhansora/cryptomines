<script lang="ts">
  import { CHAIN_STREAK_MAX } from '@crypto-mines/shared';

  interface Props {
    chainStreak: number;
    pulseGen?: number;
  }
  let { chainStreak, pulseGen = 0 }: Props = $props();
  const steps = Array.from({ length: CHAIN_STREAK_MAX }, (_, i) => i + 1);
</script>

<section class="chain" aria-label="Crypto Chain" data-chain-meter class:pulse={pulseGen > 0}>
  <div class="head">
    <div>
      <h3>Crypto Chain</h3>
      <p>Safe picks in a row charge the chain.</p>
    </div>
    <span class="count">{chainStreak} / {CHAIN_STREAK_MAX}</span>
  </div>
  <div class="track">
    {#each steps as step, i}
      <div class="link" class:lit={step <= chainStreak}>
        <span class="dot" class:active={step <= chainStreak} class:next={step === chainStreak + 1}></span>
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
    background: linear-gradient(180deg, var(--surface-elevated), var(--surface));
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    position: relative;
    overflow: hidden;
  }
  .chain.pulse {
    animation: chain-pulse 0.45s ease-out;
  }
  @keyframes chain-pulse {
    0% {
      box-shadow: 0 0 0 rgba(46, 230, 214, 0);
    }
    40% {
      box-shadow: 0 0 0 2px rgba(46, 230, 214, 0.35);
    }
    100% {
      box-shadow: 0 0 0 rgba(46, 230, 214, 0);
    }
  }
  .head {
    display: flex;
    justify-content: space-between;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
  }
  h3 {
    margin: 0;
    font-size: 0.68rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-primary);
  }
  .head p {
    margin: 0.15rem 0 0;
    font-size: 0.65rem;
    color: var(--text-secondary);
  }
  .count {
    font-family: var(--font-display);
    color: var(--highlight);
    white-space: nowrap;
  }
  .track {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0;
  }
  .link {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
  }
  .dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid rgba(138, 155, 176, 0.45);
    background: #0a1018;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
    transition:
      border-color 0.2s,
      box-shadow 0.2s,
      background 0.2s;
  }
  .dot.active {
    border-color: var(--highlight);
    background: radial-gradient(circle at 35% 30%, #5fffe8, #157a72);
    box-shadow:
      0 0 12px rgba(61, 214, 181, 0.5),
      0 0 5px rgba(201, 162, 39, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }
  .dot.next {
    border-color: var(--highlight);
    animation: dot-next 1.2s ease-in-out infinite;
  }
  @keyframes dot-next {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.12);
    }
  }
  .wire {
    flex: 1;
    height: 3px;
    margin: 0 2px;
    border-radius: 2px;
    background: rgba(138, 155, 176, 0.2);
    position: relative;
    overflow: hidden;
  }
  .wire.lit {
    background: rgba(46, 230, 214, 0.25);
  }
  .wire.lit::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(46, 230, 214, 0.85), transparent);
    animation: energy-slide 1.4s linear infinite;
  }
  @keyframes energy-slide {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(100%);
    }
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
    background: rgba(7, 11, 16, 0.72);
  }
  .energy {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(circle at 50% 50%, rgba(46, 230, 214, 0.12), transparent 65%);
    opacity: 0;
  }
</style>
