# RGS Production Compatibility Audit — Crypto Mines

**Date:** 2025-09-25  
**Scope:** RGS integration only (no math / UI / artwork changes in this audit).  
**Sources of truth (non-mock):**

- [Stake Engine TS Client — Authenticate / Play / EndRound / Event](https://mintlify.wiki/StakeEngine/ts-client/api/authenticate)
- [Stake Engine Web SDK — RGS Fetcher / OpenAPI endpoint list](https://stakeengine-web-sdk.mintlify.app/api/rgs-fetcher)
- [Stake Engine Web SDK — Books & stateful games (mines)](https://mintlify.wiki/StakeEngine/web-sdk/concepts/book-and-events.md)
- [Stake Engine Web SDK — `end-round` timing (`noWin` / `singleRoundWin` / `bonusWin`)](https://mintlify.wiki/StakeEngine/web-sdk/concepts/state-machine.md)
- Project contract: `docs/RGS_EVENT_SPEC.md`, `docs/IMPLEMENTATION_PLAN.md`, `_stake-skills-ref/stake-game-developer/references/stake-engine-rgs.md`

**REAL STAKE RGS TEST: PENDING** — No operator `sessionID` + live `rgs_url` in this environment. Local mock and dev browser tests do **not** prove production compatibility.

---

## Executive summary

Wallet **authenticate**, **play**, and **end-round** align with published Stake Engine client documentation at the HTTP/path/body level, with two gaps fixed in code during this audit (`currency` on play, richer HTTP/application error parsing). **Bet event** for tile pick / cashout / vault uses a **game-specific payload** documented in this repo; it **does not** match the generic TS client `Event(string)` or Web SDK checkpoint `{ sessionID, event }` shape. That is expected only if Stake’s deployed **crypto-mines** RGS implements the same contract as `docs/RGS_EVENT_SPEC.md` — **must be confirmed on the operator launch URL**.

---

## Checklist

| Area | Result | Notes |
|------|--------|--------|
| RGS URL handling | **PASS** | Query `rgs_url`; prod requires param; `normalizeRgsBaseUrl()`; no hardcoded production host |
| Authenticate request | **PASS** | `POST {base}/wallet/authenticate`, JSON, `{ sessionID, language }` |
| Authenticate response parsing | **PARTIAL PASS** | Balance object, config, `round.active`; no `jurisdictionFlags` consumed (UI feature flags) |
| Play request | **PASS** (post-fix) | `sessionID`, integer `amount`, `currency`, `mode`, `params`; amounts via `displayToApi` (1e6) |
| Bet event request | **UNVERIFIED / RISK** | See §3 — project spec vs generic OpenAPI |
| End-round request | **PASS** | `POST {base}/wallet/end-round`, body `{ sessionID }` only |
| Zero-win behavior | **PASS** (logic) | No `end-round` when `payoutBook === 0`; follows SDK `noWin` pattern |
| Currency conversion | **PARTIAL PASS** | Wallet 1e6; book 1e2; sub-cent display may truncate (`Math.floor` on `displayToApi`) |
| Bet levels | **PARTIAL PASS** | Play uses auth `betLevels` / min-max / `stepBet`; bet stepper UI still uses hardcoded 0.1–100 (not RGS) |
| minStep | **PASS** | Parsed from auth (`minStep` or `stepBet`); play validation uses official `stepBet` |
| Active round restore | **PARTIAL PASS** | `round.active`, `amount`, `mode`, events via `state.events` or `events`; no `betID` use |
| Duplicate request protection | **PASS** | `playInFlight`, `pickInFlight`, `endingRound`, `serverRoundActive` |
| Error handling | **PARTIAL PASS** | HTTP status + `code` / `status.statusCode` on JSON body; no retry/backoff matrix |
| Static assets | **PASS** | Prod `dist/` has no runtime CDN/font loads; GSAP license URLs only in JS comments |
| Production build | **PASS** | `npm run build` succeeds; artifact `frontend/dist/` |

---

## 1. Authenticate

### Implementation (`frontend/src/lib/rgs.ts`)

| Check | Expected (official) | Actual |
|-------|---------------------|--------|
| Method | POST | POST |
| Path | `/wallet/authenticate` | `/wallet/authenticate` |
| Headers | `Content-Type: application/json` | Same |
| Body | `{ sessionID, language }` | Same |
| `device` | Launch URL param only (not in authenticate body per TS client) | Parsed in `parseLaunchParams`, not sent on authenticate — **OK** |
| Timing | Before any play/balance/end-round | `App.svelte` `onMount` → `authenticate()` before `canPlaceBets` |

**Response fields used:**

- `balance.amount` / `balance.currency` (legacy number balance fallback)
- `config.minBet`, `maxBet`, `stepBet`, `minStep`, `defaultBetLevel`, `betLevels[]`
- `round.active`, `round.amount`, `round.mode`, `round.state.events` or `round.events`

**Not consumed:** `jurisdictionFlags`, `round.betID`, `round.payout`, application `status` when HTTP 200 (now validated if present).

**Gap:** If authenticate returns HTTP 200 with `status.statusCode !== SUCCESS`, behavior depends on server; client now throws when that field is present and not `SUCCESS`.

---

## 2. Play

### Implementation

```http
POST {rgs_url}/wallet/play
Content-Type: application/json

{
  "sessionID": "...",
  "amount": <integer API units, 1_000_000 = 1.00>,
  "currency": "<ISO 4217 from last balance>",
  "mode": "base" | "buyVault",
  "params": { "mineCount": number, "mode": string }
}
```

| Check | Official | Actual |
|-------|----------|--------|
| Amount units | Integer × 1_000_000 | `displayToApi(bet)` → `API_SCALE` |
| Validation | min/max, `% stepBet`, optional bet ladder | Same before request |
| Buy Vault | Mode + cost on server | `mode: 'buyVault'`; server/mock debits `amount × BUY_VAULT_COST_MULTIPLIER` |
| Outcome authority | `round.state` events from RGS | Frontend ingests `extractRoundEvents(round)` only |

**Post-audit fix:** Added required `currency` field on play (Web SDK `req_play`).

**Mode strings:** TS examples use lowercase `'base'`; Web SDK examples use `'BASE'`. Modes are game-defined in authenticate `config`; production must accept `base` / `buyVault` as uploaded in math package.

---

## 3. Bet event (critical)

### Official generic API (Web SDK + TS client)

- Path: `POST /bet/event`
- TS client `Event(eventValue: string)` body: `{ sessionID, event }` where `event` is an opaque string (e.g. checkpoint index).
- Documented response: `{ event, status, error }` — **no** `balance` / `round` in generic schema.

### This project (`docs/RGS_EVENT_SPEC.md`)

- Same path: `POST /bet/event`
- Body: `{ sessionID, action, ... }` with actions `pick` | `vaultPick` | `cashout` and game fields (`cellIndex`, `vaultIndex`).
- Expected response: wallet-shaped `{ balance, round }` with updated event stream (mock + frontend assume this).

### Stateful mines (official concept doc)

> “Each reveal is a separate RGS request” — multi-request round; resume via authenticate `round.active`.

The public docs do **not** document pick/cashout JSON for mines. They also list `POST /bet/action` (`BET` | `DECISION`) for in-round decisions.

**Audit verdict:** **Bet event request: UNVERIFIED against published generic OpenAPI.** Compatible **only if** Stake’s hosted RGS for this game implements the repo contract. **REAL STAKE RGS TEST: PENDING** — confirm on launch URL:

1. Pick tile → which URL? (`/bet/event` vs `/bet/action`)
2. Request JSON shape
3. Response includes `round.state.events` (or equivalent) after each action

If production differs, integration must change **without** altering math (adapter layer only).

---

## 4. End round

| Check | Official | Actual |
|-------|----------|--------|
| Path | `/wallet/end-round` | Same |
| Body | `{ sessionID }` | Same (no `win` field) |
| When required | While `round.active === true` after multi-step play; SDK `noWin` never calls end-round | `finishRoundIfNeeded`: only if `snap.payoutBook > 0` **and** `client.isServerRoundActive` |
| Mine loss | SDK `noWin`: end-round never called | Loss terminal → mock sets `round.active false` at 0 payout → no end-round |
| Cashout win | Close open round after terminal win | `bet/event` cashout → events → `endRound()` when still active |
| After failure | Do not mark closed | `endingRound` guard; failed end-round keeps `ROUND_ACTIVE` |

**Cashout + re-auth:** After cashout, optional `authenticate()` refresh — redundant if end-round returns balance but harmless.

---

## 5. Currency

| Layer | Scale | Implementation |
|-------|-------|----------------|
| Wallet (RGS) | 1e6 integer | `API_SCALE`, `parseBalance`, `displayToApi` / `apiToDisplay` |
| Book / multiplier | 1e2 integer | `BOOK_SCALE`, `bookToMultiplier`, `winFromBookMultiplier*` |

**Sub-cent / high-precision currencies:** `displayToApi` uses `Math.floor` — bets may round down vs operator UI. **PARTIAL PASS** — verify with operator currency on live RGS.

**Play:** Sends `currency` from authenticated balance (post-fix).

---

## 6. Bet levels

- Default bet: `config.betLevels[config.defaultBetLevel]` when ladder present (`App.svelte`).
- Changes snap via `snapBetDisplayToConfig`.
- Play rejects amounts not in ladder when `betLevels.length > 0`.

**UI gap (not changed in this audit):** `ControlPanel.svelte` MIN/MAX/±/2× use hardcoded 0.1 and 100, not `walletConfig.minBet`/`maxBet`. Player can adjust display bet off-ladder; **play** still blocked by validation. Engine checklist “offer all bet levels from authenticate” may require UI work later — out of scope here.

**Config fallback:** If auth omits config fields, `normalizeWalletConfig` uses dev defaults — production should always send full config.

---

## 7. Active round restore

`restoreActiveRound()` when `auth.round?.active`:

- Bet from `round.amount`
- Events from `round.state.events` or `round.events`
- `playback.hydrate` + `applyEvents(..., false)`
- Buy vault flag from `round.mode === 'buyVault'`

**Not restored from round object explicitly:** `payoutMultiplier` on round header (multiplier derived from events). **Remaining actions** depend on event stream completeness from RGS.

**Official fields not used:** `round.betID`, `round.event` string.

---

## 8. Error responses

| HTTP | Handling today |
|------|----------------|
| 4xx/5xx | `res.ok` false → message from JSON `code` / `message` / `error` when present |
| 200 + app error | Throws if `status.statusCode` present and ≠ `SUCCESS` |
| ERR_IS / ERR_IPB / etc. | Surfaced in message text if in body; no dedicated UI state per code |
| 401/403/409 | Same as generic non-ok — **no** special retry/session refresh |

**PARTIAL PASS** — fails safe (no play on auth fail); could improve operator-facing copy per code.

---

## 9. Request duplication

| Scenario | Mitigation |
|----------|------------|
| Double Start / Buy Vault | `canPlaceBets`, `playInFlight`, `serverRoundActive` on client |
| Double Cash Out | `pickInFlight`, `canCashOut` |
| Rapid tile clicks | `pickInFlight`, board `disabled` while in flight |
| End-round | `endingRound` flag |
| Network retry | No automatic retries (avoids duplicate side effects) |

---

## 10. Repository search — RGS-related occurrences

| Location | What |
|----------|------|
| `frontend/src/lib/rgs.ts` | Client: authenticate, play, bet/event, end-round, URL normalize |
| `frontend/src/App.svelte` | Lifecycle, restore, finish round |
| `frontend/vite-rgs-plugin.ts` | Dev-only `/api/rgs` mock mount |
| `packages/rgs-mock/src/handler.ts` | Local mock endpoints |
| `packages/rgs-mock/src/*.test.ts` | Flow tests |
| `docs/RGS_EVENT_SPEC.md` | Game bet/event actions |
| `docs/IMPLEMENTATION_PLAN.md` | RGS flow diagram |
| `docs/BUY_BONUS_SPEC.md` | buyVault play |
| `docs/REPLAY_SPEC.md` | Replay query params |
| `README.md` | Example query string |
| `frontend/src/lib/rgs.test.ts` | URL/config unit tests (example host `rgs.stake-engine.com` in test only) |

**Hardcoded production URLs:** None in runtime client. Test-only hostname strings. **No** `stake.com` or `engine.io` wallet calls.

---

## 11. External resources (production `frontend/dist/`)

- `index.html`: no external links/scripts/styles.
- Bundled JS: no runtime `fetch` to CDNs; `https://gsap.com` appears only in **license comments** inside GSAP bundle.
- Assets: local SVG/PNG under `dist/assets/`.

---

## 12. Production build

```bash
npm run build
```

Outputs: `frontend/dist/index.html`, `frontend/dist/assets/index-*.js`, `frontend/dist/assets/index-*.css`, static game assets.

Upload **`frontend/dist/` contents** to Stake Engine (with `base: "./"` in Vite config).

---

## Manual DevTools verification (operator launch URL)

Use the iframe URL Stake provides (includes `sessionID`, `rgs_url`, `lang`, `device`).

1. **Authenticate** — Filter Network: `POST` to `{rgs_url}/wallet/authenticate`. Confirm 200, balance object, config with `betLevels`, `stepBet`. Bet button enables after load.
2. **Play** — Start round: `POST …/wallet/play`. Confirm host matches query `rgs_url`. Body includes `sessionID`, integer `amount`, `currency`, `mode`, `params.mineCount`.
3. **In-round** — Reveal tile: confirm endpoint and payload match server (see §3). Response must extend event list; board must not use client RNG for mines.
4. **Cashout win** — `POST …/wallet/end-round` once, with `{ sessionID }`, after terminal win while round was active.
5. **Mine loss** — Terminal loss, **no** `end-round` if payout 0 and `round.active` false.
6. **Invalid RGS** — `rgs_url=https://invalid.example.invalid`: authenticate fails, no play.
7. **Mid-round reload** — Authenticate returns active round; board/bet restored.
8. **Buy Vault** — Play with buy mode; same wallet flow, no local-only balance mutation.

Save HAR or screenshots for Engine resubmission.

---

## Code changes from this audit (RGS only)

- `frontend/src/lib/rgs.ts` — `currency` on play; HTTP/application error parsing; `stepBet` for play validation.
- `docs/RGS_PRODUCTION_AUDIT.md` — this document.

---

## Statement

This game is **not** certified “Stake production compatible” until **REAL STAKE RGS TEST** completes successfully, especially **§3 bet/event** shape and responses on the live operator environment.
