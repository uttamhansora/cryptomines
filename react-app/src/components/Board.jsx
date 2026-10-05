import Tile from './Tile.jsx';
import { TILES } from '../game/logic.js';

/**
 * 5x5 board inside a beveled frame with decorative corner brackets.
 * `shake` triggers the CSS screen-shake keyframe when a mine detonates.
 */
export default function Board({ tiles, roundActive, shake, onReveal }) {
  return (
    <div className={`cm-board-frame${shake ? ' is-shaking' : ''}`}>
      {/* Corner brackets (decorative) */}
      <span className="cm-bracket cm-bracket--tl" aria-hidden="true" />
      <span className="cm-bracket cm-bracket--tr" aria-hidden="true" />
      <span className="cm-bracket cm-bracket--bl" aria-hidden="true" />
      <span className="cm-bracket cm-bracket--br" aria-hidden="true" />

      <div
        className="cm-board"
        role="grid"
        aria-label="Mine field, 5 by 5"
        data-disabled={roundActive ? undefined : 'true'}
      >
        {Array.from({ length: TILES }, (_, i) => (
          <Tile
            key={i}
            index={i}
            state={tiles[i]}
            disabled={!roundActive}
            onReveal={onReveal}
          />
        ))}
      </div>
    </div>
  );
}
