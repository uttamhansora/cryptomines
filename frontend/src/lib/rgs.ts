import {
  API_SCALE,
  GAME_ID,
  GAME_VERSION,
  DEFAULT_MODE,
  displayToApi,
  apiToDisplay,
} from '@crypto-mines/shared';
import type { GameEvent } from '@crypto-mines/shared';

export type RgsConnectionState =
  | 'AUTHENTICATING'
  | 'AUTHENTICATED'
  | 'AUTH_FAILED'
  | 'PLAYING'
  | 'ROUND_ACTIVE'
  | 'ENDING_ROUND'
  | 'ROUND_COMPLETE';

export interface LaunchParams {
  sessionID?: string;
  lang: string;
  device: string;
  rgs_url: string;
  replay?: boolean;
  game?: string;
  version?: string;
  mode?: string;
  event?: string;
}

export interface WalletConfig {
  minBet: number;
  maxBet: number;
  stepBet: number;
  minStep: number;
  defaultBetLevel: number;
  betLevels: number[];
}

export interface RgsBalance {
  amount: number;
  currency: string;
}

export interface RgsRoundPayload {
  active: boolean;
  amount?: number;
  payoutMultiplier?: number;
  mode?: string;
  /** Engine resume checkpoint — last processed book event index as string (see POST /bet/event). */
  event?: string;
  state?: { events?: GameEvent[] } | GameEvent[];
  events?: GameEvent[];
}

export interface BetEventResponse {
  event: string;
}

export type InRoundDecisionParams =
  | { action: 'pick'; cellIndex: number }
  | { action: 'vaultPick'; vaultIndex: number }
  | { action: 'cashout' };

export interface AuthenticateResponse {
  balance: RgsBalance;
  config: WalletConfig;
  round?: RgsRoundPayload | null;
}

export interface PlayResponse {
  balance: RgsBalance;
  round: RgsRoundPayload;
}

const DEV = import.meta.env.DEV;

export function normalizeRgsBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('Missing rgs_url query parameter');

  let url: URL;
  if (/^https?:\/\//i.test(trimmed)) {
    url = new URL(trimmed);
  } else if (trimmed.startsWith('/')) {
    if (typeof window !== 'undefined') {
      url = new URL(trimmed, window.location.origin);
    } else {
      return trimmed.replace(/\/+$/, '') || '/';
    }
  } else {
    const protocol = trimmed.includes('localhost') || trimmed.startsWith('127.0.0.1') ? 'http' : 'https';
    url = new URL(`${protocol}://${trimmed.replace(/^\/+/, '')}`);
  }

  let path = url.pathname.replace(/\/+$/, '');
  if (path.endsWith('/wallet')) path = path.slice(0, -'/wallet'.length);
  url.pathname = path || '';
  return url.toString().replace(/\/+$/, '');
}

export function parseLaunchParams(search: string): LaunchParams {
  const q = new URLSearchParams(search);
  const replay = q.get('replay') === 'true';
  const rgsFromQuery = q.get('rgs_url');
  const rgs_url = rgsFromQuery ?? (DEV ? '/api/rgs' : '');
  return {
    sessionID: q.get('sessionID') ?? (DEV ? 'dev' : undefined),
    lang: q.get('lang') ?? 'en',
    device: q.get('device') ?? 'desktop',
    rgs_url,
    replay,
    game: q.get('game') ?? GAME_ID,
    version: q.get('version') ?? GAME_VERSION,
    mode: q.get('mode') ?? DEFAULT_MODE,
    event: q.get('event') ?? undefined,
  };
}

export function parseBalance(raw: unknown): RgsBalance {
  if (raw && typeof raw === 'object' && 'amount' in raw) {
    const o = raw as { amount: unknown; currency?: unknown };
    const amount = Number(o.amount);
    if (!Number.isFinite(amount)) throw new Error('Invalid balance.amount');
    return { amount, currency: typeof o.currency === 'string' ? o.currency : 'USD' };
  }
  const amount = Number(raw);
  if (!Number.isFinite(amount)) throw new Error('Invalid balance');
  return { amount, currency: 'USD' };
}

