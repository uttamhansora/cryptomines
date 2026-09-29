import { describe, expect, it } from 'vitest';
import { BUY_VAULT_COST_MULTIPLIER, VAULT_BUY_CHEST_PAYOUT_BOOK, } from '@crypto-mines/shared';
import { theoreticalBuyBonusRtp, expectedBuyVaultPayoutBookRandomChest } from './theory/buy-bonus.js';
import { runFeatureSimulation } from './feature-sim.js';
import { createBuyVaultRound, pickVault } from './round-engine.js';
import { verifyOrganicVaultProbabilitiesSum } from './theory/vault-chests.js';
describe('buy bonus theory', () => {
    it('expected payout book equals mean buy chest payouts', () => {
        const mean = VAULT_BUY_CHEST_PAYOUT_BOOK.reduce((a, b) => a + b, 0) / VAULT_BUY_CHEST_PAYOUT_BOOK.length;
        expect(expectedBuyVaultPayoutBookRandomChest()).toBe(mean);
        expect(mean).toBe(4800);
    });
    it('theoretical buy RTP = E[payout] / buy cost ≈ 96%', () => {
        const t = theoreticalBuyBonusRtp(1);
        expect(t.buyCost).toBe(BUY_VAULT_COST_MULTIPLIER);
        expect(t.expectedPayout).toBeCloseTo(48, 6);
        expect(t.buyRtp).toBeCloseTo(0.96, 6);
    });
    it('organic vault chest probabilities sum to 1', () => {
        expect(verifyOrganicVaultProbabilitiesSum()).toBe(true);
    });
    it('simulated buy RTP converges near 96% (100k)', { timeout: 15_000 }, () => {
        const t = theoreticalBuyBonusRtp(1);
        const sim = runFeatureSimulation({
            rounds: 100_000,
            mineCount: 5,
            seed: 'buy-rtp-test-v2',
            strategy: 'buyVault',
        });
        expect(sim.buyRtp).toBeGreaterThan(t.buyRtp - 0.005);
        expect(sim.buyRtp).toBeLessThan(t.buyRtp + 0.005);
    });
    it('each buy chest payout is reachable', () => {
        for (const payoutBook of VAULT_BUY_CHEST_PAYOUT_BOOK) {
            let found = false;
            for (let i = 0; i < 300; i += 1) {
                let s = createBuyVaultRound({ seed: `buy-chest-${payoutBook}-${i}` });
                for (let v = 0; v < 5; v += 1) {
                    const r = pickVault(s, v);
                    if (!r.ok)
                        continue;
                    s = r.state;
                    if (s.payoutBook === payoutBook)
                        found = true;
                }
            }
            expect(found).toBe(true);
        }
    });
});
