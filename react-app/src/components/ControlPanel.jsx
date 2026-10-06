import { memo } from 'react';
import { Trophy, Layers, Minus, Plus, PlayCircle, Landmark } from 'lucide-react';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber.js';
import CryptoSymbol from './CryptoSymbol.jsx';
import { MIN_MINES, MAX_MINES, VAULT_COST_MULT } from '../game/logic.js';

const PRESETS = [1, 5, 10, 15, 20, 24];

/* SVG progress-ring geometry for the multiplier dial */
const RING_R = 56;                       // ring radius in a 120×120 viewBox
const RING_CIRC = 2 * Math.PI * RING_R;  // circumference (dash units)

/** Map the multiplier onto a 0–1 ring fill on a log-ish ladder scale. */
function ringProgress(multiplier) {
  const pct = Math.min(1, Math.max(0, (multiplier - 1) / 9));
  return 0.02 + pct * 0.98;              // small base arc so the ring is never empty
}

/**
 * Right-hand control panel (spec §9–§15): circular multiplier HUD with an
 * SVG progress ring, Potential Win / Bet stat boxes, one-row segmented bet
 * controls (MIN · ½ · [− value +] · 2× · MAX), mines stepper + preset chips,
 * the large cyan Start Round CTA (green Cash Out while a round runs) and the
 * Crypto Vault purchase card. Every input locks while `gameState === 'playing'`.
 *
 * Memoized: stable callbacks from App mean this panel only re-renders when
 * its own props (bet/mines/multiplier/game state) actually change.
 */
function ControlPanelBase({
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
          role="img"
          aria-label={`Current multiplier ${multiplier.toFixed(2)}×`}
        >
          {/* SVG progress ring — communicates ladder position, not colour alone */}
          <svg className="cm-mult-ring-svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="cmRingGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent-2)" />
              </linearGradient>
            </defs>
            <circle className="cm-mult-ring-track" cx="60" cy="60" r={RING_R} />
            <circle
              className="cm-mult-ring-fill"
              cx="60" cy="60" r={RING_R}
              strokeDasharray={RING_CIRC}
              strokeDashoffset={RING_CIRC * (1 - ringProgress(multiplier))}
            />
          </svg>
          {/* faint brand watermark inside the dial */}
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

      {/* ---- Bet amount — MIN · ½ · [− value +] · 2× · MAX on one row ---- */}
      <div className="cm-field">
        <span className="cm-section-label">BET AMOUNT</span>
        <div className={`cm-bet-grid${locked ? ' is-locked' : ''}`}>
          <button type="button" className="cm-sq-btn cm-sq-btn--min" onClick={onBetMin} disabled={locked} title="Minimum bet">MIN</button>
          <button type="button" className="cm-sq-btn cm-sq-btn--half" onClick={onBetHalf} disabled={locked} title="Halve bet">½</button>
          <div className="cm-bet-stepper">
            <button type="button" className="cm-sq-btn" onClick={() => onBetStep(-1)} disabled={locked} aria-label="Decrease bet by 0.10" title="-0.10">
              <Minus size={16} />
            </button>
            <output className="cm-bet-value num" aria-label={`Bet amount ${bet.toFixed(2)}`}>{bet.toFixed(2)}</output>
            <button type="button" className="cm-sq-btn" onClick={() => onBetStep(1)} disabled={locked} aria-label="Increase bet by 0.10" title="+0.10">
              <Plus size={16} />
            </button>
          </div>
          <button type="button" className="cm-sq-btn cm-sq-btn--double" onClick={onBetDouble} disabled={locked} title="Double bet">2×</button>
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
