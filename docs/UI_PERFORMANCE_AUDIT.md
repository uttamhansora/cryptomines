# UI Performance Audit (Before Overhaul)

**Stack:** Svelte 5 (not React). Findings use measured timings + code review.

## Measurements

| Metric | Value | Method |
|--------|-------|--------|
| Production JS bundle | **52.08 kB** (gzip 19.14 kB) | `vite build` |
| Production CSS | **5.35 kB** (gzip 1.70 kB) | `vite build` |
| GSAP in bundle | **Not included** (dependency unused) | build output |
| Legacy full event replay (9 events) | **~1976 ms** | `frontend/src/lib/perf/benchmark-playback.mjs` |
| Legacy cumulative replay per 10 picks | **~3625 ms** | same script (O(n²) replays) |
| Per-event `setTimeout` delays | 120–500 ms each | `event-player.ts` `eventDelayMs` |

## Root cause: laggy feel

### 1. Full round replay on every RGS response (critical)

`App.svelte` → `syncEvents()`:

1. `player.reset()` — wipes board
2. `playEvents(allEvents)` — replays **entire** stream with `setTimeout` between **every** event

Each tile pick adds events; the next pick replays from event 0 again. Delay grows **quadratically** with picks.

### 2. Global snapshot broadcast (high)

`EventPlayer.emit()` runs after **each** event during replay. `App.svelte` assigns `snap = s`, re-rendering:

- `Hud` (5 cells)
- `Board` (25 tiles)
- `BetPanel`
- `VaultOverlay` guard

**~9 emit × 25 tiles ≈ 225 tile updates** for one pick in a mid-round (measured scenario).

### 3. Await blocks input (high)

`onPick` **awaits** `syncEvents` before returning. User cannot interact until all historical animations finish.

### 4. No animation layer (medium)

No GSAP timelines; CSS `transition` on `transform` + `box-shadow` on every tile hover (layout-friendly but combined with full re-renders feels sluggish).

### 5. Expensive CSS (low–medium)

- Board: `box-shadow: 0 12px 40px` (large repaint)
- Mine tile: `filter: drop-shadow()` (GPU filter pass)
- Body: large `radial-gradient` (acceptable static)

### Not observed

- React re-renders (N/A — Svelte)
- `backdrop-filter` / blur
- Canvas/WebGL/particles
- `requestAnimationFrame` loops
- Oversized raster assets (SVG only)

## FPS

Formal FPS trace not run in CI; inferred **sub-60 during replay** due to 280–500 ms artificial delays + burst DOM updates. Idle board likely 60 FPS.

## Recommended fixes (implemented in overhaul)

1. **Incremental playback** — apply event prefix once; animate **delta only**
2. **Instant hydrate** — compute final snapshot; optional cosmetic animation on last event only
3. **Decouple input** — apply state immediately; non-blocking GSAP (`transform`/`opacity` only)
4. **Split UI** — board / multiplier / chain / betting isolated components
5. **Central AnimationController** — GSAP timelines, `kill()` on round end
6. **Remove filter drop-shadow** — use pre-lit SVG assets
7. **Reduce shadow layers** — single elevation token

## After metrics

Recorded in `docs/UI_PERFORMANCE_REPORT.md` post-implementation.
