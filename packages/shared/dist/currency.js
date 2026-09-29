import { API_SCALE, BOOK_SCALE } from './constants.js';
export function apiToDisplay(apiAmount) {
    return apiAmount / API_SCALE;
}
export function displayToApi(displayAmount) {
    return Math.floor(displayAmount * API_SCALE);
}
export function bookToMultiplier(bookAmount) {
    return bookAmount / BOOK_SCALE;
}
export function multiplierToBook(multiplier) {
    return Math.floor(multiplier * BOOK_SCALE);
}
export function winFromBookMultiplier(betDisplay, bookMultiplier) {
    return betDisplay * (bookMultiplier / BOOK_SCALE);
}
export function winFromBookMultiplierApi(betApi, bookMultiplier) {
    return Math.floor((betApi * bookMultiplier) / BOOK_SCALE);
}
