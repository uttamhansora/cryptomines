/** Safe-reveal streak chain — milestones unlock separate chain bonus book (Phase 5D). */
export declare function applyStreakChain(safePicks: number, chainBonusBook: number): {
    chainStreak: number;
    chainStreakComplete: boolean;
    chainBonusBook: number;
    chainRewardUnlockedBook?: number;
    chainRewardStage?: 3 | 5;
};
