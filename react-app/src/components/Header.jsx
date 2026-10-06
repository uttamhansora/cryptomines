import { Volume2, VolumeX, Info } from 'lucide-react';

/** Bitcoin-style emblem for the central brand badge (inline SVG — cheap static markup). */
function CoinEmblem() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9.2" />
      <path d="M9.6 8h3.5a2.2 2.2 0 0 1 0 4.4H9.6Z" strokeWidth="1.6" />
      <path d="M9.6 12.4h3.9a2.2 2.2 0 0 1 0 4.4H9.6Z" strokeWidth="1.6" />
      <path d="M11 6.2V8M13 6.2V8M11 16.8V18.6M13 16.8V18.6" strokeWidth="1.4" />
    </svg>
  );
}

/**
 * App header: compact metallic nav panel on the left, prominent CENTRAL logo
 * badge (crypto/Bitcoin emblem + "CRYPTO|MINES" split wordmark), and a right
 * status pod with the balance readout plus audio/info icon buttons.
 * Icon buttons are 44px touch targets with clear on/off states.
 */
export default function Header({ balance, soundOn, onToggleSound, onInfo }) {
  return (
    <header className="cm-header">
      {/* Left flanking navigation panel */}
      <nav className="cm-header-nav" aria-label="Main">
        <a href="#game" className="cm-nav-link is-active" aria-current="page">PLAY</a>
        <a href="#chain" className="cm-nav-link">CHAIN</a>
        <a href="#vault" className="cm-nav-link">VAULT</a>
      </nav>

      {/* Central brand badge — emblem + lettering split across it */}
      <h1 className="cm-brand">
        <span className="cm-brand-word">CRYPTO</span>
        <span className="cm-brand-badge" aria-hidden="true"><CoinEmblem /></span>
        <span className="cm-brand-word cm-brand-word--accent">MINES</span>
      </h1>

      <div className="cm-header-utils">
        {/* Stacked label/value balance readout, matching the reference HUD */}
        <div className="cm-balance-chip" role="status" aria-label={`Balance ${balance.toFixed(2)}`}>
          <span className="cm-balance-label">BALANCE</span>
          <span className="cm-balance-row">
            <span className="cm-token" aria-hidden="true">T</span>
            <span className="cm-balance-value num">{balance.toFixed(2)}</span>
          </span>
        </div>

        <button
          type="button"
          className={`cm-icon-btn${soundOn ? '' : ' is-off'}`}
          onClick={onToggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Mute sounds' : 'Unmute sounds'}
          title={soundOn ? 'Sound on' : 'Sound off'}
        >
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        <button
          type="button"
          className="cm-icon-btn"
          onClick={onInfo}
          aria-label="How to play"
          title="How to play"
        >
          <Info size={18} />
        </button>
      </div>
    </header>
  );
}
