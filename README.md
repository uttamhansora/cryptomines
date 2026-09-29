# CRYPTO MINES

Stake Engine instant game — 5×5 crypto vault grid with Crypto Chain and Crypto Vault Bonus.

## Stack

- **@crypto-mines/math-engine** — authoritative round logic & simulator
- **@crypto-mines/rgs-mock** — local RGS (dev)
- **frontend** — Vite + Svelte event player

## Commands

```bash
npm install
npm run build
npm test
npm run sim:quick
npm run dev -w @crypto-mines/frontend
```

Dev server: `http://localhost:5173` (RGS mock at `/api/rgs`).

Replay example:

`?replay=true&game=crypto-mines&version=1.0.0&mode=base&event=demo-seed&rgs_url=/api/rgs`

## Documentation

See `/docs` for GDD, math, design, and approval checklist.

## Status

**NOT READY — BLOCKERS REMAIN** (see `docs/STAKE_APPROVAL_READINESS.md`).
