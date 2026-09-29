<script lang="ts">
  interface Props {
    balance: number;
    soundOn: boolean;
    onToggleSound: () => void;
    onRules: () => void;
  }
  let { balance, soundOn, onToggleSound, onRules }: Props = $props();
</script>

<header class="header">
  <div class="brand">
    <span class="mark" aria-hidden="true"></span>
    <h1>Crypto Mines</h1>
  </div>
  <div class="actions">
    <div class="balance">
      <span class="label">Balance</span>
      <span class="value">{balance.toFixed(2)}</span>
    </div>
    <button type="button" class="icon-btn" aria-pressed={soundOn} onclick={onToggleSound}>
      {soundOn ? 'Sound' : 'Mute'}
    </button>
    <button type="button" class="icon-btn" onclick={onRules}>Rules</button>
  </div>
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-sm) 0;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
  .mark {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    background: linear-gradient(135deg, var(--emerald-light), var(--highlight));
    box-shadow: 0 0 12px var(--glow-emerald);
  }
  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(0.95rem, 3.5vw, 1.15rem);
    letter-spacing: 0.12em;
    font-weight: 700;
    color: var(--text-primary);
  }
  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
  .balance {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    line-height: 1.1;
  }
  .label {
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-secondary);
  }
  .value {
    font-family: var(--font-display);
    font-size: 0.95rem;
    color: var(--accent-primary);
  }
  .icon-btn {
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-secondary);
    border-radius: var(--radius-sm);
    padding: 0.35rem 0.55rem;
    font-size: 0.72rem;
  }
</style>
