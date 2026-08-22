import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { PlayingCard } from '../playing-card/playing-card';

/** Painel do baralho (pilha + contagem) e número da sala atual. */
@Component({
  selector: 'app-deck-panel',
  imports: [PlayingCard],
  templateUrl: './deck-panel.html',
  styleUrl: './deck-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckPanel {
  readonly deckCount = input.required<number>();
  readonly roomNumber = input.required<number>();
}
