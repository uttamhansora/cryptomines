import { memo } from 'react';
import { Trophy, Layers, Minus, Plus, PlayCircle, Landmark } from 'lucide-react';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber.js';
import CryptoSymbol from './CryptoSymbol.jsx';
import { MIN_MINES, MAX_MINES, BET_STEP, VAULT_COST_MULT } from '../game/logic.js';

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
 * Right-hand control column — three stacked futuristic machine panels that
 * mirror the reference composition (§10–§13):
 *   PANEL 1 · MULTIPLIER      circular radar dial + POTENTIAL WIN / CURRENT BET
 *   PANEL 2 · BET QUANTUM     [-] ─ value ─ [+] track + MIN ½ 1.00 2× MAX row
 *   PANEL 3 · MINES DENSITY   cyan slider + preset chips (1·5·10·15·20·24)
 * …followed by the Start Round / Cash Out CTA and the Crypto Vault card.
 * All controls drive the app's existing bet/mines logic — nothing invented.
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

  // Slider fill % for the CSS gradient track (pure derivation, no state).
  const minePct = ((mines - MIN_MINES) / (MAX_MINES - MIN_MINES)) * 100;

  return (
    <aside className="cm-panel" aria-label="Game controls">
      {/* ==================== PANEL 1 — MULTIPLIER ==================== */}
      <section className="cm-subpanel">
        <div className="cm-mult-block">
          <span className="cm-section-label cm-center">
            <span className="cm-dot" aria-hidden="true" /> MULTIPLIER CIRCUIT
          </span>
          <div
            className={`cm-mult-badge${playing ? ' is-live' : ''}`}
            key={multiplier /* retrigger glow pulse on change */}
            role="img"
            aria-label={`Current multiplier ${multiplier.toFixed(2)}×`}
          >
            {/* animated concentric-ring decoration around the dial */}
            <span className="cm-mult-rings" aria-hidden="true">
              <span className="cm-mult-ring-line" />
              <span className="cm-mult-ring-line cm-mult-ring-line--2" />
              <span className="cm-mult-ring-line cm-mult-ring-line--3" />
            </span>
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
        </div>

        {/* POTENTIAL WIN / CURRENT BET — stat boxes live inside the same panel */}
        <div className="cm-stats">
          <div className="cm-stat-box">
            <span className="cm-stat-label">
              <Trophy size={13} aria-hidden="true" /> POTENTIAL WIN
            </span>
            <span className="cm-stat-value is-accent num">{animWin.toFixed(2)}</span>
          </div>
          <div className="cm-stat-box">
            <span className="cm-stat-label">
              <Layers size={13} aria-hidden="true" /> CURRENT BET
            </span>
            <span className="cm-stat-value num">{bet.toFixed(2)}</span>
          </div>
        </div>
      </section>

      {/* ==================== PANEL 2 — BET QUANTUM ==================== */}
      <section className="cm-subpanel">
        <span className="cm-section-label">
          BET QUANTUM
          <span className="cm-label-value num">{bet.toFixed(2)}</span>
        </span>

        {/* [-] ───────●────── [+] adjustment track */}
        <div className={`cm-slider-row${locked ? ' is-locked' : ''}`}>
          <button type="button" className="cm-sq-btn" onClick={() => onBetStep(-1)} disabled={locked} aria-label={`Decrease bet by ${BET_STEP.toFixed(2)}`} title={`-${BET_STEP.toFixed(2)}`}>
            <Minus size={16} />
          </button>
          <input
            className="cm-slider"
            type="range"
            min={0.1}
            max={Math.max(0.1, Math.floor(balance))}
            step={BET_STEP}
            value={Math.min(bet, Math.max(0.1, Math.floor(balance)))}
            disabled={locked}
            style={{ '--cm-slider-pct': `${((Math.min(bet, Math.max(0.1, Math.floor(balance))) - 0.1) / Math.max(0.1, Math.max(0.1, Math.floor(balance)) - 0.1)) * 100}%` }}
            onChange={(e) => onSetBet(parseFloat(e.target.value))}
            aria-label="Bet amount slider"
          />
          <button type="button" className="cm-sq-btn" onClick={() => onBetStep(1)} disabled={locked} aria-label={`Increase bet by ${BET_STEP.toFixed(2)}`} title={`+${BET_STEP.toFixed(2)}`}>
            <Plus size={16} />
          </button>
        </div>

        {/* quick controls: MIN · ½ · value · 2× · MAX */}
        <div className={`cm-bet-grid${locked ? ' is-locked' : ''}`}>
          <button type="button" className="cm-sq-btn cm-sq-btn--min" onClick={onBetMin} disabled={locked} title="Minimum bet">MIN</button>
          <button type="button" className="cm-sq-btn cm-sq-btn--half" onClick={onBetHalf} disabled={locked} title="Halve bet">½</button>
          <output className="cm-bet-value num" aria-label={`Bet amount ${bet.toFixed(2)}`}>{bet.toFixed(2)}</output>
          <button type="button" className="cm-sq-btn cm-sq-btn--double" onClick={onBetDouble} disabled={locked} title="Double bet">2×</button>
          <button type="button" className="cm-sq-btn cm-sq-btn--max" onClick={onBetMax} disabled={locked} title="Bet entire balance">MAX</button>
        </div>
      </section>

      {/* ==================== PANEL 3 — MINES DENSITY ==================== */}
      <section className="cm-subpanel">
        <span className="cm-section-label">
          MINES DENSITY
          <span className="cm-label-value num">{mines}</span>
        </span>

        <div className={`cm-slider-row${locked ? ' is-locked' : ''}`}>
          <button type="button" className="cm-sq-btn" onClick={() => onMinesStep(-1)} disabled={locked || mines <= MIN_MINES} aria-label="Remove one mine">
            <Minus size={16} />
          </button>
          <input
            className="cm-slider cm-slider--danger"
            type="range"
            min={MIN_MINES}
            max={MAX_MINES}
            step={1}
            value={mines}
            disabled={locked}
            style={{ '--cm-slider-pct': `${minePct}%` }}
            onChange={(e) => onSetMines(parseInt(e.target.value, 10))}
            aria-label="Mines density slider"
          />
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
      </section>

      {/* ==================== CTA + VAULT ==================== */}
      <div className="cm-subpanel cm-subpanel--cta">
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
      </div>
    </aside>
  );
}

const ControlPanel = memo(ControlPanelBase);
export default ControlPanel;
