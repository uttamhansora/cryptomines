# Visual Submission Checklist — Crypto Mines

Use before Stake Engine visual re-review.

## Assets & style

- [x] No low-quality primary assets (`docs/VISUAL_ASSET_AUDIT.md`)
- [x] No inconsistent art styles across board, tiles, crypto, vault
- [x] No emoji-style crypto symbols
- [x] Board visually cohesive (frame + inset + physical tiles)
- [x] Tiles visually cohesive (well, bevel, back face, states)
- [x] Mine visually cohesive (danger red/orange core)
- [x] Crypto symbols visually cohesive (same pack, distinct colors)
- [x] Vault visually cohesive (hall, door, capsules, scene)
- [x] Bet controls visually cohesive (MIN ½ − BET + 2× MAX metal treatment)
- [x] Buy vault presentation polished (icon, 50× BET, idle energy)

## Animations

- [x] Safe animation polished (multi-stage + particles)
- [x] Mine animation polished (flash, shockwave, shake, neighbors)
- [x] Multiplier animation polished (count + ring + energy arc)
- [x] Chain animation polished (wire energy + complete banner)
- [x] Cashout animation polished (stage/mult/payout emphasis)
- [x] Win animations polished (GOOD / BIG / MEGA tiers differ)
- [x] Vault animation polished (locks, open, capsules, resolve)

## Icon color spot check

Display BTC, ETH, SOL, USDT, Diamond, Mine, Vault together:

- [x] BTC reads amber/gold
- [x] ETH reads blue
- [x] SOL reads purple/cyan
- [x] USDT reads green
- [x] Diamond reads icy cyan
- [x] Mine reads danger red/orange
- [x] Vault reads gold
- [x] One cohesive asset family
- [x] None read as emoji or generic web icon
- [x] Readable on emerald/graphite backgrounds

## QA passes

- [x] Mobile tested (390×844, 430×932)
- [x] Tablet/desktop tested (768×1024, 1280×720, 1440×900)
- [x] Performance tested (canvas bursts bounded; no continuous particle DOM)

## Documentation

- [x] `docs/VISUAL_ASSET_AUDIT.md`
- [x] `docs/VISUAL_REVIEW_REMEDIATION.md`
- [x] `docs/VISUAL_SUBMISSION_CHECKLIST.md` (this file)

## Sign-off

Rebuild is **not** CSS-only polish: primary SVGs replaced and major interactions use layered animation. Re-run browser verification after any asset or animation change.
