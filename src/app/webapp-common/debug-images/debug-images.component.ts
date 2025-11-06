import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
  viewChildren
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {RefreshService} from '@common/core/services/refresh.service';
import {DebugSampleEvent, DebugSamples} from '@common/debug-images/debug-images-types';
import {LIMITED_VIEW_LIMIT} from '@common/experiments-compare/experiments-compare.constants';
import {isGoogleCloudUrl} from '@common/settings/admin/base-admin-utils';
import {selectBeginningOfTime} from '@common/shared/debug-sample/debug-sample.reducer';
import {Store} from '@ngrx/store';
import {isEqual} from 'lodash-es';
import {combineLatest} from 'rxjs';
import {debounceTime, filter, map} from 'rxjs/operators';
import {EventsDebugImagesResponse} from '~/business-logic/model/events/eventsDebugImagesResponse';
import {TaskMetric} from '~/business-logic/model/events/taskMetric';
import {Task} from '~/business-logic/model/tasks/task';
import {TaskStatusEnum} from '~/business-logic/model/tasks/taskStatusEnum';
import {selectSelectedExperiment} from '~/features/experiments/reducers';
import {ReportCodeEmbedService} from '~/shared/services/report-code-embed.service';
import {getSignedUrl, signUrls} from '../core/actions/common-auth.actions';
import {addMessage} from '../core/actions/layout.actions';
import {selectS3BucketCredentials} from '../core/reducers/common-auth-reducer';
import {selectRouterParams} from '../core/reducers/router-reducer';
import {ImageViewerComponent} from '../shared/debug-sample/image-viewer/image-viewer.component';
import * as  debugActions from './debug-images-actions';
import {fetchExperiments, getDebugImagesMetrics, resetDebugImages} from './debug-images-actions';
import {ALL_IMAGES} from './debug-images-effects';
import {
  selectDebugImages,
  selectOptionalMetrics,
  selectSelectedMetricForTask,
  selectTaskNames,
  selectTimeIsNow
} from './debug-images-reducer';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {DebugImagesViewComponent} from '@common/debug-images/debug-images-view/debug-images-view.component';
import {DebugImagesResponseIterations} from '~/business-logic/model/events/debugImagesResponseIterations';
import {MetricsImageEvent} from '~/business-logic/model/events/metricsImageEvent';
import {injectRouteData} from 'ngxtension/inject-route-data';
import {selectSelectedExperimentFromRouter} from '@common/experiments/reducers';

