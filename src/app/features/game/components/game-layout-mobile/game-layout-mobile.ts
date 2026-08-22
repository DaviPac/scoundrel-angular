import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { EquippedWeapon } from '../../../../core/models/card.model';
import { LogEntry } from '../../../../core/services/game-log.service';
import { ModalShell } from '../../../../shared/components/modal-shell/modal-shell';
import { RetroButton } from '../../../../shared/components/retro-button/retro-button';
import { RoomSlotVm } from '../../models/room-slot.vm';
import { AudioControls } from '../audio-controls/audio-controls';
import { HpPanel } from '../hp-panel/hp-panel';
import { LogPanel } from '../log-panel/log-panel';
import { Room } from '../room/room';
import { WeaponPanel } from '../weapon-panel/weapon-panel';

/** Escala das cartas da sala na UI mobile — maior que o padrão de desktop
 *  permite, já que o layout compacto libera espaço vertical. */
const MOBILE_CARD_SCALE = 1.15;

/**
 * Layout mobile dedicado: status enxuto no topo (vida + CORRER numa única
 * linha, arma isolada e maior), a mesa em foco com cartas grandes, e um
 * menu de pausa único que concentra registro, nova partida e áudio —
 * ações secundárias saem da tela principal para abrir espaço às cartas.
 *
 * Mesmo contrato de inputs/outputs do `GameLayoutDesktop` — só muda a
 * disposição; nenhum dos dois conhece o estado do jogo diretamente.
 */
@Component({
  selector: 'app-game-layout-mobile',
  imports: [RetroButton, AudioControls, HpPanel, LogPanel, ModalShell, Room, WeaponPanel],
  templateUrl: './game-layout-mobile.html',
  styleUrl: './game-layout-mobile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameLayoutMobile {
  readonly hp = input.required<number>();
  readonly maxHp = input.required<number>();
  readonly healPulsing = input(false);
  readonly weapon = input.required<EquippedWeapon | null>();
  readonly deckCount = input.required<number>();
  readonly roomNumber = input.required<number>();
  readonly canRun = input(false);
  readonly runDisabledReason = input('');
  readonly slots = input.required<RoomSlotVm[]>();
  readonly clickable = input(true);
  readonly roomHint = input('');
  readonly logEntries = input.required<readonly LogEntry[]>();

  readonly run = output<void>();
  readonly newGameRequested = output<void>();
  readonly cardPicked = output<number>();

  protected readonly cardScale = MOBILE_CARD_SCALE;

  /** Estado puramente visual (menu de pausa) — não pertence ao jogo. */
  protected readonly pauseOpen = signal(false);

  protected requestNewGame(): void {
    this.pauseOpen.set(false);
    this.newGameRequested.emit();
  }
}
