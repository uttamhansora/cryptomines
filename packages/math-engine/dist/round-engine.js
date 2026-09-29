import { CELL_COUNT, BOOK_SCALE, VAULT_TOKENS_TO_TRIGGER, VAULT_CHEST_COUNT, } from '@crypto-mines/shared';
import { SeededRng } from './rng.js';
import { assignSymbolsToSafeCells } from './symbols.js';
import { getMultiplierBook, capMultiplierBook } from './multipliers.js';
import { updateChainProgress } from './chain.js';
import { createVaultBonusState, resolveVaultPayout } from './vault.js';
import { applyStreakChain } from './streak-chain.js';
import { computePayoutBook } from './payout.js';
function emptyRoundFields() {
    return {
        chainBonusBook: 0,
        vaultPayoutBook: 0,
        vaultResolved: false,
        vaultTokensCollected: 0,
        chainStreak: 0,
        buyMode: false,
        terminal: false,
        payoutBook: 0,
    };
}
export function createRound(config) {
    const rng = new SeededRng(config.seed);
    const allCells = Array.from({ length: CELL_COUNT }, (_, i) => i);
    const shuffled = rng.shuffle(allCells);
    const mineCells = new Set(shuffled.slice(0, config.mineCount));
    const safeIndices = shuffled.slice(config.mineCount);
    const symbolByCell = assignSymbolsToSafeCells(safeIndices, rng);
    const events = [];
    let idx = 0;
    events.push({
        index: idx++,
        type: 'reveal',
        revealType: 'roundStart',
        mineCount: config.mineCount,
        boardSize: CELL_COUNT,
        serverSeedHash: rng.nextUint32().toString(16),
    });
    events.push({
        index: idx++,
        type: 'reveal',
        revealType: 'boardReady',
        mineCount: config.mineCount,
        boardSize: CELL_COUNT,
    });
    return {
        mineCount: config.mineCount,
        mineCells,
        symbolByCell,
        revealed: new Set(),
        safePicks: 0,
        multiplierBook: BOOK_SCALE,
        chainProgress: [],
        ...emptyRoundFields(),
        events,
    };
}
/** Paid entry — authoritative 50× bet handled in RGS; round is vault-only */
export function createBuyVaultRound(config) {
    const rng = new SeededRng(config.seed);
    const state = {
        mineCount: 0,
        mineCells: new Set(),
        symbolByCell: new Map(),
        revealed: new Set(),
        safePicks: 0,
        multiplierBook: BOOK_SCALE,
        chainProgress: [],
        ...emptyRoundFields(),
        buyMode: true,
        vaultTokensCollected: VAULT_TOKENS_TO_TRIGGER,
        events: [],
    };
    let idx = 0;
    state.events.push({
        index: idx++,
        type: 'reveal',
        revealType: 'roundStart',
        mineCount: 0,
        boardSize: CELL_COUNT,
        buyVault: true,
        serverSeedHash: rng.nextUint32().toString(16),
    });
    state.vault = createVaultBonusState(BOOK_SCALE, rng, { fullScene: true, buyMode: true });
    state.events.push({
        index: idx++,
        type: 'enterBonus',
        bonusType: 'cryptoVault',
        title: 'VAULT BONUS UNLOCKED',
        vault: state.vault,
    });
    return state;
}
function pushEvent(state, event) {
    const index = state.events.length;
    state.events.push({ ...event, index });
}
/** Authoritative post-loss disclosure — remaining cells only (hit mine already revealed). */
function pushBoardDisclosure(state) {
    const remaining = [];
    for (let i = 0; i < CELL_COUNT; i += 1) {
        if (!state.revealed.has(i))
            remaining.push(i);
    }
    remaining.sort((a, b) => a - b);
    for (const cellIndex of remaining) {
        if (state.mineCells.has(cellIndex)) {
            pushEvent(state, {
                type: 'reveal',
                revealType: 'tileFinal',
                cellIndex,
                finalState: 'mine',
            });
        }
        else {
            pushEvent(state, {
                type: 'reveal',
                revealType: 'tileFinal',
                cellIndex,
                finalState: 'safe',
                symbol: state.symbolByCell.get(cellIndex),
            });
        }
    }
}
export function pickCell(state, cellIndex) {
    if (state.terminal)
        return { ok: false, reason: 'round_terminal' };
    if (cellIndex < 0 || cellIndex >= CELL_COUNT)
        return { ok: false, reason: 'invalid_cell' };
    if (state.revealed.has(cellIndex))
        return { ok: false, reason: 'already_revealed' };
    if (state.vault && !state.vaultResolved)
        return { ok: false, reason: 'vault_pending' };
    state.revealed.add(cellIndex);
    if (state.mineCells.has(cellIndex)) {
        state.terminal = true;
        state.payoutBook = 0;
        pushEvent(state, {
            type: 'reveal',
            revealType: 'tileMine',
            cellIndex,
            mineIndex: cellIndex,
        });
        pushBoardDisclosure(state);
        pushEvent(state, { type: 'setTotalWin', amount: 0 });
        pushEvent(state, { type: 'finalWin', amount: 0 });
        return { ok: true, state };
    }
    state.safePicks += 1;
    const symbol = state.symbolByCell.get(cellIndex);
    state.multiplierBook = getMultiplierBook(state.mineCount, state.safePicks);
    const chain = updateChainProgress(state.chainProgress, symbol);
    state.chainProgress = chain.progress;
    const streak = applyStreakChain(state.safePicks, state.chainBonusBook);
    state.chainBonusBook = streak.chainBonusBook;
    state.chainStreak = streak.chainStreak;
    if (streak.chainRewardUnlockedBook && streak.chainRewardStage) {
        pushEvent(state, {
            type: 'multiplierUpdate',
            source: 'chainRewardUnlocked',
            chainStreak: streak.chainStreak,
            chainRewardStage: streak.chainRewardStage,
            chainRewardBook: streak.chainRewardUnlockedBook,
            chainBonusBook: state.chainBonusBook,
            multiplierBook: state.multiplierBook,
        });
    }
    if (chain.completedId && chain.boostBook) {
        state.chainBonusBook = capMultiplierBook(state.chainBonusBook + chain.boostBook);
        pushEvent(state, {
            type: 'multiplierUpdate',
            source: 'chainReward',
            chainCompletedId: chain.completedId,
            chainRewardBook: chain.boostBook,
            chainBonusBook: state.chainBonusBook,
            multiplierBook: state.multiplierBook,
        });
    }
    pushEvent(state, {
        type: 'multiplierUpdate',
        source: streak.chainStreakComplete ? 'chainStreak' : 'base',
        chainStreak: streak.chainStreak,
        chainStreakComplete: streak.chainStreakComplete,
        multiplierBook: state.multiplierBook,
        chainBonusBook: state.chainBonusBook,
    });
    let vaultTriggered = false;
    if (symbol === 'VAULT') {
        state.vaultTokensCollected += 1;
        if (state.vaultTokensCollected >= VAULT_TOKENS_TO_TRIGGER && !state.vault) {
            vaultTriggered = true;
            const rng = new SeededRng(`${state.events[0]?.serverSeedHash ?? 'v'}:bonus:${cellIndex}`);
            state.vault = createVaultBonusState(state.multiplierBook, rng, { fullScene: true });
            pushEvent(state, {
                type: 'enterBonus',
                bonusType: 'cryptoVault',
                title: 'VAULT BONUS UNLOCKED',
                vault: state.vault,
            });
            pushEvent(state, {
                type: 'multiplierUpdate',
                source: 'vaultTrigger',
                multiplierBook: state.multiplierBook,
                chainBonusBook: state.chainBonusBook,
            });
        }
    }
    pushEvent(state, {
        type: 'reveal',
        revealType: 'tileSafe',
        cellIndex,
        symbol,
        picksSafe: state.safePicks,
        multiplierBook: state.multiplierBook,
        chainBonusBook: state.chainBonusBook,
        chainStreak: streak.chainStreak,
        chainStreakComplete: streak.chainStreakComplete,
        vaultTokensCollected: state.vaultTokensCollected,
        chainProgress: [...state.chainProgress],
        chainCompletedId: chain.completedId,
        vaultTriggered,
    });
    return { ok: true, state };
}
export function pickVault(state, vaultIndex) {
    if (!state.vault || state.vaultResolved)
        return { ok: false, reason: 'no_vault' };
    if (vaultIndex < 0 || vaultIndex >= VAULT_CHEST_COUNT)
        return { ok: false, reason: 'invalid_vault' };
    const { payoutBook, multiplierBook } = resolveVaultPayout(state.vault, vaultIndex);
    state.vaultResolved = true;
    state.vaultPayoutBook = capMultiplierBook(payoutBook);
    pushEvent(state, {
        type: 'bonusPick',
        source: 'vaultPick',
        selectedVaultIndex: vaultIndex,
        winningVaultIndex: state.vault.winningVaultIndex,
        vaultPayoutBook: state.vaultPayoutBook,
        multiplierBook: state.multiplierBook,
        chainBonusBook: state.chainBonusBook,
    });
    if (state.buyMode) {
        state.terminal = true;
        state.payoutBook = state.vaultPayoutBook;
        pushEvent(state, { type: 'setTotalWin', amount: state.payoutBook });
        pushEvent(state, { type: 'finalWin', amount: state.payoutBook });
    }
    return { ok: true, state };
}
export function cashOut(state) {
    if (state.terminal)
        return { ok: false, reason: 'round_terminal' };
    if (state.safePicks === 0)
        return { ok: false, reason: 'no_picks' };
    if (state.vault && !state.vaultResolved)
        return { ok: false, reason: 'vault_pending' };
    state.terminal = true;
    state.payoutBook = computePayoutBook(state);
    pushEvent(state, {
        type: 'multiplierUpdate',
        source: 'cashout',
        multiplierBook: state.multiplierBook,
        chainBonusBook: state.chainBonusBook,
        vaultPayoutBook: state.vaultPayoutBook,
        payoutBook: state.payoutBook,
    });
    pushEvent(state, { type: 'setTotalWin', amount: state.payoutBook });
    pushEvent(state, { type: 'finalWin', amount: state.payoutBook });
    return { ok: true, state };
}
export function replayFromEvents(events) {
    return events.map((e, i) => ({ ...e, index: i }));
}
