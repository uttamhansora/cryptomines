# Phase 4 Art Audit (Pre-Overhaul)

## Board

- CSS-only rim gradient + flat inset panel; no physical frame asset.
- Grid gap OK; lacks glass recess, mechanical rim, floor shadow, embedded-in-environment feel.

## Tiles

- Unrevealed: flat gradient face + CSS shimmer; no embossed tile-back art.
- Safe/mine/vault: small ~58% `<img>` SVGs; reads as **prototype icons**.
- States lack distinct material language (mine danger core, vault gold treatment weak).

## Crypto assets (`public/assets/game/crypto/`)

- Six lightweight SVGs: circle + simple glyph; **inconsistent depth**, no shared lighting rig.
- **Replace all six** + migrate off duplicate `public/assets/symbols/`.

## Vault scene

- Full-screen gradient + circle “door” + **card buttons** with vault.svg thumbnail.
- Missing: door unlock sequence, capsule safes, open/reward, mult count-up, payout counter, organic return fade (~2–3s).

## Background

- Fixed grid lines on flat `#070b10`; no vault architecture, panels, or atmospheric depth.

## Controls

- Functional panel; multiplier not hero-sized; buy bonus is plain button; cash out OK but not “reward emphasis.”

## Animations

- GSAP tile flip/mine shake partial; vault enter on board only; **no vault resolution theatre**.
- Chain: numeric nodes, not energy chain; chainStreak complete under-animated.
- Big win: tier + mult only; **no payout amount**.

## Inconsistencies

- Board/tiles/controls share tokens but **assets don’t share perspective/lighting**.
- Vault bonus UI ≠ board material language.
- Gold used on vault tiles and buy CTA but not on frame/system-wide accents.

## Assets to replace (mandatory)

| Path | Reason |
|------|--------|
| `crypto/*.svg` (6) | Prototype tokens |
| `tiles/mine.svg` | Flat mine |
| *(new)* `tiles/tile-back.svg` | Unrevealed face |
| *(new)* `board/frame.svg` | Board chassis |
| *(new)* `vault/door.svg`, `vault/capsule.svg` | Bonus theatre |
| *(new)* `background/vault-hall.svg` | Environment |
| *(new)* `effects/spark.svg` | Optional static ref |

## Math / RTP

- Buy bonus dedicated RTP sim still **blocker** (`docs/BUY_BONUS_SPEC.md`); no math changes in Phase 4.
