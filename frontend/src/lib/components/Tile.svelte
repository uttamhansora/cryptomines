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
    aspect-ratio: 1;   /* perfect squares — grow with the board */
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 8px;
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
    border-radius: 10px;
    background: #020d12;
    box-shadow:
      inset 0 4px 10px rgba(0, 0, 0, 0.9),
      inset 0 -2px 5px rgba(0, 0, 0, 0.6),
      inset 0 0 0 1px rgba(0, 0, 0, 0.5);
    pointer-events: none;
  }
  /* LAYER 1 — OUTER METAL BEZEL (the raised 3D box itself). GSAP animates this
     node's transform (press / hover lift / flip), so all resting depth lives in
     box-shadow, never in transform. The bezel IS a shiny brushed-steel edge:
     a transparent 2px border painted by a diagonal light→dark→light metal
     gradient (border-box) while the teal glass face paints the padding-box. */
  .tile-inner {
    display: grid;
    place-items: center;
    width: calc(100% - 6px);
    height: calc(100% - 8px);
    margin: 3px 3px 5px;
    border-radius: 8px;
    position: relative;
    will-change: transform;
    backface-visibility: hidden;
    transform-style: preserve-3d;
    border: 2px solid transparent;
    background:
      /* face: teal glass panel (paints inside the border) */
      radial-gradient(circle at 30% 20%, rgba(130, 255, 255, 0.35) 0%, transparent 45%) padding-box,
      linear-gradient(160deg, #1f9ba5 0%, #126671 50%, #0a3d48 100%) padding-box,
      /* edge: brushed-steel shine — bright top-left, dark mid, light catch bottom-right */
      linear-gradient(
          135deg,
          #e8fbff 0%,
          #8fb7c2 18%,
          #3d5c68 45%,
          #1a2e37 70%,
          #6f98a5 90%,
          #bfe6ee 100%
        )
        border-box;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.55),       /* top edge light line    */
      inset 1px 0 0 rgba(255, 255, 255, 0.25),       /* left edge light line   */
      inset 0 -2px 4px rgba(0, 0, 0, 0.5),           /* bottom inner shade     */
      inset 0 -6px 10px rgba(0, 0, 0, 0.4),          /* deep glass bottom tint */
      0 0 0 1px rgba(0, 0, 0, 0.6),                  /* dark outline outside   */
      0 0 10px rgba(80, 220, 230, 0.25),             /* soft cyan outer glow   */
      0 5px 10px rgba(0, 0, 0, 0.6);                 /* drop shadow            */
    transition: filter 0.2s ease, box-shadow 0.2s ease;
  }
  /* GPU layer is only needed while a tile is actually interactive. Once the
     cell is revealed its pose is final, so we release the composited layer —
     25 permanent promoted layers forced full-board re-composite work during
     every reveal animation on low-powered devices. */
  .tile:disabled .tile-inner {
    will-change: auto;
  }
  /* Hover: box lifts, edge shine brightens, cyan glow intensifies, and a
     light sweep passes across the tile ONCE (0.6s, transform-only). */
  .tile:not(:disabled):hover .tile-inner {
    translate: 0 -2px;
    filter: brightness(1.12);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.7),
      inset 1px 0 0 rgba(255, 255, 255, 0.35),
      inset 0 -2px 4px rgba(0, 0, 0, 0.5),
      inset 0 -6px 10px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(0, 0, 0, 0.6),
      0 0 18px rgba(25, 227, 227, 0.7),           /* strong cyan hover glow   */
      0 9px 16px rgba(0, 0, 0, 0.7);              /* deeper drop = higher lift */
  }
  @keyframes tile-sheen {
    from { transform: translateX(-130%); }
    to   { transform: translateX(130%); }
  }
  .tile:not(:disabled):hover .tile-bevel::after {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    pointer-events: none;
    background: linear-gradient(
      110deg,
      transparent 40%,
      rgba(255, 255, 255, 0.35) 50%,
      transparent 60%
    );
    transform: translateX(-130%);
    animation: tile-sheen 0.6s ease-out 1;
  }
  .tile:not(:disabled):hover .back-mark {
    opacity: 0.95;
  }
  /* Pressed: sinks into the socket, glow reduced */
  .tile-inner.press {
    translate: 0 2px;
    scale: 0.96;
    box-shadow:
      inset 0 3px 10px rgba(0, 0, 0, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      0 0 0 1px rgba(0, 0, 0, 0.6),
      0 0 6px rgba(80, 220, 230, 0.15),
      0 2px 5px rgba(0, 0, 0, 0.6);
  }
  /* LAYER 2 — INNER TEAL GLASS PANEL: the face gradient now lives on the bezel
     itself (padding-box), so this layer is fully transparent and only carries
     the inner glass-depth shadows + the glossy top streak (::before) and the
     bright top-left corner sparkle (::after). */
  .tile-bevel {
    position: absolute;
    inset: 0;
    border-radius: 6px;
    pointer-events: none;
    background: none;
    border: none;
    box-shadow:
      inset 0 2px 4px rgba(255, 255, 255, 0.35),
      inset 0 -6px 10px rgba(0, 0, 0, 0.45),
      inset 0 0 0 1px rgba(0, 0, 0, 0.5);
  }
  /* Revealed: the inner glass panel must read as a deep dark obsidian well —
     force its background to near-black too (it is the topmost painted layer,
     so leaving it teal/transparent would visually override the dark .tile-inner). */
  .tile.revealed .tile-bevel {
    background: #080c14 !important;
    border-radius: 6px;
  }
  .tile.revealed.mine .tile-bevel {
    background: #06090f !important;
  }
  /* thin glossy streak across the top edge of the glass face */
  .tile-bevel::before {
    content: '';
    position: absolute;
    inset: 2px;
    border-radius: 6px;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.28) 0%,
      rgba(255, 255, 255, 0.06) 35%,
      transparent 36%
    );
    pointer-events: none;
  }
  /* tiny bright corner sparkle, top-left */
  .tile-bevel::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    background: radial-gradient(
      circle at 0 0,
      rgba(255, 255, 255, 0.9) 0%,
      rgba(255, 255, 255, 0) 70%
    );
    border-radius: 8px 0 0 0;
    pointer-events: none;
  }
  /* Tiny dark screws in the metal bezel corners (pure CSS, zero extra DOM) */
  .tile-inner::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 8px;
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
  /* LAYER 3 — GLOSS SHINE: diagonal soft white reflection over the glass face.
     The top-edge glossy streak + corner sparkle now live on .tile-bevel's own
     pseudo-elements, so this layer carries only the diagonal sweep. */
  .tile-inner::before {
    content: '';
    position: absolute;
    inset: 2px;
    border-radius: 6px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 40%, transparent 41%);
    pointer-events: none;
    z-index: 2;
  }
  .tile-glow {
    position: absolute;
    inset: 0;
    border-radius: 6px;
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
    inset: 0;
    display: grid;
    place-items: center;
    border-radius: 6px;
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
  /* Icons scale with the tile: 62% of the tile face.
     Revealed-state icon glows (gold for rewards, red for mines) live here so
     the token reads cleanly against the forced dark obsidian inner background.
     Purely presentational — no JS/handlers touched. */
  .sym-wrap {
    display: grid;
    place-items: center;
    width: 62%;
    height: 62%;
    perspective: 300px;
    position: relative;
    z-index: 4;   /* above the gloss-shine pseudo-element */
    filter: drop-shadow(0 0 10px rgba(244, 182, 60, 0.5)); /* gold glow (safe rewards) */
  }
  .tile.revealed.mine .sym-wrap {
    filter: drop-shadow(0 0 12px rgba(229, 48, 63, 0.7));  /* red glow (hazard/mines)  */
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
  /* Revealed tiles: the nested inner container's background MUST switch from
     the teal glass face to a deep dark obsidian/black-slate color so it never
     stays teal after opening. Forced with `!important` per requirement — this
     beats any other revealed-state rule regardless of specificity or order.
     A clean 1px inner border (#1c4650) frames the dark well. The outer frame
     (.tile-well socket) stays intact; no JS/handlers/IDs touched. */
  .tile.revealed .tile-inner {
    background: #080c14 !important;   /* deep dark obsidian/slate — overrides teal */
    background-color: #080c14 !important;
    border-color: #1c4650 !important; /* clean inner border around the dark face  */
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.6), 0 3px 8px rgba(0, 0, 0, 0.5);
  }
  /* Slightly darker slate for mines so the hazard reads deeper in the socket */
  .tile.revealed.mine .tile-inner {
    background: #06090f !important;
    background-color: #06090f !important;
  }
  .tile.revealed.safe .tile-inner {
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.6),
      0 0 12px rgba(244, 182, 60, 0.16),   /* soft gold glow on the rim */
      0 3px 8px rgba(0, 0, 0, 0.5);
  }
  .tile.revealed.mine:not(.ghost) .tile-inner {
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.6),
      0 0 14px var(--mine-glow),           /* red glow around the tile  */
      0 3px 8px rgba(0, 0, 0, 0.5);
  }
  /* Revealed SAFE = dark empty cavity (#06161c) with deep inner shadow; the
     gold reward icon sits inside it glowing. */
  .tile.revealed.safe .tile-bevel {
    border-radius: 6px;
    background: #06161c;
    box-shadow:
      inset 0 4px 14px rgba(0, 0, 0, 0.75),
      inset 0 0 18px rgba(244, 182, 60, 0.10),
      inset 0 0 0 1px #1c4650,              /* thin dim border          */
      0 0 0 1px rgba(244, 182, 60, 0.12);   /* soft gold outer rim      */
  }
  /* Revealed MINE = dark glass + red neon square border + pulsing glow */
  .tile.mine .tile-bevel {
    border-radius: 6px;
    background: linear-gradient(160deg, #1c0a10, #0b0508);
    box-shadow:
      inset 0 0 0 1px #1c4650,                /* thin dim base border   */
      0 0 0 1px rgba(229, 48, 63, 0.55),      /* red neon square border */
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
    border-radius: 6px;
  }
  /* Ghost (post-loss disclosure) tiles: keep the flat recessed look, no shine */
  .tile.ghost .tile-inner::before {
    display: none;
  }
  .tile.ghost:not(.revealed) .tile-inner {
    filter: brightness(0.85);
  }
  .tile.ghost.mine .tile-bevel {
    opacity: 0.92;
    background: linear-gradient(160deg, #1c0a10, #0b0508);
    box-shadow:
      inset 0 0 0 1px #1c4650,
      0 0 0 1px rgba(229, 48, 63, 0.32),
      0 0 10px rgba(255, 50, 70, 0.25);
    animation: none;
  }
  .tile.ghost.safe .tile-bevel {
    background: #06161c;
    box-shadow:
      inset 0 4px 14px rgba(0, 0, 0, 0.75),
      inset 0 0 0 1px #1c4650,
      0 0 0 1px rgba(244, 182, 60, 0.18);
  }
  .tile.mine:not(.ghost) .tile-inner {
    z-index: 2;
  }
</style>
