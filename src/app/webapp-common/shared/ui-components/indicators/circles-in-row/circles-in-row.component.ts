import {ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, Input} from '@angular/core';
import {SlicePipe} from '@angular/common';
import {slice} from 'lodash-es';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {InitialsPipe} from '@common/shared/pipes/initials.pipe';
import {injectResize} from 'ngxtension/resize';
import {toSignal} from '@angular/core/rxjs-interop';

export interface CirclesInRowInterface {
  name?: string;
  initials?: string;
  class?: string;
  iconClass?: string;
}

const CIRCLE_SIZE = 32;
const CIRCLE_OVERLAP = 6;
const CIRCLE_STEP = CIRCLE_SIZE - CIRCLE_OVERLAP;

@Component({
  selector: 'sm-circles-in-row',
  templateUrl: './circles-in-row.component.html',
  styleUrls: ['./circles-in-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TooltipDirective,
    InitialsPipe,
    SlicePipe
  ]
})
export class CirclesInRowComponent {
  private el = inject(ElementRef);
  private resize = toSignal(injectResize());

  data = input<CirclesInRowInterface[]>([]);
  stagger = input<string | number>();
  isStagger = input<boolean>();

  @Input() set staggerAmount(staggerAmount: number) {
    this._staggerAmount = new Array(staggerAmount).map((x, index) => index);
  }

  limit = input<number>();

  effectiveLimit = computed(() => {
    const explicit = this.limit();
    if (explicit != null) {
      return explicit;
    }
    this.resize();
    const width = this.el.nativeElement.offsetWidth;
    const total = this.data().length;
    if (width <= 0) {
      return total;
    }
    const allFitWidth = CIRCLE_STEP * total + CIRCLE_OVERLAP;
    if (allFitWidth <= width) {
      return total;
    }
    const fitWithRest = Math.floor((width - CIRCLE_OVERLAP) / CIRCLE_STEP) - 1;
    return Math.max(1, fitWithRest);
  });

  restTooltip = computed(() => {
    return this.data().slice(this.effectiveLimit()).map((x) => x.name).join('\n');
  });

  get staggerArray() {
    return this._staggerAmount;
  }

  private _staggerAmount: any[] = [];

  protected readonly slice = slice;
}
