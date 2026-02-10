import {Directive, HostListener} from '@angular/core';

@Directive({
  selector: '[smClickStopPropagation]',
  })
export class ClickStopPropagationDirective {
  @HostListener('click', ['$event'])
  @HostListener('mousedown', ['$event'])
  public onClick(event: MouseEvent) {
    event.stopPropagation();
  }
}
