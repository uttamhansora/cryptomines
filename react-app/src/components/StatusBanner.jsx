import { AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Inline game-status feedback between the board and the info cards.
 * Communicates with icon + text (never colour alone) and reserves no layout
 * space when idle, so showing/hiding it can never shift the board.
 */
export default function StatusBanner({ gameState, balance, bet }) {
  let content = null;

  if (gameState === 'busted') {
    content = (
      <span className="cm-status cm-status--busted" role="status">
        <AlertTriangle size={15} aria-hidden="true" />
        Mine hit — round lost. Starting a new round is ready below.
      </span>
    );
  } else if (gameState === 'cashedOut') {
    content = (
      <span className="cm-status cm-status--cashed" role="status">
        <CheckCircle2 size={15} aria-hidden="true" />
        Cash out complete — winnings added to your balance.
      </span>
    );
  } else if (gameState === 'idle' && balance < bet) {
    content = (
      <span className="cm-status cm-status--low" role="status">
        <AlertTriangle size={15} aria-hidden="true" />
        Bet exceeds your balance — lower the bet to start.
      </span>
    );
  }

  return <div className="cm-status-row">{content}</div>;
}
