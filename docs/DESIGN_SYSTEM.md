# Design System — Premium Futuristic Crypto Vault

## Palette (tokens in `frontend/src/styles/tokens.css`)

| Token | Usage |
|-------|-------|
| `--bg-primary` / `--bg-secondary` | Page depth |
| `--surface` / `--surface-elevated` | Panels, tiles |
| `--accent-primary` | Cyan — multiplier, links |
| `--accent-secondary` | Green — cashout |
| `--highlight` | Gold — vault / chain |
| `--danger` | Mine |
| `--text-primary` / `--text-secondary` | Copy |
| `--border` / `--glow-cyan` / `--glow-gold` | Borders & accents |

## Typography

- Display: **Orbitron** (headings, multiplier)
- UI: **DM Sans** (controls, labels)

## Tile states

IDLE, HOVER, PRESSED, REVEALING, SAFE, CRYPTO, VAULT, MINE, DISABLED — see `ANIMATION_SPEC.md`.

## Assets

SVG-only symbol set in `frontend/public/assets/symbols/`. No emoji.

## Motion

Respect `prefers-reduced-motion`: skip vault environment transition, use opacity cuts.
