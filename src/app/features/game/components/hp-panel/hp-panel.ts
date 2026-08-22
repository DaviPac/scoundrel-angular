import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Painel de vida com barra e destaque de vida baixa. */
@Component({
  selector: 'app-hp-panel',
  templateUrl: './hp-panel.html',
  styleUrl: './hp-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HpPanel {
  readonly hp = input.required<number>();
  readonly maxHp = input.required<number>();
  /** Pulsa o painel (feedback de cura). */
  readonly pulsing = input(false);
  /** Variante compacta para a UI mobile (sem rótulo, mais fina). */
  readonly compact = input(false);

  readonly percent = computed(() => (this.hp() / this.maxHp()) * 100);
  readonly low = computed(() => this.hp() <= 5);
}
