import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GamePage } from './features/game/game-page/game-page';

@Component({
  selector: 'app-root',
  imports: [GamePage],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
