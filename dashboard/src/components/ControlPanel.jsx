/**
 * ControlPanel — right sidebar with three widgets:
 *  1. Multiplier Circuit (radar gauge + readout)
 *  2. Bet Quantum (slider, input, MIN / ½ / 2x / MAX quick actions)
 *  3. Mines Density (red slider + preset pills 1/5/10/15/20/24)
 * Plus the primary DEPLOY / CASH OUT action button.
 */

/** Radar/gauge widget showing the live multiplier */
export function MultiplierGauge({ multiplier }) {
  return (
    <div className="dm-widget dm-panel dm-panel--hud">
      <div className="dm-widget__title">
        <span className="dm-label">Multiplier Circuit</span>
        <span className="dm-label" style={{ color: 'var(--accent)' }}>Online</span>
      </div>

      <div className="dm-radar" role="meter" aria-valuenow={multiplier} aria-valuemin={1} aria-label="Current multiplier">
        <span className="dm-radar__ring" aria-hidden="true" />
        <span className="dm-radar__sweep" aria-hidden="true" />
        <span className="dm-radar__readout">
          <span className="dm-radar__value num">{multiplier.toFixed(2)}x</span>
          <span className="dm-radar__sub">Circuit Gain</span>
        </span>
      </div>
    </div>
  );
}

/** Bet widget — quantum slider + inset numeric field + quick chips */
export function BetPanel({ bet, minBet, maxBet, payout, disabled, onBetChange }) {
  const pct = ((bet - minBet) / Math.max(maxBet - minBet, 0.0001)) * 100;

  const clamp = (v) => Math.min(maxBet, Math.max(minBet, v));
  const setFill = (el) => el && el.style.setProperty('--fill', `${pct}%`);

  return (
    <div className="dm-widget dm-panel dm-panel--hud">
      <div className="dm-widget__title">
        <span className="dm-label">Bet Quantum</span>
        <span className="dm-label">BTC</span>
      </div>

      {/* Slider + value slot */}
      <div className="dm-slider-row">
        <input
          ref={setFill}
          type="range"
          className="dm-range"
          min={minBet} max={maxBet} step={0.01}
          value={bet}
          disabled={disabled}
          onChange={(e) => onBetChange(clamp(parseFloat(e.target.value)))}
          aria-label="Bet amount slider"
        />
        <input
          type="number"
          className="dm-input num"
          min={minBet} max={maxBet} step={0.01}
          value={bet}
          disabled={disabled}
          onChange={(e) => onBetChange(clamp(parseFloat(e.target.value) || minBet))}
          aria-label="Bet amount input"
        />
      </div>

      {/* Quick-action metallic buttons */}
      <div className="dm-quick">
        <button className="dm-chip" disabled={disabled} onClick={() => onBetChange(minBet)}>Min</button>
        <button className="dm-chip" disabled={disabled} onClick={() => onBetChange(clamp(bet / 2))}>½</button>
        <button className="dm-chip" disabled={disabled} onClick={() => onBetChange(clamp(bet * 2))}>2x</button>
        <button className="dm-chip" disabled={disabled} onClick={() => onBetChange(maxBet)}>Max</button>
      </div>

      {/* Projected payout row */}
      <div className="dm-payout">
        <span className="dm-label">Potential Payout</span>
        <span className="dm-payout__value num">{payout.toFixed(2)} ₿</span>
      </div>
    </div>
  );
}

/** Mines density widget — red-themed slider + preset selector pills */
export function MinesPanel({ mines, disabled, onMinesChange }) {
  const MIN = 1, MAX = 24;
  const presets = [1, 5, 10, 15, 20, 24];
  const pct = ((mines - MIN) / (MAX - MIN)) * 100;

  return (
    <div className="dm-widget dm-panel dm-panel--hud">
      <div className="dm-widget__title">
        <span className="dm-label" style={{ color: 'var(--danger)' }}>Mines Density</span>
        <span className="dm-label">{mines} / 25</span>
      </div>

      <input
        ref={(el) => el && el.style.setProperty('--fill', `${pct}%`)}
        type="range"
        className="dm-range dm-range--danger"
        min={MIN} max={MAX} step={1}
        value={mines}
        disabled={disabled}
        onChange={(e) => onMinesChange(parseInt(e.target.value, 10))}
        aria-label="Mines count slider"
      />

      {/* Preset density options */}
      <div className="dm-density">
        {presets.map((n) => (
          <button
            key={n}
            className={`dm-density__opt${n === mines ? ' dm-density__opt--active' : ''}`}
            disabled={disabled}
            onClick={() => onMinesChange(n)}
            aria-pressed={n === mines}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
