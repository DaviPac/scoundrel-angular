export type Suit = 'hearts' | 'diamonds' | 'spades' | 'clubs';

export type CardRole = 'potion' | 'weapon' | 'monster';

export interface Card {
  readonly id: string;
  readonly suit: Suit;
  readonly value: number;
  readonly role: CardRole;
  /** Rótulo exibido: 2..10, J, Q, K, A. */
  readonly label: string;
  readonly symbol: string;
  readonly suitName: string;
}

/** Um slot da sala: carta ou vazio. */
export type RoomSlot = Card | null;

export interface EquippedWeapon {
  readonly card: Card;
  /** Monstros derrotados com esta arma, em ordem cronológica; vazio = arma nova. */
  readonly kills: readonly Card[];
}
