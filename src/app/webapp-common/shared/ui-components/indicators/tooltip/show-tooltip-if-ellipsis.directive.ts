import {Directive, ElementRef, inject, input} from '@angular/core';
import {TooltipDirective} from './tooltip.directive';

@Directive({
  selector: '[smShowTooltipIfEllipsis]',
  host: {
    '(mouseenter)': 'setTooltipState()',
  },
})
export class ShowTooltipIfEllipsisDirective {
  private matTooltip = inject(TooltipDirective);
  private elementRef = inject(ElementRef<HTMLElement>);

  showAlwaysTooltip = input(false);
  smShowTooltipIfEllipsis = input<string | boolean>(undefined);
  private originalMessage: string;

  setTooltipState(): void {
    if (this.showAlwaysTooltip()) {
      return;
    }
    const element = this.elementRef.nativeElement;
    let isEllipsis: boolean;
    if(element.tagName==='MAT-OPTION' && element.firstElementChild?.tagName==='SPAN' || element.firstElementChild?.classList.contains('ellipsis')){
      isEllipsis = element.firstElementChild.scrollWidth > element.firstElementChild.clientWidth;
    } else {
      isEllipsis = element.scrollWidth > element.clientWidth;
    }

    if (this.smShowTooltipIfEllipsis() !== undefined && this.smShowTooltipIfEllipsis() !== '' && this.smShowTooltipIfEllipsis() !== false) {
      if (isEllipsis) {
        if (typeof this.smShowTooltipIfEllipsis() === 'string') {
          if (!this.originalMessage) {
            this.originalMessage = this.matTooltip.message;
          }
          this.matTooltip.message = this.smShowTooltipIfEllipsis() as string;
        }
        this.matTooltip.disabled = false;
      } else {
        if (this.originalMessage) {
          this.matTooltip.message = this.originalMessage;
        }
        this.matTooltip.disabled = false;
      }
    } else {
      this.matTooltip.disabled = !isEllipsis;
    }
  }
}
