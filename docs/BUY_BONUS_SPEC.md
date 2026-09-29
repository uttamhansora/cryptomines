# Buy Crypto Vault — Specification

## Product

- **Label:** Buy Crypto Vault
- **Cost:** `50 × base bet`
- **Entry:** Immediate Crypto Vault Bonus (5 chests)

## Payout convention (Phase 5B)

**Win = base bet × `payoutBook` / 100.**

Buy chests are **absolute payout multiples** (not 1.1×–2.0×):

| Chest | payoutBook | Win (× base bet) | P |
|-------|------------|------------------|---|
| 1–5 (shuffled) | 4000 | 40× | 0.20 |
| | 4400 | 44× | 0.20 |
| | 4800 | 48× | 0.20 |
| | 5200 | 52× | 0.20 |
| | 5600 | 56× | 0.20 |

**E[payout] = 48× bet → Buy RTP = 48/50 = 96%.**

Organic in-round vault uses **multiplicative factors** `[110,125,150,175,200]` on the **current** multiplier — see `VAULT_ORGANIC_CHEST_FACTOR_BOOK`.

## Authoritative flow

1. `POST /wallet/play` with `params.mode = 'buyVault'`
2. Debit `50 × amount`
3. `createBuyVaultRound` → `enterBonus` with `buyMode: true`
4. `vaultPick` → `resolveVaultPayout` (buy branch) → `finalWin`

## Commands

```bash
npm test -w @crypto-mines/math-engine   # buy RTP tests
npm run generate:books                 # regenerate book artifacts
```
