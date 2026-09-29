# Board Interaction Diagnosis — Unclickable Tiles During Active Round

**Date:** 2026-09-26

## Result

**BOARD INTERACTION: PASS** (after fix) — local mock flow: start round → multiple tile picks → cash out.

Production re-verify on Engine launch URL after uploading new `frontend/dist/`.

---

## 1. Click flow

```
Tile.svelte handleClick / pointerdown
  → onpick(cell.index)  [GameBoard → App.svelte onPick]
  → client.inRoundDecision({ action: 'pick', cellIndex })
  → POST /bet/action (DECISION)
  → recordRoundEvent (POST /bet/event, non-fatal on failure)
  → applyEvents(extractRoundEvents(res.round))
  → playback updates snap.cells
```

---

## 2. Root cause

**File:** `frontend/src/App.svelte`  
**Mechanism:** Board `disabled` included **`vaultTheatreActive`** and global **`pickInFlight`**.

### A. Sticky `vaultTheatreActive` (primary)

```javascript
playback.subscribe((s) => {
  if (s.inVaultBonus) vaultTheatreActive = true;
  // never cleared when inVaultBonus became false
});
```

During hydrate/resume or event replay, `inVaultBonus` could become `true` then `false`, but **`vaultTheatreActive` stayed `true`**.

**Symptom match (production screenshot):**

| UI | Explanation |
|----|-------------|
| Chain 3/5, multiplier, revealed tiles | Playback state OK, `roundActive === true` |
| “Tap a tile on the board to reveal” | `canCashOut === false` because **`!vaultTheatreActive`** was false in old `canCashOut` |
| Tiles not clickable | `disabled={… \|\| vaultTheatreActive}` → entire board disabled |

DOM clicks could fire on tiles, but **`disabled` on `<button>`** blocked interaction (not an overlay).

### B. Global `pickInFlight` (secondary)

Any in-flight pick/cashout set **`pickInFlight = true`** on **all** tiles. If a request hung or UX needed concurrent targeting, the whole board stayed disabled until `finally`.

---

## 3. DOM / overlay

- `GameBoard` overlays (`mine-flash`, `spark`, frame art): **`pointer-events: none`**
- `shell.dimmed`: only when vault scene visible
- **No invisible overlay** was the primary blocker; **`disabled` prop** was.

---

## 4. Fix applied

| Change | Location |
|--------|----------|
| Clear `vaultTheatreActive` when `!snap.inVaultBonus` in playback subscribe | `App.svelte` |
| Board guard uses **`showVaultScene`** (vault UI actually open), not stale theatre flag | `boardInteractionBlocked`, `canCashOut` |
| Remove **`pickInFlight`** from board disable; use **`pickingCell`** — only the tile awaiting RGS is disabled | `App.svelte`, `GameBoard.svelte` |
| **`recordRoundEvent` failure non-fatal** after successful `/bet/action` | `rgs.ts` |
| DEV-only `[TILE]` / `[BOARD STATE]` logs | `Tile.svelte`, `App.svelte` |

---

## 5. `/bet/event` involvement

Tile picks use **`/bet/action`** first. `/bet/event` is checkpoint only. A failed `/bet/event` no longer fails the whole pick (non-fatal log); it did **not** permanently set `pickInFlight` (already cleared in `finally`), but threw errors that confused recovery.

---

## 6. Active-round state (expected after fix)

| Field | Active base round (3 safe picks) |
|-------|----------------------------------|
| `roundActive` | `true` |
| `boardInteractionBlocked` | `false` |
| `showVaultScene` | `false` |
| `pickingCell` | `null` (except during one pick) |
| `vaultTheatreActive` | `false` when not in vault bonus |

---

## 7. Tests performed

- `npm run build -w @crypto-mines/frontend`
- Local: authenticate → start round → click tiles (mock RGS)

---

## 8. Remaining risks

- Production `/bet/action` schema mismatch → pick errors in banner, but board stays clickable for retry.
- True vault bonus: board correctly blocked while **`showVaultScene`** is open.
