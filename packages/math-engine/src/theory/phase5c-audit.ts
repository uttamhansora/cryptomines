import { TARGET_RTP } from '@crypto-mines/shared';
import { buildRtpLadder } from './rtp-ladder.js';
import {
  buildDepthCashoutWithStreakTable,
  buildStreakChainStageTable,
} from './streak-chain-economics.js';
import {
  symbolChainDefinitionTable,
  estimateSymbolChainByDepth,
  symbolChainInterpretation,
} from './symbol-chain-economics.js';
import { estimateOrganicVaultByDepth } from './organic-vault-economics.js';
import { buildStackingScenarioGrid, stackingSummary, featureBudgetTable, maxWinPathAudit } from './stacking-audit.js';
import { theoreticalBuyBonusRtp } from './buy-bonus.js';
import { mathConfigurationHash, mathConfigurationPayload } from './config-hash.js';
import { GAME_VERSION } from '@crypto-mines/shared';

export const PHASE5C_SEED = 'phase5c-signoff-v1';
export const PHASE5C_SIM_VERSION = 'phase5c-audit-v1';

export function runPhase5cTheoreticalAudit(mineCount = 5, mcSamples = 100_000) {
  const baseLadder = buildRtpLadder(mineCount);
  const streakDepth = buildDepthCashoutWithStreakTable(mineCount, TARGET_RTP);
  const streakStages = buildStreakChainStageTable(mineCount);
  const symbolDefs = symbolChainDefinitionTable();
  const depthMax = Math.min(20, 25 - mineCount);
  const symbolMc = estimateSymbolChainByDepth(depthMax, mcSamples);
  const vaultMc = estimateOrganicVaultByDepth(mineCount, depthMax, mcSamples);
  const stacking = buildStackingScenarioGrid(mineCount);
  const stackSum = stackingSummary(mineCount, TARGET_RTP);
  const budgets = featureBudgetTable();
  const maxWin = maxWinPathAudit(mineCount);
  const buy = theoreticalBuyBonusRtp(1);

  const baseOnlyAboveTarget = baseLadder.filter((r) => r.rtpIfCashAtDepth > TARGET_RTP + 0.005);
  const streakAboveTarget = streakDepth.filter((r) => r.theoreticalRtpIfCashHere > TARGET_RTP + 0.005);

  return {
    generatedAt: new Date().toISOString(),
    gameVersion: GAME_VERSION,
    simulationVersion: PHASE5C_SIM_VERSION,
    seed: PHASE5C_SEED,
    configurationHash: mathConfigurationHash(mineCount),
    configuration: mathConfigurationPayload(mineCount),
    targetRtp: TARGET_RTP,
    chainInterpretation: symbolChainInterpretation(),
    baseLadder,
    streakStages,
    depthWithStreak: streakDepth,
    symbolChainDefinitions: symbolDefs,
    symbolChainMonteCarlo: symbolMc,
    organicVaultMonteCarlo: vaultMc,
    stackingScenarios: stacking,
    stackingSummary: stackSum,
    featureBudgets: budgets,
    buyBonus: buy,
    maxWin,
    findings: {
      baseOnlyDepthsAboveTargetRtp: baseOnlyAboveTarget.map((r) => r.depth),
      streakCashoutDepthsAboveTargetRtp: streakAboveTarget.map((r) => ({
        depth: r.depth,
        rtp: r.theoreticalRtpIfCashHere,
        excess: r.excessRtpVsTarget,
      })),
      stackingPathsAboveTarget: stackSum.pathsAboveTarget.map((p) => ({
        id: p.id,
        rtp: p.theoreticalRtp,
        depth: p.depth,
      })),
    },
  };
}