export function normalizeWalletConfig(raw: Record<string, unknown> | undefined): WalletConfig {
  const minBet = Number(raw?.minBet ?? API_SCALE / 10);
  const maxBet = Number(raw?.maxBet ?? 100 * API_SCALE);
  const stepBet = Number(raw?.stepBet ?? raw?.minStep ?? API_SCALE / 10);
  const minStep = Number(raw?.minStep ?? stepBet);
  const betLevelsRaw = raw?.betLevels;
  const betLevels = Array.isArray(betLevelsRaw)
    ? betLevelsRaw.map((v) => Number(v)).filter((v) => Number.isFinite(v))
    : [];
  const defaultBetLevel = Number(raw?.defaultBetLevel ?? 0);
  return {
    minBet,
    maxBet,
    stepBet,
    minStep,
    defaultBetLevel: Number.isInteger(defaultBetLevel) ? defaultBetLevel : 0,
    betLevels,
  };
}

export function extractRoundEvents(round: RgsRoundPayload | undefined | null): GameEvent[] {
  if (!round) return [];
  if (Array.isArray(round.events)) return round.events;
  const state = round.state;
  if (Array.isArray(state)) return state as GameEvent[];
  if (state && Array.isArray(state.events)) return state.events;
  return [];
}

/** Safe launch diagnostics (no full sessionID). */
export function logLaunchDiagnostics(params: LaunchParams): void {
  const hasRgs = Boolean(params.rgs_url?.trim());
  const hasSession = Boolean(params.sessionID?.trim());
  console.info(`[RGS] rgs_url present: ${hasRgs}`);
  console.info(`[RGS] sessionID present: ${hasSession}`);
  if (!hasRgs) console.error('[RGS] Missing rgs_url');
  if (!hasSession) console.error('[RGS] Missing sessionID');
}

function rgsDiag(message: string, detail?: string) {
  if (detail) console.info(message, detail);
  else console.info(message);
}

/** Official /bet/event payload: bookEvent.index as string (Web SDK recordBookEvent pattern). */
export function roundProgressEventString(
  events: GameEvent[],
  roundEventFromServer?: string | null,
): string {
  if (typeof roundEventFromServer === 'string' && roundEventFromServer.length > 0) {
    return roundEventFromServer;
  }
  let maxIndex = -1;
  for (const ev of events) {
    const idx = typeof ev.index === 'number' ? ev.index : -1;
    if (idx > maxIndex) maxIndex = idx;
  }
  if (maxIndex >= 0) return String(maxIndex);
  return events.length > 0 ? String(events.length - 1) : '0';
}

/**
 * Exact integer micro-unit conversion for wallet math.
 *
 * Float division/multiplication by API_SCALE (1e6) produces values like
 * 47.55 → 47549999.999… where `Math.floor` loses a whole unit — the root cause of
 * the "unresponsive" MIN/MAX buttons: the player's own MAX amount failed the
 * server's strict range/grid/ladder checks and was silently rewritten. Working in
 * rounded integers everywhere removes that class of bug entirely.
 */
function toApiInt(display: number): number {
  return Math.round(display * API_SCALE);
}

/**
 * Canonical cent grid (0.01 USD steps, exact integer micro-units). The RGS mock wallet
 * and the Stake platform both accept cent amounts; snapping through this grid keeps every
 * produced amount bit-for-bit server-valid (float accumulation over thousands of 1e5-unit
 * steps drifts by ±1 micro-unit and previously rewrote valid cent amounts like 47.55).
 */
const CENT_MICRO = API_SCALE / 100; // 0.01 USD

/**
 * True when `amountApi` is a multiple of `step` within one-hundredth of a micro-unit.
 * Config values arrive via `Number(raw)` from JSON and display conversions go through
 * `x * 1e6`, so even "integer" amounts can be off by a fraction of a unit; a strict
 * `%` check would reject the player's own MAX amount and silently rewrite it — exactly
 * the bug that made the MIN/MAX buttons look unresponsive. The tolerance is far below
 * any real currency granularity, so it can never let a genuinely off-grid amount slip
 * through to the server.
 */
function onGrid(amountApi: number, step: number): boolean {
  const m = amountApi % step;
  const dist = Math.min(m, step - m);
  return dist <= step * 1e-8 || dist >= step - step * 1e-8;
}

/**
 * Mirror of `RgsClient.validateBetAmount` (range + step grid + ladder), evaluated on
 * integer micro-units with drift-tolerant grid/ladder checks — an amount that passes
 * here round-trips through the server-side validation without being rejected
 * (rejection was what made MIN/MAX clicks look dead).
 */
