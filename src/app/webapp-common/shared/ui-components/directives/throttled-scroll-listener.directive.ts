import {Directive, EventEmitter, HostListener, Input, Output} from '@angular/core';

@Directive({
  selector: '[smThrottledScrollListener]',
})
export class ThrottledScrollListenerDirective {
  private isScrolling;
  @Input() throttleTime = 250;
  @Output() onScrollStopped = new EventEmitter();

  @HostListener('scroll', ['$event'])
  onScroll(event) {
      // Clear our timeout throughout the scroll
      clearTimeout( this.isScrolling );
      this.isScrolling = setTimeout(() => this.onScrollStopped.emit(event), this.throttleTime);
    }
}
