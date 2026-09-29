export interface RtpLadderRow {
    depth: number;
    survivalProbability: number;
    multiplierBook: number;
    multiplierDisplay: number;
    /** RTP if player always cashes exactly at this depth when reached */
    rtpIfCashAtDepth: number;
    houseEdgeIfCashAtDepth: number;
}
export declare function buildRtpLadder(mineCount: number): RtpLadderRow[];
export declare function rtpBaseSurvivalConstant(): number;
