# Phase 5D — CRYPTO CHAIN Economic Redesign

**Status:** MATH SIGN-OFF **BLOCKED** until `npm run signoff:phase5d` 20M matrix completes (see `docs/phase5d-sim-results.json`).

**Config hash:** run `mathConfigurationHash(5)` after build — includes chain reward constants.

---

## 1. Problem (Phase 5C)

Streak chain added **+80 / +200 book** directly to `multiplierBook`, inflating conditional cashout RTP above **100%** at depths ≥3.

## 2. Old model

`multiplierBook += chainBoost` on picks 3 and 5 (same book used for cashout).

## 3. New model — **Option B (selected)**

**Separate chain bonus book** (fixed bet-relative rewards), summed only at payout:

```
finalWin = bet × (baseComponent + chainBonusBook) / 100
```

| Field | Meaning |
|-------|---------|
| `multiplierBook` | Base mines ladder only (`getMultiplierBook`) |
| `chainBonusBook` | Streak + symbol sequence rewards (additive book) |
| `vaultPayoutBook` | Organic vault applied to **base at trigger** only |

**Cash out:** claims **base** (or resolved vault payout) **+ all unlocked** `chainBonusBook`. No separate action.

**Why Option B:** Clear player semantics (matches UI split: Current Multiplier vs Chain Bonus), minimal RGS change, deterministic replay via events.

Options A/C/D documented in Phase 5C sign-off; C/D deferred (future risk shaping / bonus round).

## 4. Chain rewards (calibrated)

| Milestone | Book reward | Display |
|-----------|------------:|--------:|
| Pick 3 | `CHAIN_STREAK_REWARD_PICK3_BOOK` = **5** | +0.05× |
| Pick 5 | +`CHAIN_STREAK_REWARD_PICK5_INCREMENTAL_BOOK` = **5** | +0.05× (10 total with stage 3) |

Symbol sequences (α/β/γ): **+4 / +5 / +6** book → separate `chainBonusBook` entries.

## 5. RTP allocation

| Component | Slice | Notes |
|-----------|------:|-------|
| Base ladder | **92%** (`RTP_BASE_SURVIVAL = TARGET − RTP_CHAIN − RTP_VAULT`) | Depth-1 cashout ≈ 92% |
| Chain budget | **2%** | Streak + symbol via `chainBonusBook` |
| Vault budget | **2%** | Organic vault on base only |
| **Target** | **96%** | Product metadata |

Per-depth cap: `theoreticalRtpIfCashAtDepth` ≤ **96.2%** (tolerance) for streak-only; symbol chains add small incremental risk (see tests).

## 6. Vault interaction

- Trigger uses **base** `multiplierBook` at trigger pick.
- `vaultPayoutBook = floor(base × factor / 100)` — **does not** multiply chain bonus.
- Terminal: `computePayoutBook` = `vaultPayoutBook + chainBonusBook` (or `multiplierBook + chainBonusBook` if no vault).

## 7. Buy vault

Unchanged (50× cost, 40×–56× chests, **96%** buy RTP). No `chainBonusBook` on buy rounds.

## 8. RGS events

New / updated payload fields on `multiplierUpdate`:

- `chainRewardUnlocked` (pick 3 / 5)
- `chainReward` (symbol sequence)
- `chainBonusBook`, `vaultPayoutBook`, `source: cashout | vaultPick | vaultTrigger`

`finalWin.amount` = authoritative `payoutBook`.

## 9. Artifacts

| File | Purpose |
|------|---------|
| `docs/MATH_COMPLETE_LADDER.md` | Per-depth base + chain + RTP |
| `docs/phase5d-sim-results.json` | 100k / 1M / 20M strategy sims |
| `scripts/calibrate-chain-rewards.mjs` | Verify depth cap |

## 10. Validation

```bash
npm test -w @crypto-mines/math-engine   # includes phase5d-rtp.test.ts
npm run signoff:phase5d
npm test -w @crypto-mines/rgs-mock
```

## 11. Known limits

- **Vault + max chest (2.00× on base)** can raise **strategy** RTP; organic vault uses expected factor in ladder docs, max chest bounded by **5000×** cap.
- **cashoutFirstSafe** strategy RTP ≈ **base slice (92%)**, not 96% — chain/vault require deeper play or purchases.

---

*Math-only phase — no frontend/CSS/asset changes.*
