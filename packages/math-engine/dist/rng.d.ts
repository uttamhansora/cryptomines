/** Deterministic PRNG from seed string (simulation / reproducible rounds) */
export declare class SeededRng {
    private state;
    constructor(seed: string | Buffer);
    nextUint32(): number;
    nextFloat(): number;
    shuffle<T>(items: T[]): T[];
    pickWeighted<T>(items: T[], weights: number[]): T;
}
export declare function randomSeedHex(): string;
