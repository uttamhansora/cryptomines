# Visual Asset Audit — Crypto Mines

Audit date: 2026-09-26  
Scope: `frontend/public/assets/game/` and runtime references under `frontend/src/`

Grading: **A** professional/cohesive · **B** acceptable · **C** low/inconsistent · **D** placeholder (must replace)

## Summary

| Grade | Count (primary gameplay) |
|-------|--------------------------|
| A     | 12                       |
| B     | 0                        |
| C/D   | 0 (replaced in rebuild)  |

All primary gameplay assets are now SVG redraws sharing one **Premium 3D Crypto Mining Vault** material language (graphite metal, emerald glass, restrained gold, symbol-specific emissive colors).

---

## Board & frame

| Asset | Path | Used by | Grade | Notes |
|-------|------|---------|-------|-------|
| Board frame | `board/frame.svg` | `GameBoard.svelte` | A | Architectural outer ring, gold/emerald trim, recessed inner glass |
| Tile back | `tiles/tile-back.svg` | `Tile.svelte` | A | Recessed panel, bevel, emerald edge light |
| Mine | `tiles/mine.svg` | `Tile.svelte` | A | Graphite device, red/orange core glow |

---

## Crypto symbols (distinct color identity)

| Asset | Path | Primary color | Grade | Notes |
|-------|------|---------------|-------|-------|
| BTC | `crypto/btc.svg` | Amber / gold coin | A | Brushed metallic coin, warm highlights |
| ETH | `crypto/eth.svg` | Electric blue | A | Faceted crystal/metal emblem |
| SOL | `crypto/sol.svg` | Violet / cyan | A | Metallic faceted emblem |
| USDT | `crypto/usdt.svg` | Emerald / teal | A | Metallic token |
| Diamond | `crypto/diamond.svg` | Icy cyan / white | A | Faceted gemstone (win hero) |
| Vault (tile) | `crypto/vault.svg` | Gold + emerald | A | Bonus unlock on grid |

Shared: same perspective, bevel depth, rim light, shadow direction.

---

## Vault bonus scene

| Asset | Path | Used by | Grade | Notes |
|-------|------|---------|-------|-------|
| Vault hall BG | `background/vault-hall.svg` | `VaultBonusScene.svelte`, `StageBackground.svelte` | A | Dark hall, pillars, emerald radial glow |
| Vault door | `vault/door.svg` | `VaultBonusScene.svelte` | A | Gold rim, split leaves, emerald core |
| Vault capsule | `vault/capsule.svg` | `VaultBonusScene.svelte` | A | Glass cylinder, gold rim, energy core |

Scene layering (locks, energy ring, door open, light flood) is implemented in `VaultBonusScene.svelte` + GSAP, not CSS-only filters on legacy art.

---

## UI-adjacent (no separate PNG pack)

| Element | Source | Grade | Notes |
|---------|--------|-------|-------|
| Bet stepper buttons | CSS in `ControlPanel.svelte` | A | Graphite metal gradient, gold border, emerald hover |
| Buy Crypto Vault | CSS + `crypto/vault.svg` icon | A | Metallic border, idle energy sweep, 50× BET hierarchy |
| Chain meter | `ChainMeter.svelte` | A | Physical nodes + wire energy slide |
| Multiplier ring | `ControlPanel.svelte` + `controller.ts` | A | Ring + dashed energy arc on bump |

---

## Non-asset presentation (verified cohesive)

- **Typography:** `--font-display` + body sans via global tokens (`tokens.css` / app styles).
- **Particles:** Deterministic canvas bursts (`particles.ts`) — SAFE, MINE, CHAIN, CASHOUT, win tiers, VAULT palettes; seeds from authoritative event indices.
- **Animations:** Multi-stage tile safe/mine, chain complete, multiplier bump, cashout freeze, vault intro (`controller.ts`, `VaultBonusScene.svelte`, `WinCelebration.svelte`).

---

## Retired / replaced (historical C–D)

Prior review flagged flat/generic crypto SVGs, weak mine, flat board, and vault scene built from low-detail art + CSS glow only. Those files were **replaced** under the same paths listed above (not filter-tweaked in place).

---

## Primary experience rule

**No C or D assets remain** on the main grid, control panel, chain meter, cashout path, win overlay, or vault bonus scene.
