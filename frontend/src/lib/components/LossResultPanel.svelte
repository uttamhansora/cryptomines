<script lang="ts">
  interface Props {
    active: boolean;
    bet: number;
    potential: number;
    onPlayAgain: () => void;
  }
  let { active, bet, potential, onPlayAgain }: Props = $props();
</script>

{#if active}
  <div class="loss-wrap" role="status" aria-live="polite">
    <div class="card">
      <p class="title">Round Lost</p>
      <p class="sub">Mine Hit</p>
      <dl class="stats">
        <div>
          <dt>Bet</dt>
          <dd>{bet.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Potential Win</dt>
          <dd>{potential.toFixed(2)}</dd>
        </div>
      </dl>
      <button type="button" class="again" onclick={onPlayAgain}>Play Again</button>
    </div>
  </div>
{/if}

<style>
  .loss-wrap {
    position: fixed;
    inset: 0;
    z-index: 95;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: var(--space-lg) var(--space-md) calc(var(--space-xl) + var(--safe-bottom));
    pointer-events: none;
    background: linear-gradient(to top, rgba(5, 8, 12, 0.72) 0%, transparent 45%);
  }
  .card {
    pointer-events: auto;
    width: min(100%, 360px);
    padding: var(--space-md) var(--space-lg);
    border-radius: var(--radius-lg);
    border: 1px solid rgba(46, 196, 214, 0.28);
    background: rgba(8, 12, 10, 0.94);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
    text-align: center;
  }
  .title {
    margin: 0;
    font-family: var(--font-display);
    letter-spacing: 0.12em;
    font-size: 0.85rem;
    color: #ff8a9a;
  }
  .sub {
    margin: 0.25rem 0 0.75rem;
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
    margin: 0 0 var(--space-md);
  }
  dt {
    font-size: 0.65rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  dd {
    margin: 0.15rem 0 0;
    font-family: var(--font-display);
    font-size: 1.05rem;
  }
  .again {
    width: 100%;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: var(--radius-md);
    background: linear-gradient(135deg, rgba(46, 230, 214, 0.25), rgba(46, 230, 214, 0.08));
    color: var(--accent-primary);
    font-family: var(--font-display);
    letter-spacing: 0.06em;
    cursor: pointer;
  }
</style>
