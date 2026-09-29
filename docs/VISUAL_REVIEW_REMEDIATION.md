# Visual Review Remediation — Crypto Mines

Remediation pass: **Premium 3D Crypto Mining Vault** art direction (visual/animation only; math/RGS unchanged).

## Asset replacements

| Old (issue) | Replacement | Reason |
|-------------|-------------|--------|
| Generic flat crypto SVGs (all green-ish) | Redrawn `crypto/*.svg` with canonical colors (BTC amber, ETH blue, SOL purple/cyan, USDT green, Diamond icy cyan, Vault gold) | Review: inconsistent art, emoji-like symbols |
| Weak mine icon | `tiles/mine.svg` graphite + red/orange core | Mine must read as danger, not generic bomb clip-art |
| Flat tile backs | `tiles/tile-back.svg` recessed metal/glass panel | Board must look physical, not 25 HTML buttons |
| Thin board frame | `board/frame.svg` architectural frame + trim | Visual hierarchy: outer / middle / inner play surface |
| Legacy vault hall/door/capsule | `background/vault-hall.svg`, `vault/door.svg`, `vault/capsule.svg` | Vault must feel like premium bonus scene |

## Animation: before → after

| Interaction | Before | After |
|-------------|--------|--------|
| Safe tile reveal | Mostly opacity/scale pop | Anticipation depress → inner light → symbol emerge (back.out) → glow → burst → deterministic canvas particles (~300–500ms) |
| Mine hit | Single scale/fade | Depress → freeze beat → mine emerge → flash → shockwave → board shake → neighbor wobble → mine particles |
| Multiplier change | Number jump | GSAP count tween + ring glow + `.ring-energy` rotation + chain energy pulse |
| Chain 5/5 | Light CSS pulse | Track scale + “Chain Complete!” banner + chain meter pulse hook |
| Cash out | Button fade | Stage freeze scale + multiplier enlarge + potential payout emphasis (`playCashout`) |
| Vault bonus | Door scale-in only | Locks rotate → energy buildup → leaves split → light flood → capsules stagger → selection activation |
| Win GOOD/BIG/MEGA | One generic burst | Tiered dim backgrounds, diamond hero, payout count-up; BIG/GOOD canvas particles; MEGA shockwave + shake + heavier particles |

Implementation files: `frontend/src/lib/animation/controller.ts`, `particles.ts`, `Tile.svelte`, `VaultBonusScene.svelte`, `WinCelebration.svelte`, `ControlPanel.svelte`, `ChainMeter.svelte`, `GameBoard.svelte`.

## Visual consistency verification

- [x] Shared bevel, lighting direction, and metal language across all `public/assets/game` SVGs
- [x] Symbol color readable at 36–72px (`Tile.svelte` sym-* glow classes match asset identity)
- [x] Vault gold/emerald distinct from USDT green and global emerald UI chrome
- [x] Buy Vault uses same vault icon asset as grid bonus symbol

## Responsive verification

Manual inspection (Vite preview `http://127.0.0.1:4173/`, production build):

| Viewport | Board dominant | Controls readable | Layout clipping |
|----------|----------------|-------------------|-----------------|
| 390×844 | Yes | Yes | None observed |
| 430×932 | Same breakpoints as mobile stack | Yes | Not re-screenshot; layout matches 390 stack |
| 768×1024 | Yes (wider stack) | Yes | Not re-screenshot |
| 1280×720 | Yes | Yes | None observed (side-by-side stage) |
| 1440×900 | Yes | Yes | None observed |

**Animation pass:** Requires an authenticated mock/local RGS session (start round → reveals → mine/vault/cashout). Static preview confirms asset composition and responsive shell only.

## Performance

- Particles: short-lived canvas bursts (no permanent RAF loops except active win overlay duration).
- Motion: GSAP + CSS transforms; board shake uses transform on board root.
- Build: `npm run build -w @crypto-mines/frontend` — **passed** (2026-09-26).

Suggested spot-check before submission: DevTools Performance during rapid tile reveals on 390×844; record FPS / worst frame while reduced-motion is off.

## Reviewer checklist mapping

Failed criteria addressed:

1. **Poor animations** → Multi-stage GSAP timelines + deterministic particles  
2. **Low quality assets** → Full SVG redraw set under `public/assets/game/`  
3. **Inconsistent art style** → Single material language + color rules per symbol  

## Out of scope (unchanged)

RTP, mine probability, payout tables, vault/chain economics, RGS endpoints, wallet auth, `/wallet/play`, `/bet/event`, `/bet/action` game logic contracts.
