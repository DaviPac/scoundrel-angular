import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Card } from '../../../core/models/card.model';
import { AudioService } from '../../../core/services/audio.service';
import { GameEngineService } from '../../../core/services/game-engine.service';
import { GameLogService } from '../../../core/services/game-log.service';
import { GameSoundsService } from '../../../core/services/game-sounds.service';
import { ViewportService } from '../../../core/services/viewport.service';
import { ConfirmRestartModal } from '../components/confirm-restart-modal/confirm-restart-modal';
import { FightModal } from '../components/fight-modal/fight-modal';
import { GameLayoutDesktop } from '../components/game-layout-desktop/game-layout-desktop';
import { GameLayoutMobile } from '../components/game-layout-mobile/game-layout-mobile';
import { GameOverModal } from '../components/game-over-modal/game-over-modal';
import { CardHint } from '../components/playing-card/playing-card';
import { RoomSlotVm } from '../models/room-slot.vm';

type ModalKind = 'none' | 'fight' | 'confirm-restart' | 'game-over';

interface FightTarget {
  readonly slotIndex: number;
  readonly card: Card;
}

/**
 * Container da partida: liga o estado do engine aos componentes de
 * apresentação e traduz interações do usuário em ações do engine.
 */
@Component({
  selector: 'app-game-page',
  imports: [ConfirmRestartModal, FightModal, GameLayoutDesktop, GameLayoutMobile, GameOverModal],
  templateUrl: './game-page.html',
  styleUrl: './game-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamePage {
  protected readonly engine = inject(GameEngineService);
  protected readonly log = inject(GameLogService);
  protected readonly viewport = inject(ViewportService);
  private readonly audio = inject(AudioService);

  protected readonly modal = signal<ModalKind>('none');
  protected readonly fightTarget = signal<FightTarget | null>(null);
  protected readonly shaking = signal(false);
  protected readonly healPulsing = signal(false);

  /** Slot → atraso da animação de compra, atualizado a cada evento 'deal'. */
  private readonly dealDelays = signal<ReadonlyMap<number, number>>(new Map());

  protected readonly slots = computed<RoomSlotVm[]>(() =>
    this.engine.room().map((card, index) => ({
      card,
      hint: card ? this.hintFor(card) : null,
      dealDelay: this.dealDelays().get(index) ?? null,
    })),
  );

  protected readonly roomHint = computed(() => {
    const engine = this.engine;
    if (engine.over()) return engine.won() ? 'Masmorra concluída!' : 'Fim de jogo.';
    if (engine.deckCount() === 0) return 'Últimas cartas — resolva todas para vencer!';
    if (!engine.roomTouched()) {
      return engine.canRun()
        ? 'Encare a sala (escolha uma carta) ou corra.'
        : 'Você deve encarar esta sala.';
    }
    const left = engine.roomCards().length - 1;
    return left > 0 ? `Resolva mais ${left} carta${left > 1 ? 's' : ''} para avançar.` : '';
  });

  protected readonly runDisabledReason = computed(() => {
    if (this.engine.canRun()) return '';
    if (this.engine.ranLastRoom()) return 'Você correu da sala anterior — precisa encarar esta.';
    if (this.engine.roomTouched()) return 'A sala já foi tocada — não dá mais para correr.';
    return '';
  });

  protected readonly fightPreview = computed(() => {
    const target = this.fightTarget();
    return target ? this.engine.damagePreview(target.card) : null;
  });

  constructor() {
    inject(GameSoundsService); // ativa o mapeamento eventos → sons

    // Política de autoplay: o áudio só pode iniciar após um gesto do usuário
    const doc = inject(DOCUMENT);
    doc.addEventListener('pointerdown', () => this.audio.unlock(), { once: true });

    this.engine.events$.pipe(takeUntilDestroyed()).subscribe((event) => {
      switch (event.type) {
        case 'deal':
          this.dealDelays.set(new Map(event.slots.map((slot, i) => [slot, i * 90])));
          break;
        case 'heal':
          if (!event.wasted && event.amount > 0) this.pulseHp();
          break;
        case 'fight':
          if (event.damage > 0) this.shake();
          break;
        case 'win':
        case 'lose':
          setTimeout(() => this.modal.set('game-over'), 600);
          break;
      }
    });

    this.engine.newGame();
  }

  // ---------- Interações ----------

  protected onCardPicked(slotIndex: number): void {
    if (this.engine.over()) return;
    const card = this.engine.room()[slotIndex];
    if (!card) return;

    if (card.role === 'monster' && this.engine.weapon()) {
      this.audio.play('click');
      this.fightTarget.set({ slotIndex, card });
      this.modal.set('fight');
      return;
    }
    this.engine.resolveCard(slotIndex, false);
  }

  protected onFightChoice(useWeapon: boolean): void {
    const target = this.fightTarget();
    this.closeModal();
    if (target) this.engine.resolveCard(target.slotIndex, useWeapon);
  }

  protected onRun(): void {
    this.engine.run();
  }

  protected onNewGameClicked(): void {
    this.audio.play('click');
    const inProgress = !this.engine.over() && this.engine.roomNumber() > 1;
    if (inProgress) this.modal.set('confirm-restart');
    else this.restart();
  }

  protected restart(): void {
    this.closeModal();
    this.engine.newGame();
  }

  protected closeModal(): void {
    this.modal.set('none');
    this.fightTarget.set(null);
  }

  protected cancelFight(): void {
    this.audio.play('click');
    this.closeModal();
  }

  // ---------- Apoio ----------

  private hintFor(card: Card): CardHint {
    switch (card.role) {
      case 'potion': {
        if (this.engine.healedThisRoom()) return { text: 'sem efeito', kind: 'waste' };
        return { text: `cura +${this.engine.healPreview(card)}`, kind: 'heal' };
      }
      case 'weapon':
        return { text: `equipar (${card.value})`, kind: 'equip' };
      case 'monster': {
        const preview = this.engine.damagePreview(card);
        return {
          text:
            preview.weapon !== null
              ? `dano ${preview.weapon} ⚔ / ${preview.hands} ✊`
              : `dano ${preview.hands} ✊`,
          kind: 'damage',
        };
      }
    }
  }

  private shake(): void {
    this.shaking.set(false);
    requestAnimationFrame(() => this.shaking.set(true));
    setTimeout(() => this.shaking.set(false), 400);
  }

  private pulseHp(): void {
    this.healPulsing.set(false);
    requestAnimationFrame(() => this.healPulsing.set(true));
    setTimeout(() => this.healPulsing.set(false), 550);
  }
}
