import { computed, inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { GAME_RULES } from '../config/game.config';
import { Card, EquippedWeapon, RoomSlot } from '../models/card.model';
import { GameEvent } from '../models/game-event.model';
import { DeckService } from './deck.service';

/**
 * Máquina de estado do Scoundrel. Lógica pura de regras:
 * não conhece DOM, áudio ou componentes. Expõe o estado como signals
 * (somente leitura) e notifica cada ação através de `events$`.
 */
@Injectable({ providedIn: 'root' })
export class GameEngineService {
  private readonly deckService = inject(DeckService);

  private readonly eventsSubject = new Subject<GameEvent>();
  /** Fluxo de eventos de jogo — consumido por sons, log e página. */
  readonly events$ = this.eventsSubject.asObservable();

  readonly maxHp = GAME_RULES.maxHp;

  private deck: Card[] = [];

  // ---- Estado observável ----
  private readonly _hp = signal<number>(GAME_RULES.startHp);
  private readonly _room = signal<RoomSlot[]>(Array(GAME_RULES.roomSize).fill(null));
  private readonly _weapon = signal<EquippedWeapon | null>(null);
  private readonly _discard = signal<Card[]>([]);
  private readonly _deckCount = signal(0);
  private readonly _roomNumber = signal(1);
  private readonly _over = signal(false);
  private readonly _won = signal(false);
  private readonly _ranLastRoom = signal(false);
  private readonly _roomTouched = signal(false);
  private readonly _healedThisRoom = signal(false);

  readonly hp = this._hp.asReadonly();
  readonly room = this._room.asReadonly();
  readonly weapon = this._weapon.asReadonly();
  readonly deckCount = this._deckCount.asReadonly();
  readonly roomNumber = this._roomNumber.asReadonly();
  readonly over = this._over.asReadonly();
  readonly won = this._won.asReadonly();
  readonly ranLastRoom = this._ranLastRoom.asReadonly();
  readonly roomTouched = this._roomTouched.asReadonly();
  readonly healedThisRoom = this._healedThisRoom.asReadonly();

  readonly roomCards = computed(() => this._room().filter((c): c is Card => c !== null));

  readonly canRun = computed(
    () =>
      !this._over() &&
      !this._ranLastRoom() &&
      !this._roomTouched() &&
      this.roomCards().length === GAME_RULES.roomSize &&
      this._deckCount() > 0,
  );

  // ---------- Consultas ----------

  weaponUsable(card: Card): boolean {
    const weapon = this._weapon();
    if (!weapon || card.role !== 'monster') return false;
    const last = weapon.kills.at(-1);
    return !last || card.value < last.value;
  }

  /** Prévia de dano: com as mãos e, se aplicável, com a arma. */
  damagePreview(card: Card): { hands: number; weapon: number | null } {
    return {
      hands: card.value,
      weapon: this.weaponUsable(card)
        ? Math.max(0, card.value - this._weapon()!.card.value)
        : null,
    };
  }

  healPreview(card: Card): number {
    if (this._healedThisRoom()) return 0;
    return Math.min(card.value, this.maxHp - this._hp());
  }

  // ---------- Ações ----------

  newGame(): void {
    this.deck = this.deckService.shuffle(this.deckService.buildDeck());
    this._hp.set(GAME_RULES.startHp);
    this._room.set(Array(GAME_RULES.roomSize).fill(null));
    this._weapon.set(null);
    this._discard.set([]);
    this._roomNumber.set(1);
    this._over.set(false);
    this._won.set(false);
    this._ranLastRoom.set(false);
    this._roomTouched.set(false);
    this._healedThisRoom.set(false);
    this.syncDeckCount();

    this.emit({ type: 'newGame' });
    this.fillRoom();
  }

  /** Correr: as 4 cartas vão para o fim do baralho e nova sala é formada. */
  run(): void {
    if (!this.canRun()) return;
    for (const card of this.roomCards()) this.deck.push(card);
    this._room.set(Array(GAME_RULES.roomSize).fill(null));
    this._ranLastRoom.set(true);
    this.syncDeckCount();

    this.emit({ type: 'run' });
    this.startNewRoom();
    this.fillRoom();
  }

  /** Resolve a carta do slot indicado; `useWeapon` só se aplica a monstros. */
  resolveCard(slotIndex: number, useWeapon = false): void {
    if (this._over()) return;
    const card = this._room()[slotIndex];
    if (!card) return;

    this._room.update((room) => room.map((c, i) => (i === slotIndex ? null : c)));
    this._roomTouched.set(true);
    if (card.role !== 'weapon') this.pushDiscard(card); // arma equipada fica em jogo

    switch (card.role) {
      case 'potion':
        this.usePotion(card);
        break;
      case 'weapon':
        this.equipWeapon(card);
        break;
      case 'monster':
        this.fightMonster(card, useWeapon);
        break;
    }

    this.afterResolve(card);
  }

  // ---------- Internos ----------

  private usePotion(card: Card): void {
    const wasted = this._healedThisRoom();
    let amount = 0;
    if (!wasted) {
      amount = Math.min(card.value, this.maxHp - this._hp());
      this._hp.update((hp) => hp + amount);
      this._healedThisRoom.set(true);
    }
    this.emit({ type: 'heal', card, amount, wasted });
  }

  private equipWeapon(card: Card): void {
    const previous = this._weapon()?.card ?? null;
    if (previous) this.pushDiscard(previous); // arma antiga (e seu histórico) vai fora
    this._weapon.set({ card, kills: [] });
    this.emit({ type: 'equip', card, previous });
  }

  private fightMonster(card: Card, wantWeapon: boolean): void {
    const withWeapon = wantWeapon && this.weaponUsable(card);
    const damage = withWeapon
      ? Math.max(0, card.value - this._weapon()!.card.value)
      : card.value;
    this._hp.update((hp) => hp - damage);
    if (withWeapon) {
      this._weapon.update((w) => w && { ...w, kills: [...w.kills, card] });
    }
    this.emit({ type: 'fight', card, damage, withWeapon });
  }

  private afterResolve(card: Card): void {
    if (this._hp() <= 0) {
      this._hp.set(0);
      this._over.set(true);
      this.emit({ type: 'lose', card });
      return;
    }
    const remaining = this.roomCards().length;
    if (remaining === 0 && this.deck.length === 0) {
      this._over.set(true);
      this._won.set(true);
      this.emit({ type: 'win' });
      return;
    }
    // Sala vencida: sobrou 1 carta e ainda há baralho → nova sala
    if (remaining === 1 && this.deck.length > 0) {
      this._ranLastRoom.set(false); // encarou a sala inteira, pode correr de novo
      this.startNewRoom();
      this.fillRoom();
    }
  }

  private startNewRoom(): void {
    this._roomNumber.update((n) => n + 1);
    this._roomTouched.set(false);
    this._healedThisRoom.set(false);
    this.emit({ type: 'newRoom', number: this._roomNumber() });
  }

  /** Preenche os slots vazios com cartas do topo do baralho. */
  private fillRoom(): void {
    const filledSlots: number[] = [];
    this._room.update((room) =>
      room.map((slot, i) => {
        if (slot !== null || this.deck.length === 0) return slot;
        filledSlots.push(i);
        return this.deck.shift()!;
      }),
    );
    this.syncDeckCount();
    this.emit({ type: 'deal', slots: filledSlots });
  }

  private pushDiscard(card: Card): void {
    this._discard.update((discard) => [...discard, card]);
  }

  private syncDeckCount(): void {
    this._deckCount.set(this.deck.length);
  }

  private emit(event: GameEvent): void {
    this.eventsSubject.next(event);
  }
}
