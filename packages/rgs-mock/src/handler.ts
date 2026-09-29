import { randomSeedHex } from '@crypto-mines/math-engine';
import {
  createRound,
  createBuyVaultRound,
  pickCell,
  pickVault,
  cashOut,
  type RoundState,
} from '@crypto-mines/math-engine';
import { API_SCALE, BUY_VAULT_COST_MULTIPLIER, winFromBookMultiplierApi } from '@crypto-mines/shared';
import type { GameEvent } from '@crypto-mines/shared';

interface Session {
  balance: number;
  round?: RoundState;
  betApi: number;
  mode: string;
  /** Last POST /bet/event checkpoint (returned as round.event on authenticate). */
  eventCheckpoint?: string;
}

const sessions = new Map<string, Session>();

function getSession(id: string): Session {
  let s = sessions.get(id);
  if (!s) {
    s = { balance: 100 * API_SCALE, betApi: API_SCALE, mode: 'base' };
    sessions.set(id, s);
  }
  return s;
}

function stakeBalance(amount: number) {
  return { amount, currency: 'USD' };
}

function rgsSuccess() {
  return { status: { statusCode: 'SUCCESS' as const } };
}

/** Stake: end-round required only while round is open; zero-win terminal rounds are inactive. */
function serverRoundActive(round: RoundState | undefined): boolean {
  if (!round) return false;
  if (!round.terminal) return true;
  return round.payoutBook > 0;
}

function latestEventIndex(events: GameEvent[]): string {
  let maxIndex = -1;
  for (const ev of events) {
    const idx = typeof ev.index === 'number' ? ev.index : -1;
    if (idx > maxIndex) maxIndex = idx;
  }
  if (maxIndex >= 0) return String(maxIndex);
  return events.length > 0 ? String(events.length - 1) : '0';
}

function roundPayload(session: Session) {
  const round = session.round;
  const events = (round?.events ?? []) as GameEvent[];
  const payout = round?.payoutBook ?? 0;
  const event =
    session.eventCheckpoint ?? (events.length > 0 ? latestEventIndex(events) : undefined);
  return {
    active: serverRoundActive(round),
    amount: session.betApi,
    mode: session.mode,
    payoutMultiplier: payout,
    ...(event !== undefined ? { event } : {}),
    state: { events },
  };
}

function walletResponse(session: Session) {
  return {
    ...rgsSuccess(),
    balance: stakeBalance(session.balance),
    round: roundPayload(session),
  };
}

function applyInRoundDecision(session: Session, params: Record<string, unknown>): { ok: true } | { ok: false; reason: string } {
  if (!session.round) return { ok: false, reason: 'no_round' };
  const action = String(params.action ?? '');
  if (action === 'pick') {
    const cellIndex = Number(params.cellIndex);
    const r = pickCell(session.round, cellIndex);
    if (!r.ok) return { ok: false, reason: r.reason ?? 'pick_failed' };
    session.round = r.state;
    return { ok: true };
  }
  if (action === 'vaultPick') {
    const vaultIndex = Number(params.vaultIndex);
    const r = pickVault(session.round, vaultIndex);
    if (!r.ok) return { ok: false, reason: r.reason ?? 'vault_failed' };
    session.round = r.state;
    if (session.round.terminal && session.round.payoutBook > 0) {
      session.balance += winFromBookMultiplierApi(session.betApi, session.round.payoutBook);
    }
    return { ok: true };
  }
  if (action === 'cashout') {
    const r = cashOut(session.round);
    if (!r.ok) return { ok: false, reason: r.reason ?? 'cashout_failed' };
    session.round = r.state;
    const winApi = winFromBookMultiplierApi(session.betApi, session.round.payoutBook);
    session.balance += winApi;
    return { ok: true };
  }
  return { ok: false, reason: 'unknown_action' };
}

function hasExtraBetEventFields(body: Record<string, unknown>): boolean {
  const allowed = new Set(['sessionID', 'event']);
  return Object.keys(body).some((k) => !allowed.has(k));
}

