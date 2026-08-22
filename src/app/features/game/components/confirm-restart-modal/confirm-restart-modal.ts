import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { ModalShell } from '../../../../shared/components/modal-shell/modal-shell';
import { RetroButton } from '../../../../shared/components/retro-button/retro-button';

/** Confirmação antes de abandonar uma partida em andamento. */
@Component({
  selector: 'app-confirm-restart-modal',
  imports: [ModalShell, RetroButton],
  templateUrl: './confirm-restart-modal.html',
  styleUrl: './confirm-restart-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmRestartModal {
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
