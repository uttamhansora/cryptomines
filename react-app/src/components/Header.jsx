import { Hexagon, Volume2, VolumeX, Info } from 'lucide-react';

/**
 * App header (reference §17): hexagon logo badge + "CRYPTO MINES" wordmark
 * on the left; BALANCE chip, sound toggle and info button on the right.
 * Icon buttons are 44px touch targets with clear on/off states.
 */
export default function Header({ balance, soundOn, onToggleSound, onInfo }) {
  return (
    <header className="cm-header">
      <div className="cm-brand">
        <span className="cm-brand-badge" aria-hidden="true">
          <Hexagon size={19} strokeWidth={2} />
        </span>
        <h1 className="cm-brand-name">
          CRYPTO<span>MINES</span>
        </h1>
      </div>

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
