import {Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Optional, Output} from '@angular/core';

export enum ScrollEndDirection {
  down = 'down',
  up = 'up',
}

@Directive({
  selector: '[smScrollEnd]',
})
export class ScrollEndDirective implements OnInit, OnDestroy {
  @Output() smScrollEnd = new EventEmitter<any>();

  @Input() rootMargin = '0px 0px 0px 0px';
  @Input() desiredDirection: ScrollEndDirection = ScrollEndDirection.down;

  observer: IntersectionObserver;
  previousEntry: IntersectionObserverEntry;
  scrollDirection: ScrollEndDirection;

  constructor(
    private el: ElementRef,
    @Optional() private scrollEndRoot: ScrollEndRootDirective,
  ) {
  }

  ngOnInit(): void {
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        this.scrollDirection = (this.previousEntry?.boundingClientRect.bottom === undefined || this.previousEntry?.boundingClientRect.bottom === 0 || this.previousEntry?.boundingClientRect.bottom > entry.boundingClientRect.bottom)
          ? ScrollEndDirection.down : ScrollEndDirection.up;

        if (!this.previousEntry?.isIntersecting && entry.isIntersecting && this.scrollDirection === this.desiredDirection) {
          // TODO: The 'emit' function requires a mandatory any argument
          this.smScrollEnd.emit();
        }

        this.previousEntry = entry;
      });
    }, {
      root: this.scrollEndRoot?.el.nativeElement,
      rootMargin: this.rootMargin,
    });

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer.disconnect();
  }
}

@Directive({
  selector: '[smScrollEndRoot]',
})
export class ScrollEndRootDirective {
  constructor(
    public el: ElementRef,
  ) {
  }
}
