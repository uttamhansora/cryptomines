# Crypto Chain Specification

## Purpose

Reward consecutive safe reveals that match predefined symbol sequences with **additive book-scale multiplier boosts** (not decorative).

## Valid sequences

| Chain ID | Sequence | Boost (book) | Display |
|----------|----------|--------------|---------|
| alpha | BTC → ETH → SOL | +500 (+5.00× additive*) | Tier I |
| beta | ETH → SOL → USDT | +800 | Tier II |
| gamma | SOL → USDT → DIAMOND | +1200 | Tier III |

\*Boost is added to current `multiplierBook` after base ladder applied; result capped at max win.

## Trigger rules

- Track last up to 3 symbols from safe reveals only.
- After each safe reveal, compare sliding window to definitions.
- On match: emit `multiplierUpdate` (`source: chain`), reset chain progress buffer.
- Multiple chains can trigger across a round; each boost stacks additively subject to cap.

## Probabilities

Symbol weights on safe cells (see `MATH_SPEC.md`). Chain completion frequency ≈ product of conditional symbol arrivals — validated in simulation (`chainCompletes` counter).

## RTP interaction

4% RTP budget allocated to chain (`RTP_CHAIN`). Base ladder uses 88%; vault 4%.

## Bonus mode

Chains can complete during base reveals before or after vault; vault multiplier applies to current book value independently.

## Replay

Chain progress and completions are encoded in `reveal` / `multiplierUpdate` events; replay must not recompute boosts client-side.
