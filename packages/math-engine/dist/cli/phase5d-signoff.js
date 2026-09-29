import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GAME_VERSION, TARGET_RTP } from '@crypto-mines/shared';
import { runFeatureSimulation } from '../feature-sim.js';
import { theoreticalBuyBonusRtp } from '../theory/buy-bonus.js';
import { mathConfigurationHash, mathConfigurationPayload } from '../theory/config-hash.js';
import { verifyAllDepthsWithinCap } from '../theory/chain-calibration.js';
const seed = 'phase5d-signoff-v1';
const mineCount = 5;
const strategies = [
    'cashoutFirstSafe',
    'cashoutDepth2',
    'cashoutDepth3',
    'cashoutDepth5',
    'cashoutDepth10',
    'buyVault',
];
const roundsFilter = process.env.PHASE5D_ROUNDS;
const sampleSizes = roundsFilter
    ? roundsFilter.split(',').map(Number)
    : [100_000, 1_000_000, 20_000_000];
const out = join(process.cwd(), '..', '..', 'docs', 'phase5d-sim-results.json');
const simulations = {};
function writeReport(partial = false) {
    const report = {
        generatedAt: new Date().toISOString(),
        phase: '5D',
        partial,
        gameVersion: GAME_VERSION,
        seed,
        configurationHash: mathConfigurationHash(mineCount),
        configuration: mathConfigurationPayload(mineCount),
        targetRtpConfigured: TARGET_RTP,
        theoreticalDepthCap: verifyAllDepthsWithinCap(mineCount),
        buyBonus: theoreticalBuyBonusRtp(1),
        simulations: { ...simulations },
        labels: {
            strategyRtpDisclaimer: 'Strategy-specific RTP — not universal game RTP.',
            playerStrategies: strategies,
        },
    };
    writeFileSync(out, JSON.stringify(report, null, 2));
}
for (const rounds of sampleSizes) {
    for (const strategy of strategies) {
        const key = `${strategy}_${rounds}`;
        process.stderr.write(`phase5d sim ${key}\n`);
        simulations[key] = runFeatureSimulation({ rounds, mineCount, seed, strategy });
        writeReport(true);
    }
}
writeReport(false);
console.log(JSON.stringify({ ok: true, out }, null, 2));
