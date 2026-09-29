<script lang="ts">
  import { BUY_VAULT_COST_MULTIPLIER, CHAIN_STREAK_MAX, VAULT_TOKENS_TO_TRIGGER } from '@crypto-mines/shared';

  interface Props {
    open: boolean;
    onClose: () => void;
  }
  let { open, onClose }: Props = $props();
</script>

{#if open}
  <div class="backdrop" role="presentation" onclick={onClose}></div>
  <aside class="modal" aria-label="Rules">
    <header>
      <h2>Rules</h2>
      <button type="button" onclick={onClose}>Close</button>
    </header>
    <section>
      <h3>How to play</h3>
      <ol>
        <li>Choose your bet and number of mines (1–24).</li>
        <li>Reveal tiles on the 5×5 vault grid.</li>
        <li>Each safe tile increases your multiplier.</li>
        <li>Hit a mine and you lose the round.</li>
        <li>Cash out before a mine to lock in your win.</li>
        <li>Press Space to start a round or cash out when available (desktop).</li>
      </ol>
    </section>
    <section>
      <h3>Crypto Chain</h3>
      <p>
        Each safe reveal advances the chain (1–{CHAIN_STREAK_MAX}). Boosts apply at steps 3 and 5 (authoritative
        events).
      </p>
    </section>
    <section>
      <h3>Crypto Vault Bonus</h3>
      <p>
        Collect {VAULT_TOKENS_TO_TRIGGER} Vault symbols on safe tiles to unlock the full-screen vault bonus with 5
        vaults. Pick one — the server already determined the rewards.
      </p>
    </section>
    <section>
      <h3>Buy Crypto Vault</h3>
      <p>
        Pay {BUY_VAULT_COST_MULTIPLIER}× your base bet to enter the vault bonus immediately (RGS authoritative
        round).
      </p>
    </section>
    <section>
      <h3>RTP &amp; information</h3>
      <p>
        Target RTP ~96% (long-run expectation). Max win 5000× base bet. Buy Vault cost is
        {BUY_VAULT_COST_MULTIPLIER}× base bet. Payouts and results are determined by the Remote Game Server (RGS);
        on-screen animations do not determine settlement.
      </p>
    </section>
    <section>
      <h3>Disclaimer</h3>
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
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-md);
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h2 {
    margin: 0;
    font-family: var(--font-display);
  }
  h3 {
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
    padding-left: 1.1rem;
  }
</style>
