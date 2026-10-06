<script lang="ts">
  import { onDestroy } from 'svelte';
  import { BUY_VAULT_COST_MULTIPLIER } from '@crypto-mines/shared';
  import { apiToDisplay, betRangeFromConfig } from '../rgs';
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

  const rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  onDestroy(() => cancelAnimationFrame(rafId));

  // Derived so this effect ONLY re-runs when the multiplier actually changes —
  // previously it re-ran (and cancelled/restarted a rAF tween) on every snapshot
  // emission, balance update, bet change, etc.
  const multTarget = $derived(multiplier);

  $effect(() => {
    const target = multTarget;
    if (rmQuery.matches) {
      cancelAnimationFrame(rafId);
      displayMult = target;
      return;
    }
    const from = displayMult;
    if (from === target) return;
    const jump = Math.abs(target - from);
    const start = performance.now();
    const dur = jump >= 0.5 ? 420 : 300;
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

  /* Circular glowing ring: stroke-dashoffset encodes progress toward the next
     big multiplier tier. Pure derived value — zero reactive writes per frame,
     and the CSS transition below renders every change smoothly (<1s). */
  const RING_R = 46;
  const RING_CIRC = 2 * Math.PI * RING_R; // ≈ 289.03
  const ringPct = $derived(Math.max(0, Math.min(100, ((displayMult - 1) / 9) * 100)));
  const ringDashOffset = $derived(RING_CIRC * (1 - ringPct / 100));

  /* BET QUANTUM horizontal slider position (0–100%) between effective MIN/MAX.
     Derived from `bet` only — no extra state, no drift, zero JS on drag beyond
     the one input event that already flows through applyBet(). */
  const betPct = $derived(
    betCap > betMin ? Math.max(0, Math.min(100, ((bet - betMin) / (betCap - betMin)) * 100)) : 0,
  );
  /** Slider works in display units; map its raw position back onto the legal range. */
  function handleBetSlider(e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    if (!Number.isFinite(v)) return;
    applyBet(+(betMin + (v / 100) * (betCap - betMin)).toFixed(2));
  }

  const ladderEnabled = $derived(
    !!walletConfig && Array.isArray(walletConfig.betLevels) && walletConfig.betLevels.length > 0,
  );

  /**
   * Effective MIN / MAX targets, computed from the exact constraints the server enforces
   * (range + step grid + ladder). Because these values are always server-valid, clicking
   * MIN/MAX can never be silently rewritten by `snapBetDisplayToConfig` in App — which is
   * what made the buttons look unresponsive when raw minBet/maxBet sat off the ladder or
   * when the balance fell between two rungs.
   */
  const betRange = $derived(betRangeFromConfig(walletConfig, balance));

  /** Lowest wager the player may place (e.g. 1.00 on the mock wallet's ladder). */
  const betMin = $derived(betRange.min);

  /** Highest wager allowed: the configured cap, limited to the player's available balance. */
  const betCap = $derived(Math.max(betRange.min, betRange.max));

  const betStep = $derived(
    walletConfig ? apiToDisplay(walletConfig.stepBet || walletConfig.minStep) : 0.1,
  );

  /** MAX button target — the full available balance clamped into the legal range. */
  const maxBetValue = $derived(betCap);

  /**
   * Server bet ladder in display units, sorted ONCE per config change instead
   * of on every +/- / 2× click (the previous `.map().sort()` ran inside the
   * click handler on the UI hot path).
   */
  const betLadder = $derived(
    walletConfig && Array.isArray(walletConfig.betLevels) && walletConfig.betLevels.length > 0
      ? walletConfig.betLevels.map((v) => apiToDisplay(v)).sort((a, b) => a - b)
      : [],
  );

  /**
   * Memoized "next ladder rung above the current bet" cursor. The naive
   * implementation ran `findIndex` on every render of this component — and it
   * re-renders on EVERY snapshot emission (each pick/animation step). We only
   * recompute when the bet or the ladder actually changes, so the ± buttons,
   * MIN/MAX and the whole panel stay perfectly responsive mid-round.
   */
  let upperIdxCache = { bet: NaN, ladderRef: null as number[] | null, idx: -1 };
  const upperIdx = $derived.by(() => {
    const levels = betLadder ?? [];
    if (upperIdxCache.ladderRef === levels && upperIdxCache.bet === bet) {
      return upperIdxCache.idx;
    }
    const idx = levels.findIndex((v) => v > bet + 1e-9);
    upperIdxCache = { bet, ladderRef: levels, idx };
    return idx;
  });

  /**
   * All bet/mines mutators are guarded so a click can NEVER be swallowed by an
   * undefined array read (the class of bug behind "Cannot read properties of
   * undefined (reading '0')" when a wallet config arrives with an empty or
   * missing `betLevels`): every ladder lookup goes through `levelAt()`, which
   * returns null instead of indexing an absent array, and every handler bails
   * out silently (no crash, no stale write) when there is nothing to apply.
   */
  const levelAt = (i: number): number | null => {
    const l = betLadder ?? [];
    if (i < 0 || i >= l.length) return null;
    const v = l[i];
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  };

  /** True only when the ladder actually has usable rungs. */
  const canAdjustBet = $derived(
    ladderEnabled && levelAt(0) !== null && levelAt((betLadder ?? []).length - 1) !== null,
  );

  function adjustBet(deltaSteps: number) {
    if (ladderEnabled) {
      if (!canAdjustBet) return;
      const len = (betLadder ?? []).length;
      const idx = upperIdx; // memoized — no per-click scan of the ladder
      let next: number | null;
      if (deltaSteps < 0) {
        const down = idx - 1;
        next = levelAt(down >= 0 ? down : 0);
      } else if (idx === -1) {
        next = levelAt(len - 1);
      } else {
        next = levelAt(Math.min(len - 1, idx + deltaSteps));
      }
      if (next == null) return; // defensive: never index an undefined rung
      // Never step below MIN or above the effective cap.
      if (next < betMin) next = betMin;
      if (next > betCap) next = betCap;
      if (next !== bet) onBetChange(next);
      return;
    }
    const next = Math.min(betCap, Math.max(betMin, +(bet + deltaSteps * betStep).toFixed(2)));
    if (next !== bet) onBetChange(next);
  }

  function applyBet(v: number) {
    if (!Number.isFinite(v)) return; // never write NaN/undefined into the bet state
    onBetChange(v);
  }

  onDestroy(() => cancelAnimationFrame(rafId));

  /* ── Instant, zero-latency button handlers ────────────────────────────
     MIN / MAX / ½ / 2× mutate the bet SYNCHRONOUSLY inside the click task —
     no debounce, no rAF deferral, no await — so Svelte flushes the new value
     in the same frame the pointer event fires. Each button additionally
     carries a CSS :active press pose (transform only), so even the visual
     response lands before the browser would paint any delay. */
  const setMinBet = () => applyBet(betMin);
  const setMaxBet = () => applyBet(maxBetValue);
  const halveBet = () => applyBet(Math.max(betMin, +(bet / 2).toFixed(2)));
  const doubleBet = () => applyBet(Math.min(betCap, +(bet * 2).toFixed(2)));
</script>

<section class="panel" aria-label="Game controls">
  <div class="section mult-hero">
    <span class="label label-center">
      <Icon name="multiplier" size={14} />
      Multiplier Circuit
    </span>
    <!-- MULTIPLIER CIRCUIT: concentric animated rings + progress dial. The fill
         arc tracks the live count-up value via stroke-dashoffset only (GPU-cheap);
         orbit-1/orbit-2 are the counter-rotating decorative circuit rings.
         Animation hooks kept intact: `.mult-ring .ring-svg` / `.ring-orbit` are
         what AnimationController.multiplierBump() looks up, and
         [data-multiplier-display] is what GSAP bumps on each event. -->
    <div class="mult-ring" data-multiplier-ring>
      <span class="mult-halo" aria-hidden="true"></span>
      <span class="orbit orbit-1" aria-hidden="true"></span>
      <span class="orbit orbit-2" aria-hidden="true"></span>
      <span class="orbit orbit-3" aria-hidden="true"></span>
      <svg class="ring-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false" style="transform: rotate(-90deg)">
        <circle class="ring-track" cx="50" cy="50" r="46" />
        <circle
          class="ring-fill"
          cx="50"
          cy="50"
          r="46"
          stroke-dasharray={RING_CIRC.toFixed(2)}
          stroke-dashoffset={ringDashOffset.toFixed(2)}
        />
      </svg>
      <span class="ring-orbit" aria-hidden="true"></span>
      <span class="mult-value" key={multKey} data-multiplier-display>{displayMult.toFixed(2)}×</span>
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
    <span class="label label-row">
      <span class="label-inner">
        <Icon name="bet" size={14} />
        Bet Quantum
      </span>
      <!-- Tooltip explaining that bet/mines lock during a live round -->
      <span class="tip lock-hint" data-tip={"Bet & mines lock while a round is running"} tabindex="0" role="note" aria-label="Bet and mines controls lock while a round is running">
        <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 10.6v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7.2" r="1.5" fill="currentColor"/></svg>
      </span>
    </span>
    <!-- BET QUANTUM: sleek horizontal range slider (− ● +) above the quick-control
         row. Dragging updates the bet through the same synchronous applyBet() path,
         so every change commits in the input event's task — zero latency. -->
    <div class="quantum-slider-row" class:locked={roundActive}>
      <button type="button" class="step-btn" disabled={roundActive} aria-label="Decrease bet" onclick={() => adjustBet(-1)}>
        <Icon name="minus" size={16} />
      </button>
      <span class="quantum-track">
        <input
          class="quantum-range"
          type="range"
          min="0"
          max="100"
          step="0.5"
          value={betPct.toFixed(1)}
          disabled={roundActive}
          aria-label="Bet amount slider"
          oninput={handleBetSlider}
        />
      </span>
      <button type="button" class="step-btn" disabled={roundActive} aria-label="Increase bet" onclick={() => adjustBet(1)}>
        <Icon name="plus" size={16} />
      </button>
    </div>
    <!-- Quick controls: MIN · ½ · (value) · 2× · MAX on one shared CSS-grid track.
         All cells sit at equal heights/gaps, the label row above stays aligned, and
         every button commits its change in the click task itself (see
         setMinBet/setMaxBet/halveBet/doubleBet). -->
    <div class="bet-grid" role="group" aria-label="Bet amount controls" class:locked={roundActive}>
      <button type="button" class="grid-btn wide" data-bet-min disabled={roundActive} title="Minimum bet" aria-label="Minimum bet" onclick={setMinBet}>MIN</button>
      <button type="button" class="grid-btn" data-bet-half disabled={roundActive} title="Halve bet" aria-label="Halve bet" onclick={halveBet}>½</button>
      <div class="value-cell">
        <span class="value" data-bet-value>{bet.toFixed(2)}</span>
      </div>
      <button type="button" class="grid-btn" data-bet-double disabled={roundActive} title="Double bet" aria-label="Double bet" onclick={doubleBet}>2×</button>
      <button type="button" class="grid-btn wide accent" data-bet-max disabled={roundActive} title="Maximum bet" aria-label="Maximum bet" onclick={setMaxBet}>MAX</button>
    </div>
  </div>

  <div class="section">
    <span class="label label-row">
      <span class="label-inner">
        <Icon name="mines" size={14} />
        Mines Density
      </span>
      <span class="tip lock-hint" data-tip={"More mines = higher multipliers&#10;Fewer gems left to find"} tabindex="0" role="note" aria-label="More mines means higher multipliers but fewer safe gems">
        <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 10.6v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7.2" r="1.5" fill="currentColor"/></svg>
      </span>
    </span>
    <!-- MINES DENSITY: red-accent slider across the legal 1–24 range, with the
         structured density pills (1 / 5 / 10 / 15 / 20 / 24) below. Both drive
         the exact same onMinesChange handler — no new game logic. -->
    <div class="density-slider-row" class:locked={roundActive}>
      <input
        class="density-range"
        type="range"
        min="1"
        max="24"
        step="1"
        value={mines}
        disabled={roundActive}
        aria-label="Mines density slider"
        oninput={(e) => onMinesChange(Number((e.target as HTMLInputElement).value))}
      />
      <span class="density-count" aria-live="polite">{mines}<i>/24</i></span>
    </div>
    <div class="presets chips" role="group" aria-label="Mine density presets">
      {#each minePresets as m}
        <button type="button" class="chip" class:active={mines === m} disabled={roundActive} aria-pressed={mines === m} onclick={() => onMinesChange(m)}>{m}</button>
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
    background: linear-gradient(180deg, rgba(16, 21, 31, 0.94), rgba(9, 14, 22, 0.97));
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
    background: linear-gradient(90deg, transparent, rgba(0, 242, 254, 0.5), transparent);
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
    border-bottom: 1px solid rgba(0, 242, 254, 0.1);
  }
  .mult-ring {
    position: relative;
    display: grid;
    place-items: center;
    width: 108px;
    height: 108px;
    margin-top: 0.15rem;
  }
  /* Ambient halo behind the ring — static radial glow, no per-frame repaints */
  .mult-halo {
    position: absolute;
    inset: -14px;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 50%, rgba(0, 242, 254, 0.16), transparent 68%);
    pointer-events: none;
  }
  .ring-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    /* rotation lives in an inline style attribute (see markup) so GSAP can
       animate scale on this element without clobbering the -90deg offset */
  }
  .ring-track {
    fill: none;
    stroke: rgba(112, 132, 165, 0.14);
    stroke-width: 3;
  }
  .ring-fill {
    fill: none;
    stroke: var(--accent-primary);
    stroke-width: 3;
    stroke-linecap: round;
    filter: drop-shadow(0 0 4px rgba(0, 242, 254, 0.5));
    transition: stroke-dashoffset 0.4s var(--ease-out-soft);
  }
  .ring-orbit {
    position: absolute;
    inset: 8px;
    border-radius: 50%;
    border: 1px dashed rgba(0, 242, 254, 0.22);
    animation: orbit-spin 14s linear infinite;
    pointer-events: none;
  }
  /* Concentric circuit rings — decorative, transform-only (GPU composited),
     disabled under prefers-reduced-motion below. */
  .orbit {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }
  .orbit-1 {
    inset: -9px;
    border: 1px solid rgba(0, 242, 254, 0.10);
    border-top-color: rgba(0, 242, 254, 0.45);
    border-right-color: rgba(167, 139, 250, 0.35);
    animation: orbit-spin 9s linear infinite;
  }
  .orbit-2 {
    inset: -18px;
    border: 1px dotted rgba(167, 139, 250, 0.28);
    border-bottom-color: rgba(0, 242, 254, 0.4);
    animation: orbit-spin 18s linear infinite reverse;
  }
  /* Third concentric circuit ring — outermost, faint cyan sweep */
  .orbit-3 {
    inset: -27px;
    border: 1px solid rgba(0, 242, 254, 0.07);
    border-left-color: rgba(0, 242, 254, 0.32);
    animation: orbit-spin 27s linear infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .orbit-1,
    .orbit-2,
    .orbit-3,
    .ring-orbit {
      animation: none;
    }
  }
  @keyframes orbit-spin {
    to { transform: rotate(360deg); } }
  .mult-ring .mult-value {
    position: relative;
    font-weight: bold;
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 4.5vw, 1.8rem);
    color: var(--accent-secondary);
    text-shadow: 0 0 18px rgba(0, 242, 254, 0.25);
    font-variant-numeric: tabular-nums;
    /* transform/opacity only — the old `filter: brightness()` keyframe repainted
       this layer every frame of its pop-in */
    animation: mult-pop 0.38s var(--ease-out-soft);
    will-change: transform;
  }
  @keyframes mult-pop {
    0% { opacity: 0.5; transform: scale(0.92); }
    100% { opacity: 1; transform: scale(1); }
  }
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
  }
  .stat-card {
    background: linear-gradient(170deg, rgba(16, 21, 31, 0.85), rgba(9, 14, 22, 0.9));
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
    border: 1px solid rgba(112, 132, 165, 0.2);
    background: linear-gradient(165deg, #1d2840 0%, #121721 45%, #0c111a 100%);
    color: var(--text-primary);
    font-weight: 600;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 2px 6px rgba(0, 0, 0, 0.35);
    transition: transform 0.1s ease, border-color 0.15s, box-shadow 0.15s;
  }
  .stepper button:hover:not(:disabled),
  .presets button:hover:not(:disabled) {
    border-color: rgba(0, 242, 254, 0.4);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 0 12px rgba(0, 242, 254, 0.14);
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
    border-color: rgba(0, 242, 254, 0.65);
    color: var(--accent-secondary);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 0 14px rgba(0, 242, 254, 0.25);
  }

  /* ── Bet control grid (sidebar layout v2) ────────────────────────────
     One shared CSS-grid track keeps MIN / ½ / value / 2× / MAX perfectly
     aligned; every cell is a first-class button (not decorative text), and
     all motion is transform/opacity-only with durations far under 1s so a
     click reads as instant. */
  .bet-grid {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr) auto auto;
    gap: 0.35rem;
    align-items: stretch;
  }
  .bet-grid.locked {
    opacity: 0.72;
  }
  .grid-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0 0.6rem;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(112, 132, 165, 0.2);
    background: linear-gradient(165deg, #1d2840 0%, #121721 45%, #0c111a 100%);
    color: var(--text-primary);
    font-weight: 700;
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 2px 6px rgba(0, 0, 0, 0.35);
    transition: transform 0.1s ease, border-color 0.15s, box-shadow 0.15s;
  }
  .grid-btn:hover:not(:disabled) {
    border-color: rgba(0, 242, 254, 0.4);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 0 12px rgba(0, 242, 254, 0.14);
  }
  /* :active fires in the SAME frame as pointerdown — zero-JS tactile press */
  .grid-btn:active:not(:disabled) {
    transform: scale(0.94);
  }
  .grid-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .grid-btn.wide {
    min-width: 52px;
  }
  .grid-btn.accent {
    border-color: rgba(0, 242, 254, 0.35);
    color: var(--highlight-soft);
  }
  .value-cell {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem;
    min-height: 44px;
    padding: 0 0.3rem;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(112, 132, 165, 0.2);
    background: linear-gradient(180deg, rgba(9, 14, 22, 0.9), rgba(16, 21, 31, 0.85));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }
  .step-btn {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    flex-shrink: 0;
    border-radius: var(--radius-xs);
    border: 1px solid rgba(112, 132, 165, 0.22);
    background: linear-gradient(165deg, #1d2840 0%, #121721 55%, #0c111a 100%);
    color: var(--text-primary);
    padding: 0;
    transition: transform 0.1s ease, border-color 0.15s, box-shadow 0.15s;
  }
  .step-btn:hover:not(:disabled) {
    border-color: rgba(0, 242, 254, 0.45);
    box-shadow: 0 0 10px rgba(0, 242, 254, 0.16);
  }
  .step-btn:active:not(:disabled) {
    transform: scale(0.9);
  }
  .step-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .label-center {
    justify-content: center;
  }
  .label-row {
    justify-content: space-between;
    width: 100%;
  }
  .label-inner {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .lock-hint {
    display: inline-grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    color: var(--text-muted);
    cursor: help;
  }
  .lock-hint:hover {
    color: var(--highlight-soft);
  }
  /* Mines selector grid: stepper on its own row, presets in an even grid */
  .mines-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.35rem;
  }

  /* ── BET QUANTUM horizontal slider (− ● +) ─────────────────────────── */
  .quantum-slider-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.2rem 0.35rem;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(112, 132, 165, 0.18);
    background: linear-gradient(180deg, rgba(9, 14, 22, 0.9), rgba(16, 21, 31, 0.85));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }
  .quantum-slider-row.locked {
    opacity: 0.72;
  }
  .quantum-track {
    flex: 1;
    display: flex;
    align-items: center;
    min-width: 0;
  }
  .quantum-range,
  .density-range {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    margin: 0;
    border-radius: var(--radius-pill);
    background:
      linear-gradient(90deg, rgba(0, 242, 254, 0.55), rgba(0, 242, 254, 0.16)),
      rgba(112, 132, 165, 0.14);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.6);
    cursor: pointer;
    transition: box-shadow 0.15s;
  }
  .quantum-range:hover:not(:disabled) {
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.6), 0 0 10px rgba(0, 242, 254, 0.25);
  }
  .quantum-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid rgba(0, 242, 254, 0.85);
    background: radial-gradient(circle at 40% 32%, #9BFBFF, #0090A8 70%);
    box-shadow: 0 0 12px rgba(0, 242, 254, 0.5), 0 2px 6px rgba(0, 0, 0, 0.5);
    transition: transform 0.1s ease;
  }
  .quantum-range::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid rgba(0, 242, 254, 0.85);
    background: radial-gradient(circle at 40% 32%, #9BFBFF, #0090A8 70%);
    box-shadow: 0 0 12px rgba(0, 242, 254, 0.5), 0 2px 6px rgba(0, 0, 0, 0.5);
  }
  .quantum-range:active:not(:disabled)::-webkit-slider-thumb {
    transform: scale(1.15);
  }
  .quantum-range:focus-visible {
    outline: 2px solid rgba(0, 242, 254, 0.6);
    outline-offset: 4px;
  }
  .quantum-range:disabled,
  .density-range:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ── MINES DENSITY red-accent slider + live count readout ──────────── */
  .density-slider-row {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.2rem 0.5rem;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(239, 68, 68, 0.16);
    background: linear-gradient(180deg, rgba(22, 12, 16, 0.85), rgba(12, 8, 10, 0.92));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }
  .density-slider-row.locked {
    opacity: 0.72;
  }
  .density-range {
    background:
      linear-gradient(90deg, rgba(239, 68, 68, 0.6), rgba(239, 68, 68, 0.18)),
      rgba(112, 132, 165, 0.14);
  }
  .density-range:hover:not(:disabled) {
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.6), 0 0 10px rgba(239, 68, 68, 0.3);
  }
  .density-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid rgba(248, 113, 113, 0.9);
    background: radial-gradient(circle at 40% 32%, #fca5a5, #991b1b 70%);
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.55), 0 2px 6px rgba(0, 0, 0, 0.5);
    transition: transform 0.1s ease;
  }
  .density-range::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid rgba(248, 113, 113, 0.9);
    background: radial-gradient(circle at 40% 32%, #fca5a5, #991b1b 70%);
    box-shadow: 0 0 12px rgba(239, 68, 68, 0.55), 0 2px 6px rgba(0, 0, 0, 0.5);
  }
  .density-range:active:not(:disabled)::-webkit-slider-thumb {
    transform: scale(1.15);
  }
  .density-range:focus-visible {
    outline: 2px solid rgba(248, 113, 113, 0.6);
    outline-offset: 4px;
  }
  .density-count {
    font-family: var(--font-display);
    font-size: 0.95rem;
    color: var(--danger-bright);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    min-width: 3.2rem;
    text-align: right;
  }
  .density-count i {
    font-style: normal;
    font-size: 0.68rem;
    color: var(--text-muted);
    margin-left: 1px;
  }
  .chips {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0.3rem;
  }
  .chip {
    min-height: 36px;
    border-radius: var(--radius-xs);
    border: 1px solid rgba(112, 132, 165, 0.2);
    background: linear-gradient(165deg, #1d2840 0%, #121721 45%, #0c111a 100%);
    color: var(--text-primary);
    font-weight: 600;
    font-size: 0.78rem;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
    transition: transform 0.1s ease, border-color 0.15s, box-shadow 0.15s, color 0.15s;
  }
  .chip:hover:not(:disabled) {
    border-color: rgba(0, 242, 254, 0.4);
  }
  .chip:active:not(:disabled) {
    transform: scale(0.93);
  }
  .chip:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .chip.active {
    border-color: rgba(239, 68, 68, 0.65);
    color: var(--danger-bright);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 0 14px rgba(239, 68, 68, 0.28);
  }
  /* red hover tint on density pills — the section reads as a danger control */
  .chips .chip:hover:not(:disabled) {
    border-color: rgba(239, 68, 68, 0.45);
    box-shadow: 0 0 10px rgba(239, 68, 68, 0.14);
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
    background: linear-gradient(180deg, #4FACFE 0%, #00F2FE 100%);
    color: #ecfeff;
    font-size: 1.02rem;
    border: 1px solid rgba(0, 242, 254, 0.55);
    box-shadow:
      0 10px 24px rgba(0, 0, 0, 0.45),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
    transition: transform 0.12s var(--ease-out-soft), box-shadow 0.2s;
  }
  .play:hover:not(:disabled) {
    box-shadow:
      0 10px 24px rgba(0, 0, 0, 0.45),
      0 0 22px rgba(0, 242, 254, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.12);
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
    color: rgba(225, 240, 255, 0.78);
    font-weight: 600;
  }
  .energy-sweep {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(100deg, transparent 30%, rgba(103, 232, 249, 0.16) 48%, rgba(103, 232, 249, 0.22) 52%, transparent 70%);
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
    border: 2px solid rgba(238, 245, 250, 0.3);
    border-top-color: #ecfeff;
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
    background: linear-gradient(180deg, #fbbf24, #d97706);
    color: #1a1206;
    border: 1px solid rgba(253, 230, 138, 0.55);
    box-shadow:
      0 0 0 1px rgba(251, 191, 36, 0.25),
      0 10px 28px rgba(217, 119, 6, 0.45);
    animation: cashout-breathe 1.6s ease-in-out infinite;
  }
  @keyframes cashout-breathe {
    0%, 100% { box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.25), 0 10px 28px rgba(217, 119, 6, 0.45); }
    50% { box-shadow: 0 0 0 2px rgba(253, 230, 138, 0.4), 0 10px 32px rgba(217, 119, 6, 0.6); }
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
    border: 1px solid rgba(79, 172, 254, 0.45);
    background:
      radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0, 242, 254, 0.12), transparent 70%),
      linear-gradient(165deg, rgba(23, 27, 34, 0.98), rgba(8, 12, 14, 0.99));
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
    background: linear-gradient(115deg, transparent 35%, rgba(165, 243, 252, 0.08) 48%, rgba(165, 243, 252, 0.12) 52%, transparent 65%);
    transform: translateX(-70%);
    transition: transform 0.6s ease;
    pointer-events: none;
  }
  .buy:hover:not(:disabled) {
    border-color: rgba(165, 243, 252, 0.7);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 0 22px rgba(79, 172, 254, 0.2),
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
    filter: drop-shadow(0 4px 12px rgba(79, 172, 254, 0.4));
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
    border: 1px solid rgba(79, 172, 254, 0.35);
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
    background: linear-gradient(180deg, #4FACFE, #007A8F);
    color: #040a1a;
    border: none;
    border-radius: var(--radius-sm);
    min-height: 44px;
    font-weight: 700;
  }
</style>
