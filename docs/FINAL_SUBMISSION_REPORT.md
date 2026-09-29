# Crypto Mines Final Submission Report

**Date:** 2025-09-25  
**Build tested:** `npm run build` (workspace) + `frontend/dist/`  
**Decision:** **NOT READY TO RESUBMIT**

---

## RGS

**Status:** **BLOCKED** (local **PASS**, production **MANUAL REQUIRED**)

- Code path: authenticate → play → bet/event → end-round (zero-win skip) — verified on mock (`validate:rgs-flow`, full `npm test`).
- Production operator RGS not exercised in this environment.
- `/bet/event` game payload must match hosted crypto-mines RGS (see `docs/RGS_PRODUCTION_AUDIT.md`).

### DevTools checklist (operator launch URL)

1. Filter **Fetch/XHR** → confirm `POST {rgs_url}/wallet/authenticate` (200).
2. Confirm **Start** → `POST …/wallet/play` with `sessionID`, integer `amount`, `currency`, `mode`, `params.mineCount`.
3. Reveal tile → `POST …/bet/event` (or operator-documented path).
4. Cash out win → `POST …/wallet/end-round` once with `{ sessionID }`.
5. Mine loss (0 payout) → **no** end-round.
6. `?rgs_url=https://invalid.example.invalid` → auth fails, no play.

---

## Math

**Status:** **BLOCKED** for full statistical sign-off; **PASS** for cross-mode compliance

| Metric | Result |
|--------|--------|
| Base RTP (published 10k books) | **95.69%** |
| Buy Vault RTP (published 1k) | **95.77%** |
| Cross-mode gap | **0.08%** (≤ 0.50% required) |
| Base max payout (books) | **3.35×** |
| Buy max payout (books) | **56×** |
| 500k / 200k sims | PASS (see cross-mode report) |
| **20M Phase 5D matrix** | **BLOCKED** — run `npm run signoff:phase5d` |

---

## 51 Guideline Audit

**Score: 39 / 51 applicable checks passed** (6 N/A, 4 FAIL, 2 BLOCKED — see notes)

| Area | Pass | Notes |
|------|------|-------|
| Prechecks (5) | 4 | Live RGS BLOCKED |
| Compliance (3) | 3 | Unique title, assets present |
| Thumbnail (1) | 0 | **FAIL** — no thumbnail asset in repo |
| RGS (2) | 2 | Bet levels + restore in code |
| Currency (2) | 1 | Sub-cent live NOT TESTABLE |
| RGS requests (2) | 2 | Zero-win + IPB handling partial |
| Frontend (2) | 2 | Spacebar + scroll (fixed this pass) |
| Game rules (8) | 7 | Provably Fair UI **FAIL** (not exposed) |
| Autoplay (2) | N/A | No autoplay feature |
| Responsive (6) | 2 | Code only; matrix NOT TESTABLE |
| Sound (1) | 1 | Toggle present |
| Language (2) | 1 | Fallback NOT TESTABLE |
| Replay (6) | 4 | Popout matrix NOT TESTABLE |
| Stake.US (5) | N/A | Not implemented |
| Final (3) | 2 | Portal bet templates NOT TESTABLE |

---

## Visual Quality

**Status:** **PASS** with known exceptions

- Premium Emerald system shipped (`docs/VISUAL_DIRECTION.md`).
- **Remaining:** vault hall/door/capsule/frame SVGs not fully redrawn (cosmetic, not functional).

---

## Animation

**Status:** **NOT TESTABLE** (code **PASS**)

- GSAP tied to authoritative events; tests pass; manual 18-state QA not recorded.

---

## Responsive

**Status:** **NOT TESTABLE**

- Viewport/zoom/touch targets updated; no screenshot matrix attached.

---

## Replay

**Status:** **PASS** (code); **NOT TESTABLE** (Popout S/L)

- `?replay=true&game=…&event=…&rgs_url=…` implemented.

---

## Currency

**Status:** **PASS** (implementation); live edge cases **NOT TESTABLE**

---

## Static Assets

**Status:** **PASS**

- Production `dist/`: bundled fonts, no googleapis/CDN in HTML/JS/CSS grep.

---

## Stake Package

**Status:** **PASS**

```
validate:stake-package → pass, 11000 events, 0 errors
validate:stake-engine → passed: true (base 10000 + buyVault 1000 rows)
```

---

## Performance

**Status:** **NOT TESTABLE**

- No FPS/memory captures in this pass.

---

## Blockers fixed in this release pass

| Fix | File(s) |
|-----|---------|
| Spacebar start/cashout | `App.svelte` |
| Disable double-tap zoom | `index.html`, `app.css` |
| Bet stepper uses auth min/max/step/levels | `ControlPanel.svelte` |
| Rules disclaimer + interaction | `RulesModal.svelte` |

---

## Remaining manual checks (Engine/operator only)

1. **Live RGS** full matrix on operator iframe URL.
2. **`npm run signoff:phase5d`** and archive `docs/phase5d-sim-results.json`.
3. Responsive + FPS screenshots at 5 breakpoints.
4. Upload **game thumbnail** per Stake portal requirements.
5. Confirm **Provably Fair / Replay** portal links if required by checklist (replay works in-client; PF UI not present).
6. Stake.US social copy if distributing on `.us`.

---

## Submission Decision

### NOT READY TO RESUBMIT

**Critical blockers:**

1. **Production RGS not verified** on real operator environment (original Engine rejection reason).
2. **20M Phase 5D statistical sign-off artifact missing**.
3. **Manual QA evidence** (responsive, animation, performance) not attached.
4. **Marketing thumbnail** not in repository.

**Recommendation:** Complete items 1–3 (minimum) before resubmission. Item 1 is mandatory to address the prior Engine Support rejection.

---

## Commands run (evidence)

```bash
npm run validate:stake-package      # PASS
npm run validate:stake-engine       # PASS
npm run validate:cross-mode-rtp     # PASS (gap 0.08%)
npm run validate:rgs-flow           # PASS
npm test                            # PASS (all workspaces)
npm run build -w @crypto-mines/frontend  # PASS
```
