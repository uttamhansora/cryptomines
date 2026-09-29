import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAME_VERSION, TARGET_RTP } from '../packages/shared/dist/index.js';
import { runFeatureSimulation } from '../packages/math-engine/dist/feature-sim.js';
import { theoreticalBuyBonusRtp } from '../packages/math-engine/dist/theory/buy-bonus.js';
import { organicVaultChestDistribution } from '../packages/math-engine/dist/theory/vault-chests.js';
import { mathConfigurationHash } from '../packages/math-engine/dist/theory/config-hash.js';
import { theoreticalInstantLossRtp } from '../packages/math-engine/dist/multipliers.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const seed = 'phase5-signoff-v1';
const mineCount = 5;
const configHash = mathConfigurationHash(mineCount);

const bookErrors = [];
const indexPath = join(root, 'math', 'index.json');
if (existsSync(indexPath)) {
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  for (const mode of index.modes ?? []) {
    const eventsRel = mode.events ?? mode.book;
    const weightsRel = mode.weights ?? mode.lookupTable;
    if (eventsRel && !existsSync(join(root, 'math', eventsRel))) bookErrors.push(`missing ${eventsRel}`);
    if (weightsRel && !existsSync(join(root, 'math', weightsRel))) bookErrors.push(`missing ${weightsRel}`);
  }
}

const strategies = [
  'cashoutFirstSafe',
  'continueUntilMine',
  'continueUntilN',
  'vaultSeeking',
  'chainSeeking',
  'buyVault',
];
const sizes = [100_000, 1_000_000, 20_000_000];

const simulations = {};
for (const rounds of sizes) {
  for (const strategy of strategies) {
    if (rounds === 20_000_000 && !['cashoutFirstSafe', 'continueUntilN', 'buyVault'].includes(strategy)) {
      continue;
    }
    const key = `${strategy}_${rounds}`;
    process.stderr.write(`run ${key}\n`);
    simulations[key] = runFeatureSimulation({
      rounds,
      mineCount,
      seed,
      strategy,
      targetSafePicks: 5,
    });
  }
}

const buyTheory = theoreticalBuyBonusRtp(1);
const payload = JSON.stringify({
  gameVersion: GAME_VERSION,
  targetRtp: TARGET_RTP,
  seed,
  configurationHash: configHash,
  configurationVersion: configHash,
  codeHash: createHash('sha256').update(configHash + seed).digest('hex').slice(0, 16),
  theoretical: {
    buyBonus: buyTheory,
    vaultChests: organicVaultChestDistribution(100),
    baseUniformStopDiagnostic: theoreticalInstantLossRtp(mineCount),
  },
  bookValidation: { ok: bookErrors.length === 0, errors: bookErrors },
  simulations,
});

writeFileSync(join(root, 'docs', 'phase5-sim-results.json'), payload);
process.stdout.write(payload);
