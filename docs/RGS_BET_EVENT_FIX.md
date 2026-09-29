# RGS `/bet/event` Fix — Crypto Mines

**Date:** 2026-09-26

## Root cause

Production Stake Engine RGS validates `POST /bet/event` against the **official contract** (session checkpoint only). The frontend sent **game decision fields** on `/bet/event`, which the Engine rejects as **ERR_VAL / HTTP 400**.

## Previous request (production client)

```http
POST {rgs_url}/bet/event
Content-Type: application/json
```

```json
{
  "sessionID": "<launch sessionID>",
  "action": "pick",
  "cellIndex": 0
}
```

(Tile pick also duplicated `action` via `betEvent('pick', { action: 'pick', cellIndex })`.)

## Official documented request

```json
{
  "sessionID": "xxxxxx",
  "event": "xxxxxx"
}
```

## Official documented response

```json
{
  "event": "xxxxxx"
}
```

Purpose (Engine docs): track in-progress player actions for **resume after disconnect** — not to execute tile math or wallet debits.

## Difference

| Aspect | Before | After (Engine-aligned) |
|--------|--------|-------------------------|
| Endpoint for tile/vault/cashout | `/bet/event` | `/bet/action` (`action: "DECISION"`, game fields in `params`) |
| `/bet/event` body | `sessionID`, `action`, `cellIndex`, … | **`sessionID`, `event` (string) only** |
| `/bet/event` response handling | Expected `{ balance, round }` | **`{ event }`** (+ optional `status`) |
| `event` string meaning | N/A (wrong field names) | **Last processed book event `index` as string** (Web SDK `recordBookEvent` / `round.event` pattern) |

## 400 response

**REAL STAKE RGS VERIFICATION = BLOCKED** in this environment (no live operator `sessionID` + `rgs_url`).

Expected production failure mode before fix: **HTTP 400**, application code **ERR_VAL** (Invalid Request) when undeclared JSON properties are present.

Dev diagnostics now log full non-2xx bodies:

```
[RGS][bet/event][400]
URL: …
Request: { … }
Response body: …
```

## Fix (code)

1. **`frontend/src/lib/rgs.ts`**
   - `recordRoundEvent(event: string)` → official `/bet/event`.
   - `inRoundDecision(params)` → `/bet/action` with `{ sessionID, action: "DECISION", params }`.
   - After each successful decision, checkpoint via `recordRoundEvent(roundProgressEventString(...))`.
   - Rich DEV logging for failed RGS calls; sessionID parity logged on authenticate and `/bet/event`.

2. **`frontend/src/App.svelte`**
   - Pick / vault / cashout call `inRoundDecision`, not `/bet/event`.
   - Restore logs `round.event` checkpoint in DEV when resuming.

3. **`packages/rgs-mock/src/handler.ts`**
   - Strict `/bet/event` (reject extra fields).
   - Game logic moved to `/bet/action`.

## `event` string decision

Official docs specify **`event` is a string**, not an object. Internal format for Crypto Mines checkpoints:

- Use **`String(max(bookEvent.index))`** from the authoritative event stream after each server decision.
- Prefer **`round.event`** from the RGS when present on play/action/authenticate responses.

We do **not** JSON-encode `{ type: "pick", cellIndex }` into `event` — that is not the Engine checkpoint pattern.

## Wallet flow (unchanged)

1. `POST /wallet/authenticate`
2. `POST /wallet/play` — start round
3. `POST /bet/action` — in-round decisions (stateful mines)
4. `POST /bet/event` — resume checkpoint after decisions
5. `POST /wallet/end-round` — when round still active after qualifying win

## Tests

| Test | Result |
|------|--------|
| `validate:rgs-flow` | Run after change |
| Mock valid `/bet/event` | 200 |
| Mock missing `sessionID` / `event` | 400 |
| Mock legacy `action`+`cellIndex` on `/bet/event` | 400 |
| Mock pick flow via `/bet/action` | 200 |

## Production RGS checklist (operator launch URL)

1. `POST /wallet/authenticate` → 200
2. `POST /wallet/play` → 200
3. Reveal tile → **`POST /bet/action`** (not `/bet/event` with pick fields)
4. **`POST /bet/event`** with `{ sessionID, event: "<index>" }` → 200
5. `POST /wallet/end-round` → 200 when required

**Production RGS: PASS / FAIL / BLOCKED** → **BLOCKED** until operator Network capture confirms steps 3–4.
