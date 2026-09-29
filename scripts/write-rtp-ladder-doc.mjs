#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRtpLadder, rtpBaseSurvivalConstant } from '../packages/math-engine/dist/theory/rtp-ladder.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mineCount = 5;
const rows = buildRtpLadder(mineCount);

let md = `# Mines RTP Ladder (authoritative math)\n\n`;
md += `Mine count: **${mineCount}**  \n`;
md += `RTP_BASE_SURVIVAL constant: **${rtpBaseSurvivalConstant()}** (aligned to \`TARGET_RTP\`)\n\n`;
md += `Convention: **win = bet × multiplierBook / 100**. Chain boosts **add** book units (+80 = +0.80×).\n\n`;
md += `| Depth | P(reach) | Mult (book) | Mult (×) | RTP if cash here | House edge |\n`;
md += `|------:|---------:|------------:|---------:|-----------------:|-----------:|\n`;
for (const row of rows) {
  md += `| ${row.depth} | ${row.survivalProbability.toFixed(6)} | ${row.multiplierBook} | ${row.multiplierDisplay.toFixed(4)} | ${(row.rtpIfCashAtDepth * 100).toFixed(2)}% | ${(row.houseEdgeIfCashAtDepth * 100).toFixed(2)}% |\n`;
}
md += `\n**Note:** “RTP if cash here” = P(reach depth) × multiplier at depth ( assumes zero payout on mine before depth). Player strategy mixes depths; this is not a single game RTP.\n`;

writeFileSync(join(root, 'docs', 'MATH_RTP_LADDER.md'), md);
console.log('Wrote docs/MATH_RTP_LADDER.md');
