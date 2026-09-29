# Phase 5B — Math Economics Correction

## 1. Current problem (pre-5B)

- **Buy price:** 50× base bet  
- **Old buy chest semantics:** factors `[110…200]` on `baseBook=100` → payouts **1.10×–2.00× bet**  
- **Buy RTP:** 1.52 / 50 = **3.04%** (economically incoherent with 96% product target)

**Root cause:** one field (`vaultMultipliersBook`) mixed **multiplicative factors** (organic) with **buy entry** that should pay at **buy-price scale**.

---

## 2. Buy Bonus alternatives

| Option | Summary | Buy RTP @ 96% target | Player clarity |
|--------|---------|----------------------|----------------|
| **A (selected)** | Keep **50×** buy; chests pay **absolute × bet** (40×–56×, mean 48×) | **48/50 = 96%** | “Pay 50, win 40–56× bet” |
| **B** | Keep 1.10–2.00× payouts; buy price ≈ **1.58×** bet | 96% | Cheap buy, conflicts with “premium 50×” UX |
| **C** | 50× “entry stake” × small factors | Needs same math as A | Two-stage mult harder to explain |

---

## 3. Selected model — **Option A**

### Payout convention (single rule)

**Win currency = base bet × `payoutBook` / `BOOK_SCALE` (100).**

| Mode | `vaultMultipliersBook[slot]` meaning |
|------|-------------------------------------|
| **Buy Vault** | **Absolute payout book** (× bet): `[4000, 4400, 4800, 5200, 5600]` → **40×–56×** bet |
| **Organic Vault** | **Multiplicative factor** on current mult: `[110, 125, 150, 175, 200]` ÷ 100 |

Constants: `VAULT_BUY_CHEST_PAYOUT_BOOK`, `VAULT_ORGANIC_CHEST_FACTOR_BOOK` in `@crypto-mines/shared`.

Implementation: `resolveVaultPayout()` branches on `state.buyMode`.

---

## 4. Base RTP ladder

See **`docs/MATH_RTP_LADDER.md`** (generated from `buildRtpLadder(5)`).

- `RTP_BASE_SURVIVAL` set to **`TARGET_RTP` (0.96)** so fair ladder matches configured target.
- Depth 1 (5 mines): P(reach)=0.8, mult=**1.20×**, **RTP if cash at depth 1 = 96%**.

**Sim (post-fix):** `cashoutFirstSafe` → **~96.03%** (1M rounds, seed `phase5b-v1`).

---

## 5. Chain economics

| Boost | Semantics | Example @ 1.20× base (book 120) |
|-------|-----------|-----------------------------------|
| +80 book @ 3 safes | **Add** to `multiplierBook` | +0.80× → 2.00× |
| +200 book @ 5 safes | **Add** to `multiplierBook` | +2.00× on top of ladder+ prior boosts |
| Symbol chain +150/+250/+350 | Same additive book units | Applied when 3-symbol combo completes |

Chain **increases** realized RTP vs ladder-only for strategies that reach 3/5 safes (strategy-dependent).

---

## 6. Organic Vault economics

- Trigger: **3 VAULT** symbols (weight 8/100 on safe cells).
- Payout: `floor(currentMultiplierBook × factor / 100)`; round **continues**.
- **Conditional EV** — depends on cashout depth and base mult at trigger.
- **Sim reference:** `vaultSeeking` vault trigger ≈ **21%** (feature-seeking strategy; not universal RTP).

---

## 7. Buy Bonus economics (post-fix)

| Metric | Value |
|--------|-------|
| Buy cost | **50×** bet |
| E[payout] | **48×** bet |
| **Buy RTP** | **96%** |
| Min / max | **40× / 56×** bet |
| Median | **48×** bet |
| Distribution | Uniform 20% each chest |

**Sim:** `buyVault` 100k → RTP **≈ 96.04%** (seed `phase5b-v1`).

Percentiles (discrete uniform): P5=40×, P25=44×, P50=48×, P75=52×, P95=56×.

---

## 8. Max win

| Path | Max (× bet) |
|------|-------------|
| Buy vault | **56×** (book 5600) |
| Organic vault | `floor(base × 200/100)` capped |
| Global cap | **5000×** (`MAX_WIN_MULTIPLIER`) |

Tests: `max-win.test.ts`.

---

## 9. Book validation

- **Cause of missing files:** never generated in repo (not deleted).
- **Regenerated:** `npm run generate:books` → `math/books/base_sample.jsonl`, `math/lookup/base_weights.csv` from engine sim + buy outcomes.
- Fixture `sample-round.json` still matches deterministic regen.

---

## 10. RGS validation

- **PASS:** buy debits 50×, credits **`payoutBook`** win (`handler.test.ts`).
- No RGS handler changes required (payout comes from `pickVault`).

---

## 11. Replay validation

- **PASS:** `replay.test.ts`, buy `finalWin` = `payoutBook`.

---

## 12. Simulation results (reference)

| Strategy | 100k RTP | Notes |
|----------|----------|-------|
| cashoutFirstSafe | **~96.01%** | Reference base strategy |
| buyVault | **~96.04%** | Buy economics |
| vaultSeeking / chainSeeking | **>100%** | **Strategy RTP** — not global target |

Run full matrix: `npm run signoff:math` (100k / 1M / 20M).

---

## 13. Remaining risks

- **No single “game RTP”** for all player behaviors; features add upside for deep-play strategies.
- **Book file** is sampled empirical distribution, not exhaustive outcome enumeration.
- **UI labels** may still show old “1.25×” style unless updated in a **future UI phase** (out of scope 5B).

---

## MATH SIGN-OFF: **BLOCKED**

**Resolved:** buy 3% bug, base ladder vs 96%, payout unit ambiguity, missing book paths, max-win tests.

**Still blocked for full release sign-off:**

1. Stake-weighted **total** RTP model (strategy mix) not approved.  
2. Feature-heavy **strategy RTP > 100%** not budgeted against base.  
3. Complete **20M** matrix + `validate-books-index` RTP reconciliation not attached to this doc run.

**Core economics (buy + base reference strategy) now meet 96% target in code and simulation.**
