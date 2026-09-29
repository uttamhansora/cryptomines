#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { zstdDecompressSync } from 'node:zlib';
import { runFeatureSimulation } from '../packages/math-engine/dist/feature-sim.js';
import { theoreticalBuyBonusRtp } from '../packages/math-engine/dist/theory/buy-bonus.js';
import { RTP_BASE_SURVIVAL, RTP_CHAIN, RTP_VAULT } from '../packages/math-engine/dist/multipliers.js';
import { BOOK_SCALE, BUY_VAULT_COST_MULTIPLIER, MAX_WIN_MULTIPLIER, TARGET_RTP } from '../packages/shared/dist/index.js';

function bookStats(path, cost = 1) {
  const raw = zstdDecompressSync(readFileSync(path));
  const lines = raw.toString('utf8').trim().split('\n');
  const payouts = lines.map((line) => JSON.parse(line).payoutMultiplier / BOOK_SCALE);
  const mean = payouts.reduce((a, b) => a + b, 0) / payouts.length;
  const variance = payouts.reduce((s, p) => s + (p - mean) ** 2, 0) / payouts.length;
  const hits = payouts.filter((p) => p > 0).length;
  const max = Math.max(...payouts);
  const rtp = mean / cost;
  return {
    rounds: lines.length,
    rtpPct: rtp * 100,
    hitRatePct: (hits / payouts.length) * 100,
    maxPayoutX: max,
    volatility: Math.sqrt(variance),
    meanPayoutX: mean,
  };
}

const baseBook = bookStats('math/publish_files/books_base.jsonl.zst', 1);
const buyBook = bookStats('math/publish_files/books_buyVault.jsonl.zst', BUY_VAULT_COST_MULTIPLIER);
const buyTheory = theoreticalBuyBonusRtp(1);

const baseSim = runFeatureSimulation({
  rounds: 500_000,
  mineCount: 5,
  seed: 'cross-mode-base-v1',
  strategy: 'cashoutDepth3',
});
const buySim = runFeatureSimulation({
  rounds: 200_000,
  mineCount: 5,
  seed: 'cross-mode-buy-v1',
  strategy: 'buyVault',
});

const crossDiff = buyBook.rtpPct - baseBook.rtpPct;
const pass =
  baseBook.rtpPct >= 95.27 &&
  buyBook.rtpPct >= 90 &&
  buyBook.rtpPct <= 96.7 &&
  Math.abs(crossDiff) <= 0.5 &&
  baseBook.maxPayoutX <= MAX_WIN_MULTIPLIER &&
  buyBook.maxPayoutX <= MAX_WIN_MULTIPLIER;

console.log(
  JSON.stringify(
    {
      status: pass ? 'PASS' : 'FAIL',
      constants: { TARGET_RTP, RTP_BASE_SURVIVAL, RTP_CHAIN, RTP_VAULT },
      buyTheoryRtpPct: buyTheory.buyRtp * 100,
      publishedBooks: {
        base1x: baseBook,
        buyVault50x: buyBook,
        crossModeRtpDifferencePct: crossDiff,
      },
      independentSimulations: {
        baseCashoutDepth3: {
          rounds: baseSim.rounds,
          rtpPct: baseSim.rtp * 100,
          hitRatePct: baseSim.hitRate * 100,
          maxPayoutX: baseSim.maxObservedPayoutBook / BOOK_SCALE,
          volatility: baseSim.stdDev,
          vaultTriggerRatePct: baseSim.vaultTriggerRate * 100,
          chainCompleteRatePct: baseSim.chainCompleteRate * 100,
        },
        buyVault: {
          rounds: buySim.rounds,
          rtpPct: buySim.rtp * 100,
          hitRatePct: buySim.hitRate * 100,
          maxPayoutX: buySim.maxObservedPayoutBook / BOOK_SCALE,
          volatility: buySim.stdDev,
        },
      },
      acceptance: {
        baseRtpMin95_27: baseBook.rtpPct >= 95.27,
        buyRtpInBand: buyBook.rtpPct >= 90 && buyBook.rtpPct <= 96.7,
        crossModeWithinHalfPoint: Math.abs(crossDiff) <= 0.5,
        maxPayoutWithinCap: baseBook.maxPayoutX <= MAX_WIN_MULTIPLIER && buyBook.maxPayoutX <= MAX_WIN_MULTIPLIER,
      },
      note: 'Published book stats use the same 10k/1k sims as Stake upload; 500k/200k sims are additional statistical checks (not 20M sign-off).',
    },
    null,
    2,
  ),
);

process.exit(pass ? 0 : 1);
