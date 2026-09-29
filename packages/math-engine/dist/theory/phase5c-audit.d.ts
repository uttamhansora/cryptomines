export declare const PHASE5C_SEED = "phase5c-signoff-v1";
export declare const PHASE5C_SIM_VERSION = "phase5c-audit-v1";
export declare function runPhase5cTheoreticalAudit(mineCount?: number, mcSamples?: number): {
    generatedAt: string;
    gameVersion: string;
    simulationVersion: string;
    seed: string;
    configurationHash: string;
    configuration: Record<string, unknown>;
    targetRtp: number;
    chainInterpretation: string;
    baseLadder: import("./rtp-ladder.js").RtpLadderRow[];
    streakStages: {
        stage: number;
        safePicksAtStage: number;
        incrementalBoostBook: number;
        incrementalBoostDisplay: number;
        reachProbability: number;
        incrementalRtpContribution: number;
    }[];
    depthWithStreak: import("./streak-chain-economics.js").DepthCashoutRow[];
    symbolChainDefinitions: import("./symbol-chain-economics.js").SymbolChainDefRow[];
    symbolChainMonteCarlo: import("./symbol-chain-economics.js").SymbolChainMonteCarloRow[];
    organicVaultMonteCarlo: import("./organic-vault-economics.js").OrganicVaultDepthRow[];
    stackingScenarios: import("./stacking-audit.js").StackingScenario[];
    stackingSummary: {
        highestEv: import("./stacking-audit.js").StackingScenario;
        lowestEv: import("./stacking-audit.js").StackingScenario;
        maxPayout: import("./stacking-audit.js").StackingScenario;
        pathsAboveTarget: import("./stacking-audit.js").StackingScenario[];
    };
    featureBudgets: {
        component: string;
        rtpContribution: string;
        note: string;
    }[];
    buyBonus: {
        buyCost: number;
        expectedPayout: number;
        buyRtp: number;
        payoutConvention: string;
        chestDistribution: {
            payoutBook: number;
            payoutTimesBet: number;
            probability: number;
        }[];
    };
    maxWin: {
        maxBook: number;
        maxDisplay: number;
        atCap: boolean;
        buyMaxBook: number;
    };
    findings: {
        baseOnlyDepthsAboveTargetRtp: number[];
        streakCashoutDepthsAboveTargetRtp: {
            depth: number;
            rtp: number;
            excess: number;
        }[];
        stackingPathsAboveTarget: {
            id: string;
            rtp: number;
            depth: number;
        }[];
    };
};
