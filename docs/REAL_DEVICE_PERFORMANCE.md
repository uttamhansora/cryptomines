# Real Device Performance (Browser CDP)

**Environment:** Cursor embedded Chromium, game at `http://localhost:5173/` (Vite dev).  
**Method:** `Emulation.setDeviceMetricsOverride` + `requestAnimationFrame` frame deltas + `PerformanceObserver` longtasks (>50ms).  
**Build:** Post-incremental playback; polish pass validated 2026-09-24.

## Viewport: 390×844 @2x (mobile)

**Scenario:** Start round → 10 consecutive safe tile reveals (~480ms between picks).

| Metric | Value |
|--------|-------|
| Sample frames | 94 |
| Avg frame time | 13.76 ms |
| **Avg FPS** | **72.7** |
| **Min FPS** (max frame) | **18.7** (53.4 ms spike) |
| Long tasks (>50ms) | 0 |
| JS heap (used) | ~5.9 MB |

**Interpretation:** Sustained interaction above 60 FPS average; occasional single-frame spike (~53ms) during GSAP reveal — not a sustained drop.

## Viewport: 1280×720 (desktop)

**Scenario:** Automated start + 10 reveals (partial run — session canceled once; re-run recommended in Chrome DevTools Performance panel for sign-off).

| Metric | Status |
|--------|--------|
| Formal capture | **Pending full trace export** |
| Expected | Equal or better than mobile (more CPU headroom) |

## Scenarios — coverage matrix

| # | Scenario | Browser tested | Notes |
|---|----------|----------------|-------|
| 1 | 10 safe reveals | Yes (390×844) | See table above |
| 2 | Mine reveal | Manual / partial | GSAP mine timeline ~450ms |
| 3 | Multiplier update | Via reveal chain | Bump on `multiplierUpdate` |
| 4 | Chain step | Audio + meter | `chain-step` synth |
| 5 | Chain complete | Animation + sound | `chainComplete` timeline ~700ms |
| 6 | Vault transition | Portal + dim opacity | No animated filters |
| 7 | Bonus mode | VaultBonus overlay | Separate scene |
| 8 | Cashout | Mult + button timeline | ~500ms |
| 9 | Big win | Overlay + 14 canvas particles | Short-lived rAF |
| 10 | Replay | Query param path | Hydrate + delta anim |

## Viewports — status

| Size | Profiled |
|------|----------|
| 390×844 | Yes |
| 430×932 | Pending |
| 768×1024 | Pending |
| 1280×720 | Partial |
| 1440×900 | Pending |

## Component render count

Svelte keyed tiles (`{#each cells as cell (cell.index)}`) — only changed cells reconcile; full board not remounted per multiplier tick (snapshot still updates parent once per delta event).

## Post-polish regression (390×844, same scenario)

After animation/audio/board polish pass:

| Metric | Pre-polish | Post-polish |
|--------|------------|-------------|
| Avg FPS | 72.7 | **75.0** |
| Min FPS (worst frame) | 18.7 | **74.1** |
| Max frame ms | 53.4 | **13.5** |
| Long tasks | 0 | 0 |

Polish did **not** reintroduce replay lag; frame spikes reduced in this run.

## Regression vs Node benchmarks

| Metric | Legacy replay | Incremental + polish |
|--------|---------------|----------------------|
| Per-pick processing (est.) | ~3625 ms cumulative | ~139–450 ms per pick |
| Full stream replay | ~1976 ms | Not used on picks |

## 60 FPS claim

**Average FPS ~73 on 390×844 during 10 reveals — evidenced above.**  
**Min FPS ~19 on worst single frame — not sustained 60 FPS floor.**  
Do not claim locked 60 FPS minimum; claim **smooth average** with rare spikes.

## Recommended sign-off steps

1. Chrome Performance → record 10 reveals on real Android/iOS device.
2. Repeat at 1280×720 desktop.
3. Attach trace JSON to this doc.
