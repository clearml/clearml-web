import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  Renderer2
} from '@angular/core';


@Directive({
  selector: '[smHesitate]',
  exportAs: 'hesitate',
  })
export class HesitateDirective implements AfterViewInit, OnDestroy {
  @Input() delay = 2000;
  @Input() action = 'enter' as 'enter' | 'leave';
  @Output() smHesitate = new EventEmitter<void>();

  private listeners = null as (() => void)[];
  private timer: number;
  public hesitateStatus = false;

  // I initialize the hesitate directive.
  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private zone: NgZone
  ) {}

  // I cancel any pending hesitation timer.
  // --
  // NOTE: This is method is PUBLIC so that it may be consumed as part of the EXPORTED
  // API in the View of the calling context.
  public cancel(): void {
    this.hesitateStatus = false;
    window.clearTimeout( this.timer );
  }

  // I get called once when the host element is being unmounted.
  public ngOnDestroy(): void {
    this.cancel();
    // If we have event-handler bindings, unbind them all.
    if ( this.listeners ) {
      for ( const listener of this.listeners ) {
        listener();
      }
    }
  }

  // I get called once after the host element has been mounted and the inputs have been
  // bound for the first time.
  public ngAfterViewInit(): void {
    // Instead of using host bindings, which would trigger change-detection digests
    // when the events are triggered, we want to drop-down out of the core NgZone so
    // that we can setup our event-handlers without adding processing overhead.
    if (this.action === 'enter') {
      this.zone.runOutsideAngular(
        () => {
          this.listeners = [
            this.renderer.listen(this.elementRef.nativeElement, 'mouseenter', this.handleMouseenter),
            this.renderer.listen(this.elementRef.nativeElement, 'mousedown', this.handleMousedown),
            this.renderer.listen(this.elementRef.nativeElement, 'mouseleave', this.handleMouseleave)
          ];
        }
      );
    } else {
      this.zone.runOutsideAngular(
        () => {
          this.listeners = [
            this.renderer.listen(this.elementRef.nativeElement, 'mouseenter', this.handleMouseleave),
            this.renderer.listen(this.elementRef.nativeElement, 'mousedown', this.handleMousedown),
            this.renderer.listen(this.elementRef.nativeElement, 'mouseleave', this.handleMouseenter)
          ];
        }
      );

    }
  }

  // I handle the mousedown event inside the host element.
  // --
  // CAUTION: Currently OUTSIDE the core NgZone.
  private handleMousedown = (): void => {
    // If the user shows any mouse-activity (other than enter/leave) inside the host
    // element, we want to cancel the hesitation timer. Such mouse activity indicates
    // non-hesitation intent on behalf of the user.
    this.cancel();
  };


  // I handle the mouseevent event inside the host element.
  // --
  // CAUTION: Currently OUTSIDE the core NgZone.
  private handleMouseenter = (): void => {
    // When the user enters the host, start the hesitation timer. This timer will be
    // fulfilled if the user remains inside of the host without performing any other
    // meaningful actions.
    this.hesitateStatus = true;
    this.timer = window.setTimeout( this.handleTimerThreshold, this.delay );
  };


  // I handle the mouseleave event inside the host element.
  // --
  // CAUTION: Currently OUTSIDE the core NgZone.
  private handleMouseleave = (): void => {
    this.cancel();
  };


  // I handle the timer threshold event.
  // --
  // CAUTION: Currently OUTSIDE the core NgZone.
  private handleTimerThreshold = (): void => {
    // Once the hesitation timer threshold has been surpassed, we want to trigger an
    // output event. This time, however, we want to trigger Angular change-detection.
    // As such, we have set up into the Angular zone for the emission.
    this.zone.runGuarded(
      () => {
        // TODO: The 'emit' function requires a mandatory void argument
        this.smHesitate.emit();
      }
    );
  };
}
