<script lang="ts">
  import type { BoardViewCell } from '../game/snapshot';
  import { symbolIcon, iconSrc } from '../icons';


  interface Props {
    cell: BoardViewCell;
    disabled: boolean;
    onpick: (index: number) => void;
  }
  let { cell, disabled, onpick }: Props = $props();

  /**
   * IMPORTANT: the server's `symbol` field is a free-text flavour string
   * (e.g. "Bitcoin"), NOT the registry key. The canonical CryptoSymbolId
   * (BTC / ETH / SOL / USDT / DIAMOND / VAULT) lives in `data-symbol`, which
   * apply-event.ts always writes uppercase. We normalize defensively here so
   * any casing / naming variant still resolves to a local SVG.
   */
  function normalizeSymbol(raw: string | null | undefined): string {
    const s = String(raw ?? '').toUpperCase().replace(/[^A-Z]/g, '');
    if (!s) return '';
    if (s.startsWith('BTC') || s.startsWith('BITCOIN')) return 'BTC';
    if (s.startsWith('ETH') || s.startsWith('ETHEREUM')) return 'ETH';
    if (s.startsWith('SOL')) return 'SOL';
    if (s.startsWith('USDT') || s.startsWith('TETHER')) return 'USDT';
    if (s.startsWith('DIAMOND')) return 'DIAMOND';
    if (s.startsWith('VAULT')) return 'VAULT';
    if (s.startsWith('MINE')) return 'MINE';
    return s;
  }

  const symId = $derived(normalizeSymbol(cell.symbol));
  // Drives the symbol-specific glow/burst gradients in <style> (e.g. "sym-btc").
  const symClass = $derived(symId ? `sym-${symId.toLowerCase()}` : '');
  // ALWAYS resolve through the registry to an imported SVG asset URL.
  // `icon` can never be a bare name like "bitcoin" — iconSrc() returns the
  // Vite-imported URL (or undefined, in which case no <img> renders at all).
  const icon = $derived(iconSrc(cell.state === 'mine' ? 'mine' : symbolIcon(symId)));

  let pressing = $state(false);

  function handleClick() {
    if (disabled || cell.state !== 'hidden') return;
    // Start the tactile press transform synchronously in the pointer/click
    // task itself. Previously only `pointerdown` set this — on touch devices
    // where pointer events are dispatched late (or suppressed by scroll
    // heuristics), the tile had no visual response until the server round-trip
    // completed, which is exactly the "click → wait → open" lag. Now every
    // click path paints a pressed pose within the same frame as the event.
    pressing = true;
    ownPickPending = true;
    onpick(cell.index);
  }

  function handlePointerDown() {
    if (pressing) return;
    // Synchronous state write inside the pointerdown task: Svelte flushes the
    // `press` class in this same frame, so the tactile transform commits with
    // zero lag — no rAF deferral (which pushed the response a full frame late),
    // no extra DOM mutation pass.
    pressing = true;
  }

  function releasePress() {
    if (!pressing) return;
    pressing = false;
  }

  /**
   * One-shot entrance for tiles that flip open via post-loss disclosure
   * (ghost/final reveals). The PLAYER-PICKED tile does NOT use this path: its
   * tactile press AND lid flip start synchronously at click time (see
   * App.onPick -> playback.beginTilePickFx), so the square visibly opens in the
   * same frame as the pointer event; the confirming snapshot below only has to
   * render the icon, which it does immediately.
   */
  let justRevealed = $state(false);
  // True while the player's own pick is awaiting server confirmation. The
  // optimistic press/flip for this tile is driven by GSAP (App.onPick ->
  // playback.beginTilePickFx); the CSS entrance below must NOT also fire on it,
  // or two animations fight over the same lid transform and the reveal reads as
  // a stutter/delay. Set synchronously in handleClick — before any await — so
  // the flag is always in place when the confirming snapshot emit re-renders.
  let ownPickPending = $state(false);
  let firstRun = true;
  // Cache the last observed state so this effect performs zero work on every
  // snapshot emission (the parent re-renders all tiles per event; previously
  // each of the 25 tiles ran `cell.state !== 'hidden'` bookkeeping each time).
  let lastState: BoardViewCell['state'] | null = null;
  $effect(() => {
    const revealed = cell.state !== 'hidden';
    if (firstRun) {
      firstRun = false;
      lastState = cell.state;
      // Hydrated/resumed rounds should not replay entrance animations.
      return;
    }
    if (cell.state === lastState) return;
    const wasHidden = lastState === 'hidden';
    lastState = cell.state;
    if (!revealed) {
      justRevealed = false;
      ownPickPending = false;
      return;
    }
    if (wasHidden && !justRevealed) {
      const mineOwnPick = ownPickPending;
      ownPickPending = false;
      if (!mineOwnPick) {
        // Zero-timer entrance: the `both` fill on the keyframes holds the final
        // resting pose, and `.tile.just-revealed` only ever matches during the
        // hidden→revealed transition itself (a new pick re-enters with the flag
        // false). The previous 700ms setTimeout existed only to unmount the
        // class — pure artificial latency plus a needless reactive write; gone.
        justRevealed = true;
      } else {
        // Player-picked tile: its lid was ALREADY flipped open at click time by
        // the GSAP pending tween (beginTilePickFx). The committed snapshot now
        // toggles the lid's inline `visibility:hidden`, but a still-in-flight
        // tween would keep writing inline opacity/transform afterwards and
        // could leave stale values on the node if the tween is killed mid-way
        // (e.g. rapid cash-out). Drop those leftovers synchronously in THIS
        // pre-paint flush so the CSS visibility rule wins deterministically —
        // the icon itself renders in this exact pass, with zero waiting.
        clearLidInlinePose();
      }
    }
  });

  function clearLidInlinePose() {
    if (typeof document === 'undefined') return;
    const el = tileEl;
    const lid = el?.querySelector('.tile-lid') as HTMLElement | null;
    if (lid?.style.length) {
      lid.style.removeProperty('transform');
      lid.style.removeProperty('opacity');
    }
  }

  let tileEl = $state<HTMLButtonElement | undefined>();
