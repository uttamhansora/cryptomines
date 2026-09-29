# Bonus Feature Spec

## Crypto Vault Bonus

- **Trigger A:** 3× Vault symbols on safe tiles in base round
- **Trigger B:** Buy Crypto Vault (50× bet)
- **Scene:** Full-screen (`VaultBonusScene`), not board modal
- **Play:** Choose 1 of 5 vaults; payout from `resolveVaultPayout`
- **Events:** `enterBonus` → `multiplierUpdate` (vaultBonus) → optional `finalWin` (buy mode)

## Crypto Chain

- **Display:** 5-step safe-reveal streak
- **Math:** Boosts at 3 and 5 safe picks (`streak-chain.ts`)
- **Events:** `chainStreak`, `chainStreakComplete` on `multiplierUpdate` / `tileSafe`
