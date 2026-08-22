import { inject, Injectable } from '@angular/core';
import { AudioService } from './audio.service';
import { GameEngineService } from './game-engine.service';

/**
 * Traduz eventos do engine em efeitos sonoros.
 * Mantém engine e áudio desacoplados: nenhum dos dois conhece o outro.
 * Basta injetar uma vez (na página do jogo) para ativar.
 */
@Injectable({ providedIn: 'root' })
export class GameSoundsService {
  private readonly audio = inject(AudioService);

  constructor() {
    inject(GameEngineService).events$.subscribe((event) => {
      switch (event.type) {
        case 'deal':
          event.slots.forEach((_, i) => this.audio.play('deal', i * 90)); // acompanha o stagger visual
          break;
        case 'run':
          this.audio.play('run');
          break;
        case 'heal':
          this.audio.play(event.wasted || event.amount === 0 ? 'waste' : 'heal');
          break;
        case 'equip':
          this.audio.play('equip');
          break;
        case 'fight':
          if (event.damage === 0) this.audio.play('block');
          else this.audio.play(event.withWeapon ? 'hitWeapon' : 'hitHands');
          break;
        case 'win':
          this.audio.duckMusic(4);
          this.audio.play('win', 300);
          break;
        case 'lose':
          this.audio.duckMusic(4);
          this.audio.play('lose', 300);
          break;
      }
    });
  }
}
