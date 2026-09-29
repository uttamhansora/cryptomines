<script lang="ts">
  interface Props {
    chainStreak: number;
    vaultTokens: number;
  }
  let { chainStreak, vaultTokens }: Props = $props();
</script>

<section class="features" aria-label="Bonus features">
  <article>
    <h3>Crypto Chain</h3>
    <p>Each safe reveal fills the chain (1–5). Complete step 5 for a multiplier boost.</p>
    <span class="stat">{chainStreak} / 5</span>
  </article>
  <article>
    <h3>Crypto Vault Bonus</h3>
    <p>Collect 3 Vault symbols on safe tiles to unlock the full vault bonus game.</p>
    <span class="stat">{vaultTokens} / 3 Vault symbols</span>
  </article>
</section>

<style>
  .features {
    display: grid;
    gap: var(--space-sm);
    font-size: 0.72rem;
  }
  article {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
  }
  h3 {
    margin: 0 0 0.25rem;
    font-size: 0.68rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--highlight);
  }
  p {
    margin: 0 0 0.35rem;
    color: var(--text-secondary);
    line-height: 1.35;
  }
  .stat {
    font-family: var(--font-display);
    color: var(--accent-primary);
    font-size: 0.75rem;
  }
</style>
