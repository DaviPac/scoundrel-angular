import { Card } from './card.model';

/**
 * Eventos emitidos pelo engine a cada ação. A UI (sons, log, animações)
 * reage a eles sem que o engine conheça seus consumidores.
 */
export type GameEvent =
  | { type: 'newGame' }
  | { type: 'deal'; slots: number[] }
  | { type: 'newRoom'; number: number }
  | { type: 'run' }
  | { type: 'heal'; card: Card; amount: number; wasted: boolean }
  | { type: 'equip'; card: Card; previous: Card | null }
  | { type: 'fight'; card: Card; damage: number; withWeapon: boolean }
  | { type: 'win' }
  | { type: 'lose'; card: Card };
