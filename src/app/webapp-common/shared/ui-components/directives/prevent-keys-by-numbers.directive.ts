import {Directive, HostListener, input} from '@angular/core';

@Directive({
  selector: '[smPreventKeysByNumbersDirective]',
})
export class PreventKeysByNumbersDirective {
  keys = input<number[]>([])
  @HostListener('keydown', ['$event'])
  public onKeyDown(event: any): boolean {
    if (this.keys().includes(event.which)) {
      event.target.blur();
      return false;
    } else {
      return true;
    }

  }
}
