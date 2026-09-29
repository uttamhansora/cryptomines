# Stake Engine `index.json` Audit

**Date:** 2026-09-25  
**Scope:** Artifact / package generation only. Gameplay math, RTP, UI, and animations were not modified for this audit.

## 1. Inspection of `math/index.json`

| Check | Result |
|-------|--------|
| Exists | Yes — `math/index.json` |
| Size | **258 bytes** (not 0 bytes) |
| Encoding | UTF-8, no BOM. CRLF line endings (`0x0D 0x0A` after `{`) |
| JSON validity | **Valid** — `JSON.parse` succeeds |
| Empty array/object | No |
| Is an event/index file? | **No — not the Stake Engine event-index contract** |

Parsed structure (current, pre-fix):

```json
{
  "gameId": "crypto-mines",
  "version": "1.0.0",
  "modes": [
    {
      "id": "base",
      "name": "Crypto Mines Base",
      "rtp": 96.0,
      "book": "books/base_sample.jsonl",
      "lookupTable": "lookup/base_weights.csv"
    }
  ]
}
```

Missing official Stake Engine mode keys: `cost`, `events`, `weights`.

`modes[].events` is **undefined**. That is what Stake Engine uses as the event-file path. The validator error:

```
ERR_INVALID_FORMAT: event file cannot be empty
Mode: *
File: index.json
```

matches a missing/empty `events` reference on the index (Mode `*` = unresolved / package-level check). The file is not a zero-byte file; it is the **wrong contract**, so the engine cannot resolve a non-empty event book.

Referenced files **do exist** and are non-zero:

| File | Bytes | Format |
|------|------:|--------|
| `math/books/base_sample.jsonl` | 382 | Histogram rows `{ payoutMultiplier, weight }` — **no `id`, no `events`** |
| `math/lookup/base_weights.csv` | 106 | Header `payoutMultiplier,weight` — **not** `id,weight,payoutMultiplier` |
| `math/fixtures/sample-round.json` | 630 | Valid `{ payoutMultiplier, events[] }` from the math engine |

`base_sample.jsonl` is therefore **not** a Stake event book. It cannot satisfy `events` even if the index were pointed at it.

## 2. What generates `index.json`?

| Question | Finding |
|----------|---------|
| What generates it? | **Nothing.** It is a hand-written static file. `scripts/generate-books.mjs` does **not** write `index.json`. |
| When is it generated? | Never, at package-build time. |
| What input does it require? | Official contract: completed per-mode event books + lookup tables. Current file ignores that. |
| Why is the result “empty” to Stake? | `modes[].events` is absent. Stake treats the event file as empty/unresolved. |
| Is it supposed to be an event index? | **Yes.** Official name: `index.json` mapping each mode to a compressed event book and a CSV lookup. |
| Required event schema? | **Yes — taken from Stake Engine math-sdk / `_stake-skills-ref`, not invented.** |

`scripts/generate-books.mjs` **does** run the authoritative math engine (`createRound` / `pickCell` / `cashOut` / `createBuyVaultRound` / `pickVault`) but then **discards `state.events`** and writes only a payout histogram. That is the source of the empty event package — not a missing simulation.

## 3. Official Stake Engine schema (existing sources)

Do not invent. Sources in this repo / Stake docs:

1. `_stake-skills-ref/book-generator/references/data-contract.md`
2. Stake Engine math-sdk: [Required Math File Format](https://github.com/StakeEngine/math-sdk/blob/main/docs/rgs_docs/data_format.md)
3. math-sdk `write_data.py` lookup writer: `{id},1,{payoutMultiplier}`

### `index.json` (strict)

```json
{
  "modes": [
    {
      "name": "base",
      "cost": 1.0,
      "events": "books_base.jsonl.zst",
      "weights": "lookUpTable_base_0.csv"
    }
  ]
}
```

### Event book (`books_<mode>.jsonl` then `.zst`)

One simulation per line:

```json
{ "id": 1, "events": [ { "index": 0, "type": "reveal", "...": "..." } ], "payoutMultiplier": 191 }
```

Required keys: `id` (int), `events` (non-empty list of event objects), `payoutMultiplier` (int, book scale ×100).

### Lookup CSV (`lookUpTable_<mode>_0.csv`)

No header. Columns: simulation id, probability/weight, payout multiplier. math-sdk default weight is `1` per simulation.

## 4. Event files inventory (pre-fix)

| Path | Event book? | Notes |
|------|-------------|--------|
| `math/index.json` | No | Metadata only; no `events` path |
| `math/books/base_sample.jsonl` | No | Histogram; empty of events |
| `math/lookup/base_weights.csv` | No | Wrong column order / no ids |
| `math/fixtures/sample-round.json` | Yes (fixture) | Authoritative engine events for one seed |
| `math/publish_files/**` | Missing | Official upload directory not generated |
| `*.jsonl.zst` | Missing | Required production event encoding |

No other `*.jsonl` event books exist.

## 5. Build order (pre-fix)

Incorrect conceptual order:

1. Static `index.json` already on disk (wrong schema)
2. `generate:books` writes histogram **without events**
3. Local `validate:index` only checks `book` / `lookupTable` path keys — **does not know `events` / `weights`**
4. Stake Engine upload reads `events`, finds empty → fail

Required order:

1. Build math artifacts (`shared`, `math-engine`)
2. Generate authoritative event data from the engine
3. Validate event data (non-empty, parseable, schema)
4. Generate `index.json` from those files
5. Validate `index.json`
6. Package (zstd books + lookup + index)
7. Run Stake package validator

## 6. Crypto Mines RGS events (engine already emits)

Verified in `packages/math-engine/src/round-engine.ts` — generation must **persist** these, not invent them:

| Semantic | Engine emission |
|----------|-----------------|
| round start | `reveal` / `revealType: roundStart` |
| tile reveal | `reveal` / `revealType: tileSafe` |
| tileFinal | `reveal` / `revealType: tileFinal` (loss disclosure) |
| mine | `reveal` / `revealType: tileMine` |
| chainStreak | `multiplierUpdate` / `source: chainStreak` |
| chainRewardUnlocked | `multiplierUpdate` / `source: chainRewardUnlocked` |
| chainReward | `multiplierUpdate` / `source: chainReward` |
| vault trigger | `enterBonus` + `multiplierUpdate` / `source: vaultTrigger` |
| vaultPick | `bonusPick` / `source: vaultPick` |
| vaultPayoutBook | field on `bonusPick` |
| buyVault | `createBuyVaultRound` (`buyVault: true`, `enterBonus`) |
| finalWin | `finalWin` |
| cashout | `multiplierUpdate` / `source: cashout` + `setTotalWin` + `finalWin` |

## 7. Conclusion

- `index.json` is **not** zero bytes.
- Stake Engine fails because the index is **not an event index** and the book generator **drops events**.
- Fix at source: persist engine events into official books, write lookup tables, **then** write `index.json`. Fail the build if any event file or index would be empty. Do not insert `{}` / `[]` placeholders.