export async function handleRgsRequest(
  pathname: string,
  method: string,
  body: Record<string, unknown>,
): Promise<{ status: number; json: unknown }> {
  if (method === 'POST' && pathname === '/wallet/authenticate') {
    const sessionID = String(body.sessionID ?? '');
    if (!sessionID) return { status: 400, json: { code: 'ERR_VAL', message: 'missing sessionID' } };
    const session = getSession(sessionID);
    const activeRound = serverRoundActive(session.round)
      ? roundPayload(session)
      : null;
    return {
      status: 200,
      json: {
        ...rgsSuccess(),
        balance: stakeBalance(session.balance),
        config: {
          minBet: API_SCALE / 10,
          maxBet: 100 * API_SCALE,
          stepBet: API_SCALE / 10,
          minStep: API_SCALE / 10,
          defaultBetLevel: 1,
          betLevels: [API_SCALE / 10, API_SCALE, 5 * API_SCALE, 10 * API_SCALE],
        },
        round: activeRound,
      },
    };
  }

  if (method === 'POST' && pathname === '/wallet/play') {
    const session = getSession(String(body.sessionID ?? 'dev'));
    if (serverRoundActive(session.round)) {
      return { status: 400, json: { code: 'ERR_VAL', message: 'round_already_active' } };
    }
    const amount = Number(body.amount ?? API_SCALE);
    const params = (body.params ?? {}) as { mineCount?: number; mode?: string };
    const mineCount = Number(params.mineCount ?? 5);
    const mode = String(params.mode ?? body.mode ?? 'base');
    session.mode = mode;
    session.eventCheckpoint = undefined;
    const totalCost = mode === 'buyVault' ? amount * BUY_VAULT_COST_MULTIPLIER : amount;
    if (session.balance < totalCost) return { status: 400, json: { code: 'ERR_IPB' } };
    session.balance -= totalCost;
    session.betApi = amount;
    const seed = randomSeedHex();
    session.round =
      mode === 'buyVault'
        ? createBuyVaultRound({ seed })
        : createRound({ mineCount, seed });
    return { status: 200, json: walletResponse(session) };
  }

  if (method === 'POST' && pathname === '/bet/event') {
    const sessionID = body.sessionID;
    if (typeof sessionID !== 'string' || !sessionID.trim()) {
      return { status: 400, json: { code: 'ERR_VAL', message: 'missing sessionID' } };
    }
    const event = body.event;
    if (typeof event !== 'string' || event.length === 0) {
      return { status: 400, json: { code: 'ERR_VAL', message: 'missing event' } };
    }
    if (typeof event !== 'string') {
      return { status: 400, json: { code: 'ERR_VAL', message: 'event must be string' } };
    }
    if (hasExtraBetEventFields(body)) {
      return { status: 400, json: { code: 'ERR_VAL', message: 'invalid fields' } };
    }
    const session = getSession(sessionID);
    if (!session.round) return { status: 400, json: { code: 'ERR_VAL', message: 'no_active_round' } };
    session.eventCheckpoint = event;
    return {
      status: 200,
      json: {
        ...rgsSuccess(),
        event,
      },
    };
  }

  if (method === 'POST' && pathname === '/bet/action') {
    const sessionID = String(body.sessionID ?? '');
    if (!sessionID) return { status: 400, json: { code: 'ERR_VAL', message: 'missing sessionID' } };
    const actionType = String(body.action ?? '');
    if (actionType !== 'DECISION' && actionType !== 'BET') {
      return { status: 400, json: { code: 'ERR_VAL', message: 'invalid action type' } };
    }
    const session = getSession(sessionID);
    if (!session.round) return { status: 400, json: { code: 'ERR_VAL', message: 'no_active_round' } };
    const params = (body.params ?? {}) as Record<string, unknown>;
    const result = applyInRoundDecision(session, params);
    if (!result.ok) {
      return { status: 400, json: { code: 'ERR_VAL', reason: result.reason } };
    }
    return {
      status: 200,
      json: {
        ...walletResponse(session),
        action: actionType,
      },
    };
  }

  if (method === 'POST' && pathname === '/wallet/end-round') {
    const session = getSession(String(body.sessionID ?? 'dev'));
    if (!serverRoundActive(session.round)) {
      return { status: 400, json: { code: 'ERR_VAL', message: 'no_active_round' } };
    }
    session.round = undefined;
    session.eventCheckpoint = undefined;
    return { status: 200, json: { ...rgsSuccess(), balance: stakeBalance(session.balance) } };
  }

  if (method === 'GET' && pathname.startsWith('/bet/replay/')) {
    const parts = pathname.split('/').filter(Boolean);
    const seed = parts[parts.length - 1] ?? 'replay-demo';
    let state = createRound({ mineCount: 5, seed });
    for (let i = 0; i < 8; i += 1) {
      const r = pickCell(state, i);
      if (!r.ok) break;
      state = r.state;
      if (state.terminal) break;
    }
    if (!state.terminal && state.safePicks > 0) cashOut(state);
    return {
      status: 200,
      json: {
        payoutMultiplier: state.payoutBook,
        costMultiplier: 100,
        state: { events: state.events as GameEvent[] },
      },
    };
  }

  return { status: 404, json: { error: 'not_found' } };
}
