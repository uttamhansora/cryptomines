import type { CryptoSymbolId } from '@crypto-mines/shared';
export declare function updateChainProgress(progress: CryptoSymbolId[], symbol: CryptoSymbolId): {
    progress: CryptoSymbolId[];
    completedId?: string;
    boostBook?: number;
};
