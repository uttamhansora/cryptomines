import { Hexagon } from 'lucide-react';

/**
 * A single board tile. Purely presentational — receives its reveal state
 * and a click handler. The 3D flip is done with an inner wrapper using
 * rotateY so the back face (gem / mine) stays readable.
 */
export default function Tile({ index, state, disabled, onReveal }) {
  // state: 'hidden' | 'safe' | 'safe-vault' | 'mine' | 'mine-ghost'
  const revealed = state !== 'hidden';

  let aria = `Tile ${index + 1}`;
  if (state === 'safe') aria += ', revealed gem';
  if (state === 'safe-vault') aria += ', revealed vault symbol';
  if (state === 'mine' || state === 'mine-ghost') aria += ', revealed mine';

  return (
    <button
      type="button"
      className={`cm-tile cm-tile--${state}`}
      disabled={disabled || revealed}
      onClick={() => onReveal(index)}
      aria-label={aria}
    >
      <span className="cm-tile-flip">
        {/* Front: closed tile with faint hex logo */}
        <span className="cm-tile-face cm-tile-front" aria-hidden="true">
          <span className="cm-tile-hex">
            <Hexagon size={22} strokeWidth={1.5} />
            <span className="cm-tile-dot" />
          </span>
        </span>

        {/* Back: revealed content */}
        <span className="cm-tile-face cm-tile-back" aria-hidden="true">
          {(state === 'safe' || state === 'safe-vault') && (
            <span className="cm-gem-wrap">
              <span className="cm-gem" />
              {state === 'safe-vault' && <span className="cm-vault-mark">V</span>}
              <span className="cm-burst" />
            </span>
          )}
          {(state === 'mine' || state === 'mine-ghost') && (
            <span className="cm-mine-wrap">
              <span className="cm-mine" />
              {state === 'mine' && <span className="cm-boom" />}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
