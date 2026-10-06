<script lang="ts">
  import { onMount } from 'svelte';
  import {
    bookToMultiplier,
    winFromBookMultiplier,
    WIN_TIER_GOOD,
  } from '@crypto-mines/shared';
  import {
    parseLaunchParams,
    RgsClient,
    normalizeRgsBaseUrl,
    displayToApi,
    apiToDisplay,
    extractRoundEvents,
    snapBetDisplayToConfig,
    logLaunchDiagnostics,
    type RgsConnectionState,
    type WalletConfig,
  } from './lib/rgs';
  import { PlaybackCoordinator } from './lib/game/playback-coordinator';
  import type { PlayerSnapshot } from './lib/game/snapshot';
  import type { VaultPickResult } from './lib/vault/types';
  import { preloadGameIcons } from './lib/icons';
  import StageBackground from './lib/components/StageBackground.svelte';
  import GameHeader from './lib/components/GameHeader.svelte';
  import HeroPitch from './lib/components/HeroPitch.svelte';
  import GameBoard from './lib/components/GameBoard.svelte';
  import FeatureEducation from './lib/components/FeatureEducation.svelte';
  import ControlPanel from './lib/components/ControlPanel.svelte';
  import ChainMeter from './lib/components/ChainMeter.svelte';
  import VaultBonusScene from './lib/components/VaultBonusScene.svelte';
  import RulesModal from './lib/components/RulesModal.svelte';
  import Icon from './lib/components/Icon.svelte';
  import LoadingShell from './lib/components/LoadingShell.svelte';
  import WinCelebration from './lib/components/WinCelebration.svelte';
  import { setSoundEnabled, getSoundSettings } from './lib/sound/sound-manager';
  import { playDeltaSounds } from './lib/game/event-sounds';

  const launch = parseLaunchParams(window.location.search);
  let client: RgsClient | null = null;
  let clientInitError = '';

  try {
    if (!launch.replay) {
      const base = normalizeRgsBaseUrl(launch.rgs_url);
      client = new RgsClient(base, launch.sessionID, launch.lang);
    } else {
      client = new RgsClient(normalizeRgsBaseUrl(launch.rgs_url || '/api/rgs'), launch.sessionID, launch.lang);
    }
  } catch (e) {
    clientInitError = e instanceof Error ? e.message : String(e);
  }

  const playback = new PlaybackCoordinator();

  let snap = $state<PlayerSnapshot>(playback.getSnapshot() as PlayerSnapshot);
  let balance = $state(0);
  let bet = $state(1);
  let mines = $state(5);
  let loading = $state(true);
  let replayMode = $state(!!launch.replay);
  let roundActive = $state(false);
  let vaultData = $state<unknown>(null);
  let vaultTitle = $state('BONUS UNLOCKED');
  let vaultVariant = $state<'organic' | 'buy'>('organic');
  let vaultTheatreActive = $state(false);
  let soundOn = $state(true);
  let rulesOpen = $state(false);
  let errorMsg = $state('');
  let pickInFlight = $state(false);
  /** In-flight board pick request (plain flag: guards without re-rendering). */
  let activePickCell: number | null = null;
  /**
   * Purely cosmetic idle affordance for the NEXT pick target. It must NEVER
   * gate interaction: gating on it (or on any in-flight network request) is
   * what made tiles feel unresponsive while the previous pick was still being
   * confirmed. Click-time dedupe lives in AnimationController.pendingReveals
   * and single-flight for the server decision lives in App.onPick's guard —
   * both synchronous, zero-latency checks.
   */
  let pickingCell = $state<number | null>(null);
  let playInFlight = $state(false);
  let endingRound = $state(false);
  let connectionState = $state<RgsConnectionState>('AUTHENTICATING');
  let walletConfig = $state<WalletConfig | null>(null);
  let showWin = $state(false);
  /** On-board loss banner (NO blocking modal). Auto-dismisses and resets. */
  let lossBanner = $state(false);
  let lossPotential = $state(0);
  let lossBet = $state(0);
  let boardLost = $state(false);
  let lossResetTimer: ReturnType<typeof setTimeout> | undefined;
  let winDisplayMult = $state(0);
  let winDisplayPayout = $state(0);
  let winChainBonusBook = $state(0);
  let chainPulse = $state(0);

  const reducedMotionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = () => reducedMotionMq.matches;

  // Memoize the stable callbacks passed to children. Previously inline arrow
  // props re-created every render, and App re-renders on EVERY snapshot
  // emission (each pick/animation step), which forced ControlPanel /
  // GameHeader / GameBoard / FeatureEducation to re-evaluate their bodies and
  // cascade updates they did not need.
  const openRules = () => (rulesOpen = true);
  const closeRules = () => (rulesOpen = false);
  const handleBetChange = (v: number) => {
    if (walletConfig) bet = snapBetDisplayToConfig(v, walletConfig);
    else bet = v;
  };
  const handleMinesChange = (v: number) => (mines = v);

  playback.subscribe((s) => {
    snap = s as PlayerSnapshot;
    if (s.vault) vaultData = s.vault;
    if (s.inVaultBonus) {
      vaultTheatreActive = true;
    } else if (!s.inVaultBonus) {
      vaultTheatreActive = false;
    }
  });

  const totalBook = $derived(snap.multiplierBook + snap.chainBonusBook);
  const multiplier = $derived(bookToMultiplier(snap.multiplierBook));
  const potential = $derived(winFromBookMultiplier(bet, totalBook));
  const showVaultScene = $derived(vaultTheatreActive && vaultData && !replayMode);
  const canCashOut = $derived(
    roundActive && snap.safePicks > 0 && !snap.inVaultBonus && !snap.terminal && !showVaultScene,
  );
  const boardInteractionBlocked = $derived(
    !roundActive ||
      snap.terminal ||
      replayMode ||
      snap.buyMode ||
      snap.inVaultBonus ||
      showVaultScene,
  );
  /** Server session is authenticated and idle — new play/buy allowed. */
  const rgsReadyForNewBet = $derived(
    !replayMode &&
      !!client?.isAuthenticated &&
      connectionState !== 'AUTHENTICATING' &&
      connectionState !== 'AUTH_FAILED' &&
      !client?.isServerRoundActive,
  );

  const canPlaceBets = $derived(
    rgsReadyForNewBet && !roundActive && !playInFlight && !endingRound,
  );

  function bumpFxFromDelta(delta: import('@crypto-mines/shared').GameEvent[]) {
    for (const ev of delta) {
      const type = String(ev.type).toLowerCase();
      if (type === 'reveal' && ev.chainStreakComplete) chainPulse += 1;
      if (type === 'multiplierupdate' && ev.chainStreakComplete) chainPulse += 1;
    }
  }

  async function applyEvents(events: import('@crypto-mines/shared').GameEvent[], animate: boolean) {
    // Defensive guard: a malformed/absent payload must never reach the slice /
    // ingest pipeline — indexing an undefined events array was the source of
    // "Cannot read properties of undefined (reading '0')".
    if (!Array.isArray(events)) return;
    const prev = playback.getEventCount();
    const delta = events.slice(prev);
    bumpFxFromDelta(delta);
    await playback.ingest(events, {
      animate,
      reducedMotion: reducedMotion(),
      onChainComplete: () => {
        chainPulse += 1;
      },
    });
    playDeltaSounds(delta);
  }

  /** Safe per-cell state lookup for template/logic use (no raw `snap.cells[i]`). */
  const cellStateAt = (index: number) => playback.getCellState(index);

  function applyWalletBalance(amount: number) {
    balance = apiToDisplay(amount);
  }

  async function restoreActiveRound(round: import('./lib/rgs').RgsRoundPayload) {
    const events = extractRoundEvents(round);
    if (events.length === 0) {
      errorMsg =
        'Active round could not be restored (no event data from RGS). Reload or contact support.';
      console.error('[RGS] resume failed: round.active but no events in round.state');
      return false;
    }
    if (import.meta.env.DEV && typeof round.event === 'string') {
      console.info('[RGS] restore round.event checkpoint', round.event);
    }
    if (typeof round.amount === 'number' && round.amount > 0) {
      bet = apiToDisplay(round.amount);
    }
    playback.hydrate(events);
    await applyEvents(events, false);
    roundActive = true;
    connectionState = 'ROUND_ACTIVE';
    if (round.mode === 'buyVault') {
      vaultVariant = 'buy';
      vaultTheatreActive = true;
    }
    return true;
  }

  async function load() {
    loading = true;
    errorMsg = clientInitError;
    try {
      if (!client) {
        connectionState = 'AUTH_FAILED';
        return;
      }
      if (replayMode && launch.event) {
        const data = await client.fetchReplay(
          launch.game!,
          launch.version!,
          launch.mode!,
          launch.event,
        );
        playback.hydrate(extractRoundEvents(data.round));
        await applyEvents(extractRoundEvents(data.round), !reducedMotion());
        connectionState = 'ROUND_COMPLETE';
      } else {
        connectionState = 'AUTHENTICATING';
        const auth = await client.authenticate();
        connectionState = client.connectionState;
        walletConfig = auth.config;
        applyWalletBalance(auth.balance.amount);
        bet = snapBetDisplayToConfig(bet, auth.config);
        if (auth.config.betLevels.length > 0) {
          const idx = auth.config.defaultBetLevel;
          if (idx >= 0 && idx < auth.config.betLevels.length) {
            bet = apiToDisplay(auth.config.betLevels[idx]!);
          }
        }
        soundOn = getSoundSettings().enabled;
        if (auth.round?.active) {
          const resumed = await restoreActiveRound(auth.round);
          if (!resumed) {
            connectionState = 'AUTHENTICATED';
          }
        }
        console.info(`[RGS] gameReady = ${client.isAuthenticated}`);
        console.info(`[RGS] canPlay = ${rgsReadyForNewBet}`);
        console.info(`[RGS] canPlaceBets = ${canPlaceBets}`);
      }
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
      connectionState = 'AUTH_FAILED';
      console.error('[RGS] auth state: failed', errorMsg);
      console.info('[RGS] RGS connection failed. Check browser console and Network → wallet/authenticate.');
    } finally {
      loading = false;
    }
  }

  function startRound() {
    if (!client || !canPlaceBets) return;
    // Zero-latency feedback: commit the pending visual state SYNCHRONOUSLY in
    // the click task (same frame as pointerdown), before any await. The board
    // resets immediately and the button shows its spinner instantly — the
    // player never stares at a frozen UI while /bet/action round-trips.
    playInFlight = true;
    playback.resetRound();
    showWin = false;
    clearLossState();
    vaultTheatreActive = false;
    void (async () => {
      try {
        const amountApi = displayToApi(bet);
        const res = await client!.play(amountApi, mines, 'base');
        applyWalletBalance(res.balance.amount);
        roundActive = true;
        connectionState = client!.connectionState;
        vaultVariant = 'organic';
        vaultTitle = 'BONUS UNLOCKED';
        await applyEvents(extractRoundEvents(res.round), true);
      } catch (e) {
        errorMsg = e instanceof Error ? e.message : String(e);
      } finally {
        playInFlight = false;
      }
    })();
  }

  async function startBuyVault() {
    if (!client || !canPlaceBets) return;
    // Same synchronous-first pattern as startRound: instant visual response.
    playInFlight = true;
    playback.resetRound();
    showWin = false;
    clearLossState();
    void (async () => {
      try {
        const amountApi = displayToApi(bet);
        const res = await client!.play(amountApi, mines, 'buyVault');
        applyWalletBalance(res.balance.amount);
        roundActive = true;
        connectionState = client!.connectionState;
        vaultVariant = 'buy';
        vaultTitle = 'BONUS UNLOCKED';
        vaultTheatreActive = true;
        await applyEvents(extractRoundEvents(res.round), true);
      } catch (e) {
        errorMsg = e instanceof Error ? e.message : String(e);
      } finally {
        playInFlight = false;
      }
    })();
  }

  async function onPick(cellIndex: number) {
    // Synchronous, zero-latency guards — no awaits before the visual response.
    if (
      !client ||
      boardInteractionBlocked ||
      snap.terminal ||
      pickInFlight ||
      cellIndex === activePickCell
    ) {
      return;
    }
    // Single-flight for the SERVER decision only. The tile itself is NOT
    // disabled during the round-trip anymore: gating every pick behind the
    // previous network response was the dominant "click → wait → open" delay.
    // Duplicate/rapid re-clicks are still impossible (this guard + the hidden
    // state check in Tile), so no duplicate requests or race conditions.
    pickInFlight = true;
    activePickCell = cellIndex;
    // Immediate, same-frame visual response while the RGS response is in
    // flight: GSAP press/pop + lid-flip driven directly on the cached tile DOM
    // node (transform/opacity only). Presentation-only — the authoritative
    // flip still happens when server events arrive; a mine result rewinds the
    // cosmetic tween before the explosion plays. No game state changes here.
    playback.beginTilePickFx(cellIndex);
    try {
      const res = await client.inRoundDecision({ action: 'pick', cellIndex });
      applyWalletBalance(res.balance.amount);
      await applyEvents(extractRoundEvents(res.round), true);
      connectionState = client.connectionState;
      if (snap.inVaultBonus) vaultTheatreActive = true;
      await finishRoundIfNeeded();
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    } finally {
      pickInFlight = false;
      activePickCell = null;
      pickingCell = null;
    }
  }

  async function handleVaultPick(index: number): Promise<VaultPickResult> {
    if (!client) throw new Error('RGS not connected');
    const baseMult = multiplier;
    const res = await client.inRoundDecision({ action: 'vaultPick', vaultIndex: index });
    applyWalletBalance(res.balance.amount);
    await applyEvents(extractRoundEvents(res.round), !reducedMotion());
    connectionState = client.connectionState;
    const finalMult = bookToMultiplier(snap.multiplierBook);
    const payout =
      snap.terminal && snap.payoutBook > 0
        ? winFromBookMultiplier(bet, snap.payoutBook)
        : winFromBookMultiplier(bet, snap.multiplierBook);
    return { baseMult, finalMult, payout, terminal: snap.terminal };
  }

  function onVaultTheatreComplete() {
    vaultTheatreActive = false;
    void finishRoundIfNeeded();
  }

  async function onCashout() {
    if (!client || !canCashOut) return;
    // Immediate button feedback IN THE SAME TASK as the click — a transform-only
    // GSAP press that never touches game state. Previously the button gave zero
    // visual response until the /bet/action round-trip resolved, which read as
    // "frozen interface". Backend validation and payout logic are untouched.
    const cashBtn = document.querySelector('[data-cashout-btn]') as HTMLElement | null;
    playback.beginCashoutPressFx(cashBtn);
    pickInFlight = true;
    try {
      const res = await client.inRoundDecision({ action: 'cashout' });
      applyWalletBalance(res.balance.amount);
      await applyEvents(extractRoundEvents(res.round), true);
      connectionState = client.connectionState;
      await playback.playCashout(
        document.querySelector('[data-multiplier-display]'),
        document.querySelector('[data-cashout-btn]'),
        document.querySelector('[data-cashout-btn] .amt'),
      );
      await finishRoundIfNeeded(true);
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
    } finally {
      pickInFlight = false;
    }
  }

  async function finishRoundIfNeeded(fromCashout = false) {
    if (!client || !snap.terminal) return;
    const mult = bookToMultiplier(snap.payoutBook);
    const payout = winFromBookMultiplier(bet, snap.payoutBook);

    if (snap.payoutBook > 0) {
      if (mult >= WIN_TIER_GOOD) {
        winDisplayMult = mult;
        winDisplayPayout = payout;
        winChainBonusBook = snap.chainBonusBook;
        showWin = true;
      }
      if (client.isServerRoundActive) {
        endingRound = true;
        try {
          const end = await client.endRound();
          applyWalletBalance(end.balance.amount);
          connectionState = client.connectionState;
        } catch (e) {
          errorMsg = e instanceof Error ? e.message : String(e);
          return;
        } finally {
          endingRound = false;
        }
      }
    } else {
      // Loss is communicated ON THE BOARD: danger tint + non-blocking banner.
      // The RGS end-round call below already settled the wallet, so after a
      // short transition we wipe the disclosed board back to idle — the
      // player can immediately press START ROUND. No popup, no confirmation.
      lossBet = bet;
      lossPotential = winFromBookMultiplier(bet, snap.multiplierBook + snap.chainBonusBook);
      boardLost = true;
      lossBanner = true;
      clearTimeout(lossResetTimer);
      lossResetTimer = setTimeout(() => {
        lossBanner = false;
        boardLost = false;
        playback.resetRound();
      }, reducedMotion() ? 450 : 900);
    }

    roundActive = false;
    connectionState = client.connectionState;
    if (fromCashout && client.isAuthenticated) {
      try {
        const auth = await client.authenticate();
        applyWalletBalance(auth.balance.amount);
      } catch {
        /* balance already updated from end-round */
      }
    }
  }

  function clearLossState() {
    clearTimeout(lossResetTimer);
    lossBanner = false;
    boardLost = false;
  }

  function toggleSound() {
    soundOn = !soundOn;
    setSoundEnabled(soundOn);
  }

  function onSpaceAction(e: KeyboardEvent) {
    if (e.code !== 'Space' && e.key !== ' ') return;
    const t = e.target as HTMLElement | null;
    if (t?.closest('input, textarea, select, button, [role="dialog"]')) return;
    if (loading || replayMode || rulesOpen || showVaultScene) return;
    e.preventDefault();
    if (canCashOut) void onCashout();
    else if (canPlaceBets) void startRound();
  }

  onMount(() => {
    logLaunchDiagnostics(launch);
    console.info('[RGS] auth state: initial');
    void load();
    // Warm the tile-glyph image/decode caches at app init so the first reveal
    // of any symbol never triggers a fetch or decode at click time.
    preloadGameIcons();
    window.addEventListener('keydown', onSpaceAction);
    return () => {
      window.removeEventListener('keydown', onSpaceAction);
      clearTimeout(lossResetTimer);
    };
  });
