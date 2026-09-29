# Animation Specification

Event-driven GSAP in `frontend/src/lib/animation/controller.ts` + scene transitions in components.

## Safe tile (target)

| Phase | ms | Action |
|-------|-----|--------|
| Anticipation | 0–120 | scale 0.98, glow ramp |
| Flip | 120–300 | rotateY, border emissive |
| Object | 300–420 | symbol scale-in |
| Glow | 420–650 | radial glow peak |
| Mult | 650–900 | multiplier display punch |

## Mine

Warning flash → impact scale → board translateX shake → mine symbol settle (~430ms total).

## Crypto Vault scene

Full-screen fade (350ms) → vault door scale-in → stagger vault buttons (70ms). Selection: dim siblings, selected vault scale 1.08.

## Chain complete

`chainStreakComplete` → `chain-complete` SFX + meter pulse (ChainMeter CSS).

## Big win tiers

Thresholds from shared constants (3× / 10× / 50×). Overlay dim + `BigWinFx` canvas burst; no DOM particle spam.

Playback: **`PlaybackCoordinator.ingest`** applies **delta events only**.
