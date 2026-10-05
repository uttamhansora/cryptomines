import { Link2 } from 'lucide-react';
import { CHAIN_STEPS } from '../game/logic.js';

/**
 * Crypto Chain — full-width horizontal HUD strip below the header (spec §2).
 * 5 circular nodes joined by a thin track; the fill animates with
 * transform: scaleX (GPU friendly, no layout thrash). Completed nodes glow
 * cyan; the next node carries a static ring highlight.
 */
export default function ChainStepper({ progress }) {
  const pct = Math.min(1, progress / CHAIN_STEPS);

  return (
    <section className="cm-chain-strip" aria-label="Crypto Chain progress">
      <span className="cm-chain-title">
        <Link2 size={14} className="cm-title-icon" aria-hidden="true" />
        CRYPTO CHAIN
      </span>

      <div
        className="cm-stepper"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={CHAIN_STEPS}
        aria-valuenow={progress}
      >
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

      <span className="cm-counter">
        <strong className="num">{progress}</strong>
        <span className="cm-counter-max num">/{CHAIN_STEPS}</span>
      </span>
    </section>
  );
}
