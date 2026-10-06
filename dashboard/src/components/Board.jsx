import React from 'react';
import { HexIcon, BullionIcon, MineIcon } from './icons.jsx';

/**
 * Tile — one square of the 5×5 field.
 * States: 'hidden' | 'safe' | 'mine'.
 * Memoized so revealing one tile doesn't re-render the whole board.
 */
const Tile = React.memo(function Tile({ state, disabled, onReveal }) {
  return (
    <button
      className={`dm-tile dm-tile--${state}`}
      disabled={disabled || state !== 'hidden'}
      onClick={onReveal}
      aria-label={
        state === 'safe' ? 'Revealed: bullion' :
        state === 'mine' ? 'Revealed: mine' : 'Unrevealed tile'
      }
    >
      {/* Closed recessed metallic plate with cyan border glow */}
      <span className="dm-tile__front">
        <span className="dm-tile__hex"><HexIcon size={26} /></span>
      </span>

      {/* Revealed face mounts WITH the result (never gated by animation) */}
      {state === 'safe' && (
        <span className="dm-tile__back"><BullionIcon size={30} /></span>
      )}
      {state === 'mine' && (
        <span className="dm-tile__back"><MineIcon size={30} /></span>
      )}
    </button>
  );
});

/**
 * Board — metallic frame + corner brackets + interactive 5×5 grid.
 * `tiles` is an array of 25 state strings.
 */
export default function Board({ tiles, disabled, statusText, onReveal }) {
  return (
    <section className="dm-board-card dm-panel dm-panel--hud" aria-label="Mine field">
      {/* Board header: title + legend */}
      <div className="dm-board-head">
        <span className="dm-label">Sector Grid · 5 × 5</span>
        <div className="dm-legend">
          <span className="dm-legend__item"><i className="dm-dot dm-dot--cyan" />Plate</span>
          <span className="dm-legend__item"><i className="dm-dot dm-dot--gold" />Bullion</span>
          <span className="dm-legend__item"><i className="dm-dot dm-dot--red" />Mine</span>
        </div>
      </div>

      {/* Frame */}
      <div className="dm-frame">
        <span className="dm-frame__well" aria-hidden="true">
          <span className="dm-frame__watermark"><HexIcon size={140} /></span>
        </span>
        <i className="dm-bracket dm-bracket--tl" aria-hidden="true" />
        <i className="dm-bracket dm-bracket--tr" aria-hidden="true" />
        <i className="dm-bracket dm-bracket--bl" aria-hidden="true" />
        <i className="dm-bracket dm-bracket--br" aria-hidden="true" />

        <div className="dm-grid" data-disabled={disabled ? 'true' : 'false'} role="group" aria-label="Cybernetic tiles">
          {tiles.map((state, i) => (
            <Tile key={i} state={state} disabled={disabled} onReveal={() => onReveal(i)} />
          ))}
        </div>
      </div>

      {/* Status strip under the grid */}
      <div className="dm-board-foot">
        <span>{statusText}</span>
        <span>GRID LINK <strong>STABLE</strong></span>
      </div>
    </section>
  );
}
