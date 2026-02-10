import {Directive, ElementRef, inject, NgZone, OnDestroy, OnInit, output} from '@angular/core';

@Directive({
  selector: '[smScrollEnd]'
})
export class ScrollEndDirective implements OnInit, OnDestroy {
  /**
   * Emits when the element becomes visible at the bottom of its scrollable container.
   * This is ideal for triggering "load more" or "infinite scroll" logic.
   */
  smScrollEnd = output<number>();
  private el = inject(ElementRef<HTMLElement>);
  private ngZone = inject(NgZone);
  private observer: IntersectionObserver | null = null;
  private counter = 1;

  ngOnInit() {
    // We run this outside of Angular's zone to avoid triggering
    // unnecessary change detection on intersection events.
    this.ngZone.runOutsideAngular(() => {
      const options: IntersectionObserverInit = {
        // Use the nearest scrollable ancestor as the root.
        // If null, the browser's viewport is used.
        root: this.getScrollableParent(this.el.nativeElement),
        rootMargin: '0px',
        // Fire when even 1px of the element becomes visible
        threshold: 0.01,
      };

      this.observer = new IntersectionObserver(([entry]) => {
        // entry.isIntersecting is true when the element enters the viewport
        if (entry.isIntersecting) {
          this.ngZone.run(() => {
            this.smScrollEnd.emit(++this.counter);
          });
        }
      }, options);

      // Start observing the element this directive is attached to
      this.observer.observe(this.el.nativeElement);
    });
  }

  ngOnDestroy() {
    // Clean up the observer when the directive is destroyed
    this.observer?.disconnect();
  }

  /**
   * Traverses up the DOM tree to find the first scrollable parent.
   * If no scrollable parent is found (or we reach the body/document),
   * it returns null, which defaults the IntersectionObserver's
   * root to the browser's viewport.
   */
  private getScrollableParent(element: HTMLElement | null): HTMLElement | null {
    if (!element || element === document.body) {
      return null;
    }

    const parent = element.parentElement;

    if (!parent) {
      return null;
    }

    const overflowY = window.getComputedStyle(parent).overflowY;
    const isScrollable = overflowY === 'auto' || overflowY === 'scroll';

    if (isScrollable) {
      return parent;
    } else {
      // Recurse up the tree
      return this.getScrollableParent(parent);
    }
  }
}
