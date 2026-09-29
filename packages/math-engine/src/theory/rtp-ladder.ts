import { BOOK_SCALE } from '@crypto-mines/shared';
import {
  getMultiplierBook,
  survivalProbability,
  RTP_BASE_SURVIVAL,
} from '../multipliers.js';

export interface RtpLadderRow {
  depth: number;
  survivalProbability: number;
  multiplierBook: number;
  multiplierDisplay: number;
  /** RTP if player always cashes exactly at this depth when reached */
  rtpIfCashAtDepth: number;
  houseEdgeIfCashAtDepth: number;
}

export function buildRtpLadder(mineCount: number): RtpLadderRow[] {
  const maxSafe = 25 - mineCount;
  const rows: RtpLadderRow[] = [];
  for (let k = 1; k <= maxSafe; k += 1) {
    const pReach = survivalProbability(mineCount, k);
    const multBook = getMultiplierBook(mineCount, k);
    const mult = multBook / BOOK_SCALE;
    const rtp = pReach * mult;
    rows.push({
      depth: k,
      survivalProbability: pReach,
      multiplierBook: multBook,
      multiplierDisplay: mult,
      rtpIfCashAtDepth: rtp,
      houseEdgeIfCashAtDepth: 1 - rtp,
    });
  }
  return rows;
}

export function rtpBaseSurvivalConstant(): number {
  return RTP_BASE_SURVIVAL;
}
