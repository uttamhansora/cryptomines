# Gameplay + Visual Redesign Audit (Pre-Change)

## 1. What the player currently sees

- Title "Crypto Mines" with balance/sound/rules only.
- Multiplier + potential payout panels without a one-line game pitch.
- 5×5 grid with generic tile backs and small SVG symbols.
- "Crypto Chain" showing last symbols (BTC/ETH/SOL slots) — **not explained**.
- On VAULT tile: dim overlay + small "Crypto Vault" dialog with 3 chests **on top of the board**.
- Betting: bet stepper, mine stepper, Start Round / Cash Out — **no Buy Bonus**, no mine presets 1/5/10/24, no "Reveal" CTA copy.
- Rules: one short aside when opened — **no structured help**.

## 2. What is confusing

| Issue | Why |
|-------|-----|
| "Vault" | Reads as label, not a **bonus game**; overlay feels like a modal |
| Crypto Chain | Shows symbol codes, not "safe streak" or goal |
| No tagline | Mines genre not explained for new players |
| Cash Out vs picking | Primary action unclear before first safe tile |
| Buy Bonus | **Does not exist** |
| Win tiers | Only binary big win ≥10× |

## 3. Features that exist (authoritative)

- Base 5×5 mines, mine count 1–24, hypergeometric multipliers
- Safe tile symbols (BTC, ETH, SOL, USDT, DIAMOND, VAULT)
- Symbol-sequence chain (3-symbol combos) with multiplier boosts
- **Single VAULT symbol** → 3-choice vault bonus (not 3 tokens, not 5 chests)
- Cash out, mine loss, replay path, incremental event playback
- Web Audio synth SFX

## 4. Visual placeholders / prototype quality

- SVG coins: simple gradients, readable as **dev art**
- Vault bonus: card overlay, not a **separate scene**
- No asset pipeline under `assets/game/`
- No win tier presentations beyond "Big Win"

## 5. Playable bonus modes

| Mode | Playable? | Notes |
|------|-----------|-------|
| Crypto Vault (in-round) | **Partial** | 3 chests; triggered by 1 VAULT tile |
| Buy Crypto Vault | **No** | Not implemented |
| Symbol chain | **Yes** | Hidden rules |

## 6–8. Buy / Vault / Chain implementation

- **Buy Bonus:** None (no math, no RGS mode, no UI).
- **Vault:** `enterBonus` + `pickVault` (index 0–2); multipliers 110/125/150 book; outcome pre-seeded.
- **Chain:** `updateChainProgress` on symbol triples; UI shows 3 symbol slots unrelated to player mental model.

## 9–12. Quality snapshot

- **Assets:** Cohesive but prototype SVGs.
- **Animation:** GSAP delta playback; acceptable, not casino-trailer tier.
- **Betting UI:** Functional; not premium; missing buy, presets, copy.
- **Mobile:** Single column + sticky bet bar; board not hero-sized; no explainer strip.

## 10. Architecture to preserve

- `@crypto-mines/math-engine` outcome generation
- RGS mock flow + event stream
- `PlaybackCoordinator` incremental ingest
- Currency scales, replay, tests

## Redesign direction (approved scope)

1. Player-facing copy: **Reveal. Multiply. Cash Out.**
2. Desktop: board center-left, controls right; mobile-first stack.
3. **Chain:** 5-step safe-reveal streak (math-backed).
4. **Vault:** 3 vault **tokens** → full-screen **Crypto Vault Bonus** with **5 chests**.
5. **Buy Vault:** 50× bet, authoritative `createBuyVaultRound`.
6. Art + layout + rules as specified in `GAMEPLAY_VISUAL_REDESIGN.md`.
