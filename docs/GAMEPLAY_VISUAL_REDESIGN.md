# Gameplay Visual Redesign — Summary

## Player promise (10-second test)

- **Game:** Crypto Mines — grid mines with crypto theme
- **Action:** Reveal safe tiles, avoid mines, cash out
- **Multiplier:** Shown prominently; grows on safe reveals
- **Chain:** 1–5 safe streak meter with explanation
- **Vault:** Collect 3 Vault symbols → full-screen bonus (5 vaults)
- **Buy:** 50× bet → vault bonus immediately

## Layout

- **Desktop:** Board column (hero + grid + education) | Controls column (chain + betting)
- **Mobile:** Board first, sticky-style controls, full-screen vault scene

## Preserved architecture

Incremental `PlaybackCoordinator`, RGS mock, math-engine authority, replay, currency scales.
