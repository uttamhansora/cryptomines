import { writeFileSync } from 'node:fs';
import { runFeatureSimulation } from '../packages/math-engine/dist/feature-sim.js';
import { theoreticalBuyBonusRtp } from '../packages/math-engine/dist/theory/buy-bonus.js';
import { mathConfigurationHash } from '../packages/math-engine/dist/theory/config-hash.js';

const seed = 'phase5-signoff-v1';
const mineCount = 5;
const sizes = [100_000, 1_000_000, 20_000_000];
const strategies = [
  'cashoutFirstSafe',
  'continueUntilN',
  'vaultSeeking',
  'chainSeeking',
  'buyVault',
];

const simulations = {};
for (const rounds of sizes) {
  for (const strategy of strategies) {
    if (rounds === 20_000_000 && !['cashoutFirstSafe', 'buyVault', 'continueUntilN'].includes(strategy)) {
      continue;
    }
    const key = `${strategy}_${rounds}`;
    console.error(`running ${key}...`);
    simulations[key] = runFeatureSimulation({
      rounds,
      mineCount,
      seed,
      strategy,
      targetSafePicks: 5,
    });
  }
}

const out = {
  seed,
  configurationHash: mathConfigurationHash(mineCount),
  theoreticalBuyBonus: theoreticalBuyBonusRtp(1),
  simulations,
};
writeFileSync(new URL('../docs/phase5-sim-results.json', import.meta.url), JSON.stringify(out, null, 2));
console.log('written docs/phase5-sim-results.json');
