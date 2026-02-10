import {ChangeDetectionStrategy, Component, computed, input, Input} from '@angular/core';
import {SlicePipe} from '@angular/common';
import {slice} from 'lodash-es';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {InitialsPipe} from '@common/shared/pipes/initials.pipe';

export interface CirclesInRowInterface {
  name?: string;
  initials?: string;
  class?: string;
  iconClass?: string;
}

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

  data = input<CirclesInRowInterface[]>([]);
  stagger = input<string | number>();
  isStagger = input<boolean>();

  @Input() set staggerAmount(staggerAmount: number) {
    this._staggerAmount = new Array(staggerAmount).map((x, index) => index);
  }


  limit = input<number>();
  restTooltip= computed(() => {
    return this.data().slice(this.limit()).map((x) => x.name).join('\n');
  });

  get staggerArray() {
    return this._staggerAmount;
  }

  private _staggerAmount: any[] = [];

  protected readonly slice = slice;
}
