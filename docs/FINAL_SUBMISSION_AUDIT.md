# Final Submission Audit — Crypto Mines

**Audit date:** 2025-09-25  
**Auditor role:** Final release engineering pass  
**Evidence rule:** PASS only with command output, test result, or file inspection cited.

Legend: **PASS** | **FAIL** | **BLOCKED** | **NOT TESTABLE**

---

## 1. RGS

| Item | Status | Evidence |
|------|--------|----------|
| Single RGS client (`frontend/src/lib/rgs.ts`) | PASS | Repo grep: one wallet implementation; mock separate |
| `rgs_url` from query | PASS | `parseLaunchParams`; prod empty → error |
| `POST /wallet/authenticate` on launch | PASS | `App.svelte` `load()`; mock + dev browser (prior session) |
| `POST /wallet/play` on Start/Buy Vault | PASS | `startRound` / `startBuyVault`; `flow.test.ts` |
| `POST /bet/event` in-round | PASS | `onPick`, cashout, vault; mock handler |
| `POST /wallet/end-round` qualifying wins only | PASS | `finishRoundIfNeeded`; zero-win test in `flow.test.ts` |
| `currency` on play | PASS | `rgs.ts` play body |
| Active round restore | PASS | `restoreActiveRound()` on `auth.round.active` |
| Error handling (HTTP + codes) | PASS | `rgsHttpErrorMessage`, `assertRgsApplicationSuccess` |
| Invalid `rgs_url` | PASS | Browser test (prior): auth fail, play disabled |
| **REAL Stake operator RGS** | **BLOCKED** | No live `sessionID` + production `rgs_url` in CI |
| **Production `/bet/event` schema** | **NOT TESTABLE** | Game-specific payload; see `docs/RGS_PRODUCTION_AUDIT.md` |

**Manual RGS test:** Launch operator URL → DevTools Network → authenticate → play → pick → cashout → end-round (if win). Compare host to `rgs_url` query param.

---

## 2. Math

| Item | Status | Evidence |
|------|--------|----------|
| Cross-mode RTP ≤ 0.50% gap | PASS | `node scripts/cross-mode-rtp-report.mjs` → `crossModeRtpDifferencePct: 0.0803`, `status: PASS` |
| Published base RTP | PASS | Books: **95.69%** (10k books) |
| Published buy RTP | PASS | Books: **95.77%** (1k books) |
| Max payout vs cap | PASS | base max **3.35×**, buy **56×** (within configured limits) |
| Independent sim 500k/200k | PASS | Report JSON `independentSimulations` |
| **Phase 5D 20M sign-off** | **BLOCKED** | `docs/phase5d-sim-results.json` **missing** |
| Math unit tests | PASS | `npm test` math-engine **29 passed** |

**20M command (when ready):** `npm run signoff:phase5d` (long runtime; not executed in this audit).

---

## 3. Game Rules

| Item | Status | Evidence |
|------|--------|----------|
| Rules modal content | PASS | `RulesModal.svelte`: 5×5, mines, chain, vault, buy 50×, RTP ~96%, max 5000× |
| Disclaimer (malfunction, RGS settlement) | PASS | Added in this pass |
| Spacebar documented | PASS | Rules list item |
| Matches current buy cost constant | PASS | `BUY_VAULT_COST_MULTIPLIER` from shared |

---

## 4. Bet Levels

| Item | Status | Evidence |
|------|--------|----------|
| Default bet from auth | PASS | `App.svelte` `defaultBetLevel` + `betLevels` |
| Play validation vs config | PASS | `RgsClient.validateBetAmount` |
| Stepper uses min/max/step/levels | PASS | `ControlPanel.svelte` (this pass) |
| Invalid bet blocked at play | PASS | Client throws before POST |

---

## 5. Currency

| Item | Status | Evidence |
|------|--------|----------|
| Wallet 1e6 API scale | PASS | `@crypto-mines/shared` `API_SCALE` |
| Display conversion | PASS | `apiToDisplay` / `displayToApi` |
| Sub-cent display | NOT TESTABLE | No live fractional-currency operator test |

---

## 6. Frontend

| Item | Status | Evidence |
|------|--------|----------|
| Production build | PASS | `npm run build -w @crypto-mines/frontend` |
| `base: "./"` | PASS | `vite.config.ts` |
| Spacebar = bet/cashout | PASS | `App.svelte` `onSpaceAction` (this pass) |
| No page zoom (double-tap) | PASS | viewport `user-scalable=no`, `touch-action: manipulation` |
| Scroll containment | PASS | `app.css` overflow rules |
| Sound toggle | PASS | `GameHeader` |
| Autoplay | N/A | Feature not implemented |

