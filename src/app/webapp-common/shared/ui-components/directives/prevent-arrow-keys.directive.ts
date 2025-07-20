import {Directive, HostListener} from '@angular/core';

@Directive({
  selector: '[smPreventArrowKeysDirective]',
})
export class PreventArrowKeysDirective {
  @HostListener('keydown', ['$event'])
  public onKeyDown(event: any): boolean {
    const arrowKeys = [37, 38, 39, 40];
    if (arrowKeys.includes(event.which)) {
      event.target.blur();
      return false;
    } else {
      return true;
    }

  }
}
