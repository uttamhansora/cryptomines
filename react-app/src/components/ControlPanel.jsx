import { Trophy, Layers, Minus, Plus, PlayCircle, Landmark } from 'lucide-react';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber.js';
import CryptoSymbol from './CryptoSymbol.jsx';
import { MIN_MINES, MAX_MINES, VAULT_COST_MULT } from '../game/logic.js';

const PRESETS = [1, 5, 10, 15, 20, 24];

/**
 * Right-hand control panel (spec §9–§15): circular multiplier HUD,
 * Potential Win / Bet stat boxes, segmented bet controls, mines stepper +
 * preset chips, the large cyan Start Round CTA (green Cash Out while a round
 * runs) and the Crypto Vault purchase card.
 * Every input locks while `gameState === 'playing'`.
 */
export default function ControlPanel({
  multiplier,
  potentialWin,
  bet,
  mines,
  balance,
  gameState,
  onSetBet,
  onBetMin,
  onBetHalf,
  onBetDouble,
  onBetMax,
  onBetStep,
  onSetMines,
  onMinesStep,
  onStart,
  onCashOut,
  onBuyVault,
}) {
  const playing = gameState === 'playing';
  const locked = playing; // bet + mines controls lock during a round
  const vaultCost = bet * VAULT_COST_MULT;
  const canBuyVault = !locked && balance >= vaultCost;

  // Count-up animation for the two hero numbers (presentational only —
  // it never delays or gates any value render; final value lands instantly).
  const animMult = useAnimatedNumber(multiplier);
  const animWin = useAnimatedNumber(potentialWin);

  return (
    <aside className="cm-panel" aria-label="Game controls">
      {/* ---- Current multiplier — circular HUD ring ---- */}
      <div className="cm-mult-block">
        <span className="cm-section-label cm-center">
          <span className="cm-dot" aria-hidden="true" /> CURRENT MULTIPLIER
        </span>
        <div
          className={`cm-mult-badge${playing ? ' is-live' : ''}`}
          key={multiplier /* retrigger glow pulse on change */}
        >
          {/* thin decorative ring + faint brand watermark inside the dial */}
          <span className="cm-mult-ring" aria-hidden="true" />
          <span className="cm-mult-watermark" aria-hidden="true"><CryptoSymbol size={72} /></span>
          <span className="cm-mult-value num">
            {animMult.toFixed(2)}
            <span className="cm-mult-x">×</span>
          </span>
        </div>
        <div className="cm-divider" aria-hidden="true" />
      </div>

      {/* ---- Potential win / bet stat boxes ---- */}
      <div className="cm-stats">
        <div className="cm-stat-box">
          <span className="cm-stat-label">
            <Trophy size={13} aria-hidden="true" /> POTENTIAL WIN
          </span>
          <span className="cm-stat-value is-accent num">{animWin.toFixed(2)}</span>
        </div>
        <div className="cm-stat-box">
          <span className="cm-stat-label">
            <Layers size={13} aria-hidden="true" /> BET
          </span>
          <span className="cm-stat-value num">{bet.toFixed(2)}</span>
        </div>
      </div>

      {/* ---- Bet amount ---- */}
      <div className="cm-field">
        <span className="cm-section-label">BET AMOUNT</span>
        <div className={`cm-bet-grid${locked ? ' is-locked' : ''}`}>
          <button type="button" className="cm-sq-btn" onClick={onBetMin} disabled={locked} title="Minimum bet">MIN</button>
          <button type="button" className="cm-sq-btn" onClick={onBetHalf} disabled={locked} title="Halve bet">½</button>
          <button type="button" className="cm-sq-btn" onClick={() => onBetStep(-1)} disabled={locked} aria-label="Decrease bet by 0.10" title="-0.10">
            <Minus size={16} />
          </button>
          <output className="cm-bet-value num" aria-label={`Bet amount ${bet.toFixed(2)}`}>{bet.toFixed(2)}</output>
          <button type="button" className="cm-sq-btn" onClick={() => onBetStep(1)} disabled={locked} aria-label="Increase bet by 0.10" title="+0.10">
            <Plus size={16} />
          </button>
          <button type="button" className="cm-sq-btn" onClick={onBetDouble} disabled={locked} title="Double bet">2×</button>
          <button type="button" className="cm-sq-btn cm-sq-btn--max" onClick={onBetMax} disabled={locked} title="Bet entire balance">MAX</button>
        </div>
      </div>

      {/* ---- Mines ---- */}
      <div className="cm-field">
        <span className="cm-section-label">MINES</span>
        <div className={`cm-mines-stepper${locked ? ' is-locked' : ''}`}>
          <button type="button" className="cm-sq-btn" onClick={() => onMinesStep(-1)} disabled={locked || mines <= MIN_MINES} aria-label="Remove one mine">
            <Minus size={16} />
          </button>
          <span className="cm-mines-value num" aria-live="polite">{mines}</span>
          <button type="button" className="cm-sq-btn" onClick={() => onMinesStep(1)} disabled={locked || mines >= MAX_MINES} aria-label="Add one mine">
            <Plus size={16} />
          </button>
        </div>
        <div className="cm-chips" role="group" aria-label="Mine presets">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              className={`cm-chip${mines === p ? ' is-active' : ''}`}
              onClick={() => onSetMines(p)}
              disabled={locked}
              aria-pressed={mines === p}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Primary CTA ---- */}
      {playing ? (
        <button type="button" className="cm-cta cm-cta--cashout" onClick={onCashOut}>
          <span className="cm-cta-main">
            <Landmark size={20} aria-hidden="true" /> Cash Out
          </span>
          <span className="cm-cta-caption num">PAYOUT {potentialWin.toFixed(2)}</span>
        </button>
      ) : (
        <button
          type="button"
          className="cm-cta"
          onClick={onStart}
          disabled={balance < bet}
          aria-label="Start round"
        >
          <span className="cm-cta-main">
            <PlayCircle size={20} aria-hidden="true" /> Start Round
          </span>
          <span className="cm-cta-caption">REVEAL TILES</span>
        </button>
      )}

      {/* ---- Crypto Vault purchase card ---- */}
      <button
        type="button"
        className="cm-vault-card"
        onClick={onBuyVault}
        disabled={!canBuyVault}
        aria-label={`Buy Crypto Vault for ${vaultCost.toFixed(2)}, fifty times your bet`}
      >
        <span className="cm-vault-icon" aria-hidden="true">
          <Landmark size={18} />
        </span>
        <span className="cm-vault-label">CRYPTO VAULT</span>
        <span className="cm-vault-price num">{VAULT_COST_MULT}× BET</span>
        <span className="cm-vault-caption">Instant vault bonus entry</span>
      </button>
    </aside>
  );
}
