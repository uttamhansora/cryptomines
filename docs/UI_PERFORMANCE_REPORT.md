# UI Performance Report (After Overhaul)

## Summary

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| JS bundle (gzip) | 19.14 kB | **48.67 kB** | +GSAP + playback layer |
| CSS bundle (gzip) | 1.70 kB | **2.89 kB** | design tokens + components |
| Per-pick replay delay (10 picks) | **~3625 ms** | **~139 ms avg** (est.) | ~96% reduction |
| Full stream replay (9 events) | **~1976 ms** | **~420 ms** (1 new tile) | incremental |
| Global emit per pick | all events × full tree | **delta events only** | fewer updates |
| `filter` / `backdrop-filter` | mine drop-shadow | **removed** | GPU |
| Animation driver | `setTimeout` chain | **GSAP transform/opacity** | compositor-friendly |

Estimates from `benchmark-playback.mjs` (legacy) and `benchmark-incremental.mjs` (new).

## Architecture changes

1. **`PlaybackCoordinator`** — prefix-preserving ingest; animates tail only.
2. **`apply-event.ts`** — pure snapshot; immutable cell array updates for Svelte keyed tiles.
3. **`AnimationController`** — centralized GSAP; `killAll()` on round reset.
4. **Component split** — `Tile`, `GameBoard`, `MultiplierDisplay`, `ChainMeter`, `BettingPanel` (board not tied to HUD re-renders for unrelated balance ticks during pick — still one snap emit per delta event).

## Remaining risks

- **Snap emit per delta** still updates multiplier + chain + board in one frame — acceptable for 1–2 events/pick.
- **GSAP bundle size** — trade accepted for timeline control; tree-shaking could shrink further.
- **Sound** — stub only; no audio decode cost yet.
- **Formal FPS trace** — recommend Chrome Performance panel on device lab; not automated in CI.

## Visual QA

Manual pass recommended on 375px + 1280px for vault dim overlay + sticky bet bar.

## Post-polish (browser CDP, 390×844)

| Metric | Value |
|--------|-------|
| Avg FPS | 75.0 |
| Worst frame | 13.5 ms (~74 FPS) |
| JS gzip | 51.09 kB |

See `REAL_DEVICE_PERFORMANCE.md`.

## Status

Interaction latency target met. Average FPS >60 evidenced on mobile emulation; not all viewports traced.
