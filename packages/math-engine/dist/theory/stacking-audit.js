import { BOOK_SCALE, CHAIN_DEFINITIONS, MAX_WIN_MULTIPLIER, TARGET_RTP } from '@crypto-mines/shared';
import { getMultiplierBook, survivalProbability, capMultiplierBook } from '../multipliers.js';
import { chainBonusBookAtCashoutDepth, defaultChainRewardConfig, } from './chain-calibration.js';
import { expectedOrganicVaultPayoutBook } from './organic-vault-economics.js';
import { theoreticalBuyBonusRtp } from './buy-bonus.js';
function totalPayoutAtDepth(mineCount, depth, symbolBoost, vault) {
    const cfg = defaultChainRewardConfig();
    const base = getMultiplierBook(mineCount, depth);
    const chain = chainBonusBookAtCashoutDepth(depth, cfg) + symbolBoost;
    let vaultPay = 0;
    if (vault) {
        vaultPay = expectedOrganicVaultPayoutBook(base);
    }
    const total = capMultiplierBook((vault ? vaultPay : base) + chain);
    return { base, chain, vault: vaultPay, total };
}
export function buildStackingScenarioGrid(mineCount) {
    const maxChainBoost = Math.max(...CHAIN_DEFINITIONS.map((d) => d.boostBook));
    const depths = [1, 2, 3, 4, 5, 8, 10, 15, 20].filter((d) => d <= 25 - mineCount);
    const scenarios = [];
    const variants = [
        { sym: 0, vault: false, label: 'base+chainStreak' },
        { sym: maxChainBoost, vault: false, label: 'base+chainStreak+maxSymbolChain' },
        { sym: maxChainBoost, vault: true, label: 'base+chains+organicVaultOnBase' },
    ];
    for (const d of depths) {
        for (const v of variants) {
            const parts = totalPayoutAtDepth(mineCount, d, v.sym, v.vault);
            const p = survivalProbability(mineCount, d);
            const rtp = (p * parts.total) / BOOK_SCALE;
            scenarios.push({
                id: `d${d}_${v.label}`,
                description: `Cash at depth ${d} with ${v.label}`,
                depth: d,
                symbolChainBoostBook: v.sym,
                includesVault: v.vault,
                baseMultiplierBook: parts.base,
                chainBonusBook: parts.chain,
                vaultPayoutBook: v.vault ? parts.vault : 0,
                totalPayoutBook: parts.total,
                survivalProbability: p,
                theoreticalRtp: rtp,
            });
        }
    }
    return scenarios;
}
export function stackingSummary(mineCount, targetRtp = TARGET_RTP) {
    const grid = buildStackingScenarioGrid(mineCount);
    const sortedRtp = [...grid].sort((a, b) => b.theoreticalRtp - a.theoreticalRtp);
    return {
        highestEv: sortedRtp[0],
        lowestEv: sortedRtp[sortedRtp.length - 1],
        maxPayout: [...grid].sort((a, b) => b.totalPayoutBook - a.totalPayoutBook)[0],
        pathsAboveTarget: grid.filter((g) => g.theoreticalRtp > targetRtp + 1e-9),
    };
}
export function featureBudgetTable() {
    const buy = theoreticalBuyBonusRtp(1);
    const cfg = defaultChainRewardConfig();
    return [
        {
            component: 'Base mines ladder',
            rtpContribution: `~${(cfg.baseRtpSlice * 100).toFixed(2)}% ladder slice (calibrated for Stake cross-mode RTP)`,
            note: 'Conditional per depth; chain/vault funded separately',
        },
        {
            component: 'Chain streak bonus',
            rtpContribution: `Budget ${(0.02 * 100).toFixed(0)}% — rewards +${cfg.streakRewardPick3Book}/+${cfg.streakRewardPick5IncrementalBook} book`,
            note: 'Separate chainBonusBook',
        },
        {
            component: 'Symbol chains',
            rtpContribution: 'Stochastic chainBonusBook (+150/+250/+350)',
            note: 'Not applied to base multiplierBook',
        },
        {
            component: 'Organic vault',
            rtpContribution: 'Budget ~1% — multiplies base only',
            note: 'vaultPayoutBook + chainBonusBook on cashout',
        },
        {
            component: 'Buy vault',
            rtpContribution: `${(buy.buyRtp * 100).toFixed(2)}% standalone`,
            note: 'Unchanged Phase 5B',
        },
    ];
}
export function maxWinPathAudit(mineCount) {
    const maxDepth = 25 - mineCount;
    const maxChain = Math.max(...CHAIN_DEFINITIONS.map((d) => d.boostBook));
    const parts = totalPayoutAtDepth(mineCount, maxDepth, maxChain, true);
    const buyMax = Math.max(...theoreticalBuyBonusRtp(1).chestDistribution.map((c) => c.payoutBook));
    const cap = MAX_WIN_MULTIPLIER * BOOK_SCALE;
    return {
        maxBook: parts.total,
        maxDisplay: parts.total / BOOK_SCALE,
        atCap: parts.total >= cap,
        buyMaxBook: buyMax,
    };
}
