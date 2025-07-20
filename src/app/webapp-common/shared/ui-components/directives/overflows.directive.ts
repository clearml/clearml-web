import {AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, Output} from '@angular/core';
import {fromEvent, Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';

const isElementOverflow = ({clientWidth, clientHeight, scrollWidth, scrollHeight}) =>
  Math.abs(scrollHeight - clientHeight) > 10 || Math.abs(scrollWidth - clientWidth) > 10;

@Directive({
  selector: '[smOverflows]',
})
export class OverflowsDirective implements AfterViewInit, OnDestroy {
  @Output() smOverflows = new EventEmitter<boolean>();

  @Input() overflowDelay = 100;

  @Input() set overflowTrigger(name) {
    this.isEllipsis();
  }

  private sub = new Subscription();
  private readonly host: Element;
  public lastResult;

  constructor(_host: ElementRef) {
    this.host = _host.nativeElement;
  }

  ngAfterViewInit(): void {
    this.sub.add(fromEvent(window, 'resize')
      .pipe(debounceTime(50))
      .subscribe(() => this.isEllipsis()));

    window.setTimeout(() => this.isEllipsis(), this.overflowDelay);
  }

  private isEllipsis() {
    const hasOverflow = isElementOverflow(this.host);
    if (hasOverflow !== this.lastResult) {
      this.smOverflows.emit(hasOverflow);
      this.lastResult = hasOverflow;
    }
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
