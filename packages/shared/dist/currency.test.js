import { describe, expect, it } from 'vitest';
import { apiToDisplay, displayToApi, bookToMultiplier, winFromBookMultiplierApi, } from './currency.js';
import { BOOK_SCALE, API_SCALE } from './constants.js';
describe('currency scaling', () => {
    it('converts API wallet scale', () => {
        expect(apiToDisplay(1_000_000)).toBe(1);
        expect(displayToApi(2.5)).toBe(2_500_000);
    });
    it('converts book multiplier scale', () => {
        expect(bookToMultiplier(150)).toBe(1.5);
    });
    it('computes win without mixing scales', () => {
        const betApi = 1_000_000;
        const bookMult = 250;
        expect(winFromBookMultiplierApi(betApi, bookMult)).toBe(Math.floor((betApi * bookMult) / BOOK_SCALE));
        expect(winFromBookMultiplierApi(betApi, bookMult)).not.toBe(Math.floor((betApi * bookMult) / API_SCALE));
    });
});
