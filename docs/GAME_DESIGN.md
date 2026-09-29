# CRYPTO MINES — Game Design

## Elevator pitch

Premium 5×5 instant game set in a digital crypto vault. Players choose bet and mine count, reveal tiles to grow a cashout multiplier, build **Crypto Chains** from symbol sequences, and enter **Crypto Vault Bonus** when uncovering a Vault cell — without live market prices driving outcomes.

## Core loop

1. Set bet and mines (1–24).
2. Start round (authoritative board generated server-side).
3. Reveal tiles — safe tiles show crypto symbols and increase multiplier; mines end the round at 0.
4. Optional: complete a chain for multiplier boost; trigger vault for pick interaction.
5. Cash out anytime after ≥1 safe pick (unless vault pick pending).

## Differentiators vs generic Mines

| Layer | Purpose |
|-------|---------|
| Symbol discovery | Visual identity + chain inputs |
| Crypto Chain | Skill-adjacent planning (remember last symbols) |
| Vault cell | Distinct bonus state + environment transition |
| Vault Bonus | Three-choice presentation over predetermined outcome |
| Progressive risk | Standard hypergeometric multiplier ladder |

## Symbols

BTC, ETH, SOL, USDT, DIAMOND, VAULT — professional SVG assets (no emoji).

## Modes

- **base** — full feature set; mine count player-selected.

## Max win

5000× bet (book cap 500000).

## Compliance copy

Malfunction voids pays; settlement from RGS; RTP long-run statistic.
