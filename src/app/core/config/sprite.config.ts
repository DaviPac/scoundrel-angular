import { Suit } from '../models/card.model';

/**
 * Mapeamento dos spritesheets do Balatro (cartas de 71x95 px).
 * `faces`: 13 colunas (2..10, J, Q, K, A) x 4 linhas (um naipe por linha).
 * `backs`: folha de versos/enhancers; usamos a base branca e o verso vermelho.
 */
export const SPRITE_CONFIG = {
  cardWidth: 71,
  cardHeight: 95,
  defaultScale: 2,
  sheets: {
    faces: 'assets/playing-cards.png',
    backs: 'assets/card-backs.png',
  },
  faces: { cols: 13, rows: 4 },
  backs: { cols: 7, rows: 5 },
  suitRow: { hearts: 0, clubs: 1, diamonds: 2, spades: 3 } satisfies Record<Suit, number>,
  cardBase: { col: 1, row: 0 },
  cardBack: { col: 0, row: 0 },
} as const;
