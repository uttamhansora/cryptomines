import { ChainIcon, VaultIcon, SignalIcon } from './icons.jsx';

/**
 * StatusBar — bottom modular info windows:
 *  • CRYPTO CHAIN (segmented 0/5 pip tracker)
 *  • CRYPTO VAULT BONUS (gold progress, 0/1)
 *  • LINK STATUS (cyan tracker + uptime readout)
 */
export default function StatusBar({ chainProgress, chainGoal, vaultProgress, vaultGoal }) {
  return (
    <footer className="dm-footer">
      {/* Crypto chain window */}
      <div className="dm-status dm-panel dm-panel--hud">
        <div className="dm-status__row">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="dm-status__icon"><ChainIcon size={18} /></span>
            <span className="dm-label">Crypto Chain</span>
          </span>
          <span className="dm-status__count num">
            {chainProgress}<em>/{chainGoal}</em>
          </span>
        </div>
        {/* Segmented pips — one per chain step */}
        <div className="dm-pips" role="progressbar" aria-valuenow={chainProgress} aria-valuemax={chainGoal}>
          {Array.from({ length: chainGoal }, (_, i) => (
            <span key={i} className={`dm-pip${i < chainProgress ? ' dm-pip--on' : ''}`} />
          ))}
        </div>
      </div>

      {/* Vault bonus window */}
      <div className="dm-status dm-status--gold dm-panel dm-panel--hud">
        <div className="dm-status__row">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="dm-status__icon"><VaultIcon size={18} /></span>
            <span className="dm-label">Crypto Vault Bonus</span>
          </span>
          <span className="dm-status__count num">
            {vaultProgress}<em>/{vaultGoal}</em>
          </span>
        </div>
        <div className="dm-track" role="progressbar" aria-valuenow={vaultProgress} aria-valuemax={vaultGoal}>
          <span
            className="dm-track__fill dm-track__fill--gold"
            style={{ width: `${(vaultProgress / vaultGoal) * 100}%` }}
          />
        </div>
      </div>

      {/* Link status window */}
      <div className="dm-status dm-status--danger dm-panel dm-panel--hud">
        <div className="dm-status__row">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span className="dm-status__icon"><SignalIcon size={18} /></span>
            <span className="dm-label">Node Link Status</span>
          </span>
          <span className="dm-status__count num">99<em>%</em></span>
        </div>
        <div className="dm-track" aria-hidden="true">
          <span className="dm-track__fill" style={{ width: '99%' }} />
        </div>
      </div>
    </footer>
  );
}
