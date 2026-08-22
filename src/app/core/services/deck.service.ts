import { Injectable } from '@angular/core';
import { GAME_RULES, RANK_LABELS, SUIT_META } from '../config/game.config';
import { Card, Suit } from '../models/card.model';

/** Construção do baralho e utilidades de carta. Sem estado. */
@Injectable({ providedIn: 'root' })
export class DeckService {
  makeCard(suit: Suit, value: number): Card {
    const meta = SUIT_META[suit];
    return {
      id: `${suit}-${value}`,
      suit,
      value,
      role: meta.role,
      label: RANK_LABELS[value] ?? String(value),
      symbol: meta.symbol,
      suitName: meta.name,
    };
  }

  /** Monta o baralho de 44 cartas do Scoundrel. */
  buildDeck(): Card[] {
    const deck: Card[] = [];
    for (const [suit, range] of Object.entries(GAME_RULES.suitRanges)) {
      for (let value = range.min; value <= range.max; value++) {
        deck.push(this.makeCard(suit as Suit, value));
      }
    }
    return deck;
  }

  /** Fisher–Yates; retorna um novo array. */
  shuffle(cards: readonly Card[]): Card[] {
    const result = [...cards];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /** Nome amigável, ex.: "Q de Espadas". */
  cardName(card: Card): string {
    return `${card.label} de ${card.suitName}`;
  }
}
