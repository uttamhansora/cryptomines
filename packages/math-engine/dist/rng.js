import { createHash, randomBytes } from 'node:crypto';
/** Deterministic PRNG from seed string (simulation / reproducible rounds) */
export class SeededRng {
    state;
    constructor(seed) {
        this.state = createHash('sha256').update(seed).digest();
    }
    nextUint32() {
        this.state = createHash('sha256').update(this.state).digest();
        return this.state.readUInt32BE(0);
    }
    nextFloat() {
        return this.nextUint32() / 0x1_0000_0000;
    }
    shuffle(items) {
        const arr = [...items];
        for (let i = arr.length - 1; i > 0; i -= 1) {
            const j = this.nextUint32() % (i + 1);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
    pickWeighted(items, weights) {
        const total = weights.reduce((a, b) => a + b, 0);
        let r = this.nextFloat() * total;
        for (let i = 0; i < items.length; i += 1) {
            r -= weights[i];
            if (r <= 0)
                return items[i];
        }
        return items[items.length - 1];
    }
}
export function randomSeedHex() {
    return randomBytes(32).toString('hex');
}
