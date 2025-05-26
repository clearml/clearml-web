import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output, signal,
  TemplateRef,
  ViewChild, inject, input, effect, computed
} from '@angular/core';
import {combineLatest, Observable} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
import {chunk} from 'lodash-es';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {Store} from '@ngrx/store';
import {selectScaleFactor} from '@common/core/reducers/view.reducer';
import {NgTemplateOutlet} from '@angular/common';
import {ScrollEndDirective} from '@common/shared/ui-components/directives/scroll-end.directive';
import {PushPipe} from '@ngrx/component';
import {MatButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {toObservable} from '@angular/core/rxjs-interop';
import {trackByIndex} from '@common/shared/utils/forms-track-by';
import {injectResize} from 'ngxtension/resize';


@Component({
    selector: 'sm-virtual-grid',
    templateUrl: './virtual-grid.component.html',
    styleUrls: ['./virtual-grid.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CdkFixedSizeVirtualScroll,
        CdkVirtualForOf,
        CdkVirtualScrollViewport,
        NgTemplateOutlet,
        ScrollEndDirective,
        PushPipe,
        MatButton,
        MatProgressSpinner
    ]
})
export class VirtualGridComponent {
  private store = inject(Store);
  private width$ = injectResize({emitInitialResult: true, box: 'content-box', debounce: 10})
    .pipe(
      filter(() => document?.fullscreenElement?.nodeName !== 'VIDEO'),
      map(({width}) => width),
      distinctUntilChanged()
    );

  protected itemRows$: Observable<unknown[][]>;
  protected rowWidth = 300;
  protected min = Math.min;
  protected gridGap = signal(null)
  protected cardsInRow = signal(null);

  // snippetMode means the items has no fixed width so we can stretch them to fill the row (consider scroll in calcs and add 1fr to card-width)
  snippetsMode = input(false);
  items = input<unknown[]>()
  cardTemplate = input<TemplateRef<unknown>>();
  cardHeight = input(246);
  cardWidth = input(352);
  padding = input(64 + 24 + 24);
  showLoadMoreButton = input(false);
  autoLoadMore = input(false);
  trackFn = input(item => item.id);

  @Output() itemClicked = new EventEmitter<unknown>();
  @Output() loadMoreClicked = new EventEmitter();
  @ViewChild(CdkVirtualScrollViewport) viewPort: CdkVirtualScrollViewport;

  private items$ = toObservable(this.items);
  private cardWidth$ = toObservable(this.cardWidth);
  protected itemsState = computed(() => ({
    items: this.items(),
    loading: signal(false)
  }));
  trackRow= (index: number, row: unknown[]) =>
    row.map(item => this.trackFn()(item)).join(',');


  constructor() {
    effect(() => {
      if (this.cardTemplate()) {
        this.viewPort?.scrollToIndex(0);
      }
    });


    this.itemRows$ = combineLatest([
      this.width$,
      this.items$,
      this.store.select(selectScaleFactor).pipe(map(factor => 100 / factor)),
      this.cardWidth$
    ])
      .pipe(
        debounceTime(10),
        map(([width, results, factor, ]) => {
          this.rowWidth = width * factor - this.padding() - (this.snippetsMode() ? 12 : 0); // 12 because when scroll blinks
          this.gridGap.set(Math.min(this.cardWidth() * 0.075, 24));
          this.cardsInRow.set(Math.floor(this.rowWidth / (this.cardWidth() + this.gridGap())) || 1);
          this.rowWidth = this.cardsInRow() * this.cardWidth() + (this.cardsInRow() - 1) * this.gridGap();
          return chunk(results, this.cardsInRow());
        }));
  }

  autoLoad() {
    this.itemsState().loading.set(true);
    this.loadMoreClicked.emit();
  }

  protected readonly trackByIndex = trackByIndex;
}
