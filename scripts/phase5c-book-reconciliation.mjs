#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TARGET_RTP, BOOK_SCALE, BUY_VAULT_COST_MULTIPLIER } from '../packages/shared/dist/index.js';
import { theoreticalBuyBonusRtp } from '../packages/math-engine/dist/theory/buy-bonus.js';
import { mathConfigurationHash } from '../packages/math-engine/dist/theory/config-hash.js';
import { PHASE5C_SEED } from '../packages/math-engine/dist/theory/phase5c-audit.js';
import { buildDepthCashoutWithStreakTable } from '../packages/math-engine/dist/theory/streak-chain-economics.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadBookWeights(bookPath, lutPath) {
  const errors = [];
  if (!existsSync(bookPath)) errors.push(`missing ${bookPath}`);
  if (!existsSync(lutPath)) errors.push(`missing ${lutPath}`);
  if (errors.length) return { errors, rows: [], totalWeight: 0 };

  const jsonl = readFileSync(bookPath, 'utf8').trim().split('\n').filter(Boolean);
  const rows = jsonl.map((line, i) => {
    const o = JSON.parse(line);
    const payoutMultiplier = o.payoutMultiplier ?? o.payoutBook;
    const weight = o.weight;
    if (typeof payoutMultiplier !== 'number' || typeof weight !== 'number') {
      errors.push(`invalid line ${i + 1}`);
    }
    return { payoutMultiplier, weight };
  });
  const totalWeight = rows.reduce((s, r) => s + r.weight, 0);
  return { errors, rows, totalWeight };
}

function bookRtp(rows, totalWeight, betUnit = 1) {
  const totalWin = rows.reduce((s, r) => s + (r.payoutMultiplier / BOOK_SCALE) * r.weight, 0);
  return totalWin / (totalWeight * betUnit);
}

const mineCount = 5;
const bookPath = join(root, 'math', 'books', 'base_sample.jsonl');
const lutPath = join(root, 'math', 'lookup', 'base_weights.csv');
const indexPath = join(root, 'math', 'index.json');

const loaded = loadBookWeights(bookPath, lutPath);
const depthStreak = buildDepthCashoutWithStreakTable(mineCount, TARGET_RTP);
const buyTheory = theoreticalBuyBonusRtp(1);

const bookSampleRtp = loaded.totalWeight > 0 ? bookRtp(loaded.rows, loaded.totalWeight, 1) : null;

const buyRows = loaded.rows.filter((r) =>
  [4000, 4400, 4800, 5200, 5600].includes(r.payoutMultiplier),
);
const buyWeight = buyRows.reduce((s, r) => s + r.weight, 0);
const buySampleRtp =
  buyWeight > 0 ? bookRtp(buyRows, buyWeight, BUY_VAULT_COST_MULTIPLIER) : null;

const indexOk = existsSync(indexPath);
const index = indexOk ? JSON.parse(readFileSync(indexPath, 'utf8')) : null;

const report = {
  generatedAt: new Date().toISOString(),
  configurationHash: mathConfigurationHash(mineCount),
  seed: PHASE5C_SEED,
  artifacts: {
    book: 'math/books/base_sample.jsonl',
    lookup: 'math/lookup/base_weights.csv',
    index: 'math/index.json',
  },
  bookLoad: {
    ok: loaded.errors.length === 0,
    errors: loaded.errors,
    outcomeCount: loaded.rows.length,
    totalWeight: loaded.totalWeight,
  },
  rtp: {
    bookSampleMixedStrategy: bookSampleRtp,
    bookSampleNote:
      'Sample book mixes cashout-at-3 base rounds + buy vault outcomes; NOT equal to cashoutFirstSafe RTP.',
    buySubsetFromBook: buySampleRtp,
    buyTheoretical: buyTheory.buyRtp,
    cashoutFirstSafeTheoretical: TARGET_RTP,
    depth3BasePlusStreakTheoretical:
      depthStreak.find((r) => r.depth === 3)?.theoreticalRtpIfCashHere ?? null,
  },
  indexDeclaredRtp: index?.modes?.[0]?.rtp ?? TARGET_RTP * 100,
  reconcileOk:
    loaded.errors.length === 0 &&
    indexOk &&
    buySampleRtp !== null &&
    Math.abs(buySampleRtp - buyTheory.buyRtp) < 0.02,
};

const md = `# Phase 5C Book / Index Reconciliation

**Generated:** ${report.generatedAt}  
**Config hash:** \`${report.configurationHash}\`  
**Seed:** \`${report.seed}\`

## Artifacts

| File | Status |
|------|--------|
| \`math/books/base_sample.jsonl\` | ${loaded.errors.length ? 'ERROR' : 'OK'} (${loaded.rows.length} outcomes, weight=${loaded.totalWeight}) |
| \`math/lookup/base_weights.csv\` | ${existsSync(lutPath) ? 'OK' : 'MISSING'} |
| \`math/index.json\` | ${indexOk ? 'OK' : 'MISSING'} |

## RTP reconciliation

| Source | RTP | Notes |
|--------|----:|-------|
| Index declared | ${report.indexDeclaredRtp ?? 'n/a'}% | Product metadata |
| Book sample (mixed generator) | ${bookSampleRtp !== null ? (bookSampleRtp * 100).toFixed(4) + '%' : 'n/a'} | ${report.rtp.bookSampleNote} |
| Book buy subset | ${buySampleRtp !== null ? (buySampleRtp * 100).toFixed(4) + '%' : 'n/a'} | vs buy theoretical ${(buyTheory.buyRtp * 100).toFixed(4)}% |
| Buy theoretical | ${(buyTheory.buyRtp * 100).toFixed(4)}% | Phase 5B economics |
| cashoutFirstSafe theoretical | ${(TARGET_RTP * 100).toFixed(2)}% | Base ladder @ depth 1 |
| cashout depth 3 (base+streak) theoretical | ${report.rtp.depth3BasePlusStreakTheoretical !== null ? (report.rtp.depth3BasePlusStreakTheoretical * 100).toFixed(4) + '%' : 'n/a'} | Strategy-specific |

## Validation result

**Book load:** ${report.bookLoad.ok ? 'PASS' : 'FAIL'}  
**Buy subset vs theory (±2%):** ${report.reconcileOk ? 'PASS' : 'NEEDS REVIEW'}

${loaded.errors.length ? `\n### Errors\n${loaded.errors.map((e) => `- ${e}`).join('\n')}\n` : ''}

---

Run: \`npm run generate:books\` then \`node scripts/phase5c-book-reconciliation.mjs\`
`;

writeFileSync(join(root, 'docs', 'PHASE_5C_BOOK_RECONCILIATION.md'), md);
console.log(JSON.stringify(report, null, 2));
