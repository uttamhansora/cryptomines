# Phase 5C Book / Index Reconciliation

**Generated:** 2026-09-24T20:24:21.507Z  
**Config hash:** `8c30c1d5125af86f`  
**Seed:** `phase5c-signoff-v1`

## Artifacts

| File | Status |
|------|--------|
| `math/books/base_sample.jsonl` | OK (10 outcomes, weight=11000) |
| `math/lookup/base_weights.csv` | OK |
| `math/index.json` | OK |

## RTP reconciliation

| Source | RTP | Notes |
|--------|----:|-------|
| Index declared | 96% | Product metadata |
| Book sample (mixed generator) | 560.1680% | Sample book mixes cashout-at-3 base rounds + buy vault outcomes; NOT equal to cashoutFirstSafe RTP. |
| Book buy subset | 95.7680% | vs buy theoretical 96.0000% |
| Buy theoretical | 96.0000% | Phase 5B economics |
| cashoutFirstSafe theoretical | 96.00% | Base ladder @ depth 1 |
| cashout depth 3 (base+streak) theoretical | 135.8087% | Strategy-specific |

## Validation result

**Book load:** PASS  
**Buy subset vs theory (±2%):** PASS



---

Run: `npm run generate:books` then `node scripts/phase5c-book-reconciliation.mjs`