</script>

<button
  type="button"
  bind:this={tileEl}
  class="tile {symClass}"
  class:revealed={cell.state !== 'hidden'}
  class:safe={cell.state === 'safe'}
  class:mine={cell.state === 'mine'}
  class:ghost={cell.ghost === true}
  class:vault={symId === 'VAULT' && cell.state === 'safe'}
  class:just-revealed={justRevealed}
  data-tile-index={cell.index}
  data-symbol={symId || (cell.symbol ?? '')}
  disabled={disabled || cell.state !== 'hidden'}
  aria-label={cell.state === 'hidden' ? `Reveal tile ${cell.index + 1}` : `Tile ${cell.index + 1}`}
  onpointerdown={handlePointerDown}
  onpointerup={releasePress}
  onpointerleave={releasePress}
  onclick={handleClick}
>
  <span class="tile-well" aria-hidden="true"></span>
  <canvas class="tile-fx" aria-hidden="true"></canvas>
  <span class="tile-inner" class:press={pressing}>
    <span class="tile-bevel" aria-hidden="true"></span>
    <span class="tile-glow" aria-hidden="true"></span>
    <span class="tile-burst" aria-hidden="true"></span>
    <!-- Lid: the premium Crypto Mines tile back. Stays mounted while revealing so
         GSAP can flip it away; hidden only once fully revealed. -->
    <span class="tile-lid" aria-hidden="true" style:visibility={cell.state === 'hidden' ? 'visible' : (justRevealed ? 'visible' : 'hidden')}>
      <span class="back-mark">
        <svg viewBox="0 0 64 64" width="58%" height="58%">
          <g fill="none" stroke="var(--primary)" stroke-width="2.2" opacity=".55">
            <polygon points="32,10 52,22 52,42 32,54 12,42 12,22" />
            <polygon points="32,20 43,27 43,37 32,44 21,37 21,27" opacity=".7" />
          </g>
          <circle cx="32" cy="32" r="4.2" fill="#19E3E3" opacity=".5" />
          <path d="M32 10v10M32 44v10M12 22l9 5M43 27l9-5M12 42l9-5M43 37l9 5" stroke="var(--primary)" stroke-width="1.4" opacity=".35" />
        </svg>
      </span>
    </span>
    {#if cell.state !== 'hidden' && icon}
      <!-- ICON RENDERING IS NEVER GATED ON ANIMATION OR NETWORK: this branch
           flips in the exact synchronous commit of the authoritative snapshot
           (applyEventsToSnapshot -> emit), and the asset URL comes from the
           build-time-imported SVG registry (icons.ts) — already in the HTTP/
           module cache long before gameplay, preloaded below at app init. The
           optional CSS entrance (`just-revealed`) starts on frame 1 with zero
           animation-delay and its keyframes end in the icon's natural resting
           pose, so pixels are never held back behind a timer. -->
      <span class="sym-wrap" class:vault-sym={symId === 'VAULT'} class:mine-sym={cell.state === 'mine'}>
        <img class="sym" src={icon} alt={cell.state === 'mine' ? 'Mine' : symId} decoding="sync" fetchpriority="high" />
      </span>
    {/if}
  </span>
</button>

<style>
  .tile {
    aspect-ratio: 1;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 12px;
    position: relative;
    -webkit-tap-highlight-color: transparent;
  }
  .tile:disabled {
    cursor: default;
  }
  /* the recessed SOCKET each tile sits in — darker than the board floor with a
     deep inset shadow, so the tile reads as rising out of a hole */
  .tile-well {
    position: absolute;
    inset: 0;
    border-radius: 12px;
    background: #020d12;
    box-shadow:
      inset 0 4px 10px rgba(0, 0, 0, 0.9),
      inset 0 -2px 5px rgba(0, 0, 0, 0.6),
      inset 0 0 0 1px rgba(0, 0, 0, 0.5);
    pointer-events: none;
  }
  /* LAYER 1 — OUTER METAL BEZEL (the raised 3D box itself). GSAP animates this
     node's transform (press / hover lift / flip), so all resting depth lives in
     box-shadow, never in transform. */
  .tile-inner {
    display: grid;
    place-items: center;
    width: calc(100% - 6px);
    height: calc(100% - 8px);
    margin: 3px 3px 5px;
    border-radius: 10px;
    position: relative;
    will-change: transform;
    backface-visibility: hidden;
    transform-style: preserve-3d;
    /* brushed-metal bezel gradient + 4px frame thickness via padding */
    background: linear-gradient(145deg, #8fa7b1 0%, #4d6672 35%, #24363f 70%, #3a525e 100%);
    padding: 4px;
    box-shadow:
      0 6px 0 #0d1c23,                      /* thick bottom edge = physical height */
      0 10px 16px rgba(0, 0, 0, 0.7),       /* drop shadow cast into the socket    */
      inset 0 1px 0 rgba(255, 255, 255, 0.45),  /* top bevel highlight             */
      inset 0 -2px 3px rgba(0, 0, 0, 0.6);      /* bottom inner shade              */
    transition: filter 0.2s ease, box-shadow 0.2s ease;
  }
  /* GPU layer is only needed while a tile is actually interactive. Once the
     cell is revealed its pose is final, so we release the composited layer —
     25 permanent promoted layers forced full-board re-composite work during
     every reveal animation on low-powered devices. */
  .tile:disabled .tile-inner {
    will-change: auto;
  }
  /* Hover: the whole box lifts out of its socket */
  .tile:not(:disabled):hover .tile-inner {
    translate: 0 -2px;
    filter: brightness(1.12);
    box-shadow:
      0 8px 0 #0d1c23,
      0 14px 22px rgba(0, 0, 0, 0.75),
      0 0 14px var(--cyan-glow),
      inset 0 1px 0 rgba(255, 255, 255, 0.45),
      inset 0 -2px 3px rgba(0, 0, 0, 0.6);
  }
  .tile:not(:disabled):hover .back-mark {
    opacity: 0.95;
  }
  /* Pressed: sinks into the socket */
  .tile-inner.press {
    translate: 0 2px;
    scale: 0.97;
    box-shadow:
      0 2px 0 #0d1c23,
      0 4px 8px rgba(0, 0, 0, 0.6),
      inset 0 3px 10px rgba(0, 0, 0, 0.55);
  }
  /* LAYER 2 — INNER TEAL GLASS PANEL filling the bezel opening (inset 4px) */
  .tile-bevel {
    position: absolute;
    inset: 4px;
    border-radius: 7px;
    pointer-events: none;
    border: 1px solid #0b3a43;
    background:
      radial-gradient(circle at 30% 20%, rgba(130, 255, 255, 0.35) 0%, transparent 45%),
      linear-gradient(160deg, #23a1ab 0%, #146974 45%, #0a3c47 100%);
    box-shadow:
      inset 0 2px 4px rgba(255, 255, 255, 0.35),
      inset 0 -6px 10px rgba(0, 0, 0, 0.45),
      inset 0 0 0 1px rgba(0, 0, 0, 0.5);
  }
  /* Tiny dark screws in the metal bezel corners (pure CSS, zero extra DOM) */
  .tile-inner::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 10px;
    pointer-events: none;
    background-image:
      radial-gradient(circle, rgba(2, 8, 12, 0.85) 0 1.5px, transparent 2px),
      radial-gradient(circle, rgba(2, 8, 12, 0.85) 0 1.5px, transparent 2px),
      radial-gradient(circle, rgba(2, 8, 12, 0.85) 0 1.5px, transparent 2px),
      radial-gradient(circle, rgba(2, 8, 12, 0.85) 0 1.5px, transparent 2px);
    background-position: 7px 7px, calc(100% - 7px) 7px, 7px calc(100% - 7px), calc(100% - 7px) calc(100% - 7px);
    background-size: 6px 6px;
    background-repeat: no-repeat;
  }
  /* LAYER 3 — GLOSS SHINE: diagonal soft white reflection over the glass panel */
  .tile-inner::before {
    content: '';
    position: absolute;
    inset: 4px;
    border-radius: 7px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 40%, transparent 41%);
    pointer-events: none;
    z-index: 2;
  }
  .tile-glow {
    position: absolute;
    inset: 4px;
    border-radius: 7px;
    opacity: 0;
    pointer-events: none;
    z-index: 4;
    background: radial-gradient(circle at 50% 30%, var(--glow-blue), transparent 70%);
  }
  .tile.vault .tile-glow {
    background: radial-gradient(circle at 50% 30%, var(--glow-hot), transparent 70%);
  }
  .tile.mine .tile-glow {
    background: radial-gradient(circle at 50% 50%, rgba(229, 48, 63, 0.5), transparent 72%);
    opacity: 0.9;
  }
  .tile-fx {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 5;
  }
  .tile-burst {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    background: radial-gradient(circle, rgba(25, 227, 227, 0.3), transparent 65%);
  }
  .tile.sym-btc .tile-glow,
  .tile.sym-btc .tile-burst {
    background: radial-gradient(circle, rgba(244, 182, 60, 0.42), transparent 68%);
  }
  .tile.sym-eth .tile-glow,
  .tile.sym-eth .tile-burst {
    background: radial-gradient(circle, rgba(255, 217, 120, 0.3), transparent 68%);
  }
  .tile.sym-sol .tile-glow,
  .tile.sym-sol .tile-burst {
    background: radial-gradient(circle, rgba(244, 182, 60, 0.38), transparent 68%);
  }
  .tile.sym-usdt .tile-glow,
  .tile.sym-usdt .tile-burst {
    background: radial-gradient(circle, rgba(143, 208, 232, 0.42), transparent 68%);
  }
  .tile.sym-diamond .tile-glow,
  .tile.sym-diamond .tile-burst {
    background: radial-gradient(circle, rgba(143, 208, 232, 0.45), transparent 68%);
  }
  .tile.sym-vault .tile-glow,
  .tile.sym-vault .tile-burst {
    background: radial-gradient(circle, rgba(35, 144, 155, 0.48), transparent 68%);
  }
  /* unrevealed lid emblem */
  /* unrevealed lid = the closed glass face of the raised box. Stays mounted
     while revealing so GSAP can flip it away; hidden only once fully revealed. */
  .tile-lid {
    position: absolute;
    inset: 4px;
    display: grid;
    place-items: center;
    border-radius: 7px;
    z-index: 3;
    transform-style: preserve-3d;
    backface-visibility: hidden;
  }
  .back-mark {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    opacity: 0.35;   /* subtle cyan line emblem — the tile reads as a clean glass box */
    transition: opacity 0.16s ease;
    pointer-events: none;
  }
  /* CSS fallback flip when the tile flips open (GSAP timeline also drives this
     during playback; both are transform/opacity-only and GPU-friendly). */
  .tile.just-revealed .tile-lid {
    animation: lid-flip 0.24s var(--ease-out-soft, cubic-bezier(0.22, 1, 0.36, 1)) both;
  }
  @keyframes lid-flip {
    from { transform: rotateX(0deg); opacity: 1; }
    to { transform: rotateX(-78deg); opacity: 0; }
  }
  .sym-wrap {
    display: grid;
    place-items: center;
    width: 70%;
    height: 70%;
    perspective: 300px;
    position: relative;
    z-index: 4;   /* above the gloss-shine pseudo-element */
  }
  .tile.just-revealed .sym-wrap {
    /* Zero animation-delay: the icon entrance starts on the very first frame
       after the click/confirmation commit. Overlapping keyframe timings carry
       the stagger feel without holding any pixels back. */
    animation: sym-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  /* one-shot reveal glow: peaks ~250ms then settles — never left glowing forever */
  .tile.just-revealed.safe .tile-glow {
    animation: glow-settle 0.6s ease-out both;
  }
  .tile.just-revealed.mine .tile-glow {
    animation: danger-flash 0.45s ease-out both;
  }
  @keyframes glow-settle {
    0% { opacity: 0; transform: scale(0.85); }
    40% { opacity: 0.6; transform: scale(1.05); }
    100% { opacity: 0.14; transform: scale(1); }
  }
  @keyframes danger-flash {
    0% { opacity: 0; }
    25% { opacity: 1; }
    100% { opacity: 0.55; }
  }
  .sym {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
  }
  .sym-wrap.vault-sym .sym {
    filter: drop-shadow(0 4px 12px rgba(35, 144, 155, 0.5));
  }
  .sym-wrap.mine-sym .sym {
    filter: drop-shadow(0 4px 14px rgba(229, 48, 63, 0.55));
  }
  @keyframes sym-in {
    from {
      opacity: 0;
      transform: scale(0.55) rotateY(70deg);
    }
    25% {
      opacity: 1;
      transform: scale(1.06) rotateY(-8deg);
    }
    to {
      opacity: 1;
      transform: scale(1) rotateY(0deg);
    }
  }
  /* Revealed SAFE = dark empty cavity (#06161c) with deep inner shadow; the
     gold reward icon sits inside it glowing. */
  .tile.revealed.safe .tile-inner {
    background: linear-gradient(145deg, #38505b 0%, #1a2c34 60%, #10202a 100%);
    box-shadow:
      0 4px 0 #0d1c23,
      0 6px 12px rgba(0, 0, 0, 0.6),
      inset 0 1px 0 rgba(255, 255, 255, 0.25),
      inset 0 -2px 3px rgba(0, 0, 0, 0.6);
  }
  .tile.revealed.safe .tile-bevel {
    border-color: rgba(244, 182, 60, 0.45);   /* --gold rim */
    background: #06161c;
    box-shadow:
      inset 0 4px 14px rgba(0, 0, 0, 0.75),
      inset 0 0 18px rgba(244, 182, 60, 0.10),
      0 0 0 1px rgba(244, 182, 60, 0.12);
  }
  /* Revealed MINE = dark glass + red neon square border + pulsing glow */
  .tile.mine .tile-inner {
    background: linear-gradient(145deg, #4a3038 0%, #241319 60%, #16080c 100%);
  }
  .tile.mine .tile-bevel {
    border: 1px solid var(--danger);          /* --mine-red #e5303f */
    background: linear-gradient(160deg, #1c0a10, #0b0508);
    box-shadow:
      0 0 0 1px rgba(229, 48, 63, 0.55),
      0 0 18px var(--mine-glow),
      inset 0 0 14px rgba(229, 48, 63, 0.22);
    animation: mine-shake 0.3s ease-out, mine-pulse 1.2s ease-in-out 0.3s infinite;
  }
  @keyframes mine-pulse {
    0%, 100% { box-shadow: 0 0 0 1px rgba(229, 48, 63, 0.55), 0 0 12px rgba(255, 50, 70, 0.35), inset 0 0 10px rgba(229, 48, 63, 0.18); }
    50% { box-shadow: 0 0 0 1px rgba(229, 48, 63, 0.85), 0 0 22px rgba(255, 50, 70, 0.6), inset 0 0 16px rgba(229, 48, 63, 0.3); }
  }
  .tile.ghost .tile-inner {
    opacity: 0.8;
  }
  /* mine shake lives on the glass panel now — target it there */
  @keyframes mine-shake {
    0% { transform: translate3d(0, 0, 0); }
    25% { transform: translate3d(-3px, 1px, 0); }
    50% { transform: translate3d(3px, -1px, 0); }
    75% { transform: translate3d(-2px, 0, 0); }
    100% { transform: translate3d(0, 0, 0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .tile.mine .tile-bevel {
      animation: none;
    }
  }
  .tile.ghost .tile-bevel {
    border-radius: 7px;
  }
  .tile.ghost.mine .tile-bevel {
    opacity: 0.92;
    border-color: rgba(229, 48, 63, 0.32);
    animation: none;
  }
  .tile.ghost.safe .tile-bevel {
    border-color: rgba(244, 182, 60, 0.18);
  }
  .tile.mine:not(.ghost) .tile-inner {
    z-index: 2;
  }
</style>
