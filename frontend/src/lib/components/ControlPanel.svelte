<script lang="ts">
  import { onDestroy } from 'svelte';
  import { BUY_VAULT_COST_MULTIPLIER } from '@crypto-mines/shared';
  import { apiToDisplay } from '../rgs';
  import Icon from './Icon.svelte';
  import ChainMeter from './ChainMeter.svelte';

  interface Props {
    bet: number;
    balance: number;
    mines: number;
    multiplier: number;
    potential: number;
    chainStreak: number;
    pulseGen?: number;
    replayMode: boolean;
    roundActive: boolean;
    terminal: boolean;
    canCashOut: boolean;
    buyMode: boolean;
    canPlaceBets: boolean;
    starting?: boolean;
    walletConfig?: import('../rgs').WalletConfig | null;
    onBetChange: (v: number) => void;
    onMinesChange: (v: number) => void;
    onStart: () => void;
    onCashout: () => void;
    onBuyVault: () => void;
  }
  let {
    bet,
    balance,
    mines,
    multiplier,
    potential,
    chainStreak,
    pulseGen = 0,
    replayMode,
    roundActive,
    terminal,
    canCashOut,
    buyMode,
    canPlaceBets = false,
    starting = false,
    walletConfig = null,
    onBetChange,
    onMinesChange,
    onStart,
    onCashout,
    onBuyVault,
  }: Props = $props();

  const minePresets = [1, 5, 10, 15, 20, 24];
  let showBuyConfirm = $state(false);
  const buyCost = $derived(bet * BUY_VAULT_COST_MULTIPLIER);
  const balanceAfterBuy = $derived(Math.max(0, balance - buyCost));

  /* Lightweight rAF count-up for the displayed multiplier (no external animation lib,
     honours prefers-reduced-motion). The authoritative value is always `multiplier`. */
  let displayMult = $state(multiplier);
  let rafId = 0;
  let multKey = $state(0);

  onDestroy(() => cancelAnimationFrame(rafId));

  $effect(() => {
    const target = multiplier;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      cancelAnimationFrame(rafId);
      displayMult = target;
      return;
    }
    const from = displayMult;
    if (from === target) return;
    const jump = Math.abs(target - from);
    const start = performance.now();
    const dur = jump >= 0.5 ? 520 : 380;
    cancelAnimationFrame(rafId);
    multKey += 1;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const ease = 1 - Math.pow(1 - t, 3);
      displayMult = from + (target - from) * ease;
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  });

  /* circular energy ring: fill proportional to progress toward a big multiplier */
  const ringPct = $derived(Math.min(100, ((displayMult - 1) / 9) * 100));

  const betMin = $derived(walletConfig ? apiToDisplay(walletConfig.minBet) : 0.1);
  const betMax = $derived(walletConfig ? apiToDisplay(walletConfig.maxBet) : 100);
  const betStep = $derived(
    walletConfig ? apiToDisplay(walletConfig.stepBet || walletConfig.minStep) : 0.1,
  );

  function adjustBet(deltaSteps: number) {
    if (walletConfig && walletConfig.betLevels.length > 0) {
      const levels = walletConfig.betLevels.map((v) => apiToDisplay(v));
      const currentApi = levels.reduce((best, v) => (Math.abs(v - bet) < Math.abs(best - bet) ? v : best), levels[0]!);
      const idx = levels.indexOf(currentApi);
      const next = levels[Math.min(levels.length - 1, Math.max(0, idx + deltaSteps))]!;
      onBetChange(next);
      return;
    }
    const next = Math.min(betMax, Math.max(betMin, +(bet + deltaSteps * betStep).toFixed(2)));
    onBetChange(next);
  }
</script>

