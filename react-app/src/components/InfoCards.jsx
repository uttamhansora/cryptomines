import { Link2, Shield } from 'lucide-react';
import { CHAIN_STEPS, VAULT_SLOTS } from '../game/logic.js';

/**
 * Bottom information panels (spec §16): two equal compact cards under the
 * board — Crypto Chain explainer and Crypto Vault Bonus with 3 symbol slots
 * that light up as they are collected.
 */
export default function InfoCards({ chainProgress, vaultCount }) {
  return (
    <div className="cm-infocards">
      <section id="chain" className="cm-card cm-info-card" aria-label="Crypto Chain rules">
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
        {/* segmented indicator pod — one lit segment per chain step */}
        <div className="cm-pod" role="img" aria-label={`Crypto chain progress ${chainProgress} of ${CHAIN_STEPS}`}>
          {Array.from({ length: CHAIN_STEPS }, (_, i) => (
            <span key={i} className={`cm-pod-seg${i < chainProgress ? ' is-lit' : ''}`} />
          ))}
        </div>
        <p className="cm-info-desc">
          Each safe reveal fills the chain (1-5). Complete step 5 for a multiplier boost.
        </p>
      </section>

      <section id="vault" className="cm-card cm-info-card" aria-label="Crypto Vault Bonus progress">
        <div className="cm-card-head">
          <span className="cm-card-title">
            <Shield size={15} className="cm-title-icon" aria-hidden="true" />
            CRYPTO VAULT
          </span>
          <span className="cm-counter">
            <strong className="num">{vaultCount}</strong>
            <span className="cm-counter-max num">/{VAULT_SLOTS}</span>
          </span>
        </div>
        {/* Vault slots as segmented indicator pods — filled ones glow gold */}
        <div className="cm-pod cm-pod--vault" aria-hidden="true">
          {Array.from({ length: VAULT_SLOTS }, (_, i) => (
            <span key={i} className={`cm-pod-seg cm-pod-seg--slot${i < vaultCount ? ' is-lit' : ''}`}>
              <Shield size={13} strokeWidth={1.8} />
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