@Component({
    selector: 'sm-debug-images',
    templateUrl: './debug-images.component.html',
    styleUrls: ['./debug-images.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class DebugImagesComponent {
  private store = inject(Store);
  private dialog = inject(MatDialog);
  private changeDetection = inject(ChangeDetectorRef);
  private elRef = inject(ElementRef);
  private refresh = inject(RefreshService);
  private reportEmbed = inject(ReportCodeEmbedService);
  private destroyRef = inject(DestroyRef);

  hideNavigation = input(false);
  disableStatusRefreshFilter = input(false);
  selected = input<Task>();
  copyIdClicked = output();

  protected mergeIterations = injectRouteData<boolean>('mergeIterations');
  protected multipleExperiments = injectRouteData<boolean>('multiple');
  protected minimized = injectRouteData<boolean>('minimized');
  private routerParams = this.store.selectSignal(selectRouterParams);
  private ids = computed<string[]>(() => {
    if (this.routerParams().ids || this.routerParams().experimentId) {
      return this.routerParams().ids?.split(',') ?? this.routerParams().experimentId?.split(',')
    }
  });
  protected experimentIds = computed<string[]>(() => this.selected() ?
    [this.selected().id] :
    this.multipleExperiments() ?
      this.ids() :
      [this.selectedExperiment()?.id]
  );
  protected experimentNames = computed(() => this.selected() ?
    {[this.selected().id]: this.selected().name} :
    this.multipleExperiments() ?
      this.tasks().reduce((acc, task) => ({
        ...acc,
        [task.id]: task.name
      }), {}) as Record<string, string> :
      {[this.selectedExperiment()?.id]: this.selectedExperiment()?.name}
  );


  protected selectedExperiment = this.store.selectSignal(selectSelectedExperiment);
  protected selectedExperimentFromRouter = this.store.selectSignal(selectSelectedExperimentFromRouter);
  protected tasks = this.store.selectSignal(selectTaskNames);
  protected timeIsNow = this.store.selectSignal(selectTimeIsNow);
  protected beginningOfTime = this.store.selectSignal(selectBeginningOfTime);
  protected optionalMetrics = this.store.selectSignal(selectOptionalMetrics);
  protected metricForTask = this.store.selectSignal(selectSelectedMetricForTask);

  private previousExperimentId: string;
  private previousSelectedId: string;
  public debugImages: Record<string, DebugSamples> = null;
  public allowAutorefresh = false;

  public selectedMetrics = signal<Record<string, string>>({});
  readonly allImages = ALL_IMAGES;
  protected selectedMetric = signal<string>(null);
  protected optionalMetricsDic = linkedSignal<Record<string, string>>(() => this.optionalMetrics().reduce((acc, experimentMetrics) => {
    acc[experimentMetrics.task] = experimentMetrics.metrics;
    return acc;
  }, {}));
  public bindNavigationMode = signal(false);

  LIMITED_VIEW_LIMIT = LIMITED_VIEW_LIMIT;
  private previousIds: string[];

  constructor() {
    this.destroyRef.onDestroy(() => this.store.dispatch(resetDebugImages()));

    effect(() => {
      if (this.selectedExperimentFromRouter()) {
        this.optionalMetricsDic.set(null);
      }
    });

    effect(() => {
      // open dataset case (selected as input)
      if (this.selected() && this.selected().id !== this.previousSelectedId) {
        this.previousSelectedId = this.selected().id;
        untracked(() => this.selectMetric({value: this.allImages}, this.selected().id))
      }
    });

    if (this.multipleExperiments()) {
      effect(() => {
        if (this.tasks()?.length > 0) {
          if (this.isTaskRunning(this.tasks()) && (Object.keys(this.debugImages || {}).length > 0 || this.beginningOfTime()?.[this.ids()[0]])) {
            untracked(() => this.store.dispatch(getDebugImagesMetrics({tasks: this.ids()})));
          }
        }
      });

      effect(() => {
        if (!isEqual(this.ids(),this.previousIds)) {
          this.selectedMetric.set(null);
          this.store.dispatch(getDebugImagesMetrics({tasks: this.ids().slice(0, LIMITED_VIEW_LIMIT)}));
          this.store.dispatch(fetchExperiments({tasks: this.ids().slice(0, LIMITED_VIEW_LIMIT)}));
          this.previousIds = this.ids();
        }
      });
    } else {
      effect(() => {
        if (this.selectedExperiment() && (!this.disableStatusRefreshFilter() || this.previousExperimentId === undefined) && this.selectedExperiment()?.id !== this.previousExperimentId) {
          const id = this.selectedExperiment().id;
          this.previousExperimentId = id;
          this.optionalMetricsDic.set(null);
          this.selectedMetric.set(null);
          if (this.metricForTask()) {
            this.selectedMetrics.update(metrics => ({...metrics, [id]: this.metricForTask()[id]}));
          }
          this.store.dispatch(getDebugImagesMetrics({tasks: this.experimentIds()}));
        }
      });
    }

    combineLatest([
      this.store.select(selectS3BucketCredentials),
      this.store.select(selectDebugImages),
      this.store.select(selectSelectedMetricForTask)
    ])
      .pipe(
        takeUntilDestroyed(),
        debounceTime(50),
        map(([, debugImages, metricForTask]) => !debugImages ? {} : Object.entries(debugImages).reduce(((acc, val: [string, EventsDebugImagesResponse]) => {
          const id = val[0];
          const iterations: DebugImagesResponseIterations[] = val[1].metrics.find(m => m.task === id).iterations;
          if (iterations?.length === 0) {
            return {[id]: {}};
          }
          const metrics = val[1].metrics.map((metric) => metric?.['metric'] || metric.iterations[0].events[0].metric);
          acc[id] = {
            data: iterations.map(iteration => ({
              iter: iteration.iter,
              events: iteration.events.map((event: MetricsImageEvent) => {
                return {
                  ...event,
                  url: event.url,
                  variantAndMetric: (this.selectedMetrics()[id] === ALL_IMAGES || metricForTask[id] === ALL_IMAGES) ? `${event.metric}/${event.variant}` : ''
                };
              })
            })),
            metrics,
            metric: metrics[0],
            scrollId: val[1].scroll_id,
          };
          this.store.dispatch(signUrls({
            sign: iterations.map(iteration =>
              iteration.events.map((event: MetricsImageEvent) =>
                ({url: event.url, config: {disableCache: event.timestamp}})
              )
            ).flat()
          }));
          return acc;
        }), {}))
      )
      .subscribe(debugImages => {
        this.debugImages = debugImages;
        Object.keys(debugImages).forEach(key => {
          if (!this.selectedMetrics()[key]) {
            this.selectedMetrics.update(metrics => ({...metrics, [key]: debugImages[key]?.metric}));
          }
        });
        this.changeDetection.detectChanges();
      });

    this.refresh.tick
      .pipe(
        takeUntilDestroyed(),
        filter(auto => auto !== null && !this.disableStatusRefreshFilter()),
      )
      .subscribe(auto => {
        if (this.multipleExperiments()) {
          this.store.dispatch(debugActions.refreshDebugImagesMetrics({tasks: this.experimentIds(), autoRefresh: auto}));
          this.store.dispatch(debugActions.fetchExperiments({tasks: this.ids().slice(0, LIMITED_VIEW_LIMIT)}));
        }
        this.store.dispatch(debugActions.getDebugImagesMetrics({tasks: this.experimentIds(), autoRefresh: true}));
        this.experimentIds().forEach(experimentId => {
          if (experimentId && !(this.timeIsNow()?.[experimentId] === false) && this.elRef.nativeElement.scrollTop < 40) {
            this.store.dispatch(debugActions.refreshMetric({
              payload: {
                task: experimentId,
                metric: this.debugImages[experimentId]?.metric,
              },
              autoRefresh: (auto !== false)
            }));
          }
        });
      });

    this.store.select(selectOptionalMetrics)
      .pipe(takeUntilDestroyed())
      .subscribe(optionalMetrics => {
        if (this.optionalMetrics().length > 0) {
          if (!this.selectedMetric() || !optionalMetrics?.[0].metrics.includes(this.selectedMetric())) {
            this.optionalMetrics()
              .filter(optionalMetric => optionalMetric.metrics[0])
              .forEach(optionalMetric => this.store.dispatch(debugActions.setSelectedMetric({
                payload: {
                  task: optionalMetric.task,
                  metric: this.hideNavigation() ? null : this.metricForTask()[optionalMetric.task] ?? optionalMetric.metrics[0]
                }
              })));
          }
        }
      });
  }

  public urlError({frame}: { frame: DebugSampleEvent; experimentId: string }) {
    const url = frame.url;
    if (isGoogleCloudUrl(url)) {
      this.store.dispatch(getSignedUrl({url, config: {error: true}}));
    }
    // this.adminService.checkImgUrl(frame.oldSrc || frame.src);
  }

  imageClicked({frame}, experimentId: string) {
    const iterationSnippets = this.debugImages?.[experimentId]?.data.map(iter => iter.events).flat();
    const sources = iterationSnippets.map(img => img.url);
    const index = iterationSnippets.findIndex(img => img.url === frame.url);
    const isAllMetrics = this.selectedMetrics()[experimentId] === ALL_IMAGES;
    this.dialog.open(ImageViewerComponent, {
      data: {
        embedFunction: (rect: DOMRect, metric: string, variant: string) =>
          this.createEmbedCode({metrics: [metric], variants: [variant], domRect: rect}, experimentId),
        imageSources: sources, index, snippetsMetaData: iterationSnippets, isAllMetrics
      },
      panelClass: ['image-viewer-dialog','full-screen', 'light-theme'],
    });
  }

  private isTaskRunning(tasks: Partial<Task>[]) {
    return tasks.some(task => [TaskStatusEnum.InProgress, TaskStatusEnum.Queued].includes(task.status));
  }

  selectMetric(change: { value: string }, taskId: string) {
    this.selectedMetric.set(change.value);
    if (this.bindNavigationMode()) {
      this.experimentIds().forEach(experimentId => {
        this.selectedMetrics.update(metrics => ({...metrics, [experimentId]: change.value}));
        this.store.dispatch(debugActions.setSelectedMetric({payload: {task: experimentId, metric: change.value}}));
      });
    } else {
      this.selectedMetrics.update(metrics => ({...metrics, [taskId]: change.value}));
      this.store.dispatch(debugActions.setSelectedMetric({payload: {task: taskId, metric: change.value}}));
    }
  }

  nextBatch(taskMetric: TaskMetric) {
    if (this.bindNavigationMode()) {
      this.experimentIds().forEach(experimentId => {
        if (!this.beginningOfTime()[experimentId]) {
          this.store.dispatch(debugActions.getNextBatch({
            payload: {
              task: experimentId,
              metric: this.selectedMetrics()[experimentId]
            }
          }));
        }
      });
    } else {
      this.store.dispatch(debugActions.getNextBatch({payload: taskMetric}));
    }
  }

  previousBatch(taskMetric: TaskMetric) {
    if (this.bindNavigationMode()) {
      this.experimentIds().forEach(experimentId => {
        this.store.dispatch(debugActions.getPreviousBatch({
          payload: {
            task: experimentId,
            metric: this.selectedMetrics()[experimentId]
          }
        }));
      });
    } else {
      this.store.dispatch(debugActions.getPreviousBatch({payload: taskMetric}));
    }
  }

  backToNow(taskMetric: TaskMetric) {
    if (this.bindNavigationMode()) {
      this.experimentIds().forEach(experimentId => {
        this.store.dispatch(debugActions.setSelectedMetric({
          payload: {
            task: experimentId,
            metric: this.selectedMetrics()[experimentId]
          }
        }));
      });
    } else {
      this.store.dispatch(debugActions.setSelectedMetric({payload: taskMetric}));
    }

  }

  thereAreNoMetrics(experiment: string) {
    return !(this.optionalMetricsDic()?.[experiment]?.length > 0);
  }

  thereAreNoDebugImages(experiment: string) {
    return !(this.debugImages?.[experiment]?.data?.length > 0);
  }

  shouldShowNoImagesForExperiment(experiment: string) {
    return this.thereAreNoMetrics(experiment) && this.thereAreNoDebugImages(experiment);
  }

  copyIdToClipboard() {
    this.store.dispatch(addMessage('success', 'Copied to clipboard'));
  }

  toggleConnectNavigation() {
    this.bindNavigationMode.update(mode => !mode);
  }

  createEmbedCode(event: { metrics?: string[]; variants?: string[]; domRect: {x: number; y: number;};}, experimentId: string) {
    this.reportEmbed.createCode({
      type: 'sample',
      objects: [experimentId],
      objectType: 'task',
      ...event
    });
  }
}
