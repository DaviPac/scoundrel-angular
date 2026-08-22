import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LogEntry } from '../../../../core/services/game-log.service';

/** Registro de eventos da partida (mais recente no topo). */
@Component({
  selector: 'app-log-panel',
  templateUrl: './log-panel.html',
  styleUrl: './log-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogPanel {
  readonly entries = input.required<readonly LogEntry[]>();
}
