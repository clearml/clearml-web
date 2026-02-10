import {ChangeDetectionStrategy, Component, HostListener, OnDestroy} from '@angular/core';
import {IsAudioPipe} from '@common/shared/pipes/is-audio.pipe';
import {IsVideoPipe} from '@common/shared/pipes/is-video.pipe';
import {debounceTime, distinctUntilChanged, filter, withLatestFrom} from 'rxjs/operators';
import {BehaviorSubject, interval} from 'rxjs';
import {selectAppVisible, selectAutoRefresh} from '@common/core/reducers/view.reducer';
import {BaseImageViewerComponent} from '@common/shared/debug-sample/image-viewer/base-image-viewer.component';
import {getDebugImageSample, getNextDebugImageSample, setDebugImageViewerScrollId, setViewerEndOfTime} from '@common/shared/debug-sample/debug-sample.actions';
import {selectMinMaxIterations, selectViewerBeginningOfTime, selectViewerEndOfTime} from '@common/shared/debug-sample/debug-sample.reducer';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {FormsModule} from '@angular/forms';
import {MatSlider, MatSliderThumb} from '@angular/material/slider';
import {PushPipe} from '@ngrx/component';
import {ToPercentagePipe} from '@common/shared/pipes/to-precentage.pipe';

const VIEWER_AUTO_REFRESH_INTERVAL = 60 * 1000;

@Component({
  selector: 'sm-image-viewer',
  templateUrl: './image-viewer.component.html',
  styleUrls: ['./image-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TooltipDirective,
    ShowTooltipIfEllipsisDirective,
    FormsModule,
    MatSliderThumb,
    MatSlider,
    PushPipe,
    ToPercentagePipe
  ]
})
export class ImageViewerComponent extends BaseImageViewerComponent implements OnDestroy {

  change$: BehaviorSubject<number>;
  public embedFunction: (DOMRect, metric: string, variant: string) => null;
  protected minMaxIterations$ = this.store.select(selectMinMaxIterations);
  protected beginningOfTime$ = this.store.select(selectViewerBeginningOfTime);
  protected endOfTime$ = this.store.select(selectViewerEndOfTime);
  private autoRefreshState$ = this.store.select(selectAutoRefresh);
  private isAppVisible$ = this.store.select(selectAppVisible);
  private beginningOfTime = false;
  private endOfTime = false;

  constructor() {
    super();
    if (this.data.url) {
      this.url.set(this.data.url);
      this.isPlayer.set(new IsVideoPipe().transform(this.data.url) || new IsAudioPipe().transform(this.data.url));
      this.change$ = new BehaviorSubject<number>(0);
    } else {
      const reqData = {
        task: this.data.snippetsMetaData[this.data.index].task,
        metric: this.data.snippetsMetaData[this.data.index].metric,
        variant: this.data.snippetsMetaData[this.data.index].variant,
        iteration: this.data.snippetsMetaData[this.data.index].iter,
        isAllMetrics: this.data.isAllMetrics
      };
      this.store.dispatch(getDebugImageSample(reqData));
      this.change$ = new BehaviorSubject<number>(reqData.iteration);
    }
    this.embedFunction = this.data.embedFunction;

    interval(VIEWER_AUTO_REFRESH_INTERVAL)
      .pipe(
        takeUntilDestroyed(),
        withLatestFrom(this.autoRefreshState$, this.isAppVisible$),
        filter(([, autoRefreshState, isVisible]) => isVisible && autoRefreshState)
      )
      .subscribe(() => {
        if (this.currentDebugImage) {
          this.store.dispatch(setViewerEndOfTime({endOfTime: false}));
          this.store.dispatch(setDebugImageViewerScrollId({scrollId: null}));
          this.store.dispatch(getDebugImageSample({
            task: this.currentDebugImage.task,
            metric: this.currentDebugImage.metric,
            variant: this.currentDebugImage.variant,
            iteration: this.currentDebugImage.iter,
            isAllMetrics: this.data.isAllMetrics
          }));
        }
      });

    this.change$
      .pipe(
        takeUntilDestroyed(),
        debounceTime(100),
        distinctUntilChanged()
      )
      .subscribe(val => this.changeIteration(val));

    this.beginningOfTime$
      .pipe(takeUntilDestroyed())
      .subscribe(beg => {
        this.beginningOfTime = beg;
        if (beg) {
          this.rescale();
          this.imageLoaded = true;
        }
      });
    this.endOfTime$
      .pipe(takeUntilDestroyed())
      .subscribe(end => {
        this.endOfTime = end;
        if (end) {
          this.rescale();
          this.imageLoaded = true;
        }
      });
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowRight':
        this.next();
        break;
      case 'ArrowLeft':
        this.previous();
        break;
      case 'ArrowUp':
        this.nextIteration();
        break;
      case 'ArrowDown':
        this.previousIteration();
        break;
      default:
        this.baseOnKeyDown(e);
    }
  }

  canGoNext() {
    return !this.endOfTime;
  }

  canGoBack() {
    return !this.beginningOfTime;
  }

  next() {
    if (this.canGoNext() && this.currentDebugImage) {
      this.imageLoaded = false;
      this.store.dispatch(getNextDebugImageSample({task: this.currentDebugImage.task, navigateEarlier: false}));
    }
  }

  previous() {
    if (this.canGoBack() && this.currentDebugImage) {
      this.imageLoaded = false;
      this.store.dispatch(getNextDebugImageSample({task: this.currentDebugImage.task, navigateEarlier: true}));
    }
  }

  previousIteration() {
    if (this.canGoBack() && this.currentDebugImage) {
      this.imageLoaded = false;
      this.store.dispatch(getNextDebugImageSample({task: this.currentDebugImage.task, navigateEarlier: true, iteration: true}));
    }
  }

  changeIteration(value: number) {
    if (this.iteration === value || this.data.withoutNavigation) {
      return;
    }
    this.iteration = value;
    if (this.currentDebugImage) {
      const reqData = {
        task: this.currentDebugImage.task,
        metric: this.currentDebugImage.metric,
        variant: this.currentDebugImage.variant,
        iteration: value,
        isAllMetrics: this.data.isAllMetrics
      };
      this.store.dispatch(getDebugImageSample(reqData));
    }
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.store.dispatch(setDebugImageViewerScrollId({scrollId: null}));
  }

  embedCodeClick(event: MouseEvent) {
    if (event) {
      this.embedFunction(
        (event?.currentTarget as HTMLElement).getBoundingClientRect(),
        this.currentDebugImage?.metric,
        this.currentDebugImage?.variant
      );
    }
  }

  private nextIteration() {
    if (this.canGoNext() && this.currentDebugImage) {
      this.imageLoaded = false;
      this.store.dispatch(getNextDebugImageSample({task: this.currentDebugImage.task, navigateEarlier: false, iteration: true}));
    }
  }
}
