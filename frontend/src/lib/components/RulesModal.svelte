<script lang="ts">
  import { BUY_VAULT_COST_MULTIPLIER, CHAIN_STREAK_MAX, VAULT_TOKENS_TO_TRIGGER } from '@crypto-mines/shared';
  import Icon from './Icon.svelte';

  interface Props {
    open: boolean;
    onClose: () => void;
  }
  let { open, onClose }: Props = $props();

  const steps = [
    'Choose your bet and number of mines (1–24).',
    'Reveal tiles on the 5×5 vault grid.',
    'Each safe tile increases your multiplier.',
    'Hit a mine and you lose the round.',
    'Cash out before a mine to lock in your win.',
    'Press Space to start a round or cash out when available (desktop).',
  ];
</script>

{#if open}
  <div class="backdrop" role="presentation" onclick={onClose}></div>
  <aside class="modal" role="dialog" aria-modal="true" aria-label="Rules">
    <header>
      <h2>
        <Icon name="info" size={20} />
        Rules
      </h2>
      <button type="button" class="close" aria-label="Close rules" onclick={onClose}>
        <Icon name="close" size={18} />
      </button>
    </header>

    <section>
      <h3>How to play</h3>
      <ol>
        {#each steps as text, i}
          <li><span class="num">{i + 1}</span>{text}</li>
        {/each}
      </ol>
    </section>

    <section>
      <h3>
        <Icon name="chain" size={16} />
        Crypto Chain
      </h3>
      <p>
        Each safe reveal advances the chain (1–{CHAIN_STREAK_MAX}). Boosts apply at steps 3 and 5 (authoritative
        events).
      </p>
    </section>

    <section>
      <h3>
        <Icon name="vault" size={16} />
        Crypto Vault Bonus
      </h3>
      <p>
        Collect {VAULT_TOKENS_TO_TRIGGER} Vault symbols on safe tiles to unlock the full-screen vault bonus with 5
        vaults. Pick one — the server already determined the rewards.
      </p>
    </section>

    <section>
      <h3>
        <Icon name="vault" size={16} />
        Buy Crypto Vault
      </h3>
      <p>
        Pay {BUY_VAULT_COST_MULTIPLIER}× your base bet to enter the vault bonus immediately (RGS authoritative
        round).
      </p>
    </section>

    <section>
      <h3>
        <Icon name="trophy" size={16} />
        RTP &amp; information
      </h3>
      <p>
        Target RTP ~96% (long-run expectation). Max win 5000× base bet. Buy Vault cost is
        {BUY_VAULT_COST_MULTIPLIER}× base bet. Payouts and results are determined by the Remote Game Server (RGS);
        on-screen animations do not determine settlement.
      </p>
    </section>

    <section>
      <h3>
        <Icon name="warning" size={16} />
        Disclaimer
      </h3>
      <p>
        Malfunction voids all pays and plays. A stable connection is required; if interrupted, reload to resume an
        active round when offered by the server. RTP is a statistical average over many rounds, not a guarantee for a
        single session.
      </p>
    </section>
  </aside>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    z-index: 90;
  }
  .modal {
    position: fixed;
    z-index: 95;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(92vw, 420px);
    max-height: 85vh;
    overflow: auto;
    background: linear-gradient(180deg, var(--surface-elevated), var(--surface));
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-md);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.55);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-sm);
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid var(--border);
  }
  h2 {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    margin: 0;
    font-family: var(--font-display);
    letter-spacing: 0.08em;
  }
  .close {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    background: var(--surface);
    transition: border-color 0.15s, transform 0.1s ease;
  }
  .close:hover {
    border-color: rgba(37, 99, 235, 0.5);
  }
  .close:active {
    transform: scale(0.94);
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin: 0 0 0.3rem;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--highlight);
  }
  section {
    margin-top: var(--space-md);
    font-size: 0.8rem;
    color: var(--text-secondary);
    line-height: 1.45;
  }
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  ol li {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }
  .num {
    flex-shrink: 0;
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    font-family: var(--font-display);
    font-size: 0.62rem;
    color: var(--bg-primary);
    background: linear-gradient(160deg, var(--accent-secondary), var(--blue-light));
  }
  p {
    margin: 0;
  }
</style>
