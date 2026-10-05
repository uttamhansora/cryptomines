import { memo } from 'react';
import Tile from './Tile.jsx';
import CryptoSymbol from './CryptoSymbol.jsx';
import { TILES } from '../game/logic.js';

/**
 * 5×5 board inside a dark metallic frame with a cyan glow edge and
 * decorative corner brackets (reference image §3).
 *
 * RENDERING: `tiles` is mutated immutably upstream (only one entry changes
 * per reveal), so each memoized <Tile> bails out on shallow prop compare —
 * clicking tile #13 re-renders exactly one component. The shake class lives
 * on the frame element and is applied via CSS, not React remounts.
 */
function BoardBase({ tiles, roundActive, shake, onReveal }) {
  return (
    <div className={`cm-board-frame${shake ? ' is-shaking' : ''}`}>
      {/* Inner bevel + brand watermark (decorative) */}
      <span className="cm-board-inner" aria-hidden="true">
        <span className="cm-board-watermark"><CryptoSymbol size={220} /></span>
      </span>

      {/* Corner brackets */}
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

const Board = memo(BoardBase);
export default Board;
