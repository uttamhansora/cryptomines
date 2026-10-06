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
  <!-- Sci-fi header: left nav pod · central coin emblem badge with the
       CRYPTO/MINES wordmark split across it · right balance + icon cluster -->
  <nav class="nav-pod" aria-label="Game sections">
    <a class="nav-link active" href="#game" aria-current="page">Play</a>
    <a class="nav-link" href="#crypto-chain">Chain</a>
    <a class="nav-link" href="#crypto-vault">Vault</a>
  </nav>

  <div class="brand">
    <span class="wordmark wordmark-left" aria-hidden="true">CRYPTO</span>
    <span class="mark" aria-hidden="true">
      <!-- Bitcoin-style emblem inside a hexagonal metallic badge -->
      <svg viewBox="0 0 64 64" width="24" height="24">
        <polygon points="32,7 54,20 54,44 32,57 10,44 10,20" fill="#12161f" stroke="#00F2FE" stroke-width="2.4" />
        <g fill="none" stroke="#8BE9FD" stroke-width="3.4" stroke-linecap="round">
          <path d="M25 21v22M25 21h9.5a5.5 5.5 0 0 1 0 11H25zM25 32h10.5a5.5 5.5 0 0 1 0 11H25z" />
          <path d="M29 16.5v4.5M36 16.5v4.5M29 43v4.5M36 43v4.5" stroke-width="2.6" />
        </g>
      </svg>
    </span>
    <h1><span class="sr-only">CryptoMines</span><span class="wordmark wordmark-right" aria-hidden="true">MINES</span></h1>
  </div>
  <div class="actions">
    <div class="balance" data-balance-chip role="status" aria-label={`Balance ${balance.toFixed(2)}`}>
      <span class="label">Balance</span>
      <span class="value">
        <!-- Inline SVG (USDT mark): currentColor-driven, zero network fetch. -->
        <svg class="coin" viewBox="0 0 64 64" width="15" height="15" aria-hidden="true" focusable="false">
          <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" stroke-width="4" />
          <path d="M18 20h28v7H36v22h-8V27H18z" fill="currentColor" />
        </svg>
        <strong>{balance.toFixed(2)}</strong>
      </span>
    </div>
    <button
      type="button"
      class="icon-btn tip"
      data-tip={soundOn ? 'Sound on — click to mute' : 'Sound off — click to enable'}
      aria-pressed={soundOn}
      title={soundOn ? 'Mute sound' : 'Enable sound'}
      aria-label={soundOn ? 'Mute sound' : 'Enable sound'}
      onclick={onToggleSound}
    >
      {#if soundOn}
        <!-- Speaker with waves -->
        <svg viewBox="0 0 64 64" width="18" height="18" aria-hidden="true" focusable="false">
          <g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 24v16h10l14 10V14L20 24z" />
            <path d="M42 24c3 2.4 3 13.6 0 16" />
            <path d="M49 18c6 5 6 23 0 28" />
          </g>
        </svg>
      {:else}
        <!-- Speaker muted -->
        <svg viewBox="0 0 64 64" width="18" height="18" aria-hidden="true" focusable="false">
          <g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10 24v16h10l14 10V14L20 24z" />
            <line x1="44" y1="26" x2="56" y2="38" />
            <line x1="56" y1="26" x2="44" y2="38" />
          </g>
        </svg>
      {/if}
    </button>
    <button type="button" class="icon-btn tip" data-tip="How to play&#10;Rules & bonus features" title="Game rules" aria-label="Game rules" onclick={onRules}>
      <!-- Info "i" glyph -->
      <svg viewBox="0 0 64 64" width="18" height="18" aria-hidden="true" focusable="false">
        <circle cx="32" cy="32" r="25" fill="none" stroke="currentColor" stroke-width="5" />
        <path d="M32 28v14" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
        <circle cx="32" cy="19" r="3.2" fill="currentColor" />
      </svg>
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
    background: linear-gradient(160deg, rgba(0, 210, 211, 0.16), rgba(12, 20, 42, 0.55));
    border: 1px solid rgba(0, 210, 211, 0.4);
    box-shadow:
      0 0 16px rgba(0, 242, 254, 0.14),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(0.95rem, 3.5vw, 1.18rem);
    letter-spacing: 0.14em;
    font-weight: 700;
    text-transform: uppercase;
    color: #e0f7fa;
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
    background: linear-gradient(180deg, rgba(16, 21, 31, 0.9), rgba(9, 14, 22, 0.9));
    border: 1px solid rgba(0, 242, 254, 0.22);
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
  .coin {
    display: inline-block;
    vertical-align: middle;
    flex-shrink: 0;
    pointer-events: none;
    color: #26a17b; /* USDT green — matches the tether asset */
  }
  .icon-btn {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid rgba(112, 132, 165, 0.2);
    background: linear-gradient(165deg, rgba(26, 33, 48, 0.85) 0%, rgba(16, 21, 31, 0.9) 60%, rgba(8, 13, 20, 0.95) 100%);
    border-radius: 10px;
    padding: 0;
    color: #e2e8f0; /* currentColor for the inline SVG glyphs */
    transition:
      border-color 0.15s,
      box-shadow 0.15s,
      color 0.15s,
      transform 0.1s ease;
  }
  .icon-btn svg {
    display: block;
    pointer-events: none; /* clicks always land on the button itself */
  }
  .icon-btn:hover {
    border-color: rgba(0, 242, 254, 0.45);
    box-shadow: 0 0 14px rgba(0, 242, 254, 0.16);
    color: var(--accent-primary); /* icons glow cyan on hover */
  }
  .icon-btn:focus-visible {
    outline: 2px solid rgba(0, 242, 254, 0.6);
    outline-offset: 2px;
  }
  .icon-btn:active {
    transform: scale(0.93);
  }
  /* Sound button reads "live" (cyan) when audio is enabled, muted-grey when off */
  .icon-btn[aria-pressed='true'] {
    color: var(--accent-primary);
    border-color: rgba(0, 242, 254, 0.35);
  }
  .icon-btn[aria-pressed='false'] {
    color: #9fb0c2; /* AA contrast vs the dark chip background */
  }

  /* ── Sci-fi header (v3): nav pod · center emblem badge · right HUD ── */
  .header {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-lg);
    background:
      radial-gradient(120% 180% at 50% -60%, rgba(0, 242, 254, 0.10), transparent 60%),
      linear-gradient(180deg, rgba(16, 24, 40, 0.72), rgba(9, 14, 24, 0.82));
    border: 1px solid var(--border);
    box-shadow: inset 0 1px 0 var(--hairline-top), var(--shadow-md);
    backdrop-filter: blur(var(--glass-blur));
    -webkit-backdrop-filter: blur(var(--glass-blur));
    position: relative;
  }
  /* thin cyan scan line along the top edge */
  .header::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12%;
    right: 12%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 254, 0.55), transparent);
    pointer-events: none;
  }
  .nav-pod {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    justify-self: start;
    padding: 0.25rem;
    border-radius: var(--radius-pill);
    border: 1px solid var(--border);
    background: linear-gradient(180deg, rgba(18, 28, 45, 0.85), rgba(8, 13, 22, 0.9));
    box-shadow: inset 0 1px 0 var(--hairline-top);
  }
  .nav-link {
    font-family: var(--font-display);
    font-size: 0.66rem;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-decoration: none;
    color: var(--text-secondary);
    padding: 0.32rem 0.7rem;
    border-radius: var(--radius-pill);
    transition: color 0.15s, background-color 0.15s, box-shadow 0.15s;
  }
  .nav-link:hover {
    color: var(--highlight-soft);
    background: rgba(0, 242, 254, 0.08);
  }
  .nav-link.active {
    color: #06131d;
    background: linear-gradient(180deg, var(--primary-light), var(--blue-light));
    box-shadow: 0 0 14px rgba(0, 242, 254, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }
  .nav-link:focus-visible {
    outline: 2px solid rgba(0, 242, 254, 0.6);
    outline-offset: 2px;
  }
  /* Center brand: CRYPTO [₿ badge] MINES */
  .brand {
    justify-self: center;
    gap: 0.55rem;
  }
  .wordmark {
    font-family: var(--font-display);
    font-size: clamp(0.95rem, 3.5vw, 1.18rem);
    letter-spacing: 0.16em;
    font-weight: 700;
    text-transform: uppercase;
    background: linear-gradient(92deg, #e0f7fa 20%, var(--primary-light) 70%, var(--secondary-light));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: #e0f7fa; /* fallback if clip unsupported */
    text-shadow: none;
  }
  @supports not (background-clip: text) {
    .wordmark { color: #e0f7fa; }
  }
  .wordmark-right {
    color: var(--accent-primary);
  }
  h1 {
    margin: 0;
    display: inline-flex;
    font-size: inherit;
    background: none;
    -webkit-text-fill-color: initial;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
  .actions {
    justify-self: end;
  }
  .mark {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background:
      radial-gradient(circle at 50% 30%, rgba(0, 242, 254, 0.18), transparent 70%),
      var(--grad-hero-soft);
    border: 1px solid var(--border-strong);
    box-shadow: var(--glow-cyan), inset 0 1px 0 var(--hairline-top);
    position: relative;
  }
  /* small pulsing status light on the badge corner */
  .mark::after {
    content: '';
    position: absolute;
    top: -2px;
    right: -2px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--primary);
    box-shadow: 0 0 8px rgba(0, 242, 254, 0.8);
    animation: badge-blink 2.4s ease-in-out infinite;
  }
  @keyframes badge-blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }
  @media (prefers-reduced-motion: reduce) {
    .mark::after { animation: none; }
  }
  .balance {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.8rem;
    border-radius: var(--radius-pill);
    background: var(--grad-hero-soft);
    border: 1px solid var(--border-strong);
  }
  .balance .label {
    margin: 0;
  }
  .value strong {
    color: var(--highlight-soft);
    font-size: 1.05rem;
  }
  /* icon buttons meet the 44px touch-target minimum */
  .icon-btn {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
  }

  /* ── Responsive header reflow (no horizontal overflow on mobile) ──── */
  @media (max-width: 860px) {
    .nav-pod {
      display: none; /* brand stays centered; sections reachable via anchors below */
    }
    .header {
      grid-template-columns: auto 1fr;
    }
    .brand {
      justify-self: start;
    }
  }
  @media (max-width: 480px) {
    .balance .label {
      display: none; /* value + coin glyph stay, label drops to save width */
    }
    .wordmark {
      letter-spacing: 0.1em;
    }
  }
</style>
