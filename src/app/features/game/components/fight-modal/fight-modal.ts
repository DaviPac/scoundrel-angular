import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Card } from '../../../../core/models/card.model';
import { ModalShell } from '../../../../shared/components/modal-shell/modal-shell';
import { RetroButton } from '../../../../shared/components/retro-button/retro-button';
import { PlayingCard } from '../playing-card/playing-card';

/** Escolha de combate: arma vs. mãos limpas, com prévia de dano. */
@Component({
  selector: 'app-fight-modal',
  imports: [ModalShell, RetroButton, PlayingCard],
  templateUrl: './fight-modal.html',
  styleUrl: './fight-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FightModal {
  readonly monster = input.required<Card>();
  /** Dano com a arma; null = arma gasta demais para este monstro. */
  readonly weaponDamage = input.required<number | null>();
  readonly handsDamage = input.required<number>();
  /** Limite atual da arma (para explicar por que está gasta). */
  readonly weaponLastKill = input.required<number | null>();

  readonly weaponChosen = output<void>();
  readonly handsChosen = output<void>();
  readonly cancelled = output<void>();

  readonly weaponUsable = computed(() => this.weaponDamage() !== null);
  readonly weaponLabel = computed(() => (this.weaponUsable() ? '⚔ USAR ARMA' : '⚔ ARMA GASTA'));
  readonly weaponSub = computed(() =>
    this.weaponUsable() ? `dano: ${this.weaponDamage()}` : `só vence < ${this.weaponLastKill()}`,
  );
}
