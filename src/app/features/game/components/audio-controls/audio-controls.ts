import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { AudioService } from '../../../../core/services/audio.service';
import { RetroButton } from '../../../../shared/components/retro-button/retro-button';

/** Toggles de música e efeitos. Fala apenas com o AudioService. */
@Component({
  selector: 'app-audio-controls',
  imports: [RetroButton],
  templateUrl: './audio-controls.html',
  styleUrl: './audio-controls.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AudioControls {
  protected readonly audio = inject(AudioService);
  /** Variante compacta para a UI mobile: botões só com ícone. */
  readonly compact = input(false);

  toggleMusic(): void {
    this.audio.setMusic(!this.audio.musicOn());
    this.audio.play('click');
  }

  toggleSfx(): void {
    this.audio.setSfx(!this.audio.sfxOn());
    this.audio.play('click');
  }
}