---

## 7. Responsive

| Item | Status | Evidence |
|------|--------|----------|
| 390×844 … 1440×900 matrix | NOT TESTABLE | No captured screenshots in repo |
| Layout uses clamp/max-width | PASS | Code review `ControlPanel`, `GameBoard`, `App.svelte` |

---

## 8. Animation

| Item | Status | Evidence |
|------|--------|----------|
| Event-driven GSAP | PASS | `playback-coordinator.ts`, `animation/controller.ts` |
| No client outcome RNG | PASS | Grep: no `Math.random` in game logic (FX only) |
| Full state matrix | NOT TESTABLE | Manual QA required |

---

## 9. Visual Quality

| Item | Status | Evidence |
|------|--------|----------|
| Emerald vault direction | PASS | `docs/VISUAL_DIRECTION.md`, tokens, medallion SVGs |
| Board/tile/mine/crypto | PASS | `public/assets/game/**` |
| Vault hall/door/capsule/frame | **FAIL** (minor) | Older SVG art; tinted only — see `VISUAL_QUALITY_AUDIT.md` |
| Unused legacy symbols | PASS | Not referenced by runtime paths |

---

## 10. Audio

| Item | Status | Evidence |
|------|--------|----------|
| Sound toggle | PASS | Header + synth manager |
| Event-driven SFX | PASS | `event-sounds.ts` |

---

## 11. Replay

| Item | Status | Evidence |
|------|--------|----------|
| Replay query params | PASS | `parseLaunchParams`, `REPLAY_SPEC.md` |
| Fetch replay endpoint | PASS | `RgsClient.fetchReplay` |
| Bet UI disabled in replay | PASS | `ControlPanel` `replayMode` |
| Popout / currency replay matrix | NOT TESTABLE | Manual |

---

## 12. Static Assets

| Item | Status | Evidence |
|------|--------|----------|
| No CDN fonts in dist | PASS | Grep `frontend/dist`: no googleapis/gstatic |
| Fonts bundled | PASS | dist `*.woff2` from @fontsource |
| GSAP in bundle | PASS | `index-*.js` includes gsap |

---

## 13. Stake Package

| Item | Status | Evidence |
|------|--------|----------|
| `index.json` non-empty, official schema | PASS | `validate:stake-package` → 11000 events, 0 errors |
| Python package check | PASS | `validate:stake-engine` → `"passed":true` |
| Generation order | PASS | `docs/STAKE_INDEX_JSON_FIX.md` |

---

## 14. Performance

| Item | Status | Evidence |
|------|--------|----------|
| FPS / memory matrix | NOT TESTABLE | Not instrumented in this pass |
| Particle caps | PASS | Code review `WinCelebration`, `StageBackground` |

---

## 15. Final Submission

| Item | Status | Evidence |
|------|--------|----------|
| All automated tests green | PASS | `npm test` exit 0 (full workspace) |
| Live RGS sign-off | BLOCKED | Operator environment |
| 20M math sign-off | BLOCKED | Artifact missing |
| Marketing thumbnail | FAIL | No `thumbnail` asset in repo (portal may require separate upload) |
| Stake.US social mode | NOT TESTABLE | Not implemented / not verified |

---

## RGS test matrix (local mock)

| # | Scenario | Status | Evidence |
|---|----------|--------|----------|
| 1 | Launch | PASS | Dev/build loads |
| 2 | Authenticate | PASS | Mock + `handler.test.ts` |
| 3 | Invalid rgs_url | PASS | Prior browser + client error state |
| 4 | Start round | PASS | `flow.test.ts` play |
| 5 | Pick safe | PASS | `flow.test.ts` pick |
| 6 | Pick mine | PASS | Zero-win test loop in `flow.test.ts` |
| 7 | Cashout | PASS | Manual API script (prior session) |
| 8 | Buy Vault | PASS | Mock `mode: buyVault` |
| 9 | Insufficient balance | NOT TESTABLE | Needs mock session broke |
| 10 | Invalid bet | PASS | `validateBetAmount` unit behavior |
| 11 | Double Start | PASS | `playInFlight`, `canPlaceBets` |
| 12 | Double Cashout | PASS | `pickInFlight` |
| 13 | Reload active round | NOT TESTABLE | Manual reload |
| 14 | Complete round | PASS | end-round path in mock |
| 15 | Zero-win loss | PASS | No end-round when payout 0 |

---

## 51-point guideline snapshot

See `docs/FINAL_SUBMISSION_REPORT.md` for counted score.
