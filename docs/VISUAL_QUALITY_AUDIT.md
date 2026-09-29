# Visual Quality Audit — Overhaul Pass

## Replaced / redesigned assets

| Asset | Action |
|-------|--------|
| `public/assets/game/tiles/tile-back.svg` | Redesigned — emerald graphite vault tile |
| `public/assets/game/tiles/mine.svg` | Redesigned — dark metal + emerald core |
| `public/assets/game/crypto/btc.svg` | Medallion family |
| `public/assets/game/crypto/eth.svg` | Medallion family |
| `public/assets/game/crypto/sol.svg` | Medallion family |
| `public/assets/game/crypto/usdt.svg` | Medallion family |
| `public/assets/game/crypto/diamond.svg` | Medallion family (hero gem) |
| `public/assets/game/crypto/vault.svg` | Medallion family |

## Legacy candidates (not referenced by runtime UI)

These older duplicates may still exist under `public/assets/symbols/` and `public/assets/mine.svg` — **not loaded** by `Tile.svelte` (uses `game/` paths only). Safe to delete in a future cleanup pass.

## Removed / reduced low-quality patterns

| Issue | Mitigation |
|-------|------------|
| Cyan-neon inconsistent palette | Unified emerald vault tokens |
| System UI fonts only | Bundled Cinzel + DM Sans |
| Spinning multiplier ring | Static ring; pulse only on chain/mult events |
| Random celebration particles | Deterministic seed from payout + index |
| Cartoon red mine | Emerald-core mine asset |
| Busy grid background | Reduced dust count (24→14), softer vignette |
| Generic mixed crypto SVGs | Single medallion art direction |

## Animations rebuilt / extended

- `AnimationController.tileReveal` — depress, inner light, symbol emerge, burst
- `AnimationController.mineHit` — anticipation, mine emerge, flash, shockwave, board shake
- `AnimationController.tileFinalReveal` — subdued ghost reveals on loss
- `AnimationController.multiplierBump` — chain energy + scale settle
- `AnimationController.playCashout` — button lock, payout emphasis
- `WinCelebration` — tiered backgrounds, mega hero sequence, capped particles
- `ControlPanel` — GSAP multiplier number tween

## Files changed (visual)

- `frontend/src/styles/tokens.css`
- `frontend/src/main.ts` (fonts)
- `frontend/package.json` (@fontsource)
- `frontend/src/lib/animation/controller.ts`
- `frontend/src/lib/game/playback-coordinator.ts`
- `frontend/src/lib/components/Tile.svelte`
- `frontend/src/lib/components/GameBoard.svelte`
- `frontend/src/lib/components/ControlPanel.svelte`
- `frontend/src/lib/components/StageBackground.svelte`
- `frontend/src/lib/components/WinCelebration.svelte`
- `frontend/src/lib/components/GameHeader.svelte`
- `frontend/src/lib/components/LossResultPanel.svelte`
- `frontend/src/App.svelte` (balance prop, cashout anim target)
- `docs/VISUAL_DIRECTION.md`

## Performance

**Before/after FPS:** Not instrumented in CI for this pass. Manual check recommended:

1. Chrome Performance → record: idle, 5 safe reveals, mine hit, MEGA win, vault entry.
2. Watch for long tasks >50ms and DOM node spikes from particles (capped).

**Expected:** GPU-friendly transforms; particle frames bounded.

## Screenshots

Not attached in-repo (binary). Capture locally at:

- 390×844, 430×932, 768×1024, 1280×720, 1440×900
- States listed in `VISUAL_DIRECTION.md` § Required screen states

Dev: `npm run dev -w @crypto-mines/frontend`

## Remaining weaknesses

1. **Vault hall / frame SVGs** — older art; scene opacity masks them but full redraw would improve consistency.
2. **Bet stepper** — still generic MIN/MAX (not auth ladder UI); visual only, not RGS.
3. **`VaultBonusScene`** — capsule/door SVGs not yet redrawn to medallion spec (CSS tint only).
4. **Feature education / hero pitch** — copy blocks unchanged; typography inherits tokens only.
5. **No WebGL board** — CSS/GSAP sufficient for 5×5; 3D board would be a future art pass.

## Math / RGS

No changes to math engine, RGS client, or payout logic in this overhaul.
