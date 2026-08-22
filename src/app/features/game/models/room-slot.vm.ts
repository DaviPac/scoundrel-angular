import { Card } from '../../../core/models/card.model';
import { CardHint } from '../components/playing-card/playing-card';

/** View-model de um slot da sala, montado pela página do jogo. */
export interface RoomSlotVm {
  readonly card: Card | null;
  readonly hint: CardHint | null;
  /** Atraso (ms) da animação de compra; null = carta já estava na mesa. */
  readonly dealDelay: number | null;
}
