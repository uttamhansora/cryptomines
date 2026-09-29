# Phase 5 — Math Audit (As Implemented)

## Configuration

| Constant | Value |
|----------|-------|
| `TARGET_RTP` | **0.96** (configured in `@crypto-mines/shared`) |
| `BOOK_SCALE` | 100 |
| `MAX_WIN_MULTIPLIER` | 5000× (cap on book mult) |
| `BUY_VAULT_COST_MULTIPLIER` | **50** |
| `VAULT_TOKENS_TO_TRIGGER` | 3 safe VAULT symbols |
| `VAULT_CHEST_MULTIPLIERS_BOOK` | **[110, 125, 150, 175, 200]** |
| `CHAIN_STREAK_MAX` | 5 |
| Streak boosts | +80 book @ 3rd safe pick, +200 book @ 5th |
| Symbol weights (safe cells) | BTC 22, ETH 22, SOL 18, USDT 18, DIAMOND 12, **VAULT 8** |

**Note:** `math/config.yml` lists `rtpAllocation` (0.88/0.04/0.04) that **does not match** code ladder budget (`RTP_BASE_SURVIVAL = 0.944`, `RTP_CHAIN = 0.02`, `RTP_VAULT = 0.01` in `multipliers.ts`).

## Base game

- **Mine layout:** uniform random `mineCount` cells without replacement (`SeededRng.shuffle`).
- **P(safe on pick k)** (hypergeometric):  
  \(P_k = \prod_{i=0}^{k-1} \frac{N-M-i}{N-i}\) with \(N=25\), \(M=\) mine count.
- **Base multiplier ladder** (after k safe picks, before streak/symbol/vault):  
  `getMultiplierBook(m, k)` from `buildMultiplierLadder` using `fairMultiplierAtPick(m, k, RTP_BASE_SURVIVAL)` capped at `MAX_WIN_MULTIPLIER`.
- **Cashout payout (book):** `capMultiplierBook(multiplierBook)` → currency `bet × payoutBook / BOOK_SCALE`.

## Crypto Chain (player streak)

- On safe pick `k`, `applyStreakChain`: meter = `min(k, 5)`; boosts **add** to book mult via `applyChainBoost` at k=3 and k=5.

## Symbol chain (hidden combos)

- Last 3 symbols matched against `CHAIN_DEFINITIONS`; on match, progress resets and **+150 / +250 / +350 book** boost applied.

## Organic Vault

- Each safe **VAULT** symbol: `vaultTokensCollected++`.
- At **3 tokens:** `enterBonus`, `createVaultBonusState(current multiplierBook, rng)`.
- Chest mults are a **random permutation** of `[110…200]` across 5 UI slots.
- **Player pick:** `resolveVaultPayout(vault, index)` →  
  `floor(baseMultiplierBook × vaultMultipliersBook[index] / BOOK_SCALE)` capped.
- **Organic:** round **continues** after vault pick (not terminal unless mine/cashout).
- `winningVaultIndex` in state is **not** used for payout (display/legacy only).

## Buy Vault

- RGS debits **`50 × bet`**.
- `createBuyVaultRound`: `baseMultiplierBook = 100`, immediate `enterBonus`.
- After `pickVault`: **terminal**, `finalWin` = payout book.
- **Theoretical** random chest pick:  
  \(E[\text{payoutBook}] = \frac{110+125+150+175+200}{5} = 152\)  
  \(E[\text{payout}] = 1.52 × bet\), **Buy RTP** = \(1.52 / 50 = **0.0304**\) (**3.04%**).

## Volatility

- Base: hypergeometric survival + optional features → strategy-dependent.
- Buy: discrete uniform over 5 payout books {110…200} at base 100 → low variance on return/cost ratio.

## Maximum win (paths)

| Component | Max (display mult on bet) | Path |
|-----------|---------------------------|------|
| Base ladder | 5000× | cap `MAX_WIN_MULTIPLIER` |
| Buy vault | **2.00×** payout on bet | chest 200 @ base 100 |
| Organic vault | `floor(base × 200 / 100)` capped | high base + best chest |
| Game cap | **5000×** | `capMultiplierBook` |

## Book / index artifacts

`math/index.json` references `books/base_sample.jsonl` and `lookup/base_weights.csv` — **files not present** in repo (validation fails).
