import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ModalShell } from '../../../../shared/components/modal-shell/modal-shell';
import { RetroButton } from '../../../../shared/components/retro-button/retro-button';

/** Tela de vitória/derrota com resumo da partida. */
@Component({
  selector: 'app-game-over-modal',
  imports: [ModalShell, RetroButton],
  templateUrl: './game-over-modal.html',
  styleUrl: './game-over-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameOverModal {
  readonly won = input.required<boolean>();
  readonly hp = input.required<number>();
  readonly roomNumber = input.required<number>();

  readonly restart = output<void>();

  readonly message = computed(() => {
    const rooms = `${this.roomNumber()} sala${this.roomNumber() > 1 ? 's' : ''}`;
    return this.won()
      ? `Você sobreviveu à masmorra com ${this.hp()} de vida, em ${rooms}.`
      : `A masmorra o venceu na sala ${this.roomNumber()}.`;
  });
}
