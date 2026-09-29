# Final Release Readiness — Crypto Mines

**Date:** 2026-09-24  
**Status:** **NOT READY — BLOCKERS REMAIN**

---

## 1. Gameplay

| Item | Status |
|------|--------|
| Base pick / cashout / buy vault | Implemented |
| Phase 5D chain bonus (separate book) | Implemented (math + RGS) |
| Loss full-board reveal | **Fixed** — authoritative `tileFinal` events + staggered client animation |
| Win tiers (Good / Big / Mega) | **Updated** — premium overlay (`WinCelebration.svelte`) |

## 2–5. Chain / Vault / Buy

Documented in `docs/PHASE_5D_CHAIN_ECONOMICS.md`. Buy vault unchanged at 96% target.

## 6. Loss reveal

- **Server:** `pushBoardDisclosure()` in `round-engine.ts` after `tileMine`.
- **Client:** `apply-event.ts` applies `tileFinal`; GSAP stagger ~55ms/tile after 250ms post-impact pause.
- **UI:** `LossResultPanel.svelte` — compact result, board stays visible.
- **Tests:** `loss-disclosure.test.ts`, `loss-reveal.test.ts`.

## 7–10. Win presentation

- Dimmed backdrop (board visible), diamond hero, tier typography, payout counter (GSAP), mega canvas burst.
- Chain bonus line when `chainBonusBook > 0`.
- Vault → win: existing vault theatre completes before `finishRoundIfNeeded` win overlay.

## 11. Audio

Existing event-driven sounds (`event-sounds.ts`). No new autoplay hacks.

## 12. Art

Prototype SVG assets remain; no full art redesign in this pass. Visible blockers not re-audited with new screenshots in this session.

## 13–14. Mobile / Desktop responsive

Code uses `clamp()` / max-width; **manual screenshot QA matrix not executed in CI** (see §22).

## 15. Performance

**Browser FPS matrix not measured in this session** (see §23).

## 16. Math

| Item | Status |
|------|--------|
| Phase 5D theory + depth RTP tests | Pass (29 math-engine tests) |
| `npm run signoff:phase5d` 20M matrix | **INCOMPLETE** — `docs/phase5d-sim-results.json` missing |
| MATH SIGN-OFF | **BLOCKED** pending 20M completion |

Run: `npm run signoff:phase5d` (build + sim + ladder + books).

## 17. RGS / Replay

- `rgs-mock` handler tests pass.
- Replay tests pass (math + frontend playback).
- Loss events included in deterministic replay stream.

## 18. Books

Regenerate after math changes: `npm run generate:books`.

## 19. Known issues / blockers

1. **Phase 5D 20M simulation artifact not finished** — required for math sign-off.
2. **Full manual QA matrix** (gameplay + responsive + FPS) — not executed end-to-end with captured screenshots.
3. **Base-only cashoutFirstSafe ~92% RTP** (by design post-5D funding split) — product copy/RTP disclosure must align before Stake review.
4. **Art** — still prototype-tier; not a full production art pass.

---

## Final status

### NOT READY — BLOCKERS REMAIN

Upgrade to **READY FOR STAKE ENGINE REVIEW** only when:

- `docs/phase5d-sim-results.json` exists and validates theory vs sim ± tolerance
- Manual QA matrix signed off with evidence
- Product accepts documented RTP model (base vs chain vs buy)
