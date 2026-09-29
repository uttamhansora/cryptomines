# Phase 4 Visual QA

## Scope

Presentation-only pass: board/tiles/crypto/vault theatre/chain/controls/big win. **Math unchanged.** Buy-bonus RTP sim remains **blocker** (see `BUY_BONUS_SPEC.md`).

## Checklist

| Case | Desktop | Mobile | Notes |
|------|---------|--------|-------|
| Initial state | Manual | Manual | Hero + board frame + panel hierarchy |
| Active round | Manual | Manual | Recessed tiles, tile-back art |
| Safe reveal | Manual | Manual | Token + burst |
| Mine | Manual | Manual | Spark canvas + shake |
| Chain stage | Manual | Manual | Dot/wire energy |
| Chain complete | Manual | Manual | Pulse + burst label |
| Vault trigger | Manual | Manual | Dim + full-screen intro |
| Vault selection | Manual | Manual | Capsule assets |
| Vault reward | Manual | Manual | Authoritative mult count-up |
| Vault return (organic) | Manual | Manual | ~2–3s complete + fade |
| Buy bonus entry | Manual | Manual | Premium buy card + confirm |
| Buy result | Manual | Manual | “Purchased Bonus” badge |
| Cashout | Manual | Manual | Two-line cashout CTA |
| Good / Big / Mega win | Manual | Manual | Tier + mult + payout |
| Round reset | Manual | Manual | |

## Viewports (screenshots)

Capture from production build or dev:

- 390×844
- 430×932
- 768×1024
- 1280×720
- 1440×900

**Status:** Automated screenshot capture not checked in — run manual or CI visual job before sign-off.

## Performance (target ≥55 FPS avg)

| Viewport | FPS (post Phase 4) | Method |
|----------|-------------------|--------|
| 390×844 | **~75** (idle, preview build) | rAF count 1s, dust canvas on |
| 430×932 | _Pending_ | Same method |
| 1280×720 | _Pending_ | Same method |
| 1440×900 | _Pending_ | Same method |

Screenshots (initial state): `docs/screenshots/phase4/390x844-initial.png` (1280 capture when present).

Background dust canvas + win/mine sparks are capped (≤24 dust, ≤14 big-win, ≤10 mine particles).

## Sign-off

**NOT READY** until manual matrix + FPS rows filled and art gate passed (`PHASE_4_ART_AUDIT.md` replacements verified in-browser).
