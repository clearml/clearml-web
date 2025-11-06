import {
  Component, computed,
  ElementRef,
  HostListener,
  OnDestroy,
  signal, viewChild, inject
} from '@angular/core';
import {debounceTime, filter, map, switchMap, tap} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {last} from 'lodash-es';
import {isFileserverUrl} from '~/shared/utils/url';
import {IsVideoPipe} from '@common/shared/pipes/is-video.pipe';
import {IsAudioPipe} from '@common/shared/pipes/is-audio.pipe';
import {resetViewer} from '@common/shared/debug-sample/debug-sample.actions';
import {selectCurrentImageViewerDebugImage} from '@common/shared/debug-sample/debug-sample.reducer';
import {getSignedUrl} from '@common/core/actions/common-auth.actions';
import {getSignedUrlOrOrigin$} from '@common/core/reducers/common-auth-reducer';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';

export interface ImageViewerData {
  index: number;
  isAllMetrics: boolean;
  withoutNavigation: boolean;
  url: string;
  embedFunction: (DOMRect, metric: string, variant: string) => null;
  snippetsMetaData: {
    task: string;
    metric: string;
    variant: string;
    iter: number
  }[];
}


@Component({
  selector: 'sm-image-viewer',
  template: '',
  standalone: false
})
export abstract class BaseImageViewerComponent implements OnDestroy {
  public data = inject<ImageViewerData>(MAT_DIALOG_DATA);
  public dialogRef = inject<MatDialogRef<BaseImageViewerComponent>>(MatDialogRef<BaseImageViewerComponent>);
  public store = inject(Store);
  public imageTop: string | number;
  public imageLeft: number;

  public xCord: number;
  public yCord: number;
  readonly scaleStep = 0.1;
  public autoFitScale: number;
  protected imageContainer = viewChild<ElementRef>('imageContainer');
  protected debugImage = viewChild<ElementRef>('debugImage');
  protected scaleOffset = signal({
    scale: 1,
    offset: {x: 0, y: 0}
  });
  protected wheelEvent = signal<WheelEvent>(null);
  protected wheelEvent$ = toObservable<WheelEvent>(this.wheelEvent);


  protected translate = computed(() => `translate(${this.scaleOffset().offset.x}px, ${this.scaleOffset().offset.y}px)`);
  public dragging: boolean;
  protected currentDebugImage$ = this.store.select(selectCurrentImageViewerDebugImage)
    .pipe(
      filter(event => !!event),
      map(event => {
        this.store.dispatch(getSignedUrl({url: event.url, config: {disableCache: event.timestamp}}));
        return event;
      })
    );

  public currentDebugImage: any;
  public wheeling: boolean;
  protected url = signal<string>(null);
  protected isPlayer = signal(false);
  public imageLoaded = false;
  public iteration: number;
  public isFileserverUrl = isFileserverUrl;

  protected imageHeight = computed(() => Math.floor(this.debugImage().nativeElement.naturalHeight * this.scaleOffset().scale));
  protected imageWidth = computed(() => Math.floor(this.debugImage().nativeElement.naturalWidth * this.scaleOffset().scale));
  private wheelingTimeout;
  maxScale: number;
  private viewerInitialized: boolean;
  private lastZoomMode: 'oneToOne' | 'fit';

