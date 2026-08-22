import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SPRITE_CONFIG } from '../../../../core/config/sprite.config';
import { Card, EquippedWeapon } from '../../../../core/models/card.model';
import { PlayingCard } from '../playing-card/playing-card';

/** Um monstro derrotado, já posicionado na pilha visual sobre a arma. */
interface PileCard {
  readonly id: string;
  readonly card: Card;
  readonly rotation: number;
  readonly offsetX: number;
  readonly offsetY: number;
}

/**
 * Pequeno "visual" de pilha (rotação + deslocamento) que cicla independente
 * de quantas vitórias a arma acumular — evita que a pilha cresça sem limite
 * e continue parecendo uma pilha jogada à mão, não uma fileira organizada.
 * `dy` é uma fração do espalhamento vertical total de cada variante.
 */
const PILE_LOOK = [
  { dx: 3, dy: 0.35, rot: 8 },
  { dx: -4, dy: 0.55, rot: -10 },
  { dx: 2, dy: 0.75, rot: 6 },
  { dx: -3, dy: 0.95, rot: -7 },
  { dx: 4, dy: 0.6, rot: 11 },
  { dx: -2, dy: 0.85, rot: -5 },
] as const;

/** Espalhamento vertical adicional da pilha, em px, além do desvio do
 *  índice de canto. No mobile é maior de propósito: a última carta deve
 *  transbordar a borda do painel (efeito 3D). */
const PILE_SPREAD = { compact: 46, full: 20 };

/**
 * Fração da altura da carta ocupada pelo índice de canto (número + naipe,
 * medido no spritesheet: ~5%–24% da altura). No desktop a pilha começa
 * deslocada para baixo por isso, para nunca cobrir o número da arma — no
 * mobile o painel já é pequeno o bastante para o desvio atrapalhar mais do
 * que ajudar, então a pilha volta a nascer rente à carta.
 */
const CORNER_CLEARANCE_RATIO = 0.2;

/** Painel da arma equipada, com a pilha de monstros derrotados com ela. */
@Component({
  selector: 'app-weapon-panel',
  imports: [PlayingCard],
  templateUrl: './weapon-panel.html',
  styleUrl: './weapon-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeaponPanel {
  readonly weapon = input.required<EquippedWeapon | null>();
  /** Variante compacta para a UI mobile: painel em linha, pilha maior transborda a borda. */
  readonly compact = input(false);

  protected readonly cardScale = computed(() => (this.compact() ? 0.85 : 1.1));

  readonly info = computed(() => {
    const weapon = this.weapon();
    if (!weapon) return '';
    const last = weapon.kills.at(-1);
    return !last
      ? `Poder ${weapon.card.value} · nova em folha`
      : `Poder ${weapon.card.value} · só vence monstros < ${last.value}`;
  });

  /** Cartas dos monstros derrotados, cada uma com rotação/deslocamento
   *  próprios — a mais recente fica por cima e mais deslocada. */
  readonly pile = computed<PileCard[]>(() => {
    const kills = this.weapon()?.kills ?? [];
    const spread = this.compact() ? PILE_SPREAD.compact : PILE_SPREAD.full;
    const cornerClearance = this.compact()
      ? 0
      : SPRITE_CONFIG.cardHeight * this.cardScale() * CORNER_CLEARANCE_RATIO;
    return kills.map((card, i) => {
      const look = PILE_LOOK[i % PILE_LOOK.length];
      return {
        id: card.id,
        card,
        rotation: look.rot,
        offsetX: look.dx,
        offsetY: cornerClearance + look.dy * spread,
      };
    });
  });
}
