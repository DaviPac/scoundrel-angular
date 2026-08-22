import { CardRole, Suit } from '../models/card.model';

/** Regras numéricas do Scoundrel — ajustes de balanceamento vivem aqui. */
export const GAME_RULES = {
  startHp: 20,
  maxHp: 20,
  roomSize: 4,
  /** Faixa de valores por naipe (copas/ouros sem figuras; A preto = 14). */
  suitRanges: {
    hearts: { min: 2, max: 10 },
    diamonds: { min: 2, max: 10 },
    spades: { min: 2, max: 14 },
    clubs: { min: 2, max: 14 },
  } satisfies Record<Suit, { min: number; max: number }>,
} as const;

export interface SuitMeta {
  readonly symbol: string;
  readonly name: string;
  readonly role: CardRole;
}

export const SUIT_META: Record<Suit, SuitMeta> = {
  hearts: { symbol: '♥', name: 'Copas', role: 'potion' },
  diamonds: { symbol: '♦', name: 'Ouros', role: 'weapon' },
  spades: { symbol: '♠', name: 'Espadas', role: 'monster' },
  clubs: { symbol: '♣', name: 'Paus', role: 'monster' },
};

export const RANK_LABELS: Record<number, string> = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
