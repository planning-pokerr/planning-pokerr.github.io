import type { Deck, DeckId } from './types.js';

export const DECKS: Record<DeckId, Deck> = {
  fibonacci: {
    id: 'fibonacci',
    name: 'Fibonacci',
    cards: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'],
    isNumeric: true,
  },
  tshirt: {
    id: 'tshirt',
    name: 'T-Shirt',
    cards: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕'],
    isNumeric: false,
  },
  'powers-of-2': {
    id: 'powers-of-2',
    name: 'Powers of 2',
    cards: ['1', '2', '4', '8', '16', '32', '64', '?', '☕'],
    isNumeric: true,
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    cards: [],
    isNumeric: false, // updated by host at creation time
  },
};

export function getDeck(deckId: DeckId, customCards?: string[]): Deck {
  const deck = DECKS[deckId];
  if (deckId === 'custom' && customCards) {
    const numericCards = customCards.filter((c) => !isNaN(Number(c)));
    return {
      ...deck,
      cards: customCards,
      isNumeric: numericCards.length > 0 && numericCards.length === customCards.filter((c) => c !== '?' && c !== '☕').length,
    };
  }
  return deck;
}
