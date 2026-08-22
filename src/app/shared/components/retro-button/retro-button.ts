import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type RetroButtonVariant = 'danger' | 'primary' | 'neutral' | 'panel';

/** Botão chunky no estilo Balatro. Conteúdo via projeção; sublabel opcional. */
@Component({
  selector: 'app-retro-button',
  templateUrl: './retro-button.html',
  styleUrl: './retro-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetroButton {
  readonly variant = input<RetroButtonVariant>('danger');
  readonly size = input<'md' | 'sm'>('md');
  readonly disabled = input(false);
  readonly subLabel = input<string | null>(null);
  readonly hint = input('');

  readonly pressed = output<void>();
}
