import { GemIcon, SoundIcon } from './icons.jsx';

/**
 * Header — top HUD bar.
 *  • left: nav pod (GAME / RANKS / VAULT)
 *  • center: metallic "CRYPTOMINES" pill badge
 *  • right: BTC balance widget + sound toggle
 */
export default function Header({ balance, soundOn, onToggleSound }) {
  return (
    <header className="dm-header dm-panel dm-panel--hud">
      {/* Left navigation pod */}
      <nav className="dm-nav" aria-label="Primary">
        <button className="dm-nav__link dm-nav__link--active">Game</button>
        <button className="dm-nav__link">Ranks</button>
        <button className="dm-nav__link">Vault</button>
      </nav>

      {/* Centered brand badge */}
      <div className="dm-brand">
        <span className="dm-brand__icon"><GemIcon size={22} /></span>
        <span className="dm-brand__name">Crypto<b>Mines</b></span>
      </div>

      {/* Right stats widget — crypto/Bitcoin motif */}
      <div className="dm-balance">
        <span className="dm-balance__btc" aria-hidden="true">₿</span>
        <span>
          <span className="dm-balance__amount num">{balance.toFixed(2)}</span>
          <span className="dm-balance__unit">BTC</span>
        </span>
        <button
          className="dm-icon-btn"
          onClick={onToggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Mute sound' : 'Enable sound'}
        >
          <SoundIcon size={17} />
        </button>
      </div>
    </header>
  );
}
