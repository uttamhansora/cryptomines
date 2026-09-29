import { runSimulation } from '../simulate.js';
import { TARGET_RTP } from '@crypto-mines/shared';
const args = process.argv.slice(2);
let rounds = 1_000_000;
let mineCount = 5;
let seed = 'crypto-mines-signoff';
let strategy = 'cashoutFirstSafe';
for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--rounds' && args[i + 1]) {
        rounds = Number(args[i + 1]);
        i += 1;
    }
    else if (args[i] === '--mines' && args[i + 1]) {
        mineCount = Number(args[i + 1]);
        i += 1;
    }
    else if (args[i] === '--seed' && args[i + 1]) {
        seed = args[i + 1];
        i += 1;
    }
    else if (args[i] === '--strategy' && args[i + 1]) {
        strategy = args[i + 1];
        i += 1;
    }
}
const result = runSimulation({
    rounds,
    mineCount,
    seed,
    cashoutAggression: 0.12,
    strategy,
});
console.log(JSON.stringify({ targetRtp: TARGET_RTP, mineCount, ...result }, null, 2));
