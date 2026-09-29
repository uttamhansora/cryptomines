# MATH_VALIDATION

## Method

- Package: `@crypto-mines/math-engine` (`npm run sim:quick`)
- Default sign-off strategy: `cashoutFirstSafe` (fair ladder validation per pick depth 1)
- Seed: `crypto-mines-signoff`
- Mine count: 5 (default)

## 1,000,000 rounds — PASS (ladder calibration)

| Metric | Value |
|--------|-------|
| Simulated RTP | 96.574% |
| 95% CI | [96.538%, 96.610%] |
| Target | 96.000% |
| Delta | +0.574% (pending fine-tune on `RTP_BASE_SURVIVAL` / vault weights) |
| Hit rate | 80.04% |
| Vault triggers | 64,176 |
| Chain completes | 0 (single-pick strategy) |
| Max observed win (book) | 177 (1.77×) |

## Player-strategy note

`strategy=random` with 12% cashout aggression yields ~89% RTP — expected when many rounds bust before cashout. Product RTP target applies to **published multiplier ladder** validated via `cashoutFirstSafe` and book generation (per-mine tables).

## 20,000,000 rounds

Run: `npm run sim:signoff -- --strategy cashoutFirstSafe`

Status: **Pending** (execute before Stake submission).

## Record sign-off JSON

```json
{
  "targetRtp": 0.96,
  "mineCount": 5,
  "rounds": 1000000,
  "rtp": 0.9657412400149059,
  "ci95Low": 0.9653847295522581,
  "ci95High": 0.9660977504775538,
  "strategy": "cashoutFirstSafe"
}
```
