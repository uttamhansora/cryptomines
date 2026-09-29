# RGS Production — Start / Buy Vault Buttons Disabled

**Date:** 2026-09-26

## Status

**RGS NOT READY — EXACT BLOCKER (code-level):** Play/Buy buttons were gated on `connectionState === 'AUTHENTICATED'` only, while successful auth with `round.active === true` sets **`ROUND_ACTIVE`**, and **`endRound()`** left **`ROUND_COMPLETE`**. Either state kept **`canPlaceBets === false`** even when the player should be able to bet (or after a completed round).

**Production operator verification:** **BLOCKED** in this environment (no live Engine launch URL). Use Network → `POST …/wallet/authenticate` on the uploaded build to confirm.

---

## 1. Button disabled expressions

| Button | File | Disabled when |
|--------|------|----------------|
| **Start Round · Reveal Tiles** | `frontend/src/lib/components/ControlPanel.svelte` ~149 | `disabled={!canPlaceBets}` |
| **Buy Crypto Vault — 50× BET** | `ControlPanel.svelte` ~155 | `disabled={!canPlaceBets}` |

**`canPlaceBets` (before fix)** — `App.svelte`:

```javascript
!replayMode &&
  connectionState === 'AUTHENTICATED' &&  // ← too strict
  !roundActive &&
  !playInFlight &&
  !endingRound &&
  !!client?.isAuthenticated
```

**After fix:**

```javascript
rgsReadyForNewBet && !roundActive && !playInFlight && !endingRound

// rgsReadyForNewBet =
//   authenticated, not AUTH_FAILED/AUTHENTICATING, !serverRoundActive, !replay
```

---

## 2. State initialization → should become true

| State | Initialized | Should become true when |
|-------|-------------|-------------------------|
| `client` | `App.svelte` on load from `parseLaunchParams` + `normalizeRgsBaseUrl` | Valid `rgs_url` + no init throw |
| `client.isAuthenticated` | `false` in `RgsClient` | `authenticate()` HTTP 200 + parse OK |
| `connectionState` | `'AUTHENTICATING'` | `'AUTHENTICATED'` after auth (or `'ROUND_ACTIVE'` if resuming) |
| `loading` | `true` | `false` after `load()` finishes |
| `canPlaceBets` | `false` | `rgsReadyForNewBet && !roundActive && …` |

---

## 3. Launch parameters (production)

**Source:** `parseLaunchParams(window.location.search)` in `frontend/src/lib/rgs.ts`

| Param | Production |
|-------|------------|
| `rgs_url` | Required — **no** `/api/rgs` fallback when `import.meta.env.DEV === false` |
| `sessionID` | Required — **no** `'dev'` fallback in production |
| `lang` | Optional, default `en` → sent as `language` on authenticate |
| `device` | Parsed, not sent on authenticate (Engine pattern) |

**Safe console logs added:**

- `[RGS] rgs_url present: true/false`
- `[RGS] sessionID present: true/false`
- `[RGS] Missing rgs_url` / `Missing sessionID` when absent

---

## 4. Authenticate request

```http
POST {normalized rgs_url}/wallet/authenticate
Content-Type: application/json

{ "sessionID": "<from query>", "language": "<lang>" }
```

Same base URL as `/wallet/play`, `/bet/action`, `/bet/event`, `/wallet/end-round`.

---

## 5. Root causes (exact)

### A. **`canPlaceBets` required `connectionState === 'AUTHENTICATED'`** (`App.svelte`)

- After auth with **`round.active`**, `RgsClient.authenticate()` sets **`ROUND_ACTIVE`** → buttons stay disabled even if UI did not resume.
- After **`endRound()`**, client used **`ROUND_COMPLETE`** → buttons never re-enabled for a new round.

### B. **Resume with empty events** (`restoreActiveRound`)

- If Engine returns `round.active: true` but events are not under `round.events` or `round.state.events`, restore no-op’d.
- UI: `roundActive === false`, `connectionState === ROUND_ACTIVE` → **permanently disabled** Start/Buy.

### C. **Production init failures (param / network)**

If **`rgs_url`** or **`sessionID`** missing on the iframe URL, or authenticate fails (4xx/CORS), `canPlaceBets` stays false — now surfaced via error banner + console.

---

## 6. Fixes applied

1. **`canPlaceBets` / `rgsReadyForNewBet`** — use `client.isAuthenticated` + `!client.isServerRoundActive` instead of strict `connectionState === 'AUTHENTICATED'`.
2. **`extractRoundEvents`** — also accept **`round.state` as `GameEvent[]`** (Engine/SDK variant).
3. **`endRound()`** — set **`connectionState = 'AUTHENTICATED'`** after close (not `ROUND_COMPLETE`).
4. **`finishRoundIfNeeded`** — sync `connectionState` from client after round end.
5. **Failed resume** — explicit error message; reset UI `connectionState` to `AUTHENTICATED` when events missing (server may still block new play until round closed).
6. **Production-safe RGS diagnostics** — auth URL, status, `gameReady` / `canPlay` / `canPlaceBets` flags (no full sessionID).

---

## 7. Verification

| Environment | Expected |
|-------------|----------|
| Local mock `?rgs_url=/api/rgs&sessionID=dev` | Auth 200 → **Start** + **Buy** enabled |
| Production Engine iframe URL | Auth 200, no missing params → buttons enabled when no server-active round |
| Missing `rgs_url` in prod | `[RGS] Missing rgs_url`, client init error, buttons disabled |

**Commands run:**

- `npm run build -w @crypto-mines/frontend`
- `npm run test -w @crypto-mines/frontend -- src/lib/rgs.test.ts`

---

## 8. Remaining risks

1. **Authenticate HTTP failure** (ERR_IS, ERR_VAL, CORS) — buttons correctly disabled; check Network response body.
2. **`round.active === true`** with no restorable events — error shown; may need Engine **`/wallet/end-round`** or support to clear stale round.
3. **`/bet/action`** on real RGS — separate from button enable; in-round actions may still fail if hosted game server expects a different `params` shape.

---

## Final statement

**After this fix:** **RGS READY — BUTTONS ENABLE AFTER AUTHENTICATION** when:

- Launch URL includes valid **`rgs_url`** and **`sessionID`**
- **`POST /wallet/authenticate`** returns **200** with parseable balance/config
- Server reports **no active round** (`round.active === false` / not blocking)

**Still NOT READY if:** authenticate never succeeds or server keeps an unresolvable active round — **exact blocker** visible in console + Network tab.
