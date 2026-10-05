import { Link2, Shield } from 'lucide-react';
import { CHAIN_STEPS, VAULT_SLOTS } from '../game/logic.js';

/**
 * Two equal info cards below the board: chain explainer + vault bonus
 * with 3 symbol slots that light up as they are collected.
 */
export default function InfoCards({ chainProgress, vaultCount }) {
  return (
    <div className="cm-infocards">
      <section className="cm-card cm-info-card" aria-label="Crypto Chain rules">
        <div className="cm-card-head">
          <span className="cm-card-title">
            <Link2 size={15} className="cm-title-icon" aria-hidden="true" />
            CRYPTO CHAIN
          </span>
          <span className="cm-counter">
            <strong className="num">{chainProgress}</strong>
            <span className="cm-counter-max num">/{CHAIN_STEPS}</span>
          </span>
        </div>
        <p className="cm-info-desc">
          Each safe reveal fills the chain (1-5). Complete step 5 for a multiplier boost.
        </p>
      </section>

      <section className="cm-card cm-info-card" aria-label="Crypto Vault Bonus progress">
        <div className="cm-card-head">
          <span className="cm-card-title">
            <Shield size={15} className="cm-title-icon" aria-hidden="true" />
            CRYPTO VAULT BONUS
          </span>
          <span className="cm-counter">
            <strong className="num">{vaultCount}</strong>
            <span className="cm-counter-max num">/{VAULT_SLOTS}</span>
          </span>
        </div>
        {/* Three vault slots — filled ones glow violet */}
        <div className="cm-vault-slots" aria-hidden="true">
          {Array.from({ length: VAULT_SLOTS }, (_, i) => (
            <span key={i} className={`cm-vault-slot${i < vaultCount ? ' is-filled' : ''}`}>
              <Shield size={16} strokeWidth={1.8} />
            </span>
          ))}
        </div>
        <p className="cm-info-desc">
          Collect 3 Vault symbols on safe tiles to unlock the full vault bonus game.
        </p>
      </section>
    </div>
  );
}
