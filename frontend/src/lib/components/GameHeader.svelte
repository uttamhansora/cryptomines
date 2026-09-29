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
    <span class="mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
        <rect x="3.5" y="6.5" width="17" height="13" rx="2.5" fill="#1a2220" stroke="#c9a227" stroke-width="1.4" />
        <circle cx="12" cy="13" r="3.4" fill="none" stroke="#3dd6b5" stroke-width="1.4" />
        <circle cx="12" cy="13" r="1.1" fill="#e8c547" />
        <path d="M12 9.6v-1.4M12 17.8v-1.4M8.6 13H7.2M16.8 13h-1.4" stroke="#3dd6b5" stroke-width="1.2" stroke-linecap="round" />
      </svg>
    </span>
    <h1>Crypto Mines</h1>
  </div>
  <div class="actions">
    <div class="balance">
      <span class="label">Balance</span>
      <span class="value">
        <img class="coin" src="./assets/game/ui/icons/usdt.png" alt="" width="16" height="16" />
        {balance.toFixed(2)}
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
      <img src="./assets/game/ui/icons/{soundOn ? 'sound' : 'mute'}.png" alt="" width="20" height="20" />
    </button>
    <button type="button" class="icon-btn" title="Game rules" aria-label="Game rules" onclick={onRules}>
      <img src="./assets/game/ui/icons/rules.png" alt="" width="20" height="20" />
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
    gap: var(--space-sm);
  }
  .mark {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: linear-gradient(160deg, rgba(201, 162, 39, 0.18), rgba(13, 61, 50, 0.5));
    border: 1px solid rgba(201, 162, 39, 0.35);
    box-shadow: 0 0 14px var(--glow-emerald);
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
    margin-right: var(--space-xs);
  }
  .label {
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-secondary);
  }
  .value {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-family: var(--font-display);
    font-size: 0.95rem;
    color: var(--accent-primary);
    font-variant-numeric: tabular-nums;
  }
  .coin {
    object-fit: contain;
  }
  .icon-btn {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--border);
    background: linear-gradient(165deg, var(--graphite-light) 0%, var(--surface) 60%, #0a0f0d 100%);
    border-radius: var(--radius-sm);
    padding: 0;
    transition:
      border-color 0.15s,
      box-shadow 0.15s,
      transform 0.1s ease;
  }
  .icon-btn:hover {
    border-color: rgba(61, 214, 181, 0.4);
    box-shadow: 0 0 12px rgba(61, 214, 181, 0.15);
  }
  .icon-btn:active {
    transform: scale(0.94);
  }
</style>
