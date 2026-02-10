import {AfterViewInit, ComponentRef, Directive, ElementRef, Input, OnDestroy} from '@angular/core';
import {DomService} from '@common/shared/services/dom-service.service';
import {fromEvent, merge, Subscription} from 'rxjs';
import {filter, take, tap} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {selectScaleFactor} from '@common/core/reducers/view.reducer';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[appendComponentOnTopElement]',
  })
export class AppendComponentOnTopElementDirective implements OnDestroy, AfterViewInit {
  private timer: number;
  @Input() set componentToAppend(componentToAppend: any) {
    this._componentToAppend = componentToAppend;
    this.appendToElement();
  };
  @Input() set appendComponentOnTopElement(shouldAppendComponent: boolean) {
    this._shouldAppendComponent = shouldAppendComponent;
    if (shouldAppendComponent) {
      this.appendToElement();
    } else {
      this.componentRef && this.domService.detachComponentFromBody(this.componentRef);
    }
  }

  get componentToAppend() {
    return this._componentToAppend;
  }

  get shouldAppendComponent() {
    return this._shouldAppendComponent;
  }

  private scaleFactor = 1;
  private _componentToAppend;
  private _shouldAppendComponent;
  private _init = false;
  private subscription: Subscription;
  private componentRef: ComponentRef<any>;

  constructor(private hostElement: ElementRef, private domService: DomService, private store: Store) {
    store.select(selectScaleFactor)
      .pipe(filter(s => !!s), take(1))
      .subscribe(scale => this.scaleFactor = scale / 100);
  }

  ngAfterViewInit() {
    this._init = true;
    this.appendToElement();
  }

  appendToElement() {
    clearTimeout(this.timer);
    this.timer = window.setTimeout( () => {
      if (this._init && this.componentToAppend && this.shouldAppendComponent) {
        const {x, y, height, width} = this.hostElement.nativeElement.getBoundingClientRect();
        this.componentRef = this.domService.appendComponentToBody(this.componentToAppend);
        this.componentRef.instance.top = ((y * this.scaleFactor) + (height / 2)) - this.componentRef.instance.height / 2;
        this.componentRef.instance.left = ((x * this.scaleFactor) + (width / 2)) - this.componentRef.instance.width / 2;
        this.componentRef.changeDetectorRef.detectChanges();
        const clickEvent$ = fromEvent(this.componentRef.location.nativeElement, 'click').pipe(
          tap(() => {
            this.hostElement.nativeElement.click();
          })
        );
        const enterEvent$ = fromEvent(this.componentRef.location.nativeElement, 'mouseenter').pipe(
          tap(() => {
            this.hostElement.nativeElement.dispatchEvent(new MouseEvent('mouseenter', {view: window, bubbles: true, cancelable: true}));
          })
        );
        const leaveEvent$ = fromEvent(this.componentRef.location.nativeElement, 'mouseleave').pipe(
          tap(() => {
            this.hostElement.nativeElement.dispatchEvent(new MouseEvent('mouseleave', {view: window, bubbles: true, cancelable: true}));
          })
        );
        this.subscription?.unsubscribe();
        this.subscription = merge(
          clickEvent$,
          enterEvent$,
          leaveEvent$
        )
          .subscribe();
      }
    }, 1000);
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.domService.detachComponentFromBody(this.componentRef);
  }
}

