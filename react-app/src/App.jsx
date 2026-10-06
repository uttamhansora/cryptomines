import { useCallback, useMemo, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import ChainStepper from './components/ChainStepper.jsx';
import Board from './components/Board.jsx';
import InfoCards from './components/InfoCards.jsx';
import ControlPanel from './components/ControlPanel.jsx';
import StatusBanner from './components/StatusBanner.jsx';
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

  /* Refs mirror the latest values so `revealTile` can stay referentially
     STABLE (required for memoized tiles to bail out on re-render). Reading
     refs gives synchronous access to current state inside the handler. */
  const gameStateRef = useRef(gameState);
  const boardDataRef = useRef(boardData);
  const tilesRef = useRef(tiles);
  const safeRevealsRef = useRef(safeReveals);
  const chainProgressRef = useRef(chainProgress);
  const vaultCountRef = useRef(vaultCount);
  const minesCountRef = useRef(minesCount);
  const betRef = useRef(bet);
  const chainBoostsRef = useRef(chainBoosts);
  const balanceRef = useRef(balance);
  gameStateRef.current = gameState;
  boardDataRef.current = boardData;
  tilesRef.current = tiles;
  safeRevealsRef.current = safeReveals;
  chainProgressRef.current = chainProgress;
  vaultCountRef.current = vaultCount;
  minesCountRef.current = minesCount;
  betRef.current = bet;
  chainBoostsRef.current = chainBoosts;
  balanceRef.current = balance;

  /* Cash-out core — reads from refs so it can be called from stable
     callbacks (manual click OR auto-cashout timer) with identical math. */
  const doCashOut = useCallback(() => {
    if (gameStateRef.current !== 'playing' || safeRevealsRef.current === 0) return;
    const win = round2(
      betRef.current * effectiveMultiplier(
        safeRevealsRef.current, minesCountRef.current, chainBoostsRef.current
      )
    );
    if (soundRef.current) sfx.cashout();
    setBalance((b) => round2(b + win));
    setGameState('cashedOut');
    setWinModal({ amount: win, isVault: false });
    setConfettiKey((k) => k + 1);
    setTimeout(() => setGameState('idle'), 900);
  }, []);

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

  /* ---------------- bet controls (locked while playing) ----------------
     All handlers are useCallback-stable so memoized children (ControlPanel)
     bail out of re-renders when only board state changes. */
  const adjustBet = useCallback((updater) => {
    if (gameStateRef.current === 'playing') return;
    play(sfx.click);
    setBalance((bal) => setBet((b) => clampBet(updater(b), bal)));
  }, [play]);
  const onBetMin = useCallback(() => adjustBet(() => MIN_BET), [adjustBet]);
  const onBetHalf = useCallback(() => adjustBet((b) => b / 2), [adjustBet]);
  const onBetDouble = useCallback(() => adjustBet((b) => b * 2), [adjustBet]);
  const onBetMax = useCallback(() => adjustBet((b) => b), [adjustBet]); // clamp caps at balance
  const onBetStep = useCallback((dir) => adjustBet((b) => b + dir * BET_STEP), [adjustBet]);
  const onSetBet = useCallback((v) => adjustBet(() => v), [adjustBet]);

  /* ---------------- mines controls ---------------- */
  const onSetMines = useCallback((v) => {
    if (gameStateRef.current === 'playing') return;
    play(sfx.click);
    setMinesCount(clampMines(v));
  }, [play]);
  const onMinesStep = useCallback((dir) => {
    if (gameStateRef.current === 'playing') return;
    play(sfx.click);
    setMinesCount((m) => clampMines(m + dir));
  }, [play]);

  /* ---------------- round lifecycle ---------------- */
  const startRound = useCallback(() => {
    if (gameStateRef.current === 'playing') return;
    // Read balance synchronously from the latest committed value.
    if (balanceRef.current < betRef.current) return;
    play(sfx.click);
    /* Everything needed by the reveal handler is committed synchronously
       into refs BEFORE setState, so a click landing on the very first paint
       of the new round already resolves correctly — zero artificial delay. */
    const freshBoard = buildBoard(minesCountRef.current);    // Fisher-Yates placement
    boardDataRef.current = freshBoard;
    tilesRef.current = HIDDEN;
    safeRevealsRef.current = 0;
    chainProgressRef.current = 0;
    vaultCountRef.current = 0;

    setBalance((b) => round2(b - betRef.current));           // deduct stake
    setBoardData(freshBoard);
    setTiles(HIDDEN);
    setSafeReveals(0);
    setChainProgress(0);
    setChainBoosts(0);
    setVaultCount(0);
    setGameState('playing');
  }, [play]);

  const revealTile = useCallback((index) => {
    if (gameStateRef.current !== 'playing') return;

    /* Resolve mine/safe synchronously from the latest board — the result
       state is committed in THIS render, so the correct symbol appears on
       the very next paint (no timers gate the icon). */
    const cell = boardDataRef.current[index];
    if (!cell || tilesRef.current[index] !== 'hidden') return;

    let nextTiles;
    if (cell.mine) {
      play(sfx.mine);
      setShake(true);
      setTimeout(() => setShake(false), 480); // presentation only
      nextTiles = tilesRef.current.map((s, i) => {
        if (i === index) return 'mine';
        if (boardDataRef.current[i].mine) return 'mine-ghost';
        return s;
      });
      setTiles(nextTiles);
      setGameState('busted');
      // Bet already deducted at start — nothing returned on a bust.
      setTimeout(() => setGameState('idle'), 1600); // auto-reset for new round
      return;
    }

    play(sfx.reveal);
    const nextK = safeRevealsRef.current + 1;
    nextTiles = tilesRef.current.map((s, i) =>
      i === index ? (cell.vault ? 'safe-vault' : 'safe') : s
    );
    setTiles(nextTiles);
    setSafeReveals(nextK);

    // Chain: every safe reveal advances one step; completing step 5 boosts & resets.
    const c = chainProgressRef.current + 1;
    if (c >= CHAIN_STEPS) {
      setChainBoosts((b) => b + 1);
      setChainProgress(0); // reset after boost
      play(sfx.chain);
    } else {
      setChainProgress(c);
    }

    // Vault symbol collection
    if (cell.vault) {
      const nv = Math.min(VAULT_SLOTS, vaultCountRef.current + 1);
      setVaultCount(nv);
      if (nv === VAULT_SLOTS) unlockVault();
      else play(sfx.vault);
    }

    // Filled every safe tile — auto cash out.
    if (nextK === TILES - minesCountRef.current) {
      setTimeout(cashOut, 350);
    }
  }, [play]);

  /* Shared vault bonus reward — used by collect-3 and by Buy Vault.
     Stable + ref-based so revealTile (memoized tiles) can call it safely. */
  const grantVaultBonus = useCallback((cost = 0) => {
    const b = betRef.current;
    const reward = round2(Math.max(b * 2, cost));           // simple bonus payout
    setBalance((bal) => round2(bal - cost + reward));
    setWinModal({ amount: reward, isVault: true });
    setConfettiKey((k) => k + 1);
    if (soundRef.current) sfx.vault();
  }, []);

  const unlockVault = useCallback(() => grantVaultBonus(0), [grantVaultBonus]);

  const cashOut = doCashOut;

  const buyVault = useCallback(() => {
    const cost = round2(betRef.current * VAULT_COST_MULT);
    if (gameStateRef.current === 'playing' || balanceRef.current < cost) return;
    grantVaultBonus(cost);
    setVaultCount(VAULT_SLOTS);                              // show slots as filled
  }, [grantVaultBonus]);

  const closeWinModal = useCallback(() => setWinModal(null), []);
  const openRules = useCallback(() => setShowRules(true), []);
  const closeRules = useCallback(() => setShowRules(false), []);

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
          onInfo={openRules}
        />

        {/* Full-width Crypto Chain HUD strip between header and main grid */}
        <ChainStepper progress={chainProgress} />

        <main className="cm-layout">
          {/* ============ LEFT COLUMN — board area (focal point) ============ */}
          <div className="cm-col-board">
            <p className="cm-tagline">REVEAL&nbsp;&nbsp;·&nbsp;&nbsp;MULTIPLY&nbsp;&nbsp;·&nbsp;&nbsp;CASH OUT</p>

            <Board
              tiles={tiles}
              roundActive={gameState === 'playing'}
              shake={shake}
              onReveal={revealTile}
            />

            {/* Compact HUD instruction — small, centred, muted (spec §9) */}
            <p className="cm-instruction">TAP A TILE ON THE BOARD TO REVEAL</p>

            {/* Clear, human-readable game feedback (never colour alone) */}
            <StatusBanner gameState={gameState} balance={balance} bet={bet} />

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
        <Modal title="HOW TO PLAY" onClose={closeRules}>
          <div className="cm-rules-section">
            <h3 className="cm-rules-subtitle">THE BASICS</h3>
            <ul className="cm-rules-list">
              <li>Set your <strong>bet</strong> and choose how many <strong>mines</strong> hide in the 5×5 field.</li>
              <li><strong>Start Round</strong>, then reveal tiles. Every safe gem raises your multiplier.</li>
              <li><strong>Cash Out</strong> any time before hitting a mine to bank bet × multiplier.</li>
            </ul>
          </div>
          <div className="cm-rules-section">
            <h3 className="cm-rules-subtitle">BONUS FEATURES</h3>
            <ul className="cm-rules-list">
              <li>Fill the <strong>Crypto Chain</strong> (5 safe reveals) for a +0.25x boost.</li>
              <li>Collect <strong>3 Vault symbols</strong> on safe tiles — or buy instant entry — to crack the vault for a bonus.</li>
            </ul>
          </div>
          <div className="cm-rules-section">
            <h3 className="cm-rules-subtitle">GOOD TO KNOW</h3>
            <ul className="cm-rules-list">
              <li>Hit a mine and the round is lost. House edge: 1%.</li>
            </ul>
          </div>
          <button type="button" className="cm-btn-primary" onClick={closeRules}>GOT IT</button>
        </Modal>
      )}
    </div>
  );
}
