import {Directive, Input} from '@angular/core';
import {MatTooltip} from '@angular/material/tooltip';
import {MAT_TOOLTIP_SCROLL_STRATEGY} from '@angular/material/tooltip';
import {scrollFactory} from '@common/shared/utils/scroll-factory';
import {Overlay} from '@angular/cdk/overlay';

export type TooltipTypeEnum = 'help' | 'validation' | 'error';

@Directive({
  selector: '[smTooltip]',
  providers: [{ provide: MAT_TOOLTIP_SCROLL_STRATEGY, useFactory: scrollFactory, deps: [Overlay] },],
})
export class TooltipDirective extends MatTooltip {

  @Input() set smTooltip(message) {
    this.tooltipClass = `sm-tooltip ${this.tooltipType} ${this.customClass}`;
    this.message = message;
  }

  @Input() tooltipType: TooltipTypeEnum = 'help';
  @Input() customClass: string;

  @Input() set showTooltip(show) {
    show && this.show();
  }
}
