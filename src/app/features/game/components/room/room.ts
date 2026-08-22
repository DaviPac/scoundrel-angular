import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SPRITE_CONFIG } from '../../../../core/config/sprite.config';
import { RoomSlotVm } from '../../models/room-slot.vm';
import { PlayingCard } from '../playing-card/playing-card';

/** A sala: 4 slots fixos de carta sobre o feltro. Componente burro. */
@Component({
  selector: 'app-room',
  imports: [PlayingCard],
  templateUrl: './room.html',
  styleUrl: './room.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Room {
  readonly slots = input.required<RoomSlotVm[]>();
  readonly clickable = input(true);
  readonly hintText = input('');
  /** Escala das cartas; a UI mobile passa um valor menor para caber na tela. */
  readonly cardScale = input<number>(SPRITE_CONFIG.defaultScale);
  /** Espaçamento reduzido entre cartas, para telas estreitas. */
  readonly dense = input(false);

  readonly cardPicked = output<number>();

  protected readonly slotSize = computed(() => ({
    width: SPRITE_CONFIG.cardWidth * this.cardScale(),
    height: SPRITE_CONFIG.cardHeight * this.cardScale(),
  }));
}
