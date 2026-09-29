# Replay Specification

## Query params

`replay=true`, `game`, `version`, `mode`, `event`, `rgs_url` (required).

## Behavior

1. Disable bet/mine controls and live wallet calls.
2. Fetch replay payload from RGS.
3. Feed `state.events` into `EventPlayer` (same pipeline as live round).
4. Show **Play Again** (re-run same events only).

## Parity requirements

Replay must reproduce: board layout, reveals, symbols, mine hit, multipliers, chain boosts, vault, cashout, final payout.

## Tests

`frontend/src/lib/replay.test.ts` — byte-stable event JSON hash across two playback passes.
