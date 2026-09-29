# RGS Event Specification — CRYPTO MINES

## Transport

Stake RGS wallet flow + `POST /bet/event` for tile picks and vault selection.

## Event envelope

```json
{ "index": 1, "type": "reveal", "revealType": "roundStart", ... }
```

Types align with Stake validator: `reveal`, `multiplierUpdate`, `enterBonus`, `setTotalWin`, `finalWin`.

Vault player choice uses `multiplierUpdate` (`source: vaultBonus`) mid-round to avoid premature `bonusPick` terminal coupling.

## Semantic map

See `IMPLEMENTATION_PLAN.md` event table.

## Terminal round

- Loss: `tileMine` → `setTotalWin(0)` → `finalWin(0)`
- Win: `setTotalWin(payoutBook)` → `finalWin(payoutBook)`
- `payoutBook` on round object equals `finalWin.amount`

## bet/event actions

| action | payload |
|--------|---------|
| `pick` | `{ cellIndex: 0-24 }` |
| `vaultPick` | `{ vaultIndex: 0-2 }` |
| `cashout` | `{}` |

## Replay

`GET {rgs_url}/bet/replay/crypto-mines/1.0.0/base/{event}` returns `{ payoutMultiplier, state: { events } }`.
