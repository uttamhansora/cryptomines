import { Link2 } from 'lucide-react';
import { CHAIN_STEPS } from '../game/logic.js';

/**
 * Crypto Chain stepper card — 5 circular nodes joined by a track whose
 * fill animates via transform: scaleX (GPU-friendly). Completed nodes get
 * a glowing cyan fill; the next node pulses with a ring to draw the eye.
 */
export default function ChainStepper({ progress }) {
  const pct = Math.min(1, progress / CHAIN_STEPS);

  return (
    <section className="cm-card cm-chain-card" aria-label="Crypto Chain progress">
      <div className="cm-card-head">
        <span className="cm-card-title">
          <Link2 size={15} className="cm-title-icon" aria-hidden="true" />
          CRYPTO CHAIN
        </span>
        <span className="cm-counter">
          <strong className="num">{progress}</strong>
          <span className="cm-counter-max num">/{CHAIN_STEPS}</span>
        </span>
      </div>

      <div className="cm-stepper" role="progressbar" aria-valuemin={0} aria-valuemax={CHAIN_STEPS} aria-valuenow={progress}>
        <div className="cm-stepper-track" aria-hidden="true">
          <div className="cm-stepper-fill" style={{ transform: `scaleX(${pct})` }} />
        </div>
        {Array.from({ length: CHAIN_STEPS }, (_, i) => {
          const step = i + 1;
          const done = progress >= step;
          const next = progress === i && !done; // first unreached node
          return (
            <span
              key={step}
              className={`cm-node${done ? ' is-done' : ''}${next ? ' is-next' : ''}`}
              aria-hidden="true"
            >
              <span className="cm-node-inner num">{step}</span>
            </span>
          );
        })}
      </div>
    </section>
  );
}
