import { API_SCALE, BOOK_SCALE } from './constants.js';

export function apiToDisplay(apiAmount: number): number {
  return apiAmount / API_SCALE;
}

export function displayToApi(displayAmount: number): number {
  return Math.floor(displayAmount * API_SCALE);
}

export function bookToMultiplier(bookAmount: number): number {
  return bookAmount / BOOK_SCALE;
}

export function multiplierToBook(multiplier: number): number {
  return Math.floor(multiplier * BOOK_SCALE);
}

export function winFromBookMultiplier(betDisplay: number, bookMultiplier: number): number {
  return betDisplay * (bookMultiplier / BOOK_SCALE);
}

export function winFromBookMultiplierApi(betApi: number, bookMultiplier: number): number {
  return Math.floor((betApi * bookMultiplier) / BOOK_SCALE);
}
