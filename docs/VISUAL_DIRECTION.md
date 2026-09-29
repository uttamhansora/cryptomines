# Crypto Mines — Visual Direction

**Theme:** Premium Emerald Crypto Vault  
**Goal:** One art-directed casino instant game — cohesive materials, lighting, and motion.

## Color palette

| Token | Hex / value | Use |
|-------|-------------|-----|
| `--bg-primary` | `#050807` | App background |
| `--emerald-deep` | `#0d3d32` | Depth, panels, buttons |
| `--emerald-mid` | `#1a6b55` | Primary actions |
| `--emerald-light` | `#2a9d7a` | Highlights on dark surfaces |
| `--accent-primary` | `#3dd6b5` | UI accents, safe reveals |
| `--accent-secondary` | `#5eecc4` | Multiplier, success |
| `--highlight` | `#c9a227` | Gold trim, vault, payouts |
| `--highlight-soft` | `#e8c547` | Titles, win tier labels |
| `--graphite` / `--graphite-light` | `#1a2220` / `#2a3532` | Tile faces |
| `--danger` | `#e85d6f` | Errors (not mine core) |

Mine emphasis uses **emerald/cyan core** on **dark metal**, not cartoon red bombs.

## Materials

- **Tiles:** Recessed graphite well; beveled emerald face; inner glass highlight (top-left).
- **Symbols:** Gold-rim emerald medallions; shared specular ellipse; centered glyph.
- **Board frame:** Dark stone + subtle gold rim; inset cavern shadow.
- **UI panels:** Glassy emerald-tinted gradient; 1px emerald border.

## Lighting

- **Key light:** Top-front (highlights at 30–35% vertical).
- **Ambient:** Green cavern wash (`StageBackground` radial).
- **Shadows:** Downward inset on tiles; drop-shadow on symbols (no animated box-shadow).

## Typography

- **Display:** Cinzel 600/700 — titles, multiplier, payouts, vault cost.
- **UI:** DM Sans 400–600 — labels, buttons, body.
- **Hierarchy:** Title (0.12em tracking) → Section labels (uppercase 0.1em) → Multiplier (display large) → Payout (gold display) → Secondary (0.72rem muted).

Fonts bundled via `@fontsource/*` (no CDN).

## Icon & symbol style

- Vector medallions only under `public/assets/game/crypto/`.
- No emoji. No mixed flat icon packs.
- VAULT uses vault door on same medallion as BTC/ETH/SOL/USDT/DIAMOND.

## Tile language

| State | Treatment |
|-------|-----------|
| Idle | Recessed well, emerald-graphite face, subtle rim |
| Hover | +2px lift, rim brightens |
| Press | Depress 2px, scale 0.97 |
| Safe reveal | Inner light → symbol scale-in → short burst (GSAP + CSS) |
| Mine | Metal shell + cyan/emerald core; dominant on hit |
| Ghost (loss reveal) | Lower opacity safe tiles; hit mine stays strongest |

## Animation language (GSAP, event-driven)

- Driven by `PlaybackCoordinator` + `AnimationController` only.
- Durations: micro 0.06–0.12s, reveal 0.28–0.4s, mine sequence ~0.65s, win tiers 0.45–1.05s payout count.
- Easing: `power2` / `back.out` for physical settle; no infinite spins on multiplier ring.
- Particles: capped (≤28 mega); deterministic seeds from payout index (celebration only, not outcomes).

## Particle language

- Canvas bursts for MEGA/BIG only; emerald + gold dots; short life.
- Stage dust: 14 slow pixels, deterministic paths (decorative).

## Button language

- **Start:** Emerald gradient, light border, press scale.
- **Cash Out:** Brighter emerald; payout amount as focal subline.
- **Buy Vault:** Gold border; **`50× BET`** display type — confirmation shows balance, cost, balance after.

## Vault scene

Same palette and Cinzel titles; door/capsule SVGs retained but tinted via scene CSS to match emerald/gold.

## Performance rules

- Prefer `transform` + `opacity`; avoid layout thrash.
- No continuous blur animation; limit concurrent particles.
- Respect `prefers-reduced-motion`.

## Required screen states (visual QA)

Auth loading, auth error, ready, active round, safe/mine reveals, cashout, GOOD/BIG/MEGA, vault flow, buy confirm, rules, replay — all use tokens above.
