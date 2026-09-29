#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDepthCashoutWithChainTable } from '../packages/math-engine/dist/theory/streak-chain-economics.js';
import { mathConfigurationHash } from '../packages/math-engine/dist/theory/config-hash.js';
import { TARGET_RTP } from '../packages/shared/dist/index.js';
import { RTP_BASE_SURVIVAL } from '../packages/math-engine/dist/multipliers.js';
import { PHASE5C_SEED } from '../packages/math-engine/dist/theory/phase5c-audit.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mineCount = 5;
const rows = buildDepthCashoutWithChainTable(mineCount, TARGET_RTP);
const hash = mathConfigurationHash(mineCount);

let md = `# MATH Complete Ladder (Phase 5D)\n\n`;
md += `**Mine count:** ${mineCount} · **Target RTP cap:** ${(TARGET_RTP * 100).toFixed(0)}%  \n`;
md += `**RTP_BASE_SURVIVAL:** ${RTP_BASE_SURVIVAL} · **Config hash:** \`${hash}\` · **Seed:** \`${PHASE5C_SEED}\`\n\n`;
md += `**Payout:** win = bet × (baseMultiplierBook + chainBonusBook [+ vault on base]) / 100. Chain does **not** modify base multiplierBook.\n\n`;
md += `| Depth | P(reach) | Base mult | Chain stage | Chain bonus | Combined | Theoretical RTP | House edge |\n`;
md += `|------:|---------:|----------:|:-----------:|------------:|---------:|----------------:|-----------:|\n`;
for (const row of rows) {
  md += `| ${row.depth} | ${row.survivalProbability.toFixed(8)} | ${row.baseMultiplierBook} | ${row.chainStage} | ${row.chainBonusBook} | ${row.combinedPayoutBook} | ${(row.theoreticalRtpIfCashHere * 100).toFixed(4)}% | ${(row.houseEdgeIfCashHere * 100).toFixed(4)}% |\n`;
}
md += `\n*Phase 5D — separate chain bonus economics.*\n`;
writeFileSync(join(root, 'docs', 'MATH_COMPLETE_LADDER.md'), md);
console.log('Wrote docs/MATH_COMPLETE_LADDER.md');
