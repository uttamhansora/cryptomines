# Phase 5 — Math Sign-Off Report

## Executive summary

- **Buy Bonus RTP is now known:** theoretical **3.04%**; 20M Monte Carlo **≈ 3.0402%** (matches theory).
- **Base game** (`cashoutFirstSafe`, 5 mines): simulated **≈ 94.45%** RTP — **below** configured `TARGET_RTP` **96%**.
- **Chain / organic Vault** require non–first-safe strategies; frequencies and incremental RTP are **strategy-dependent** (see simulations).
- **Book artifacts** referenced in `math/index.json` are **missing**; fixture payout **matches** runtime regeneration.
- **RGS + replay tests** pass for buy vault debit/credit and event determinism.

## MATH SIGN-OFF: **BLOCKED**

Reasons:

1. Buy Bonus RTP **3.04%** — economically signed off as *implemented*, but **not acceptable** vs `TARGET_RTP` without product retune (50× cost vs 1.10–2.00× payout).
2. **No holistic total RTP** for a defined player mix; base-only sim **misses 96% target**.
3. **Book / lookup files** (`books/base_sample.jsonl`, `lookup/base_weights.csv`) **not present** — cannot validate BOOK RTP 96% in `math/index.json`.
4. `math/config.yml` rtpAllocation **≠** code budgets in `multipliers.ts`.

---

## Math model (see `PHASE_5_MATH_AUDIT.md`)

| Item | Formula / value |
|------|------------------|
| Buy cost | `50 × bet` |
| Buy payout book | `floor(baseBook × chestMult / 100)`; buy baseBook = **100** |
| Buy E[payoutBook] | **152** → **1.52 × bet** |
| **Buy RTP** | **1.52 / 50 = 0.0304** |
| Base mult (k safes) | `getMultiplierBook(mines, k)` from hypergeometric fair ladder @ `RTP_BASE_SURVIVAL=0.944` |
| Streak chain | +80 book @ 3 safes; +200 book @ 5 safes |
| Organic vault | 3× VAULT symbols → bonus; payout `floor(base × chest / 100)`; round continues |
| Max win cap | **5000×** (`MAX_WIN_MULTIPLIER`) |

---

## Theoretical RTP (independent of Monte Carlo)

| Component | Theoretical RTP | Notes |
|-----------|-----------------|-------|
| **BASE** (ladder slice) | Tuned via `RTP_BASE_SURVIVAL` | Marginal per-pick fairness, **not** full-game 96% alone |
| **CHAIN** (streak + symbol) | **Additive book boosts** | No separate RTP budget enforcement at runtime |
| **VAULT** (organic) | Trigger × E[chest\|pick] × conditional base | Strategy-dependent |
| **BUY BONUS** | **3.04%** | Exact (uniform chest pick) |
| **TOTAL** | **Not a single configured number** | Requires declared player strategy mix + retune |

**BOOK RTP:** index claims **96%** — **unverified** (artifacts missing).

**Configured target:** `TARGET_RTP = 0.96` (**configured** in `@crypto-mines/shared`).

---

## Buy Bonus breakdown

| Metric | Value |
|--------|-------|
| Buy cost (bet=1) | **50.00** |
| Average payout | **1.52** (theory); sim 100k mean **1.518** |
| Median payout book | **150** → **1.50** |
| Minimum payout | **1.10×** (book 110) |
| Maximum payout | **2.00×** (book 200) |
| **Buy RTP** | **3.04%** |
| Std dev (100k return) | ≈ 0.00103 (on 50 cost units) |
| 95% CI (100k) | **[3.031%, 3.039%]** |

### Vault chest distribution (random chest index)

| Chest mult (book) | Display factor | P | E contribution (book, base=100) |
|-------------------|----------------|---|----------------------------------|
| 110 | 1.10× | 0.20 | 22 |
| 125 | 1.25× | 0.20 | 25 |
| 150 | 1.50× | 0.20 | 30 |
| 175 | 1.75× | 0.20 | 35 |
| 200 | 2.00× | 0.20 | 40 |
| **Sum** | | **1.00** | **152** |

---

## Simulation results

**Seed:** `phase5-signoff-v1`  
**Configuration hash:** `3c7523b06eed9d5d` (see `docs/phase5-sim-results.json`)  
**Game version:** `1.0.0`  
**Git commit:** unavailable (no HEAD in workspace)

### 100,000 rounds (5 mines)

