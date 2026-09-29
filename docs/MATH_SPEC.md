# MATH_SPEC — CRYPTO MINES

## Targets

| Metric | Target |
|--------|--------|
| RTP | 96.0% |
| Sign-off tolerance | ±0.20% absolute |
| Max win | 5000× |
| Volatility | Medium–high (mine-count dependent) |

## RTP decomposition

| Component | Share |
|-----------|-------|
| Base survival ladder | ~94.4% (tuned via `RTP_BASE_SURVIVAL`) |
| Crypto Chain boosts | ~2% budget |
| Vault bonus | ~1% budget |

## Base multiplier ladder

For mine count `M`, after `k` safe picks:

`P_survive(k) = ∏_{i=0}^{k-1} (25-M-i)/(25-i)`

`mult_k = min(MAX_WIN, RTP_BASE / P_survive(k))`

Stored as `floor(mult_k × 100)` book integers.

## Symbol weights (safe cells)

BTC 22, ETH 22, SOL 18, USDT 18, DIAMOND 12, VAULT 8.

## Vault chest multipliers (book)

150, 250, 400 — uniform player pick for simulation; EV computed in validation.

## Currency

- API: ×1_000_000
- Book: ×100

## Validation commands

```bash
npm run build
npm run test
npm run sim:quick
npm run sim:signoff
```

See `MATH_VALIDATION.md` for recorded results.
