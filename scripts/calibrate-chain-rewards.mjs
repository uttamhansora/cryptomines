#!/usr/bin/env node
import { calibrateMaxChainRewards, verifyAllDepthsWithinCap } from '../packages/math-engine/dist/theory/chain-calibration.js';

const cfg = calibrateMaxChainRewards(5);
const check = verifyAllDepthsWithinCap(5, cfg);
console.log(JSON.stringify({ cfg, check }, null, 2));
