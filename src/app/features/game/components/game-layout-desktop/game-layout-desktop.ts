import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { EquippedWeapon } from '../../../../core/models/card.model';
import { LogEntry } from '../../../../core/services/game-log.service';
import { RetroButton } from '../../../../shared/components/retro-button/retro-button';
import { RoomSlotVm } from '../../models/room-slot.vm';
import { AudioControls } from '../audio-controls/audio-controls';
import { DeckPanel } from '../deck-panel/deck-panel';
import { HpPanel } from '../hp-panel/hp-panel';
import { LogPanel } from '../log-panel/log-panel';
import { Room } from '../room/room';
import { WeaponPanel } from '../weapon-panel/weapon-panel';

/**
 * Layout de desktop: barra lateral com todos os painéis sempre visíveis
 * + mesa central. Puramente apresentacional — todo o estado vem de fora.
 */
@Component({
  selector: 'app-game-layout-desktop',
  imports: [RetroButton, AudioControls, DeckPanel, HpPanel, LogPanel, Room, WeaponPanel],
  templateUrl: './game-layout-desktop.html',
  styleUrl: './game-layout-desktop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameLayoutDesktop {
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
}
