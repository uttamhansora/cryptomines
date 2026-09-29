# Crypto Vault Bonus Specification

## Trigger

- Safe cell assigned symbol `VAULT` (weight 8 / 100 on safe cells).
- Emits `enterBonus` with `bonusType: cryptoVault` and full `vault` state payload.

## Authoritative outcome

At trigger, engine generates:

- `vaultMultipliersBook`: three chest values (150, 250, 400 book scale) shuffled to display slots A/B/C.
- `winningVaultIndex`: index of highest-EV designated win slot for audit (display shuffle independent).
- `baseMultiplierBook`: ladder value at trigger.

Player selection sends `vaultIndex` 0–2 via `bet/event`. Engine applies **displayed** multiplier at selected index:

`multiplierBook = min(cap, base × vaultMult / 100)`

Emits `multiplierUpdate` (`source: vaultBonus`).

## Client role

- Animate vault discovery → environment transition → three choices.
- Highlight selection; reveal all chest values from event payload.
- **Never** roll random rewards in browser.

## Return to base

After vault resolution, board re-enables tile picks; cashout allowed when no pending vault.

## RTP

Vault symbol frequency + chest EV tuned to ~4% RTP slice (`RTP_VAULT`).

## Replay

`enterBonus.vault` + subsequent `multiplierUpdate` with matching indices reproduce exact payout path.
