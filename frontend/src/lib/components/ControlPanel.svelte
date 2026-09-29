<script lang="ts">
  import { BUY_VAULT_COST_MULTIPLIER } from '@crypto-mines/shared';
  import { apiToDisplay } from '../rgs';

  interface Props {
    bet: number;
    balance: number;
    mines: number;
    multiplier: number;
    potential: number;
    replayMode: boolean;
    roundActive: boolean;
    terminal: boolean;
    canCashOut: boolean;
    buyMode: boolean;
    canPlaceBets: boolean;
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
    replayMode,
    roundActive,
    terminal,
    canCashOut,
    buyMode,
    canPlaceBets = false,
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
    const start = performance.now();
    const dur = 420;
    cancelAnimationFrame(rafId);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const ease = 1 - Math.pow(1 - t, 3);
      displayMult = from + (target - from) * ease;
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  });

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
    <span class="label">Current multiplier</span>
    <div class="mult-ring">
      <span class="ring" aria-hidden="true"></span>
      <span class="ring-energy" aria-hidden="true"></span>
      <strong data-multiplier-display>{displayMult.toFixed(2)}×</strong>
    </div>
  </div>

  <div class="section grid2">
    <div class="stat-card">
      <span class="label">
        <img src="./assets/game/ui/icons/trophy.png" alt="" width="14" height="14" />
        Potential win
      </span>
      <strong class="potential">{potential.toFixed(2)}</strong>
    </div>
    <div class="stat-card">
      <span class="label">
        <img src="./assets/game/ui/icons/usdt.png" alt="" width="14" height="14" />
        Bet
      </span>
      <strong class="bet-val">{bet.toFixed(2)}</strong>
    </div>
  </div>

  <div class="section">
    <span class="label">
      <img src="./assets/game/ui/icons/usdt.png" alt="" width="14" height="14" />
      Bet amount
    </span>
    <div class="stepper">
      <button type="button" disabled={roundActive} title="Minimum bet" onclick={() => onBetChange(betMin)}>MIN</button>
      <button type="button" disabled={roundActive} title="Halve bet" onclick={() => onBetChange(Math.max(betMin, +(bet / 2).toFixed(2)))}>½</button>
      <button type="button" class="step-btn" disabled={roundActive} aria-label="Decrease bet" onclick={() => adjustBet(-1)}>
        <img src="./assets/game/ui/icons/minus.png" alt="" width="18" height="18" />
      </button>
      <span class="value">{bet.toFixed(2)}</span>
      <button type="button" class="step-btn" disabled={roundActive} aria-label="Increase bet" onclick={() => adjustBet(1)}>
        <img src="./assets/game/ui/icons/plus.png" alt="" width="18" height="18" />
      </button>
      <button type="button" disabled={roundActive} title="Double bet" onclick={() => onBetChange(Math.min(betMax, +(bet * 2).toFixed(2)))}>2×</button>
      <button type="button" disabled={roundActive} title="Maximum bet" onclick={() => onBetChange(betMax)}>MAX</button>
    </div>
  </div>

  <div class="section">
    <span class="label">
      <img src="./assets/game/ui/icons/mines.png" alt="" width="14" height="14" />
      Mines
    </span>
    <div class="stepper">
      <button type="button" class="step-btn" disabled={roundActive} aria-label="Fewer mines" onclick={() => onMinesChange(Math.max(1, mines - 1))}>
        <img src="./assets/game/ui/icons/minus.png" alt="" width="18" height="18" />
      </button>
      <span class="value">{mines}</span>
      <button type="button" class="step-btn" disabled={roundActive} aria-label="More mines" onclick={() => onMinesChange(Math.min(24, mines + 1))}>
        <img src="./assets/game/ui/icons/plus.png" alt="" width="18" height="18" />
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
            <img src="./assets/game/ui/icons/cashout.png" alt="" width="16" height="16" />
            Cash Out
          </span>
          <span class="amt">{potential.toFixed(2)}</span>
        </button>
      {:else}
        <p class="note reveal-hint">Tap a tile on the board to reveal</p>
      {/if}
    {:else}
      <button type="button" class="play" disabled={!canPlaceBets} onclick={onStart}>
        <img src="./assets/game/ui/icons/start.png" alt="" width="20" height="20" />
        Start Round · Reveal Tiles
      </button>
    {/if}
  </div>

  {#if !replayMode && !roundActive}
    <div class="section bonus-buy">
      <button type="button" class="buy" disabled={!canPlaceBets} onclick={() => (showBuyConfirm = true)}>
        <img class="buy-icon" src="./assets/game/ui/icons/vault-symbol.png" alt="" width="40" height="40" />
        <span class="buy-kicker">Buy Crypto Vault</span>
        <span class="buy-mult">{BUY_VAULT_COST_MULTIPLIER}× BET</span>
        <span class="buy-main">Instant vault bonus entry</span>
      </button>
      <p class="buy-hint">Enter the Crypto Vault Bonus immediately.</p>
    </div>
  {/if}

  {#if showBuyConfirm}
    <div class="confirm" role="dialog" aria-label="Confirm buy bonus">
      <p class="confirm-tag">
        <img src="./assets/game/ui/icons/warning.png" alt="" width="14" height="14" />
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
    background: linear-gradient(180deg, rgba(21, 32, 25, 0.96), rgba(8, 12, 10, 0.98));
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
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
    border-bottom: 1px solid rgba(46, 230, 214, 0.08);
  }
  .mult-ring {
    position: relative;
    display: grid;
    place-items: center;
    width: 100%;
    min-height: 3.2rem;
  }
  .ring {
    position: absolute;
    width: 92px;
    height: 92px;
    border-radius: 50%;
    border: 1px solid rgba(61, 214, 181, 0.22);
    box-shadow: 0 0 20px rgba(42, 157, 122, 0.12);
  }
  .ring-energy {
    position: absolute;
    width: 104px;
    height: 104px;
    border-radius: 50%;
    border: 2px dashed rgba(61, 214, 181, 0.2);
    opacity: 0;
    pointer-events: none;
  }
  .mult-ring strong {
    position: relative;
    font-family: var(--font-display);
    font-size: clamp(1.55rem, 5vw, 1.95rem);
    color: var(--accent-secondary);
    text-shadow: 0 0 18px rgba(61, 214, 181, 0.22);
    font-variant-numeric: tabular-nums;
    animation: mult-count 0.42s cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  @keyframes mult-count {
    from {
      opacity: 0.55;
      transform: scale(0.94);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
  }
  .stat-card {
    background: rgba(10, 15, 13, 0.6);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 0.4rem 0.55rem;
  }
  .potential {
    font-family: var(--font-display);
    font-size: 1.1rem;
    color: var(--accent-secondary);
  }
  .bet-val {
    font-family: var(--font-display);
    font-size: 1.1rem;
  }
  .label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
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
    border: 1px solid rgba(201, 162, 39, 0.22);
    background: linear-gradient(165deg, #2a3532 0%, #141f1b 45%, #0a0f0d 100%);
    color: var(--text-primary);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 2px 6px rgba(0, 0, 0, 0.35);
    transition: transform 0.1s ease, border-color 0.15s, box-shadow 0.15s;
  }
  .stepper button:hover:not(:disabled),
  .presets button:hover:not(:disabled) {
    border-color: rgba(61, 214, 181, 0.35);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 0 12px rgba(61, 214, 181, 0.12);
  }
  .stepper button:active:not(:disabled),
  .presets button:active:not(:disabled) {
    transform: scale(0.96);
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
    border-color: rgba(61, 214, 181, 0.6);
    color: var(--accent-secondary);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 0 14px rgba(61, 214, 181, 0.25);
  }
  .value {
    font-family: var(--font-display);
    min-width: 3.5rem;
    text-align: center;
  }
  .action {
    margin-top: 0.15rem;
  }
  .play,
  .cashout {
    width: 100%;
    min-height: 56px;
    border: none;
    border-radius: var(--radius-md);
    font-weight: 700;
    cursor: pointer;
  }
  .play {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background: linear-gradient(180deg, var(--emerald-mid), var(--emerald-deep));
    color: #eef5f1;
    font-size: 1rem;
    border: 1px solid rgba(61, 214, 181, 0.35);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
  }
  .play:active:not(:disabled) {
    transform: scale(0.98);
  }
  .play:disabled,
  .buy:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .cashout {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.15rem;
    background: linear-gradient(180deg, #2a9d7a, #1a6b55);
    color: #050807;
    box-shadow:
      0 0 0 1px rgba(94, 236, 196, 0.35),
      0 10px 28px rgba(26, 107, 85, 0.35);
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
  }
  .buy {
    position: relative;
    width: 100%;
    min-height: 88px;
    border-radius: var(--radius-md);
    border: 1px solid rgba(201, 162, 39, 0.5);
    background: linear-gradient(165deg, rgba(201, 162, 39, 0.14), rgba(10, 16, 14, 0.98));
    color: var(--text-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.15rem;
    padding: 0.55rem 0.65rem;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 8px 24px rgba(0, 0, 0, 0.35);
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s, transform 0.12s;
  }
  .buy::before {
    content: '';
    position: absolute;
    inset: -40%;
    background: conic-gradient(from 0deg, transparent, rgba(61, 214, 181, 0.08), transparent 35%);
    animation: buy-idle-spin 8s linear infinite;
    pointer-events: none;
  }
  @keyframes buy-idle-spin {
    to {
      transform: rotate(360deg);
    }
  }
  .buy:hover:not(:disabled) {
    border-color: rgba(61, 214, 181, 0.45);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 0 20px rgba(201, 162, 39, 0.22),
      0 10px 28px rgba(0, 0, 0, 0.4);
  }
  .buy:active:not(:disabled) {
    transform: scale(0.98);
  }
  .buy-icon {
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 4px 12px rgba(201, 162, 39, 0.4));
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
  .buy-hint {
    margin: 0;
    font-size: 0.68rem;
    color: var(--text-secondary);
    text-align: center;
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
    border: 1px solid rgba(201, 162, 39, 0.35);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    background: rgba(8, 12, 10, 0.98);
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
  .confirm-yes {
    flex: 1;
    background: var(--highlight);
    color: #1a1000;
    border: none;
    border-radius: var(--radius-sm);
    min-height: 44px;
    font-weight: 700;
  }
</style>