</script>

<StageBackground />

{#if showVaultScene}
  <VaultBonusScene
    data={vaultData}
    title={vaultTitle}
    variant={vaultVariant}
    {bet}
    onPick={handleVaultPick}
    onComplete={onVaultTheatreComplete}
  />
{/if}

<WinCelebration
  multiplier={winDisplayMult}
  payout={winDisplayPayout}
  chainBonusBook={winChainBonusBook}
  active={showWin}
/>

<main class="shell" class:dimmed={showVaultScene}>
  {#if loading}
    <LoadingShell />
  {:else}
    <GameHeader {balance} {soundOn} onToggleSound={toggleSound} onRules={openRules} />

    {#if errorMsg || connectionState === 'AUTH_FAILED'}
      <p class="error" role="alert">
        {errorMsg || 'Unable to connect to the game server. Check rgs_url and sessionID.'}
      </p>
    {/if}

    <div class="layout">
      <aside class="controls-col">
        <ControlPanel
          {bet}
          {balance}
          {mines}
          {multiplier}
          {potential}
          {replayMode}
          {roundActive}
          terminal={snap.terminal}
          {canCashOut}
          buyMode={snap.buyMode}
          {canPlaceBets}
          chainStreak={snap.chainStreak}
          pulseGen={chainPulse}
          starting={playInFlight}
          walletConfig={walletConfig}
          onBetChange={handleBetChange}
          onMinesChange={handleMinesChange}
          onStart={startRound}
          onCashout={onCashout}
          onBuyVault={startBuyVault}
        />
      </aside>

      <section class="board-col">
        <div class="chain-desktop">
          <ChainMeter chainStreak={snap.chainStreak} pulseGen={chainPulse} />
        </div>
        <HeroPitch />
        <div class="stage" data-game-stage class:lost={boardLost}>
          <div class="vault-dim" data-vault-dim aria-hidden="true"></div>
          <div class="loss-tint" aria-hidden="true"></div>
          <GameBoard
            cells={snap.cells}
            disabled={boardInteractionBlocked}
            {pickingCell}
            onpick={onPick}
          />
          {#if lossBanner}
            <!-- Non-blocking, auto-dismissing on-board loss state (no modal). -->
            <div class="loss-banner" role="status">
              <span class="lb-icon"><Icon name="mine" size={26} /></span>
              <span class="lb-text">
                <strong>Round Lost</strong>
                <small>Mine hit · Bet {lossBet.toFixed(2)} · Missed {lossPotential.toFixed(2)}</small>
              </span>
            </div>
          {/if}
        </div>
        <FeatureEducation chainStreak={snap.chainStreak} vaultTokens={snap.vaultTokensCollected} />
      </section>
    </div>

    <RulesModal open={rulesOpen} onClose={() => (rulesOpen = false)} />
  {/if}
</main>

<style>
  .shell {
    max-width: 1180px;
    margin: 0 auto;
    padding: var(--space-md) var(--space-lg) calc(var(--space-xl) + var(--safe-bottom));
    min-height: 100dvh;
    transition: opacity 0.35s ease;
  }
  .shell.dimmed {
    opacity: 0.35;
    pointer-events: none;
  }
  .layout {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }
  .board-col {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }
  .stage {
    position: relative;
  }
  .vault-dim {
    position: absolute;
    inset: -8px;
    border-radius: var(--radius-lg);
    background: rgba(5, 8, 12, 0.55);
    opacity: 0;
    pointer-events: none;
    z-index: 2;
  }
  /* On-board loss reaction — subtle danger tint over the board, never a popup */
  .loss-tint {
    position: absolute;
    inset: 0;
    border-radius: var(--radius-lg);
    background: radial-gradient(circle at 50% 45%, rgba(0, 240, 255, 0.1), rgba(10, 30, 80, 0.22) 78%);
    box-shadow: inset 0 0 42px rgba(0, 240, 255, 0.16);
    opacity: 0;
    pointer-events: none;
    z-index: 3;
    transition: opacity 0.35s ease;
  }
  .stage.lost .loss-tint {
    opacity: 1;
  }
  .loss-banner {
    position: absolute;
    left: 50%;
    bottom: 14px;
    transform: translateX(-50%);
    z-index: 6;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.5rem 0.9rem;
    border-radius: 999px;
    background: linear-gradient(160deg, rgba(16, 24, 42, 0.92), rgba(8, 13, 20, 0.92));
    border: 1px solid rgba(0, 240, 255, 0.45);
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55), 0 0 18px rgba(0, 240, 255, 0.18);
    animation: banner-in 0.32s var(--ease-out-soft) both;
    pointer-events: none;
  }
  .loss-banner .lb-icon {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: rgba(0, 240, 255, 0.12);
    animation: lb-pulse 0.9s ease-out 1;
  }
  .loss-banner .lb-text {
    display: flex;
    flex-direction: column;
    line-height: 1.25;
  }
  .loss-banner strong {
    font-family: var(--font-display);
    font-size: 0.95rem;
    letter-spacing: 0.06em;
    color: #fca5a5;
  }
  .loss-banner small {
    color: var(--text-muted);
    font-size: 0.72rem;
  }
  @keyframes banner-in {
    from { opacity: 0; transform: translateX(-50%) translateY(14px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }
  @keyframes lb-pulse {
    0% { box-shadow: 0 0 0 0 rgba(0, 240, 255, 0.5); }
    100% { box-shadow: 0 0 0 14px rgba(0, 240, 255, 0); }
  }
  .error {
    color: var(--danger);
    text-align: center;
  }
  /* Mobile/tablet (<1024px): chain rail lives inside the control panel slot */
  .chain-desktop {
    display: none;
  }
  @media (min-width: 1024px) {
    .chain-desktop {
      display: block;
    }
    .controls-col :global(.chain-slot) {
      display: none;
    }
    .layout {
      flex-direction: row;
      align-items: flex-start;
    }
    .board-col {
      flex: 1.2;
      order: 1;
    }
    .controls-col {
      flex: 0 0 340px;
      position: sticky;
      top: var(--space-md);
      order: 2;
    }
  }
  @media (max-width: 480px) {
    .shell {
      padding-left: var(--space-md);
      padding-right: var(--space-md);
    }
  }
</style>
