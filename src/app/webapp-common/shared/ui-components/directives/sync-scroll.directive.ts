import {Directive, ElementRef, HostListener, OnDestroy, Renderer2} from '@angular/core';
import {SyncScrollService} from '../../services/sync-scroll.service';
import {Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';

@Directive({
    selector: '[smSyncScroll]',
    standalone: false
})
export class SyncScrollDirective implements OnDestroy {

  private subscription: Subscription;

  @HostListener('scroll', ['$event'])
  public onScroll(event: MouseEvent): void {
    this.syncScrollService.updateOriginalTarget(event.target);
    if (this.syncScrollService.originalTarget === event.target) {
      this.syncScrollService.setScroll({
        scrollTop : (<HTMLInputElement>event.target).scrollTop,
        scrollLeft: (<HTMLInputElement>event.target).scrollLeft,
      });
    }
  }

  constructor(private el: ElementRef, private syncScrollService: SyncScrollService, private renderer: Renderer2) {
    this.subscription = this.syncScrollService.getScroll()
      .pipe(filter( _ => this.syncScrollService.originalTarget !== this.el.nativeElement))
      .subscribe(scrollData => {
      if (this.el.nativeElement.scrollTop !== scrollData.scrollTop) {
        this.renderer.setProperty(this.el.nativeElement, 'scrollTop', scrollData.scrollTop);
      }
      if (this.el.nativeElement.scrollLeft !== scrollData.scrollLeft) {
        this.renderer.setProperty(this.el.nativeElement, 'scrollLeft', scrollData.scrollLeft);

      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
