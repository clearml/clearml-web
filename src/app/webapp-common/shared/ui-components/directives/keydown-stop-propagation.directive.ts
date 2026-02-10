import {Directive, HostListener} from '@angular/core';

@Directive({
  selector: '[smKeyDownStopPropagation]',
  })
export class KeydownStopPropagationDirective {
  @HostListener('keydown', ['$event'])
  public onClick(event: any): void {
    event.stopPropagation();
  }
}
