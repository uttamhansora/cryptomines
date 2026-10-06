<script lang="ts">
  import Icon from './Icon.svelte';

  interface Props {
    chainStreak: number;
    vaultTokens: number;
  }
  let { chainStreak, vaultTokens }: Props = $props();
</script>

<section class="features" aria-label="Bonus features">
  <article id="crypto-chain" class="pod">
    <div class="head">
      <Icon name="chain" size={18} />
      <h3>Crypto Chain</h3>
      <span class="stat">{chainStreak} / 5</span>
    </div>
    <!-- Segmented indicator pod: one cell per chain step, lit cells = progress -->
    <div class="segments" role="img" aria-label={`Crypto chain progress: ${chainStreak} of 5 steps complete`}>
      {#each [1, 2, 3, 4, 5] as step}
        <span class="seg" class:lit={step <= chainStreak} class:next={step === chainStreak + 1}></span>
      {/each}
    </div>
    <p>Each safe reveal fills the chain (1–5). Complete step 5 for a multiplier boost.</p>
  </article>
  <article id="crypto-vault" class="pod">
    <div class="head">
      <Icon name="vault" size={18} />
      <h3>Crypto Vault Bonus</h3>
      <span class="stat">{vaultTokens} / 3</span>
    </div>
    <!-- Collectible slots pod: filled slots glow violet as vault tokens land -->
    <div class="segments segments-vault" role="img" aria-label={`Vault bonus progress: ${vaultTokens} of 3 tokens collected`}>
      {#each [1, 2, 3] as slot}
        <span class="seg seg-slot" class:lit={slot <= vaultTokens}>
          <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
            <path d="M12 3l7 3v6c0 4.2-3 7.4-7 9-4-1.6-7-4.8-7-9V6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
          </svg>
        </span>
      {/each}
    </div>
    <p>Collect 3 Vault symbols on safe tiles to unlock the full vault bonus game.</p>
  </article>
</section>

<style>
  .features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--space-sm);
    font-size: 0.72rem;
  }
  article {
    background: linear-gradient(165deg, rgba(16, 21, 31, 0.85), rgba(9, 14, 22, 0.95));
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }
  /* HUD pod chrome: cyan scan line + industrial corner ticks */
  .pod {
    position: relative;
    scroll-margin-top: 80px; /* anchor offset under the sticky-ish header */
  }
  .pod::before {
    content: '';
    position: absolute;
    top: 0;
    left: 14%;
    right: 14%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.4), transparent);
    pointer-events: none;
  }
  .pod::after {
    content: '';
    position: absolute;
    top: 6px;
    left: 6px;
    width: 8px;
    height: 8px;
    border-top: 1px solid rgba(34, 211, 238, 0.5);
    border-left: 1px solid rgba(34, 211, 238, 0.5);
    pointer-events: none;
  }
  /* ── Segmented status pods (chain steps / vault slots) ─────────────── */
  .segments {
    display: flex;
    gap: 0.3rem;
    margin: 0.1rem 0 0.45rem;
  }
  .seg {
    flex: 1;
    height: 10px;
    border-radius: 3px;
    background: linear-gradient(180deg, rgba(30, 42, 61, 0.9), rgba(12, 17, 26, 0.95));
    border: 1px solid rgba(112, 132, 165, 0.22);
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.55);
    transition: box-shadow 0.2s var(--ease-out-soft), border-color 0.2s, opacity 0.2s;
  }
  .seg.lit {
    border-color: rgba(34, 211, 238, 0.7);
    background: linear-gradient(180deg, #a5f3fc, #0891b2 70%);
    box-shadow:
      0 0 10px rgba(34, 211, 238, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.35);
  }
  .seg.next {
    border-color: rgba(34, 211, 238, 0.45);
    animation: seg-next-pulse 1.3s ease-in-out infinite;
  }
  @keyframes seg-next-pulse {
    0%, 100% { box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.55), 0 0 0 rgba(34, 211, 238, 0); }
    50% { box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.55), 0 0 8px rgba(34, 211, 238, 0.35); }
  }
  @media (prefers-reduced-motion: reduce) {
    .seg.next { animation: none; }
  }
  .segments-vault {
    gap: 0.45rem;
  }
  .seg-slot {
    flex: 0 0 auto;
    display: grid;
    place-items: center;
    width: 26px;
    height: 22px;
    border-radius: 5px;
    color: var(--text-muted);
  }
  .seg-slot.lit {
    border-color: rgba(167, 139, 250, 0.75);
    background: linear-gradient(180deg, #c4b5fd, #6d28d9 75%);
    box-shadow:
      0 0 10px rgba(139, 92, 246, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
    color: #160b2e;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin-bottom: 0.25rem;
  }
  h3 {
    margin: 0;
    flex: 1;
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--highlight);
  }
  p {
    margin: 0;
    color: var(--text-secondary);
    line-height: 1.35;
  }
  .stat {
    font-family: var(--font-display);
    color: var(--accent-primary);
    font-size: 0.75rem;
    white-space: nowrap;
  }
</style>
