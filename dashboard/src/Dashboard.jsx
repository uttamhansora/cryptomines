import { useCallback, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Board from './components/Board.jsx';
import StatusBar from './components/StatusBar.jsx';
import { MultiplierGauge, BetPanel, MinesPanel } from './components/ControlPanel.jsx';

/* ---------------- game constants ---------------- */
const TILES = 25;
const MIN_BET = 0.01;
const STARTING_BALANCE = 10.5;
const CHAIN_GOAL = 5;
const VAULT_GOAL = 1;

const HIDDEN = Array.from({ length: TILES }, () => 'hidden');

/** Fair minesweeper-style multiplier: probability of k safe picks in a row. */
function multiplierFor(reveals, mines) {
  if (reveals === 0) return 1;
  let m = 1;
  for (let i = 0; i < reveals; i++) {
    m *= (TILES - i) / (TILES - mines - i);
  }
  return Math.round(m * 0.97 * 100) / 100; // 3% house edge
}

export default function Dashboard() {
  /* ---------------- state ---------------- */
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [bet, setBet] = useState(0.1);
  const [mines, setMines] = useState(5);
  const [mineSet, setMineSet] = useState(() => new Set());
  const [tiles, setTiles] = useState(HIDDEN);        // 'hidden' | 'safe' | 'mine'
  const [phase, setPhase] = useState('idle');        // idle | playing | busted | won
  const [reveals, setReveals] = useState(0);
  const [chainProgress, setChainProgress] = useState(0);
  const [vaultProgress, setVaultProgress] = useState(0);
  const [soundOn, setSoundOn] = useState(true);

  const maxBet = useMemo(() => Math.max(MIN_BET, Math.floor(balance * 100) / 100), [balance]);
  const clampedBet = Math.min(bet, maxBet);
  const multiplier = phase === 'playing' ? multiplierFor(reveals, mines) : 1;
  const payout = clampedBet * multiplier;

  /* ---------------- actions ---------------- */
  const startRound = useCallback(() => {
    if (clampedBet > balance) return;
    // Randomly place `mines` bombs across the 25-cell field.
    const s = new Set();
    while (s.size < mines) s.add(Math.floor(Math.random() * TILES));
    setMineSet(s);
    setTiles(HIDDEN);
    setReveals(0);
    setBalance((b) => Math.round((b - clampedBet) * 100) / 100);
    setPhase('playing');
  }, [clampedBet, balance, mines]);

  const revealTile = useCallback((i) => {
    if (phase !== 'playing') return;
    if (mineSet.has(i)) {
      // BUSTED — expose every mine.
      setTiles((t) => t.map((v, idx) => (v === 'hidden' && mineSet.has(idx) ? 'mine' : v)));
      setPhase('busted');
      setChainProgress(0);
      return;
    }
    setTiles((t) => t.map((v, idx) => (idx === i ? 'safe' : v)));
    const nextReveals = reveals + 1;
    setReveals(nextReveals);
    setChainProgress((p) => Math.min(p + 1, CHAIN_GOAL));
    if (nextReveals === TILES - mines) {
      // Full clear → vault bonus unlocked.
      setPhase('won');
      setVaultProgress(VAULT_GOAL);
    }
  }, [phase, mineSet, reveals]);

  const cashOut = useCallback(() => {
    if (phase !== 'playing' || reveals === 0) return;
    const win = Math.round(clampedBet * multiplierFor(reveals, mines) * 100) / 100;
    setBalance((b) => Math.round((b + win) * 100) / 100);
    setPhase('won');
  }, [phase, reveals, clampedBet, mines]);

  const resetToIdle = useCallback(() => setPhase('idle'), []);

  /* Board is interactive only mid-round. */
  const boardDisabled = phase !== 'playing';

  const statusText =
    phase === 'idle'   ? 'AWAITING DEPLOYMENT — SET QUANTUM & DENSITY' :
    phase === 'playing'? `${reveals} SECTOR${reveals === 1 ? '' : 'S'} SECURED · ${mines} MINES ARMED` :
    phase === 'busted' ? '⚠ MINE DETONATED — LINK SEVERED' :
                         'ROUND COMPLETE — FUNNEL SETTLED';

  /* ---------------- render ---------------- */
  return (
    <div className="dm-page">
      {/* Ambient deep-space background: nebulae + starlight + streaks */}
      <div className="dm-bg" aria-hidden="true">
        <span className="dm-nebula dm-nebula--cyan" />
        <span className="dm-nebula dm-nebula--red" />
        <span className="dm-stars" />
        <span className="dm-stars dm-stars--far" />
        <span className="dm-streak dm-streak--l" />
        <span className="dm-streak dm-streak--r" />
      </div>

      <div className="dm-container">
        <Header balance={balance} soundOn={soundOn} onToggleSound={() => setSoundOn((s) => !s)} />

        {/* Main split: interactive grid + control sidebar */}
        <main className="dm-main">
          <Board tiles={tiles} disabled={boardDisabled} statusText={statusText} onReveal={revealTile} />

          <aside className="dm-sidebar" aria-label="Controls">
            <MultiplierGauge multiplier={multiplier} />

            <BetPanel
              bet={clampedBet}
              minBet={MIN_BET}
              maxBet={maxBet}
              payout={phase === 'playing' ? payout : clampedBet * multiplierFor(1, mines)}
              disabled={phase === 'playing'}
              onBetChange={setBet}
            />

            <MinesPanel mines={mines} disabled={phase === 'playing'} onMinesChange={setMines} />

            {/* Primary action: context-aware CTA */}
            {phase === 'playing' ? (
              <button
                className="dm-cta dm-cta--danger"
                onClick={cashOut}
                disabled={reveals === 0}
              >
                Cash Out · {payout.toFixed(2)} ₿
              </button>
            ) : phase === 'idle' ? (
              <button className="dm-cta" onClick={startRound} disabled={clampedBet > balance}>
                Deploy Round
              </button>
            ) : (
              <button className="dm-cta" onClick={resetToIdle}>New Round</button>
            )}
          </aside>
        </main>

        {/* Bottom modular status windows */}
        <StatusBar
          chainProgress={chainProgress}
          chainGoal={CHAIN_GOAL}
          vaultProgress={vaultProgress}
          vaultGoal={VAULT_GOAL}
        />
      </div>
    </div>
  );
}
