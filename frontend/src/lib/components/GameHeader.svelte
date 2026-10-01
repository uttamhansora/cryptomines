<script lang="ts">
  import Icon from './Icon.svelte';

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
    <span class="mark" aria-hidden="true">
      <svg viewBox="0 0 64 64" width="22" height="22">
        <polygon points="32,7 54,20 54,44 32,57 10,44 10,20" fill="#0c1626" stroke="#d4af5a" stroke-width="2.4" />
        <polygon points="32,17 45,25 45,39 32,47 19,39 19,25" fill="none" stroke="#ef4444" stroke-width="2" opacity=".85" />
        <circle cx="32" cy="32" r="4.6" fill="#e8c547" />
      </svg>
    </span>
    <h1>Crypto<span>Mines</span></h1>
  </div>
  <div class="actions">
    <div class="balance" data-balance-chip role="status" aria-label={`Balance ${balance.toFixed(2)}`}>
      <span class="label">Balance</span>
      <span class="value">
        <Icon name="tether" size={15} class="coin" />
        <strong>{balance.toFixed(2)}</strong>
      </span>
    </div>
    <button
      type="button"
      class="icon-btn"
      aria-pressed={soundOn}
      title={soundOn ? 'Mute sound' : 'Enable sound'}
      aria-label={soundOn ? 'Mute sound' : 'Enable sound'}
      onclick={onToggleSound}
    >
      <Icon name={soundOn ? 'sound' : 'mute'} size={18} />
    </button>
    <button type="button" class="icon-btn" title="Game rules" aria-label="Game rules" onclick={onRules}>
      <Icon name="info" size={18} />
    </button>
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
    gap: 0.55rem;
  }
  .mark {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 9px;
    background: linear-gradient(160deg, rgba(212, 175, 90, 0.16), rgba(36, 58, 12, 0.55));
    border: 1px solid rgba(212, 175, 90, 0.4);
    box-shadow:
      0 0 16px rgba(239, 68, 68, 0.14),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(0.95rem, 3.5vw, 1.18rem);
    letter-spacing: 0.14em;
    font-weight: 700;
    text-transform: uppercase;
    color: #f4ead0;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.6);
  }
  h1 span {
    color: var(--accent-primary);
  }
  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
  /* HUD-style balance */
  .balance {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    line-height: 1.15;
    margin-right: var(--space-xs);
    padding: 0.3rem 0.65rem;
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(19, 31, 38, 0.9), rgba(8, 13, 18, 0.9));
    border: 1px solid rgba(239, 68, 68, 0.22);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      0 4px 14px rgba(0, 0, 0, 0.4);
  }
  .label {
    font-size: 0.58rem;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-muted);
  }
  .value {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 1rem;
    color: var(--text-primary);
  }
  .value strong {
    font-family: var(--font-display);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.03em;
    color: var(--accent-secondary);
  }
  .icon-btn {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid rgba(120, 150, 165, 0.2);
    background: linear-gradient(165deg, rgba(34, 48, 60, 0.85) 0%, rgba(13, 21, 27, 0.9) 60%, rgba(6, 10, 14, 0.95) 100%);
    border-radius: 10px;
    padding: 0;
    transition:
      border-color 0.15s,
      box-shadow 0.15s,
      transform 0.1s ease;
  }
  .icon-btn:hover {
    border-color: rgba(239, 68, 68, 0.45);
    box-shadow: 0 0 14px rgba(239, 68, 68, 0.16);
  }
  .icon-btn:active {
    transform: scale(0.93);
  }
</style>
