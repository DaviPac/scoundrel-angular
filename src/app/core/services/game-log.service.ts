import { inject, Injectable, signal } from '@angular/core';
import { DeckService } from './deck.service';
import { GameEngineService } from './game-engine.service';

export type LogKind =
  | 'info'
  | 'room'
  | 'run'
  | 'heal'
  | 'waste'
  | 'equip'
  | 'damage'
  | 'block'
  | 'win'
  | 'lose';

export interface LogEntry {
  readonly text: string;
  readonly kind: LogKind;
}

const MAX_ENTRIES = 60;

/** Traduz eventos do engine em entradas de registro legíveis. */
@Injectable({ providedIn: 'root' })
export class GameLogService {
  private readonly deckService = inject(DeckService);

  private readonly _entries = signal<LogEntry[]>([]);
  readonly entries = this._entries.asReadonly();

  constructor() {
    inject(GameEngineService).events$.subscribe((event) => {
      const name = 'card' in event ? this.deckService.cardName(event.card) : '';
      switch (event.type) {
        case 'newGame':
          this._entries.set([]);
          this.add('Uma nova masmorra se abre…', 'info');
          break;
        case 'newRoom':
          this.add(`— Sala ${event.number} —`, 'room');
          break;
        case 'run':
          this.add('Você correu! As cartas voltam para o fundo do baralho.', 'run');
          break;
        case 'heal':
          if (event.wasted) this.add(`${name}: você já se curou nesta sala. Poção desperdiçada!`, 'waste');
          else if (event.amount === 0) this.add(`${name}: vida já cheia, nada a curar.`, 'waste');
          else this.add(`${name}: +${event.amount} de vida.`, 'heal');
          break;
        case 'equip':
          this.add(
            `Arma ${event.card.value} equipada` +
              (event.previous ? ` (a arma ${event.previous.value} foi descartada)` : '') +
              '.',
            'equip',
          );
          break;
        case 'fight': {
          const how = event.withWeapon ? 'com a arma' : 'com as próprias mãos';
          this.add(
            `Monstro ${name} enfrentado ${how}: -${event.damage} de vida.`,
            event.damage > 0 ? 'damage' : 'block',
          );
          break;
        }
        case 'win':
          this.add('A masmorra acabou. VITÓRIA!', 'win');
          break;
        case 'lose':
          this.add(`Você morreu para ${name}…`, 'lose');
          break;
      }
    });
  }

  private add(text: string, kind: LogKind): void {
    this._entries.update((entries) => [{ text, kind }, ...entries].slice(0, MAX_ENTRIES));
  }
}