  @HostListener('document:keydown', ['$event'])
  baseOnKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case '+':
        this.calculateNewScale(true);
        break;
      case '-':
        this.calculateNewScale(false);
        break;
    }
  }

  protected constructor() {
    this.wheelEvent$.pipe(filter(we => !!we), debounceTime(10)).subscribe((wheelEvent) => {
      this.wheelZoom(wheelEvent);
    });

    this.currentDebugImage$
      .pipe(
        takeUntilDestroyed(),
        tap(currentDebugImage => {
          this.currentDebugImage = currentDebugImage;
          this.iteration = currentDebugImage.iter;
        }),
        switchMap(currentDebugImage => {
          this.isPlayer.set(new IsVideoPipe().transform(currentDebugImage.url) || new IsAudioPipe().transform(currentDebugImage.url));
          return getSignedUrlOrOrigin$(currentDebugImage.url, this.store)
        })
      )
      .subscribe(signed => {
        this.url.set(signed);
      });
  }

  calculateNewScale(scaleUp: boolean) {
    const scaleFactor = scaleUp ? 1 : -1;
    this.scaleOffset.update(scaleOffset => ({
      ...scaleOffset,
      scale: Math.min(this.maxScale, Math.max(scaleOffset.scale + (scaleOffset.scale * scaleFactor * this.scaleStep), 0.1))
    }));
  }

  rescale() {
    if (this.lastZoomMode === 'oneToOne') {
      this.resetScale();
    } else if (this.lastZoomMode === 'fit') {
      this.fitToScreen();
    }
  }

  resetScale() {
    this.lastZoomMode = 'oneToOne';
    this.scaleOffset.set({scale: 1, offset: {x: 0, y: 0}});
  }

  wheelZoomHandler(event: WheelEvent) {
    this.wheelEvent.set(event);
  }

  wheelZoomOutside(event: WheelEvent) {
    this.wheelZoom(event, true);
  }

  wheelZoom(event: WheelEvent, fromOutside = false) {
    clearTimeout(this.wheelingTimeout);
    this.wheeling = true;
    this.wheelingTimeout = setTimeout(() => this.wheeling = false, 300);
    const oldScale = this.scaleOffset().scale;
    const rect = (this.debugImage().nativeElement as HTMLImageElement).getBoundingClientRect();
    const newScale = Math.min(this.maxScale, Math.max(oldScale - (event.deltaY > 0 ? 0.1 : -0.1) * oldScale, 0.1));
    const ratio = newScale / oldScale;

    if (newScale > this.autoFitScale || event.deltaY < 0) {
      if (fromOutside) {
        this.scaleOffset.update(scaleOffset => ({...scaleOffset, scale: newScale}));
      } else {
        this.scaleOffset.update(scaleOffset => ({
          scale: newScale, offset: {
            x: scaleOffset.offset.x - ((((event.clientX - rect.left) - (rect.width / 2)) / rect.width) * ((rect.width * ratio) - rect.width)),
            y: scaleOffset.offset.y - ((((event.clientY - rect.top) - (rect.height / 2)) / rect.height) * ((rect.height * ratio) - rect.height))
          }
        }));
      }
      ;
    } else if (newScale > 0.1) {
      this.scaleOffset.update(scaleOffset => ({
        scale: newScale, offset: {
          x: scaleOffset.offset.x - scaleOffset.offset.x / 10,
          y: scaleOffset.offset.y - scaleOffset.offset.y / 10
        }
      }));
    }
  }

  dragImage($event: MouseEvent) {
    if (this.dragging) {
      this.scaleOffset.update(scaleOffset => ({
        ...scaleOffset,
        offset:
          {
            x: scaleOffset.offset.x + $event.movementX,
            y: scaleOffset.offset.y + $event.movementY
          }
      }));
    }
  }

  changeCords($event: MouseEvent) {
    this.xCord = Math.floor($event.offsetX / this.scaleOffset().scale);
    this.yCord = Math.floor($event.offsetY / this.scaleOffset().scale);
  }

  closeImageViewer() {
    this.store.dispatch(resetViewer());
    this.dialogRef.close();
  }

  fitToScreen() {
    this.lastZoomMode = 'fit';
    const heightScaleFit = (this.imageContainer().nativeElement.clientHeight - 120) / this.debugImage().nativeElement.naturalHeight;
    const widthScaleFit = (this.imageContainer().nativeElement.clientWidth - 120) / this.debugImage().nativeElement.naturalWidth;
    this.scaleOffset.set({scale: Math.min(heightScaleFit, widthScaleFit), offset: {x: 0, y: 0}});
    this.autoFitScale = this.scaleOffset().scale;
    this.maxScale = Math.max(this.debugImage().nativeElement.naturalWidth, this.debugImage().nativeElement.naturalHeight);
  }


  resetCords() {
    this.xCord = null;
    this.yCord = null;
  }

  disableNativeDrag() {
    return false;
  }

  setDragging(b: boolean) {
    this.dragging = b;
  }

  downloadImage() {
    if (this.currentDebugImage) {
      const src = new URL(this.url() ?? this.currentDebugImage.url);
      if (isFileserverUrl(this.currentDebugImage.url)) {
        src.searchParams.set('download', '');
      }
      const a = document.createElement('a') as HTMLAnchorElement;
      a.href = src.toString();
      if (!this.data.withoutNavigation) {
        a.download = last(src.pathname.split('/'));
      }
      a.target = '_blank';
      a.click();
    }
  }

  ngOnDestroy(): void {
    this.store.dispatch(resetViewer());
  }

  showImage() {
    this.imageLoaded = true;
  }

  initialiseFitToScreen() {
    if (!this.viewerInitialized) {
      this.fitToScreen();
      this.viewerInitialized = true;
    } else {
      this.rescale();
    }
  }
}
