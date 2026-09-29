import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GAME_VERSION, TARGET_RTP } from '@crypto-mines/shared';
import { runFeatureSimulation } from '../feature-sim.js';
import { theoreticalBuyBonusRtp } from '../theory/buy-bonus.js';
import { mathConfigurationHash, mathConfigurationPayload } from '../theory/config-hash.js';
import { runPhase5cTheoreticalAudit, PHASE5C_SEED, PHASE5C_SIM_VERSION } from '../theory/phase5c-audit.js';
const args = process.argv.slice(2);
let outPath = '';
for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--out' && args[i + 1]) {
        outPath = args[i + 1];
        i += 1;
    }
}
const mineCount = 5;
const seed = PHASE5C_SEED;
const strategies20M = [
    'cashoutFirstSafe',
    'cashoutDepth2',
    'cashoutDepth3',
    'cashoutDepth5',
    'cashoutDepth10',
    'buyVault',
    'vaultSeeking',
    'chainSeeking',
];
const sampleSizes = [100_000, 1_000_000, 20_000_000];
const theoretical = runPhase5cTheoreticalAudit(mineCount);
const buyTheory = theoreticalBuyBonusRtp(1);
const simulations = {};
for (const rounds of sampleSizes) {
    const strategies = rounds === 20_000_000 ? strategies20M : strategies20M;
    for (const strategy of strategies) {
        const key = `${strategy}_${rounds}`;
        process.stderr.write(`phase5c sim ${key}\n`);
        simulations[key] = runFeatureSimulation({ rounds, mineCount, seed, strategy });
    }
}
function theoryRtpForStrategy(strategy) {
    if (strategy === 'buyVault')
        return buyTheory.buyRtp;
    if (strategy === 'cashoutFirstSafe')
        return TARGET_RTP;
    const depthRow = theoretical.depthWithStreak.find((r) => {
        if (strategy === 'cashoutDepth2')
            return r.depth === 2;
        if (strategy === 'cashoutDepth3')
            return r.depth === 3;
        if (strategy === 'cashoutDepth5')
            return r.depth === 5;
        if (strategy === 'cashoutDepth10')
            return r.depth === 10;
        return false;
    });
    if (depthRow) {
        return depthRow.theoreticalRtpIfCashHere;
    }
    return null;
}
const theoryVsSim = {};
for (const strategy of strategies20M) {
    const sim = simulations[`${strategy}_20_000_000`];
    const theory = theoryRtpForStrategy(strategy);
    if (!sim)
        continue;
    if (theory === null) {
        theoryVsSim[strategy] = {
            note: 'No closed-form strategy RTP (oracle pick order or feature-seeking); report simulation only.',
            simulatedRtp: sim.rtp,
            ci95: [sim.ci95Low, sim.ci95High],
        };
    }
    else {
        const diff = sim.rtp - theory;
        theoryVsSim[strategy] = {
            theoreticalRtp: theory,
            simulatedRtp: sim.rtp,
            difference: diff,
            relativeError: theory !== 0 ? diff / theory : null,
            withinCi: sim.ci95Low <= theory && theory <= sim.ci95High,
            ci95: [sim.ci95Low, sim.ci95High],
        };
    }
}
const report = {
    generatedAt: new Date().toISOString(),
    phase: '5C',
    gameVersion: GAME_VERSION,
    simulationVersion: PHASE5C_SIM_VERSION,
    targetRtpConfigured: TARGET_RTP,
    seed,
    configurationHash: mathConfigurationHash(mineCount),
    configuration: mathConfigurationPayload(mineCount),
    theoreticalAudit: theoretical,
    buyBonusTheory: buyTheory,
    simulations,
    theoryVsSimulation: theoryVsSim,
    labels: {
        strategyRtpDisclaimer: 'Each RTP is strategy-specific (named strategy). It is NOT the universal game RTP without an approved player model.',
        vaultSeekingNote: 'vaultSeeking reorders picks using full board symbol map (clairvoyant stress test, not uninformed player EV).',
        chainSeekingNote: 'chainSeeking reorders picks using full board symbol map (clairvoyant stress test, not uninformed player EV).',
    },
};
const json = JSON.stringify(report, null, 2);
if (outPath)
    writeFileSync(outPath, json);
else {
    const defaultOut = join(process.cwd(), '..', '..', 'docs', 'phase5c-sim-results.json');
    writeFileSync(defaultOut, json);
}
console.log(json);