function isServerValidBet(amountApi: number, config: WalletConfig): boolean {
  if (!Number.isFinite(amountApi)) return false;
  if (amountApi < config.minBet || amountApi > config.maxBet) return false;
  if (config.stepBet > 0 && !onGrid(amountApi, config.stepBet)) return false;
  if (config.minStep > 0 && config.minStep !== config.stepBet && !onGrid(amountApi, config.minStep)) {
    return false;
  }
  if (config.betLevels.length > 0) {
    // Ladder membership with the same tolerance — never a bare float `includes`.
    const onLadder = config.betLevels.some(
      (level) => Math.abs(level - amountApi) <= Math.max(1, level) * 1e-9,
    );
    if (!onLadder) return false;
  }
  return true;
}

/**
 * Snap a display bet onto the wallet's allowed ladder / range.
 *
 * IMPORTANT: MIN/MAX targets are derived from the SAME constraints applied here
 * (`betRangeFromConfig`), so they always come back unchanged — a silent rewrite would
 * make the buttons look unresponsive. Off-grid requests snap to the nearest legal value.
 */
export function snapBetDisplayToConfig(betDisplay: number, config: WalletConfig): number {
  const api = toApiInt(betDisplay);

  // Already a legal amount — keep it exactly as requested (MIN/MAX must not be rewritten).
  if (isServerValidBet(api, config)) return betDisplay;

  // Ladder mode: only the offered rungs are server-valid, so snap to the nearest rung.
  if (config.betLevels.length > 0) {
    let best = config.betLevels[0]!;
    let bestDist = Infinity;
    let found = false;
    for (const level of config.betLevels) {
      if (!isServerValidBet(level, config)) continue;
      const dist = Math.abs(api - level);
      if (dist < bestDist) {
        best = level;
        bestDist = dist;
        found = true;
      }
    }
    if (found) return apiToDisplay(best);
  }

  // Free-form mode: clamp into [minBet, maxBet] and land on the NEAREST multiple of the
  // wallet step (the server checks `amount % stepBet === 0` with no anchor offset).
  // Exact integer micro-unit arithmetic — no float drift — so MIN/MAX targets produced
  // by `betRangeFromConfig` always round-trip through this function unchanged.
  const clamped = Math.min(config.maxBet, Math.max(config.minBet, api));
  const step = config.stepBet > 0 ? config.stepBet : config.minStep;
  if (step <= 0) {
    return isServerValidBet(clamped, config) ? apiToDisplay(clamped) : apiToDisplay(config.minBet);
  }
  const kNearest = Math.round(clamped / step);
  const nearest = kNearest * step;
  if (nearest >= config.minBet && nearest <= config.maxBet && isServerValidBet(nearest, config)) {
    return apiToDisplay(nearest);
  }
  // Nearest crossed a bound: fall back to the floored grid point inside the range.
  const kFloor = Math.max(1, Math.floor(clamped / step));
  const stepped = kFloor * step;
  if (stepped >= config.minBet && isServerValidBet(stepped, config)) return apiToDisplay(stepped);
  return apiToDisplay(isServerValidBet(config.minBet, config) ? config.minBet : stepped);
}

/**
 * Effective MIN / MAX wager targets for the bet stepper, expressed in DISPLAY units and
 * guaranteed to satisfy the same constraints `RgsClient.validateBetAmount` enforces
 * (range, step grid, and — when offered — the ladder of allowed bet levels).
 *
 * Because these values are produced by the snapping rules themselves, clicking MIN or MAX
 * can never be silently rewritten by `snapBetDisplayToConfig`, which previously made the
 * buttons appear unresponsive whenever the raw `minBet`/`maxBet` sat off the ladder or the
 * player's balance fell between two rungs.
 */
