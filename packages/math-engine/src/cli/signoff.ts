import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TARGET_RTP, GAME_VERSION } from '@crypto-mines/shared';
import { runFeatureSimulation, type FeatureSimStrategy } from '../feature-sim.js';
import { theoreticalBuyBonusRtp } from '../theory/buy-bonus.js';
import { organicVaultChestDistribution } from '../theory/vault-chests.js';
import { mathConfigurationHash, mathConfigurationPayload } from '../theory/config-hash.js';
import { theoreticalInstantLossRtp } from '../multipliers.js';

const args = process.argv.slice(2);
let mineCount = 5;
let seed = 'phase5-signoff-v1';
let outPath = '';

for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--mines' && args[i + 1]) {
    mineCount = Number(args[i + 1]);
    i += 1;
  } else if (args[i] === '--seed' && args[i + 1]) {
    seed = args[i + 1];
    i += 1;
  } else if (args[i] === '--out' && args[i + 1]) {
    outPath = args[i + 1];
    i += 1;
  }
}

const sampleSizes = [100_000, 1_000_000, 20_000_000] as const;
const allStrategies: FeatureSimStrategy[] = [
  'cashoutFirstSafe',
  'continueUntilMine',
  'continueUntilN',
  'vaultSeeking',
  'chainSeeking',
  'buyVault',
];
const strategies20M: FeatureSimStrategy[] = [
  'cashoutFirstSafe',
  'continueUntilMine',
  'vaultSeeking',
  'buyVault',
];

const buyTheory = theoreticalBuyBonusRtp(1);
const configHash = mathConfigurationHash(mineCount);

const simulations: Record<string, ReturnType<typeof runFeatureSimulation>> = {};

const report = {
  generatedAt: new Date().toISOString(),
  gameVersion: GAME_VERSION,
  targetRtpConfigured: TARGET_RTP,
  seed,
  configurationHash: configHash,
  configuration: mathConfigurationPayload(mineCount),
  theoretical: {
    buyBonus: buyTheory,
    organicVaultChestsAtBase100: organicVaultChestDistribution(100),
    baseLadderDiagnosticUniformStop: theoreticalInstantLossRtp(mineCount),
  },
  simulations,
};

for (const rounds of sampleSizes) {
  const strategies = rounds === 20_000_000 ? strategies20M : allStrategies;
  for (const strategy of strategies) {
    const key = `${strategy}_${rounds}`;
    const cfg =
      strategy === 'continueUntilN'
        ? { rounds, mineCount, seed, strategy, targetSafePicks: 5 }
        : { rounds, mineCount, seed, strategy };
    simulations[key] = runFeatureSimulation(cfg);
  }
}

const json = JSON.stringify(report, null, 2);
console.log(json);
if (outPath) writeFileSync(outPath, json);
else {
  const defaultOut = join(process.cwd(), '..', '..', 'docs', 'phase5-sim-results.json');
  try {
    writeFileSync(defaultOut, json);
  } catch {
    /* optional */
  }
}
