import { memo } from 'react';
import CryptoSymbol from './CryptoSymbol.jsx';

/**
 * A single board tile — purely presentational.
 *
 * PERFORMANCE CONTRACT (spec §6 / §24 / §25):
 *  • The result icon is rendered in the SAME commit as the state change, so
 *    the correct symbol is visible the instant the click is handled. No
 *    timers, no animation-gated mounting, no lazy icons.
 *  • The reveal "micro-animation" only layers transform/opacity keyframes on
 *    top of already-visible content — it can never delay the icon.
 *  • Wrapped in React.memo + stable `onReveal` prop: when one tile changes,
 *    only that tile re-renders; the other 24 bail out via shallow compare.
 */
function TileBase({ index, state, disabled, onReveal }) {
  const revealed = state !== 'hidden';
  const isSafe = state === 'safe' || state === 'safe-vault';
  const isMine = state === 'mine' || state === 'mine-ghost';

  let aria = `Tile ${index + 1}`;
  if (state === 'safe') aria += ', revealed gem';
  if (state === 'safe-vault') aria += ', revealed vault gem';
  if (isMine) aria += ', revealed mine';

  return (
    <button
      type="button"
      className={`cm-tile cm-tile--${state}`}
      disabled={disabled || revealed}
      onClick={() => onReveal(index)}
      aria-label={aria}
    >
      {/* Closed face — metallic beveled navy tile with the cyan brand mark */}
      <span className="cm-tile-face cm-tile-front" aria-hidden="true">
        <span className="cm-tile-hex">
          <CryptoSymbol size={30} />
        </span>
      </span>

      {/* Opened face — mounted immediately WITH the result; flip animates over it */}
      {revealed && (
        <span className={`cm-tile-face cm-tile-back${state === 'mine' ? ' cm-tile-back--boom' : ''}`} aria-hidden="true">
          {isSafe && (
            <>
              <span className="cm-gem-wrap">
                <span className="cm-gem" />
                {state === 'safe-vault' && <span className="cm-vault-mark">V</span>}
              </span>
              <span className="cm-burst" />
            </>
          )}
          {isMine && (
            <span className="cm-mine-wrap">
              <span className="cm-mine" />
              {state === 'mine' && <span className="cm-boom" />}
            </span>
          )}
        </span>
      )}
    </button>
  );
}

/* Stable comparison: re-render only when this tile's own props change. */
const Tile = memo(TileBase);
export default Tile;
