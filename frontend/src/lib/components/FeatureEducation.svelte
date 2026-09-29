<script lang="ts">
  import Icon from './Icon.svelte';

  interface Props {
    chainStreak: number;
    vaultTokens: number;
  }
  let { chainStreak, vaultTokens }: Props = $props();
</script>

<section class="features" aria-label="Bonus features">
  <article>
    <div class="head">
      <Icon name="chain-link" size={18} />
      <h3>Crypto Chain</h3>
      <span class="stat">{chainStreak} / 5</span>
    </div>
    <p>Each safe reveal fills the chain (1–5). Complete step 5 for a multiplier boost.</p>
  </article>
  <article>
    <div class="head">
      <Icon name="vault-key" size={18} />
      <h3>Crypto Vault Bonus</h3>
      <span class="stat">{vaultTokens} / 3</span>
    </div>
    <p>Collect 3 Vault symbols on safe tiles to unlock the full vault bonus game.</p>
  </article>
</section>

<style>
  .features {
    display: grid;
    gap: var(--space-sm);
    font-size: 0.72rem;
  }
  article {
    background: linear-gradient(165deg, rgba(21, 32, 25, 0.9), rgba(10, 15, 13, 0.95));
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
  }
  .head {
    display: flex;
    align-items: center;
    gap: 0.4rem;
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
