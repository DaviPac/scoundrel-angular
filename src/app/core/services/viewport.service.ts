import { BreakpointObserver } from '@angular/cdk/layout';
import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

/** Abaixo disso, a página renderiza a UI mobile dedicada em vez da de desktop. */
const MOBILE_BREAKPOINT = '(max-width: 640px)';

/** Expõe o breakpoint atual como signal, para a UI escolher o layout dedicado. */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly isMobile = toSignal(
    this.breakpointObserver.observe(MOBILE_BREAKPOINT).pipe(map((state) => state.matches)),
    { initialValue: this.breakpointObserver.isMatched(MOBILE_BREAKPOINT) },
  );
}