<section class="panel" aria-label="Game controls">
  <div class="section mult-hero">
    <span class="label">
      <Icon name="multiplier" size={14} />
      Current multiplier
    </span>
    <div class="mult-ring" data-multiplier-ring>
      <svg class="ring-svg" viewBox="0 0 100 100" aria-hidden="true">
        <circle class="ring-track" cx="50" cy="50" r="44"></circle>
        <circle
          class="ring-fill"
          cx="50"
          cy="50"
          r="44"
          stroke-dasharray="276.5"
          stroke-dashoffset={276.5 * (1 - ringPct / 100)}
        ></circle>
      </svg>
      <span class="ring-orbit" aria-hidden="true"></span>
      <strong key={multKey} data-multiplier-display>{displayMult.toFixed(2)}×</strong>
    </div>
  </div>

  <!-- Mobile/tablet: chain rail shown between board and controls -->
  <div class="chain-slot">
    <ChainMeter {chainStreak} {pulseGen} />
  </div>

  <div class="section grid2">
    <div class="stat-card">
      <span class="label">
        <Icon name="trophy" size={14} />
        Potential win
      </span>
      <strong class="potential">{potential.toFixed(2)}</strong>
    </div>
    <div class="stat-card">
      <span class="label">
        <Icon name="bet" size={14} />
        Bet
      </span>
      <strong class="bet-val">{bet.toFixed(2)}</strong>
    </div>
  </div>

  <div class="section">
    <span class="label">
      <Icon name="bet" size={14} />
      Bet amount
    </span>
    <div class="stepper">
      <button type="button" disabled={roundActive} title="Minimum bet" onclick={() => onBetChange(betMin)}>MIN</button>
      <button type="button" disabled={roundActive} title="Halve bet" onclick={() => onBetChange(Math.max(betMin, +(bet / 2).toFixed(2)))}>½</button>
      <button type="button" class="step-btn" disabled={roundActive} aria-label="Decrease bet" onclick={() => adjustBet(-1)}>
        <Icon name="minus" size={16} />
      </button>
      <span class="value">{bet.toFixed(2)}</span>
      <button type="button" class="step-btn" disabled={roundActive} aria-label="Increase bet" onclick={() => adjustBet(1)}>
        <Icon name="plus" size={16} />
      </button>
      <button type="button" disabled={roundActive} title="Double bet" onclick={() => onBetChange(Math.min(betMax, +(bet * 2).toFixed(2)))}>2×</button>
      <button type="button" disabled={roundActive} title="Maximum bet" onclick={() => onBetChange(betMax)}>MAX</button>
    </div>
  </div>

  <div class="section">
    <span class="label">
      <Icon name="mines" size={14} />
      Mines
    </span>
    <div class="stepper">
      <button type="button" class="step-btn" disabled={roundActive} aria-label="Fewer mines" onclick={() => onMinesChange(Math.max(1, mines - 1))}>
        <Icon name="minus" size={16} />
      </button>
      <span class="value">{mines}</span>
      <button type="button" class="step-btn" disabled={roundActive} aria-label="More mines" onclick={() => onMinesChange(Math.min(24, mines + 1))}>
        <Icon name="plus" size={16} />
      </button>
    </div>
    <div class="presets">
      {#each minePresets as m}
        <button type="button" class:active={mines === m} disabled={roundActive} onclick={() => onMinesChange(m)}>{m}</button>
      {/each}
    </div>
  </div>

  <div class="section action">
    {#if replayMode}
      <p class="note">Replay mode</p>
    {:else if buyMode && roundActive}
      <p class="note">Complete the vault bonus to finish this round.</p>
    {:else if roundActive}
      {#if canCashOut}
        <button type="button" class="cashout" data-cashout-btn onclick={onCashout}>
          <span class="cta">
            <Icon name="cashout" size={16} />
            Cash Out
          </span>
          <span class="amt">{potential.toFixed(2)}</span>
        </button>
      {:else}
        <p class="note reveal-hint">Tap a tile on the board to reveal</p>
      {/if}
    {:else}
      <button type="button" class="play" data-start-btn disabled={!canPlaceBets || starting} onclick={onStart}>
        <span class="play-face">
          {#if starting}
            <span class="spinner" aria-hidden="true"></span>
            <span>Starting…</span>
          {:else}
            <Icon name="play" size={20} />
            <span>Start Round<small>Reveal Tiles</small></span>
          {/if}
        </span>
        <span class="energy-sweep" aria-hidden="true"></span>
      </button>
    {/if}
  </div>

  {#if !replayMode && !roundActive}
    <div class="section bonus-buy">
      <button type="button" class="buy" disabled={!canPlaceBets} onclick={() => (showBuyConfirm = true)}>
        <span class="buy-vault">
          <Icon name="vault" size={40} />
        </span>
        <span class="buy-kicker">Buy Crypto Vault</span>
        <span class="buy-mult">{BUY_VAULT_COST_MULTIPLIER}× BET</span>
        <span class="buy-main">Instant vault bonus entry</span>
      </button>
    </div>
  {/if}

  {#if showBuyConfirm}
    <div class="confirm" role="dialog" aria-label="Confirm buy bonus">
      <p class="confirm-tag">
        <Icon name="warning" size={14} />
        Buy Crypto Vault
      </p>
      <p class="confirm-cost">{BUY_VAULT_COST_MULTIPLIER}× BET</p>
      <dl class="confirm-grid">
        <dt>Your balance</dt>
        <dd>{balance.toFixed(2)}</dd>
        <dt>Base bet</dt>
        <dd>{bet.toFixed(2)}</dd>
        <dt>Total cost</dt>
        <dd class="cost">{buyCost.toFixed(2)}</dd>
        <dt>Balance after</dt>
        <dd class:warn={balanceAfterBuy <= 0}>{balanceAfterBuy.toFixed(2)}</dd>
      </dl>
      <div class="confirm-actions">
        <button type="button" class="confirm-no" onclick={() => (showBuyConfirm = false)}>Cancel</button>
        <button
          type="button"
          class="confirm-yes"
          onclick={() => {
            showBuyConfirm = false;
            onBuyVault();
          }}>Confirm</button
        >
      </div>
    </div>
  {/if}
</section>

<style>
  .panel {
    background: linear-gradient(180deg, rgba(24, 21, 18, 0.94), rgba(10, 9, 7, 0.97));
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    box-shadow:
      0 16px 40px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
    position: relative;
  }
  .panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 18%;
    right: 18%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.5), transparent);
    pointer-events: none;
  }
  .section {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .mult-hero {
    align-items: center;
    text-align: center;
    padding-bottom: 0.25rem;
    border-bottom: 1px solid rgba(16, 185, 129, 0.1);
  }
  .mult-ring {
    position: relative;
    display: grid;
    place-items: center;
    width: 108px;
    height: 108px;
    margin-top: 0.15rem;
  }
  .ring-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }
  .ring-track {
    fill: none;
    stroke: rgba(165, 150, 120, 0.14);
    stroke-width: 3;
  }
  /* Immediate press feedback while the RGS pick response is in flight */
  :global(.tile.is-pending .tile-inner) {
    transform: translate3d(0, 2px, 0) scale(0.96);
    box-shadow: inset 0 3px 10px rgba(0, 0, 0, 0.55);
  }
  .ring-fill {
    fill: none;
    stroke: var(--accent-primary);
    stroke-width: 3;
    stroke-linecap: round;
    filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.5));
    transition: stroke-dashoffset 0.4s var(--ease-out-soft);
  }
  .ring-orbit {
    position: absolute;
    inset: 8px;
    border-radius: 50%;
    border: 1px dashed rgba(16, 185, 129, 0.22);
    animation: orbit-spin 14s linear infinite;
    pointer-events: none;
  }
  @keyframes orbit-spin {
    to { transform: rotate(360deg); } }
  .mult-ring strong {
    position: relative;
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 4.5vw, 1.8rem);
    color: var(--accent-secondary);
    text-shadow: 0 0 18px rgba(16, 185, 129, 0.25);
    font-variant-numeric: tabular-nums;
    animation: mult-pop 0.38s var(--ease-out-soft);
  }
  @keyframes mult-pop {
    0% { opacity: 0.5; transform: scale(0.92); filter: brightness(1.5); }
    100% { opacity: 1; transform: scale(1); filter: brightness(1); }
  }
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
  }
  .stat-card {
    background: linear-gradient(170deg, rgba(24, 21, 18, 0.85), rgba(10, 9, 7, 0.9));
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.45rem 0.6rem;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }
  .potential {
    font-family: var(--font-display);
    font-size: 1.1rem;
    color: var(--accent-secondary);
    font-variant-numeric: tabular-nums;
  }
  .bet-val {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-variant-numeric: tabular-nums;
  }
  .label {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
  }
  .stepper {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: center;
  }
  .stepper button,
  .presets button {
    min-width: 44px;
    min-height: 44px;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(165, 150, 120, 0.2);
    background: linear-gradient(165deg, #2a2622 0%, #191613 45%, #13100c 100%);
    color: var(--text-primary);
    font-weight: 600;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 2px 6px rgba(0, 0, 0, 0.35);
    transition: transform 0.1s ease, border-color 0.15s, box-shadow 0.15s;
  }
  .stepper button:hover:not(:disabled),
  .presets button:hover:not(:disabled) {
    border-color: rgba(16, 185, 129, 0.4);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 0 12px rgba(16, 185, 129, 0.14);
  }
  .stepper button:active:not(:disabled),
  .presets button:active:not(:disabled) {
    transform: scale(0.95);
  }
  .stepper button:disabled,
  .presets button:disabled {
    opacity: 0.45;
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  .presets button.active {
    border-color: rgba(16, 185, 129, 0.65);
    color: var(--accent-secondary);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 0 14px rgba(16, 185, 129, 0.25);
  }
  .value {
    font-family: var(--font-display);
    min-width: 3.8rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .action {
    margin-top: 0.15rem;
  }
  .play,
  .cashout {
    width: 100%;
    min-height: 58px;
    border: none;
    border-radius: var(--radius-md);
    font-weight: 700;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }
  .play {
    display: grid;
    place-items: center;
    background: linear-gradient(180deg, #059669 0%, #10b981 100%);
    color: #ecfdf5;
    font-size: 1.02rem;
    border: 1px solid rgba(16, 185, 129, 0.55);
    box-shadow:
      0 10px 24px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
    transition: transform 0.12s var(--ease-out-soft), box-shadow 0.2s;
  }
  .play-face {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    position: relative;
    z-index: 1;
    letter-spacing: 0.04em;
  }
  .play-face small {
    display: block;
    font-size: 0.6rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(230, 245, 205, 0.75);
    font-weight: 600;
  }
  .energy-sweep {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(100deg, transparent 30%, rgba(52, 211, 153, 0.16) 48%, rgba(52, 211, 153, 0.22) 52%, transparent 70%);
    transform: translateX(-60%);
    transition: transform 0.5s ease;
  }
  .play:hover:not(:disabled) .energy-sweep {
    transform: translateX(60%);
  }
  .play:active:not(:disabled) {
    transform: scale(0.98);
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
  }
  .play:disabled,
  .buy:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .spinner {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid rgba(250, 248, 238, 0.3);
    border-top-color: #ecfdf5;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); } }
  .cashout {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.15rem;
    background: linear-gradient(180deg, #059669, #064e3b);
    color: #171408;
    border: 1px solid rgba(52, 211, 153, 0.5);
    box-shadow:
      0 0 0 1px rgba(52, 211, 153, 0.2),
      0 10px 28px rgba(5, 150, 105, 0.4);
    animation: cashout-breathe 1.6s ease-in-out infinite;
  }
  @keyframes cashout-breathe {
    0%, 100% { box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.2), 0 10px 28px rgba(5, 150, 105, 0.4); }
    50% { box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.35), 0 10px 32px rgba(5, 150, 105, 0.55); }
  }
  .cashout:active {
    transform: scale(0.98);
  }
  .cashout .cta {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .cashout .amt {
    font-family: var(--font-display);
    font-size: 1.25rem;
    font-variant-numeric: tabular-nums;
  }
  .buy {
    position: relative;
    width: 100%;
    min-height: 104px;
    border-radius: var(--radius-md);
    border: 1px solid rgba(212, 175, 90, 0.45);
    background:
      radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212, 175, 90, 0.12), transparent 70%),
      linear-gradient(165deg, rgba(30, 27, 23, 0.98), rgba(8, 12, 14, 0.99));
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
    padding: 0.6rem 0.65rem;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 8px 24px rgba(0, 0, 0, 0.35);
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.12s;
  }
  .buy::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(115deg, transparent 35%, rgba(240, 220, 138, 0.08) 48%, rgba(240, 220, 138, 0.12) 52%, transparent 65%);
    transform: translateX(-70%);
    transition: transform 0.6s ease;
    pointer-events: none;
  }
  .buy:hover:not(:disabled) {
    border-color: rgba(240, 220, 138, 0.7);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 0 22px rgba(212, 175, 90, 0.2),
      0 10px 28px rgba(0, 0, 0, 0.4);
  }
  .buy:hover:not(:disabled)::after {
    transform: translateX(70%);
  }
  .buy:active:not(:disabled) {
    transform: scale(0.98);
  }
  .buy-vault {
    position: relative;
    z-index: 1;
    display: grid;
    place-items: center;
    filter: drop-shadow(0 4px 12px rgba(212, 175, 90, 0.4));
    transition: transform 0.3s var(--ease-out-soft);
  }
  .buy:hover:not(:disabled) .buy-vault {
    transform: scale(1.06);
  }
  .buy-kicker,
  .buy-mult,
  .buy-main {
    position: relative;
    z-index: 1;
  }
  .buy-kicker {
    font-size: 0.62rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--highlight-soft);
  }
  .buy-mult {
    font-family: var(--font-display);
    font-size: clamp(1.15rem, 4.5vw, 1.35rem);
    letter-spacing: 0.08em;
    color: var(--highlight);
  }
  .buy-main {
    font-size: 0.72rem;
    color: var(--text-secondary);
  }
  .note {
    margin: 0;
    font-size: 0.8rem;
    color: var(--text-secondary);
    text-align: center;
  }
  .reveal-hint {
    color: var(--accent-primary);
  }
  .confirm {
    border: 1px solid rgba(212, 175, 90, 0.35);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    background: rgba(8, 12, 14, 0.98);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  }
  .confirm-tag {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin: 0;
    font-size: 0.65rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }
  .confirm-cost {
    margin: 0.25rem 0 0.65rem;
    font-family: var(--font-display);
    font-size: 1.45rem;
    color: var(--highlight);
    letter-spacing: 0.06em;
  }
  .confirm-grid .cost {
    color: var(--highlight-soft);
  }
  .confirm-grid .warn {
    color: var(--danger);
  }
  .confirm-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.25rem 0.75rem;
    margin: 0 0 var(--space-sm);
    font-size: 0.78rem;
  }
  .confirm-grid dt {
    color: var(--text-secondary);
  }
  .confirm-grid dd {
    margin: 0;
    text-align: right;
    font-family: var(--font-display);
  }
  .confirm-actions {
    display: flex;
    gap: var(--space-sm);
    margin-top: var(--space-sm);
  }
  .confirm-no {
    flex: 1;
    min-height: 44px;
    background: var(--surface);
    color: var(--text-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-weight: 600;
  }
  .chain-slot {
    display: contents;
  }
  .confirm-yes {
    flex: 1;
    background: linear-gradient(180deg, #e3bd63, #a8801f);
    color: #07150c;
    border: none;
    border-radius: var(--radius-sm);
    min-height: 44px;
    font-weight: 700;
  }
</style>
