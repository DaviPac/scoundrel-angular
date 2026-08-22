import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SPRITE_CONFIG } from '../../../../core/config/sprite.config';
import { Card } from '../../../../core/models/card.model';

export interface CardHint {
  readonly text: string;
  readonly kind: 'heal' | 'waste' | 'equip' | 'damage';
}

type LayerStyle = Record<string, string>;

/**
 * Uma carta renderizada a partir dos spritesheets do Balatro:
 * base branca + face (ou apenas o verso). Componente burro —
 * recebe tudo por input e emite `picked` ao ser clicada.
 */
@Component({
  selector: 'app-playing-card',
  templateUrl: './playing-card.html',
  styleUrl: './playing-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayingCard {
  readonly card = input<Card | null>(null);
  readonly variant = input<'face' | 'back'>('face');
  readonly scale = input<number>(SPRITE_CONFIG.defaultScale);
  readonly clickable = input(false);
  /** Atraso (ms) da animação de compra; null = sem animação. */
  readonly dealDelay = input<number | null>(null);
  readonly hint = input<CardHint | null>(null);

  readonly picked = output<void>();

  readonly width = computed(() => SPRITE_CONFIG.cardWidth * this.scale());
  readonly height = computed(() => SPRITE_CONFIG.cardHeight * this.scale());

  readonly baseStyle = computed<LayerStyle>(() => {
    const sprite = this.variant() === 'back' ? SPRITE_CONFIG.cardBack : SPRITE_CONFIG.cardBase;
    return this.layer('backs', sprite.col, sprite.row, SPRITE_CONFIG.backs);
  });

  readonly faceStyle = computed<LayerStyle | null>(() => {
    const card = this.card();
    if (this.variant() === 'back' || !card) return null;
    return this.layer(
      'faces',
      card.value - 2,
      SPRITE_CONFIG.suitRow[card.suit],
      SPRITE_CONFIG.faces,
    );
  });

  onClick(): void {
    if (this.clickable()) this.picked.emit();
  }

  private layer(
    sheet: keyof typeof SPRITE_CONFIG.sheets,
    col: number,
    row: number,
    grid: { cols: number; rows: number },
  ): LayerStyle {
    const w = this.width();
    const h = this.height();
    return {
      'background-image': `url("${SPRITE_CONFIG.sheets[sheet]}")`,
      'background-size': `${grid.cols * w}px ${grid.rows * h}px`,
      'background-position': `${-col * w}px ${-row * h}px`,
    };
  }
}