export function betRangeFromConfig(
  config: WalletConfig | null,
  balanceDisplay: number,
): { min: number; max: number } {
  if (!config) return { min: 0.1, max: 100 };

  const ladder = [...config.betLevels].sort((a, b) => a - b);
  const validLadder = ladder.filter((v) => isServerValidBet(v, config));

  if (validLadder.length > 0) {
    // Ladder mode: every wager must be exactly one of the offered rungs — the server
    // rejects anything else, so MIN/MAX can only ever point AT rungs. MIN is the lowest
    // rung; MAX is the highest rung the player can afford. When even the lowest rung is
    // unaffordable, MAX falls back to that rung (clicking MAX then simply surfaces the
    // server's "insufficient balance" error on start rather than offering a bet the
    // wallet would silently rewrite or reject mid-flight).
    const balanceApi = Math.max(0, toApiInt(balanceDisplay));
    let maxApi = validLadder[0]!;
    for (const level of validLadder) {
      if (level <= balanceApi) maxApi = level;
    }
    return { min: apiToDisplay(validLadder[0]!), max: apiToDisplay(maxApi) };
  }

  // Free-form range on the wallet's step multiples — every returned value satisfies the
  // server's `amount % stepBet === 0` check (integer micro-units, no drift), so clicking
  // MIN/MAX can never be silently rewritten by `snapBetDisplayToConfig`.
  const step = config.stepBet > 0 ? config.stepBet : config.minStep;
  const minApi = config.minBet;
  if (step <= 0) {
    const target = Math.max(minApi, Math.min(config.maxBet, Math.max(0, toApiInt(balanceDisplay))));
    return { min: apiToDisplay(minApi), max: apiToDisplay(target) };
  }
  // Largest step multiple within [minBet, maxBet]; if none exists, only minBet itself
  // is offered (clicking MAX then surfaces the server's clear rejection, not a silent
  // client-side rewrite that makes the button look dead).
  const capAligned = Math.floor(config.maxBet / step) * step;
  if (capAligned < minApi) {
    return { min: apiToDisplay(minApi), max: apiToDisplay(minApi) };
  }

  // MAX target: the player's full available balance rounded DOWN onto the grid —
  // "MAX" means "wager everything I have" without ever exceeding the bankroll or the
  // configured cap (e.g. balance 47.55 with a 0.1 step → 47.5).
  const balanceApi = Math.max(0, toApiInt(balanceDisplay));
  let target = Math.min(capAligned, balanceApi);
  target = Math.floor(target / step) * step;
  if (target < minApi) target = minApi;
  return { min: apiToDisplay(minApi), max: apiToDisplay(target) };
}

function devLog(message: string, detail?: string) {
  if (!DEV) return;
  if (detail) console.info(message, detail);
  else console.info(message);
}

function applicationStatusCode(json: Record<string, unknown>): string | null {
  const status = json.status;
  if (typeof status === 'string') return status;
  if (status && typeof status === 'object' && 'statusCode' in status) {
    const code = (status as { statusCode?: unknown }).statusCode;
    return typeof code === 'string' ? code : null;
  }
  return null;
}

function assertRgsApplicationSuccess(json: Record<string, unknown>, context: string): void {
  const code = applicationStatusCode(json);
  if (code && code !== 'SUCCESS') {
    const err = json.error;
    const detail = typeof err === 'string' ? err : typeof err === 'object' && err && 'message' in err ? String((err as { message?: unknown }).message) : '';
    throw new Error(detail ? `RGS ${context}: ${code} — ${detail}` : `RGS ${context}: ${code}`);
  }
}

function formatRgsHttpError(
  path: string,
  status: number,
  json: Record<string, unknown> | null,
  bodyText: string,
): string {
  const code = json?.code ?? (json ? applicationStatusCode(json) : null);
  const msg =
    typeof json?.message === 'string'
      ? json.message
      : typeof json?.error === 'string'
        ? json.error
        : '';
  if (code) return `RGS ${path} failed (${status}): ${code}${msg ? ` — ${msg}` : ''}`;
  if (msg) return `RGS ${path} failed (${status}): ${msg}`;
  if (bodyText.trim()) return `RGS ${path} failed (${status}): ${bodyText.trim()}`;
  return `RGS ${path} failed: ${status}`;
}