| Strategy | RTP | 95% CI | Vault trigger | Chain streak complete | Max book |
|----------|-----|--------|---------------|------------------------|----------|
| cashoutFirstSafe | **0.9444** | [0.9415, 0.9473] | 0 | 0 | 118 |
| continueUntilMine | **0** | — | 0.652% | 29.4% | 0 |
| continueUntilN (N=5) | **1.542** | [1.545, 1.575] | 0.143% | 29.6% | 1046 |
| vaultSeeking | **1.838** | [1.795, 1.872] | **21.17%** | 29.9% | 4247 |
| chainSeeking | **5.254** | [5.252, 5.256] | 1.0% | **99.98%** | 1046 |
| **buyVault** | **0.03035** | [0.03031, 0.03039] | — | — | 200 |

### 1,000,000 rounds

| Strategy | RTP | 95% CI | Vault trigger | Chain streak complete |
|----------|-----|--------|---------------|------------------------|
| cashoutFirstSafe | **0.9445** | [0.9435, 0.9454] | 0 | 0 |
| continueUntilMine | **0** | — | 0.673% | 29.15% |
| continueUntilN | **1.5425** | [1.538, 1.547] | 0.151% | 29.25% |
| vaultSeeking | **1.8382** | [1.826, 1.850] | **21.19%** | 29.95% |
| chainSeeking | *(see 100k — 1M run in progress)* | | | |
| **buyVault** | **≈ 0.03040** | tight | — | — |

### 20,000,000 rounds

| Strategy | RTP | 95% CI |
|----------|-----|--------|
| **buyVault** | **0.0304018** | [0.030399, 0.030405] |
| cashoutFirstSafe | *(run via `node scripts/run-phase5-signoff.mjs`)* | |
| continueUntilN | *(same)* | |

---

## Organic Vault (simulation, not buy)

- **Trigger rate (random pick order, play-to-mine):** ≈ **0.65%** (100k).
- **Trigger rate (vault-seeking picks + cash rules):** ≈ **21.2%** (100k/1M).
- **Average multiplier after vault:** strategy-dependent (vaultSeeking max book **4247** = **42.47×** observed).
- **Do not substitute buy-mode data** for organic vault.

---

## Chain (simulation)

Streak meter (5 safe picks in a row before mine):

| Stage reached | ≈ Frequency (100k, continueUntilN) |
|---------------|-------------------------------------|
| stage1 | ~100% of winning rounds |
| stage3+ boost | ~29.6% rounds reach 5 safes before cash/mine |
| **Chain complete (streak 5)** | **~29.6%** |

Symbol chain (`chainSeeking`): symbol completion **~68%** / streak complete **~99.98%** (100k) — strategy forces long safe chains before cashout.

---

## Maximum win

| Path | Max (display × bet) |
|------|---------------------|
| Buy bonus | **2.00×** (book 200 @ base 100) |
| Vault chest factor | **2.00×** on current base |
| Global cap | **5000×** (`capMultiplierBook`) |
| Observed sim max (vaultSeeking) | **42.47×** (book 4247) |

---

## Volatility

- **Buy:** low (discrete uniform on 5 outcomes).
- **Base / features:** high; strategy-dependent (mine bust vs deep cashout).

---

## Book validation

| Check | Result |
|-------|--------|
| `math/index.json` books | **FAIL** — files missing |
| `math/fixtures/sample-round.json` | **PASS** — matches regenerated engine |
| Runtime vs fixture | **PASS** (automated test) |

---

## RGS validation

| Flow | Result |
|------|--------|
| Buy vault 50× debit + payout credit | **PASS** (`rgs-mock` test) |
| pick / vaultPick / cashout authoritative | **PASS** (handler uses math-engine only) |

---

## Replay validation

| Case | Result |
|------|--------|
| Event stream determinism | **PASS** (`replay.test.ts`) |
| Buy vault `finalWin` = `payoutBook` | **PASS** |

---

## Known limitations

- `continueUntilMine` without cashout → **0 RTP** (mine forfeits); used for **feature frequency** only.
- `continueUntilN`, `vaultSeeking`, `chainSeeking` RTP **> 100%** — strategies cash at deep/multiplier-heavy states; **not** global game RTP.
- **No 20M** for all strategies in CI timebox — run `node scripts/run-phase5-signoff.mjs` locally.
- **winningVaultIndex** unused in payout resolution.

---

## Commands

```bash
npm run build -w @crypto-mines/math-engine
npm test -w @crypto-mines/math-engine
npm test -w @crypto-mines/rgs-mock
node scripts/run-phase5-signoff.mjs   # writes docs/phase5-sim-results.json
```
