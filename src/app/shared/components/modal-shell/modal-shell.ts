import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Casca de modal: overlay escurecido + painel central animado.
 * O conteúdo é projetado; fechar clicando fora é opcional.
 */
@Component({
  selector: 'app-modal-shell',
  templateUrl: './modal-shell.html',
  styleUrl: './modal-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalShell {
  readonly dismissable = input(false);
  readonly dismissed = output<void>();

  onBackdropClick(event: MouseEvent): void {
    if (this.dismissable() && event.target === event.currentTarget) {
      this.dismissed.emit();
    }
  }
}