function logRgsHttpFailure(
  pathLabel: string,
  url: string,
  requestBody: Record<string, unknown>,
  status: number,
  statusText: string,
  bodyText: string,
  json: Record<string, unknown> | null,
): void {
  if (!DEV) return;
  const tag = pathLabel.replace(/^\//, '').replace(/\//g, '/');
  console.error(`[RGS][${tag}][${status}]`);
  console.error(`URL: ${url}`);
  console.error('Request:', JSON.stringify(requestBody, null, 2));
  console.error(`Response status: ${status} ${statusText}`);
  if (!bodyText.trim()) {
    console.error('Response body: EMPTY');
    return;
  }
  console.error('Response body:', bodyText);
  if (json) {
    const code = json.code ?? applicationStatusCode(json);
    if (code) console.error(`Error code: ${code}`);
    if (typeof json.message === 'string') console.error(`Message: ${json.message}`);
  }
}

export class RgsClient {
  private authenticated = false;
  private serverRoundActive = false;
  connectionState: RgsConnectionState = 'AUTHENTICATING';
  config: WalletConfig | null = null;
  lastBalance: RgsBalance | null = null;

  constructor(
    private baseUrl: string,
    private sessionID: string | undefined,
    private language: string,
  ) {}

  get isAuthenticated(): boolean {
    return this.authenticated;
  }

  get isServerRoundActive(): boolean {
    return this.serverRoundActive;
  }

  private endpoint(path: string): string {
    const base = this.baseUrl.replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }

  private async post(path: string, body: Record<string, unknown>): Promise<Response> {
    const url = this.endpoint(path);
    devLog(`[RGS] ${path} → URL`, url);
    if (DEV && path === '/bet/event') {
      devLog('[RGS] bet/event sessionID', String(body.sessionID ?? ''));
    }
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    devLog(`[RGS] ${path} ← status`, String(res.status));
    return res;
  }

  private async postJson(
    path: string,
    body: Record<string, unknown>,
  ): Promise<{ json: Record<string, unknown>; bodyText: string }> {
    const url = this.endpoint(path);
    const res = await this.post(path, body);
    const bodyText = await res.text();
    let json: Record<string, unknown> = {};
    try {
      json = JSON.parse(bodyText) as Record<string, unknown>;
    } catch {
      json = {};
    }
    if (!res.ok) {
      logRgsHttpFailure(path, url, body, res.status, res.statusText, bodyText, json);
      throw new Error(formatRgsHttpError(path, res.status, json, bodyText));
    }
    return { json, bodyText };
  }

  private applyRoundActive(active: boolean) {
    this.serverRoundActive = active;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('roundActive', { detail: { active } }));
    }
  }

  validateBetAmount(amountApi: number): string | null {
    const cfg = this.config;
    if (!cfg) return 'Wallet config not loaded';
    if (amountApi < cfg.minBet || amountApi > cfg.maxBet) {
      return `Bet must be between ${apiToDisplay(cfg.minBet)} and ${apiToDisplay(cfg.maxBet)}`;
    }
    if (amountApi % cfg.stepBet !== 0) {
      return `Bet must be a multiple of ${apiToDisplay(cfg.stepBet)}`;
    }
    if (cfg.betLevels.length > 0 && !cfg.betLevels.includes(amountApi)) {
      return 'Bet must be one of the allowed bet levels';
    }
    return null;
  }

  async authenticate(): Promise<AuthenticateResponse> {
    if (!this.sessionID) {
      this.connectionState = 'AUTH_FAILED';
      rgsDiag('[RGS] auth state: failed', 'missing sessionID');
      throw new Error('Missing sessionID — cannot authenticate with RGS');
    }
    this.connectionState = 'AUTHENTICATING';
    rgsDiag('[RGS] auth state: authenticating');
    rgsDiag('[RGS] authenticate URL:', this.endpoint('/wallet/authenticate'));
    devLog('[RGS] authenticate sessionID', this.sessionID);
    const { json } = await this.postJson('/wallet/authenticate', {
      sessionID: this.sessionID,
      language: this.language,
    }).catch((e) => {
      this.authenticated = false;
      this.connectionState = 'AUTH_FAILED';
      rgsDiag('[RGS] auth state: failed');
      rgsDiag('[RGS] authenticate success: false');
      throw e;
    });
    rgsDiag('[RGS] authenticate status: 200');
    assertRgsApplicationSuccess(json, '/wallet/authenticate');
    this.config = normalizeWalletConfig(json.config as Record<string, unknown> | undefined);
    this.lastBalance = parseBalance(json.balance);
    this.authenticated = true;
    this.connectionState = 'AUTHENTICATED';
    rgsDiag('[RGS] authenticate success: true');
    rgsDiag('[RGS] auth state: authenticated');

    const round = json.round as RgsRoundPayload | null | undefined;
    if (round?.active) {
      this.applyRoundActive(true);
      this.connectionState = 'ROUND_ACTIVE';
      rgsDiag('[RGS] auth state: round_active (resume)');
    } else {
      this.applyRoundActive(false);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('balanceUpdate', { detail: this.lastBalance }));
    }

    return {
      balance: this.lastBalance,
      config: this.config,
      round: round ?? null,
    };
  }

  private normalizePlayResponse(json: Record<string, unknown>): PlayResponse {
    const balance = parseBalance(json.balance);
    this.lastBalance = balance;
    const round = json.round as RgsRoundPayload;
    this.applyRoundActive(!!round?.active);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('balanceUpdate', { detail: balance }));
    }
    return { balance, round };
  }

  async play(amountApi: number, mineCount: number, mode: string = DEFAULT_MODE): Promise<PlayResponse> {
    if (!this.authenticated) throw new Error('Client is not authenticated');
    if (this.serverRoundActive) throw new Error('A round is already active');
    const betErr = this.validateBetAmount(amountApi);
    if (betErr) throw new Error(betErr);

    this.connectionState = 'PLAYING';
    this.applyRoundActive(true);

    const currency = this.lastBalance?.currency ?? 'USD';
    let playJson: Record<string, unknown>;
    try {
      ({ json: playJson } = await this.postJson('/wallet/play', {
        sessionID: this.sessionID,
        amount: amountApi,
        currency,
        mode,
        params: { mineCount, mode },
      }));
    } catch (e) {
      this.applyRoundActive(false);
      this.connectionState = 'AUTHENTICATED';
      throw e;
    }
    assertRgsApplicationSuccess(playJson, '/wallet/play');
    const out = this.normalizePlayResponse(playJson);
    this.connectionState = out.round.active ? 'ROUND_ACTIVE' : 'AUTHENTICATED';
    return out;
  }

  /** Official POST /bet/event — resume checkpoint only ({ sessionID, event }). */
  async recordRoundEvent(event: string): Promise<BetEventResponse> {
    if (!this.authenticated) throw new Error('Client is not authenticated');
    if (typeof event !== 'string' || event.length === 0) {
      throw new Error('RGS /bet/event: event must be a non-empty string');
    }
    const { json: eventJson } = await this.postJson('/bet/event', {
      sessionID: this.sessionID,
      event,
    });
    assertRgsApplicationSuccess(eventJson, '/bet/event');
    const echoed = eventJson.event;
    return { event: typeof echoed === 'string' ? echoed : event };
  }

  /**
   * In-round game decisions (tile pick, vault, cashout) — POST /bet/action (DECISION).
   * Persists resume checkpoint via /bet/event after a successful decision.
   */
  async inRoundDecision(params: InRoundDecisionParams): Promise<PlayResponse> {
    if (!this.authenticated) throw new Error('Client is not authenticated');
    const { json } = await this.postJson('/bet/action', {
      sessionID: this.sessionID,
      action: 'DECISION',
      params,
    });
    assertRgsApplicationSuccess(json, '/bet/action');
    const out = this.normalizePlayResponse(json);
    this.connectionState = out.round.active ? 'ROUND_ACTIVE' : 'AUTHENTICATED';
    const events = extractRoundEvents(out.round);
    const checkpoint = roundProgressEventString(events, out.round.event);
    try {
      await this.recordRoundEvent(checkpoint);
    } catch (e) {
      rgsDiag('[RGS] recordRoundEvent failed after decision (non-fatal)', e instanceof Error ? e.message : String(e));
    }
    return out;
  }

  async endRound(): Promise<{ balance: RgsBalance }> {
    if (!this.authenticated) throw new Error('Client is not authenticated');
    if (!this.serverRoundActive) {
      throw new Error('No active round to close');
    }
    this.connectionState = 'ENDING_ROUND';
    let json: Record<string, unknown>;
    try {
      ({ json } = await this.postJson('/wallet/end-round', { sessionID: this.sessionID }));
    } catch (e) {
      this.connectionState = 'ROUND_ACTIVE';
      throw e;
    }
    assertRgsApplicationSuccess(json, '/wallet/end-round');
    const balance = parseBalance(json.balance);
    this.lastBalance = balance;
    this.applyRoundActive(false);
    this.connectionState = 'AUTHENTICATED';
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('balanceUpdate', { detail: balance }));
    }
    return { balance };
  }

  async fetchReplay(game: string, version: string, mode: string, event: string): Promise<PlayResponse> {
    const url = this.endpoint(`/bet/replay/${game}/${version}/${mode}/${event}`);
    devLog('[RGS] replay → URL', url);
    const res = await fetch(url);
    devLog('[RGS] replay ← status', String(res.status));
    if (!res.ok) throw new Error(`Replay fetch failed: ${res.status}`);
    const data = (await res.json()) as {
      payoutMultiplier: number;
      state: { events: GameEvent[] };
    };
    return {
      balance: { amount: 0, currency: 'USD' },
      round: {
        active: false,
        payoutMultiplier: data.payoutMultiplier,
        events: data.state.events,
      },
    };
  }
}

export { API_SCALE, displayToApi, apiToDisplay };
