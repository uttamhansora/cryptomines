import { useCallback, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import ChainStepper from './components/ChainStepper.jsx';
import Board from './components/Board.jsx';
import InfoCards from './components/InfoCards.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import Modal from './components/Modal.jsx';
import Confetti from './components/Confetti.jsx';
import { sfx } from './game/sound.js';
import {
  TILES,
  MIN_BET,
  BET_STEP,
  MIN_MINES,
  MAX_MINES,
  DEFAULT_MINES,
  CHAIN_STEPS,
  VAULT_SLOTS,
  VAULT_COST_MULT,
  STARTING_BALANCE,
  buildBoard,
  effectiveMultiplier,
  clampBet,
  clampMines,
  round2,
} from './game/logic.js';

const HIDDEN = Array.from({ length: TILES }, () => 'hidden');

export default function App() {
  /* ---------------- game state (spec) ---------------- */
  const [balance, setBalance] = useState(STARTING_BALANCE);
  const [bet, setBet] = useState(1.0);
  const [minesCount, setMinesCount] = useState(DEFAULT_MINES);
  const [boardData, setBoardData] = useState([]);          // [{mine, vault}, …]
  const [tiles, setTiles] = useState(HIDDEN);              // per-tile visual state
  const [gameState, setGameState] = useState('idle');      // idle | playing | busted | cashedOut
  const [safeReveals, setSafeReveals] = useState(0);       // k — drives multiplier math
  const [chainProgress, setChainProgress] = useState(0);   // 0-5 steps this streak
  const [chainBoosts, setChainBoosts] = useState(0);       // completed chains -> +0.25x each
  const [vaultCount, setVaultCount] = useState(0);         // 0-3 symbols collected

  /* ---------------- presentation-only state ---------------- */
  const [soundOn, setSoundOn] = useState(true);
  const [shake, setShake] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [winModal, setWinModal] = useState(null);          // { amount, isVault }
  const [confettiKey, setConfettiKey] = useState(0);
  const soundRef = useRef(soundOn);
  const play = useCallback((fn) => { if (soundRef.current) fn(); }, []);

  const toggleSound = () => {
    setSoundOn((v) => {
      soundRef.current = !v;
      return !v;
    });
  };

  /* ---------------- derived values ---------------- */
  const multiplier = gameState === 'playing' && safeReveals > 0
    ? effectiveMultiplier(safeReveals, minesCount, chainBoosts)
    : 1;
  const potentialWin = round2(bet * multiplier);

  /* ---------------- bet controls (locked while playing) ---------------- */
  const adjustBet = (updater) => {
    if (gameState === 'playing') return;
    play(sfx.click);
    setBet((b) => clampBet(updater(b), balance));
  };
  const onBetMin = () => adjustBet(() => MIN_BET);
  const onBetHalf = () => adjustBet((b) => b / 2);
  const onBetDouble = () => adjustBet((b) => b * 2);
  const onBetMax = () => adjustBet(() => balance);
  const onBetStep = (dir) => adjustBet((b) => b + dir * BET_STEP);
  const onSetBet = (v) => adjustBet(() => v);

  /* ---------------- mines controls ---------------- */
  const onSetMines = (v) => {
    if (gameState === 'playing') return;
    play(sfx.click);
    setMinesCount(clampMines(v));
  };
  const onMinesStep = (dir) => {
    if (gameState === 'playing') return;
    play(sfx.click);
    setMinesCount((m) => clampMines(m + dir));
  };

  /* ---------------- round lifecycle ---------------- */
  const startRound = () => {
    if (gameState === 'playing' || balance < bet) return;
    play(sfx.click);
    setBalance((b) => round2(b - bet));                    // deduct stake
    setBoardData(buildBoard(minesCount));                  // Fisher-Yates placement
    setTiles(HIDDEN);
    setSafeReveals(0);
    setChainProgress(0);
    setChainBoosts(0);
    setVaultCount(0);
    setGameState('playing');
  };

  const revealTile = (index) => {
    if (gameState !== 'playing' || tiles[index] !== 'hidden') return;
    const cell = boardData[index];

    if (cell.mine) {
      /* ---- BUST: explode the hit tile, dim-reveal remaining mines ---- */
      play(sfx.mine);
      setShake(true);
      setTimeout(() => setShake(false), 480);
      setTiles((t) => t.map((s, i) => {
        if (i === index) return 'mine';
        if (boardData[i].mine) return 'mine-ghost';
        return s;
      }));
      setGameState('busted');
      // Bet already deducted at start — nothing returned on a bust.
      setTimeout(() => setGameState('idle'), 1600);        // auto-reset to allow new round
      return;
    }

    /* ---- SAFE reveal ---- */
    play(sfx.reveal);
    const nextK = safeReveals + 1;
    setTiles((t) => t.map((s, i) => (i === index ? (cell.vault ? 'safe-vault' : 'safe') : s)));
    setSafeReveals(nextK);

    // Chain: every safe reveal advances one step; completing step 5 boosts & resets.
    setChainProgress((c) => {
      const next = c + 1;
      if (next >= CHAIN_STEPS) {
        setChainBoosts((b) => b + 1);
        play(sfx.chain);
        return 0;                                          // reset after boost
      }
      return next;
    });

    // Vault symbol collection
    if (cell.vault) {
      setVaultCount((v) => {
        const nv = Math.min(VAULT_SLOTS, v + 1);
        if (nv === VAULT_SLOTS) unlockVault();
        else play(sfx.vault);
        return nv;
      });
    }

    // Filled every safe tile — auto cash out.
    if (nextK === TILES - minesCount) {
      setTimeout(cashOut, 350);
    }
  };

  const cashOut = () => {
    if (gameState !== 'playing' || safeReveals === 0) return;
    const win = round2(bet * effectiveMultiplier(safeReveals, minesCount, chainBoosts));
    play(sfx.cashout);
    setBalance((b) => round2(b + win));
    setGameState('cashedOut');
    setWinModal({ amount: win, isVault: false });
    setConfettiKey((k) => k + 1);
    setTimeout(() => setGameState('idle'), 900);
  };

  /** Shared vault bonus reward — used by collect-3 and by Buy Vault. */
  const grantVaultBonus = (cost = 0) => {
    const reward = round2(Math.max(bet * 2, cost));         // simple bonus payout
    setBalance((b) => round2(b - cost + reward));
    setWinModal({ amount: reward, isVault: true });
    setConfettiKey((k) => k + 1);
    play(sfx.vault);
  };

  const unlockVault = () => grantVaultBonus(0);

  const buyVault = () => {
    const cost = round2(bet * VAULT_COST_MULT);
    if (gameState === 'playing' || balance < cost) return;
    grantVaultBonus(cost);
    setVaultCount(VAULT_SLOTS);                              // show slots as filled
  };

  const closeWinModal = () => setWinModal(null);

  /* ---------------- layout ---------------- */
  return (
    <div className="cm-page">
      {/* Ambient background: radial teal glow behind board + side light streaks */}
      <div className="cm-bg" aria-hidden="true">
        <span className="cm-bg-glow" />
        <span className="cm-bg-streak cm-bg-streak--l" />
        <span className="cm-bg-streak cm-bg-streak--r" />
      </div>

      <div className="cm-container">
        <Header
          balance={balance}
          soundOn={soundOn}
          onToggleSound={toggleSound}
          onInfo={() => setShowRules(true)}
        />

        <main className="cm-layout">
          {/* ============ LEFT COLUMN — board area ============ */}
          <div className="cm-col-board">
            <ChainStepper progress={chainProgress} />

            <p className="cm-tagline">REVEAL&nbsp;&nbsp;·&nbsp;&nbsp;MULTIPLY&nbsp;&nbsp;·&nbsp;&nbsp;CASH OUT</p>

            <Board
              tiles={tiles}
              roundActive={gameState === 'playing'}
              shake={shake}
              onReveal={revealTile}
            />

            <InfoCards chainProgress={chainProgress} vaultCount={vaultCount} />
          </div>

          {/* ============ RIGHT COLUMN — control panel ============ */}
          <ControlPanel
            multiplier={multiplier}
            potentialWin={potentialWin}
            bet={bet}
            mines={minesCount}
            balance={balance}
            gameState={gameState}
            onSetBet={onSetBet}
            onBetMin={onBetMin}
            onBetHalf={onBetHalf}
            onBetDouble={onBetDouble}
            onBetMax={onBetMax}
            onBetStep={onBetStep}
            onSetMines={onSetMines}
            onMinesStep={onMinesStep}
            onStart={startRound}
            onCashOut={cashOut}
            onBuyVault={buyVault}
          />
        </main>
      </div>

      {/* ============ Overlays ============ */}
      {confettiKey > 0 && winModal && <Confetti key={confettiKey} />}

      {winModal && (
        <Modal title={winModal.isVault ? 'VAULT BONUS UNLOCKED' : 'YOU WON'} onClose={closeWinModal} accent>
          <p className="cm-win-amount num">{winModal.amount.toFixed(2)}</p>
          <p className="cm-modal-text">
            {winModal.isVault
              ? 'The full vault has been cracked. Bonus credited to your balance.'
              : 'Nice nerves. Winnings credited to your balance.'}
          </p>
          <button type="button" className="cm-btn-primary" onClick={closeWinModal}>COLLECT</button>
        </Modal>
      )}

      {showRules && (
        <Modal title="HOW TO PLAY" onClose={() => setShowRules(false)}>
          <ul className="cm-rules-list">
            <li>Set your <strong>bet</strong> and choose how many <strong>mines</strong> hide in the 5×5 field.</li>
            <li><strong>Start Round</strong>, then reveal tiles. Every safe gem raises your multiplier.</li>
            <li><strong>Cash Out</strong> any time before hitting a mine to bank bet × multiplier.</li>
            <li>Fill the <strong>Crypto Chain</strong> (5 safe reveals) for a +0.25x boost.</li>
            <li>Collect <strong>3 Vault symbols</strong> on safe tiles — or buy instant entry — to crack the vault for a bonus.</li>
            <li>Hit a mine and the round is lost. House edge: 1%.</li>
          </ul>
          <button type="button" className="cm-btn-primary" onClick={() => setShowRules(false)}>GOT IT</button>
        </Modal>
      )}
    </div>
  );
}
