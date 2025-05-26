import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  effect, ElementRef, inject,
  input,
  viewChildren
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ChipsComponent} from '@common/shared/ui-components/buttons/chips/chips.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {injectResize} from 'ngxtension/resize';
import {distinctUntilChanged, map} from 'rxjs/operators';

@Component({
    selector: 'sm-chips-list',
    templateUrl: './chips-list.component.html',
    styleUrls: ['./chips-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ChipsComponent,
        TooltipDirective
    ]
})
export class ChipsListComponent {
  private readonly ref = inject(ElementRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private overflowTrigger = injectResize()
    .pipe(
      map(res => res.width),
      distinctUntilChanged()
    );
  private resize = toSignal(this.overflowTrigger);

  items = input<string[]>();

  private chips = viewChildren(ChipsComponent);
  protected visibleLabelsLen = 0;
  protected hiddenLabels = [];
  protected measure = true;

  constructor() {
    effect(() => {
      if (this.chips() && this.resize()) {
        this.visibleLabelsLen = this.chips().length;
        this.measure = true;
        this.cdr.detectChanges();
        const chipLens = this.chips().map(chip => chip.elRef.nativeElement.offsetWidth);
        let totalWidth = 32;
        let len = 0
        const offsetWidth = this.ref.nativeElement.offsetWidth;
        while (totalWidth < offsetWidth) {
          totalWidth += chipLens[len];
          len++;
        }
        this.visibleLabelsLen = len - 2;
        this.hiddenLabels = this.chips()
          .filter((chip, index) => index > this.visibleLabelsLen)
          .map(chip => chip.label);
        this.measure = false;
        this.cdr.markForCheck();
      }
    });
  }
}
