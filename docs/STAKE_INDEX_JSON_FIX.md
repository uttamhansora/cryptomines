# Stake Engine `index.json` Fix

**Date:** 2026-09-25

## Root cause

`math/index.json` was **not zero bytes** (258 bytes, valid UTF-8 JSON). Stake Engine still reported:

```
ERR_INVALID_FORMAT: event file cannot be empty
Mode: *
File: index.json
```

because the file was **not an event index**. Official Stake Engine form requires each mode to have `name`, `cost`, `events` (path to a non-empty `.jsonl.zst` book), and `weights` (lookup CSV). The old index used `book` / `lookupTable` and never set `events`.

`scripts/generate-books.mjs` already ran the math engine, then **threw away `state.events`** and wrote a payout histogram (`{ payoutMultiplier, weight }`). No `id`, no event array, no zstd book, and `index.json` was never generated after events existed.

## Fix

Persist authoritative engine rounds as Stake books, write lookup tables, compress with zstd, **then** write `index.json`. Fail the build if an event file or index would be empty (`EVENT_ARTIFACT_EMPTY:<filename>` / `INDEX_JSON_EMPTY`). No `{}` / `[]` placeholders.

Two book-generation rounds that stopped on a pending organic vault are completed with the existing `pickVault` + `cashOut` engine APIs so every published book is terminal. That is a packaging completeness fix, not an RTP/math change.

## Files changed

| File | Role |
|------|------|
| `scripts/generate-books.mjs` | Persist engine events; official package; generate index last |
| `scripts/lib/stake-artifacts.mjs` | Non-empty writes; zstd; official index JSON |
| `scripts/validate-stake-package.mjs` | New `npm run validate:stake-package` |
| `scripts/check-books-package.py` | Stake Engine books-package checker (from skills contract) |
| `scripts/validate-books-index.mjs` | Recognize official `events` / `weights` path keys |
| `scripts/validate-book-artifacts.mjs` | Resolve `events` / `weights` |
| `scripts/run-phase5-signoff.mjs` | Same path resolution |
| `scripts/phase5c-book-reconciliation.mjs` | RTP metadata fallback when index has no `rtp` field |
| `packages/math-engine/src/book-validation.test.ts` | Assert official referenced files exist |
| `package.json` | `validate:stake-package`, `validate:stake-engine` |
| `math/index.json` | Regenerated — official schema |
| `math/publish_files/**` | Upload package (zst books, lookups, index) |
| `docs/STAKE_INDEX_JSON_AUDIT.md` | Audit |
| `docs/STAKE_INDEX_JSON_FIX.md` | This report |

Gameplay math, RTP tables, UI, graphics, and animations were not modified.

## Generation order

1. Build math artifacts (`shared`, `math-engine`)
2. Simulate rounds through the math engine
3. Validate each round has a non-empty event stream and is terminal
4. Write event JSONL + lookup CSV
5. Compress event books to `.jsonl.zst`
6. Write `index.json` (publish_files, then `math/index.json`)
7. `validate:stake-package` + Stake Engine books checker

## index.json size

| File | Bytes |
|------|------:|
| `math/publish_files/index.json` | 369 |
| `math/index.json` | 425 |

Both parse, both have non-empty `modes[].events` pointing at real zstd books.

## Event artifact count

| Mode | Cost | Books | Event file | Size |
|------|-----:|------:|------------|-----:|
| `base` | 1 | 10,000 | `books_base.jsonl.zst` | 1,178,437 |
| `buyVault` | 50 | 1,000 | `books_buyVault.jsonl.zst` | 24,429 |

**Total published simulations: 11,000.** Every row is `{ id, events[], payoutMultiplier }` from the engine.

### RGS event coverage in generated books

| Semantic | Present in artifacts |
|----------|----------------------|
| round start | Yes (`revealType: roundStart`) |
| tile reveal | Yes (`tileSafe`) |
| tileFinal | Yes |
| mine | Yes (`tileMine`) |
| chainRewardUnlocked | Yes |
| chainReward | Yes |
| vault trigger | Yes (`enterBonus` / `vaultTrigger`) |
| vaultPick | Yes (`bonusPick` / `vaultPick`) |
| vaultPayoutBook | Yes |
| buyVault | Yes (buy mode, 1000 books) |
| finalWin | Yes (all 11,000) |
| cashout | Yes (`source: cashout`) |
| chainStreak | Engine emits at streak-complete (pick 5). The 3-safe-pick book strategy does not reach it. Not fabricated. |

## Validation result

```
npm run validate:stake-package
status: pass
eventArtifactCount: 11000
errors: 0
```

```
npm run validate:index
status: pass
modesChecked: 2
errors: 0
```

```
npm run validate:events
status: pass
roundsChecked: 1
errors: 0
```

```
npm run build
✓ frontend production build
```

`npm test`: shared, rgs-mock, frontend, and 28/29 math-engine tests pass. `buy-bonus.test.ts` “simulated buy RTP converges near 96% (100k)” **times out at 5s** (observed ~6.5s). That test and simulator were not changed in this fix.

## Stake validator result

```
npm run validate:stake-engine
python scripts/check-books-package.py --index math/publish_files/index.json
```

Exact output:

```json
{"index":"C:\\xampp\\htdocs\\cryptomines\\math\\publish_files\\index.json","modes":[{"name":"base","errors":[],"eventsPath":"C:\\xampp\\htdocs\\cryptomines\\math\\publish_files\\books_base.jsonl.zst","weightsPath":"C:\\xampp\\htdocs\\cryptomines\\math\\publish_files\\lookUpTable_base_0.csv","bookRowsRead":10000,"weightRowsRead":10000,"truncated":false,"passed":true},{"name":"buyVault","errors":[],"eventsPath":"C:\\xampp\\htdocs\\cryptomines\\math\\publish_files\\books_buyVault.jsonl.zst","weightsPath":"C:\\xampp\\htdocs\\cryptomines\\math\\publish_files\\lookUpTable_buyVault_0.csv","bookRowsRead":1000,"weightRowsRead":1000,"truncated":false,"passed":true}],"passed":true}
```

Upload directory for Stake Engine ACP: **`math/publish_files/`**.

## Final status

**STAKE PACKAGE VALIDATION: PASS**
