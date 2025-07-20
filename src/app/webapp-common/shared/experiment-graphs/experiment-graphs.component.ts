import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Renderer2,
  inject,
  viewChild,
  viewChildren,
  input,
  output,
  signal,
  effect,
  computed,
  untracked,
  model,
  DestroyRef
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {checkIfLegendToTitle, sortMetricsList} from '../../tasks/tasks.utils';
import {SingleGraphComponent} from '../single-graph/single-graph.component';
import {
  ChartHoverModeEnum,
  EXPERIMENT_GRAPH_ID_PREFIX,
  SINGLE_GRAPH_ID_PREFIX, singleValueChartTitle
} from '../../experiments/shared/common-experiments.const';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {GroupByCharts, groupByCharts} from '../../experiments/actions/common-experiment-output.actions';
import {Store} from '@ngrx/store';
import {ResizeEvent} from 'angular-resizable-element';
import {distinctUntilChanged, skip, tap} from 'rxjs/operators';
import {Observable, of, combineLatest} from 'rxjs';
import {ChartPreferences, ExtFrame, ExtLegend, VisibleExtFrame} from '../single-graph/plotly-graph-base';
import {signUrls} from '../../core/actions/common-auth.actions';
import {getSignedUrlOrOrigin$} from '../../core/reducers/common-auth-reducer';
import {
  EventsGetTaskSingleValueMetricsResponseValues
} from '~/business-logic/model/events/eventsGetTaskSingleValueMetricsResponseValues';
import {v4} from 'uuid';
import {selectChartSettings, selectExperimentOrModelId, selectGraphsPerRow} from '@common/experiments/reducers';
import {setGraphsPerRow} from '@common/experiments/actions/common-experiment-output.actions';
import {SmoothTypeEnum} from '@common/shared/single-graph/single-graph.utils';
import {maxInArray} from '@common/shared/utils/helpers.util';
import {explicitEffect} from 'ngxtension/explicit-effect';
import {GroupedList} from '@common/tasks/tasks.model';
import {computedPrevious} from 'ngxtension/computed-previous';
import {selectPlotlyReady} from '@common/core/reducers/view.reducer';
import {injectResize} from 'ngxtension/resize';

export const inHiddenList = (isCompare: boolean, hiddenList: string[], metric: string, variant: string) => {
  const metVar = `${metric}${variant}`;
  return isCompare ? !(hiddenList?.some(m => m.startsWith(metVar) || metric.endsWith(` - ${variant}`))) : !hiddenList?.includes(metVar);
};

@Component({
  selector: 'sm-experiment-graphs',
  templateUrl: './experiment-graphs.component.html',
  styleUrls: ['./experiment-graphs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})

export class ExperimentGraphsComponent {
  private el = inject(ElementRef);
  private changeDetection = inject(ChangeDetectorRef);
  private store = inject(Store);
  private renderer = inject(Renderer2);
  private destroy = inject(DestroyRef);
  private resize = injectResize();

  readonly experimentGraphidPrefix = EXPERIMENT_GRAPH_ID_PREFIX;
  readonly singleGraphidPrefix = SINGLE_GRAPH_ID_PREFIX;
  allMetrics = viewChild<ElementRef>('allMetrics');
  private timer: number;
  public height = 450;
  public width: number;
  private minWidth = 350;
  private resizeTextElement: HTMLDivElement;
  private graphsNumberLimit: number;
  public activeResizeElement: HTMLDivElement;
  protected readonly singleValueChartTitle = singleValueChartTitle;
  protected graphsData = signal<Record<string, VisibleExtFrame[]>>(null);
  protected signedImagePlots: Record<string, Observable<string[]>> = {};
  private previousWindowWidth: number;
  protected plotlyReady = this.store.selectSignal(selectPlotlyReady);
  protected chartSettings: Record<string, Observable<ChartPreferences>> = {};

  hiddenList = input<string[]>();
  isGroupGraphs = input<boolean>();
  legendStringLength = input(19);
  minimized = input<boolean>();
  isDarkTheme = input<boolean>();
  showLoaderOnDraw = input(true);
  legendConfiguration = input<Partial<ExtLegend>>({});
  breakPoint = input(700);
  isCompare = input(false);
  defaultHoverMode = input<ChartHoverModeEnum>();
  disableResize = input(false);
  singleValueData = model<EventsGetTaskSingleValueMetricsResponseValues[]>();
  multipleSingleValueData = model<ExtFrame>();
  experimentName = input<string>();
  splitSize = input<number>();

  smoothWeight = input<number>();
  smoothSigma = input<number>();
  smoothType = input<SmoothTypeEnum>();
  groupBy = input<GroupByCharts>();
  showOriginals = input<boolean>();
  xAxisType = input<ScalarKeyEnum>();
  exportForReport = input(true);

  metrics = input<Record<string, ExtFrame[]>>();
  list = input<GroupedList>();

  resetGraphs = output();
  // hoverModeChanged = output<ChartHoverModeEnum>();
  createEmbedCode = output<{
    metrics?: string[];
    variants?: string[];
    originalObject?: string[];
    xaxis?: ScalarKeyEnum;
    group?: boolean;
    plotsNames?: string[];
    seriesName?: string[];
    domRect: DOMRect;
  }>();

  chartSettingsChanged = output<{id: string, changes:ChartPreferences}>()

  allMetricGroups = viewChildren<ElementRef>('metricGroup');
  singleGraphs = viewChildren<ElementRef>('singleGraphContainer');
  singleValueGraph = viewChildren<SingleGraphComponent>('singleValueGraph');
  allGraphs = viewChildren(SingleGraphComponent);

  graphsPerRow = this.store.selectSignal(selectGraphsPerRow);

  allGraphsPrevious = computedPrevious(this.allGraphs);
  loading = computed(() => this.graphsData() === null || this.hiddenList() === null );

  constructor() {

    effect(() => {
      if (this.allGraphsPrevious()?.length === 0 && this.allGraphs()?.length > 0) {
        this.calculateGraphsLayout(0);
      }
    });


    effect(() => {
      if (this.graphsData() || this.splitSize() || this.groupBy()) {
        untracked(() => {
          if (this.allGraphs()) {
            this.allMetricGroups()?.forEach(metricGroup => this.renderer.removeStyle(metricGroup.nativeElement, 'width'));
            this.calculateGraphsLayout(0);
          }
        });
      }
    });

    effect(() => {
      if (this.graphsState().maxUserHeight()) {
        this.height = this.graphsState().maxUserHeight();
      }
    });

    explicitEffect(
      [this.metrics],
      ([metrics]) => {
        if (metrics === undefined) {
        return;
      }
      const graphsData = this.addId(this.sortGraphsData(metrics || {}));
      const toBeSigned = [];
      this.chartSettings['singleValues'] = this.store.select(selectChartSettings('singleValues', null));
      Object.values(graphsData).forEach((graphs: ExtFrame[]) => {
        graphs.forEach((graph: ExtFrame) => {
          if ((graph?.layout?.images?.length ?? 0) > 0) {
            const observables = [] as Observable<string>[];
            graph.layout.images.forEach(((image: Plotly.Image, i) => {
                toBeSigned.push({
                  url: image.source,
                  config: {skipFileServer: false, skipLocalFile: false, disableCache: graph.timestamp}
                });
                observables.push(getSignedUrlOrOrigin$(image.source, this.store).pipe(tap(signed => graph.layout.images[i].source = signed)));
              }
            ));
            this.signedImagePlots[graph.id] = combineLatest(observables);
          } else {
            this.signedImagePlots[graph.id] = of(['true']);
          }
          this.chartSettings[graph.id] = this.store.select(selectChartSettings(graph.metric, graph.variant));
        });
      });
      this.store.dispatch(signUrls({sign: toBeSigned}));
      this.graphsData.set(graphsData);
      // this.calculateGraphsLayout(0, (this.disableResize() || this.allGroupsSingleGraphs()) ? 1 : this.graphsState().graphsPerRow());
    });


    this.store.select(selectExperimentOrModelId)
      .pipe(
        takeUntilDestroyed(),
        distinctUntilChanged(),
        skip(1) // don't need first null->expId
      )
      .subscribe(() => {
        this.store.dispatch(setGraphsPerRow({graphsPerRow: 2}));
        this.graphsData.set(null);
        this.graphsState().numIterations.set(0);
        this.graphsState().graphList.set([]);
        this.singleValueData.set([]);
        // this.loading.set(true);
        this.multipleSingleValueData.set(null);
      });

    this.resize
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.onResize());

    this.destroy.onDestroy(() => {
      this.store.dispatch(setGraphsPerRow({graphsPerRow: 2}));
    });
  }

  graphsState = computed(() => ({
    graphsPerRow: signal(this.graphsPerRow() ?? 2),
    graphList: signal(this.metrics() ? sortMetricsList(Object.keys(this.metrics())) : []),
    noGraphs: signal(this.graphsData() && Object.keys(this.graphsData()).length === 0),
    numIterations: signal(Array.from(new Set(Object.values(this.graphsData() ?? {}).reduce((acc, frames) =>
      [...acc, ...frames.map(frame => frame.iter)], []).flat())).filter(a => Number.isInteger(a)).length),
    maxUserWidth: signal(maxInArray(Object.values(this.graphsData() ?? {}).flat().map((chart: ExtFrame) => chart.layout?.width || 0))),
    maxUserHeight: signal(maxInArray(Object.values(this.graphsData() ?? {}).flat().map((chart: ExtFrame) => chart.layout?.height || 0)))
  }));

  visibility = computed(() => {
    return Object.entries(this.list() || {}).reduce((acc, [metric, plots]) => {
      const variants = Object.keys(plots);
      acc[metric] = variants.filter(v => v !== '__displayName').length > 0 ? variants.map(variant =>
        (this.isCompare() && this.hiddenList()?.includes(metric) && metric.endsWith(` - ${variant}`)) ? null : this.hiddenList()?.includes(`${metric}${variant}`)) : null;
      return acc;
    }, {});
  });


  onResize() {
    clearTimeout(this.timer);
    if (window.innerWidth !== this.previousWindowWidth) {
      this.graphsState().graphsPerRow.set(this.allGroupsSingleGraphs() ? 1 : this.graphsState().graphsPerRow());
    }
    this.calculateGraphsLayout();
    this.previousWindowWidth = window.innerWidth;
  }

  sortGraphsData = (data: Record<string, ExtFrame[]>) =>
    Object.entries(data).reduce((acc, [label, graphs]) =>
      ({
        ...acc,
        [label]: graphs.sort((a, b) => {
          a.layout.title = a.layout.title || '';
          b.layout.title = b.layout.title || '';
          return a.layout.title === b.layout.title ?
            b.iter - a.iter :
            (a.layout.title as string).localeCompare((b.layout.title as string), undefined, {
              numeric: true,
              sensitivity: 'base'
            });
        })
      }), {} as Record<string, ExtFrame[]>);


  trackByIdFn = (item: ExtFrame) =>
    `${item.layout.title} ${item.data?.length} ${(this.isDarkTheme() ? '' : item.iter ?? '')}`;

  isWidthBigEnough() {
    return this.el.nativeElement.clientWidth > this.breakPoint();
  }

  private allGroupsSingleGraphs() {
    const groups = Object.values(this.graphsData() || {});
    return (this.isGroupGraphs() || this.disableResize() || groups.length === 1) && groups.every(group => group.length === 1);
  }

  public calculateGraphsLayout(delay = 200, graphsPerRow?: number) {
    if (this.graphsState().noGraphs()) {
      return;
    }
    this.timer = window.setTimeout(() => {
      const containerWidth = this.el.nativeElement.clientWidth;
      graphsPerRow = graphsPerRow ?? this.allGroupsSingleGraphs() ? 1 : this.graphsState().graphsPerRow();
      if (this.allGraphs()?.length > 0 && containerWidth) {
        while (containerWidth / graphsPerRow < this.minWidth && graphsPerRow > 1 || containerWidth / graphsPerRow < this.graphsState().maxUserWidth()) {
          graphsPerRow -= 1;
        }
        const width = Math.floor(containerWidth / graphsPerRow);
        this.width = width - 16 / graphsPerRow;
        this.height = this.graphsState().maxUserHeight() || this.height;
        if (!this.isGroupGraphs()) {
          this.allMetricGroups()?.forEach(metricGroup => this.renderer.setStyle(metricGroup.nativeElement, 'width', `${this.width}px`));
          this.allMetricGroups()?.forEach(metricGroup => this.renderer.setStyle(metricGroup.nativeElement, 'height', `${this.height}px`));
        } else {
          this.allMetricGroups()?.forEach(metricGroup => this.renderer.removeStyle(metricGroup.nativeElement, 'width'));
          this.allMetricGroups()?.forEach(metricGroup => this.renderer.removeStyle(metricGroup.nativeElement, 'height'));
          this.singleGraphs()?.forEach(singleGraph => this.renderer.setStyle(singleGraph.nativeElement, 'width', `${this.width}px`));
          this.singleGraphs()?.forEach(singleGraph => this.renderer.setStyle(singleGraph.nativeElement, 'height', `${this.height}px`));
        }
      }
      this.graphsState().graphsPerRow.set(graphsPerRow);
      this.changeDetection.markForCheck();
      this.allGraphs().forEach((graph) => graph.redrawPlot());
    }, delay);
  }

  sizeChanged($event: ResizeEvent) {
    this.activeResizeElement = null;
    if ($event.edges.right) {
      const containerWidth = this.el.nativeElement.clientWidth;
      const userWidth = $event.rectangle.width;
      const graphsPerRow = this.calcGraphPerRow(userWidth, containerWidth);
      this.store.dispatch(setGraphsPerRow({graphsPerRow: graphsPerRow}));

      if (!this.isGroupGraphs()) {
        this.allMetricGroups().forEach(metricGroup => {
          this.width = containerWidth / graphsPerRow - 16 / graphsPerRow - 2;
          this.renderer.setStyle(metricGroup.nativeElement, 'width', `${this.width}px`);
        });
      } else {
        this.allMetricGroups()?.forEach(metricGroup => this.renderer.removeStyle(metricGroup.nativeElement, 'width'));
        this.allMetricGroups()?.forEach(metricGroup => this.renderer.removeStyle(metricGroup.nativeElement, 'height'));
        this.singleGraphs().forEach(singleGraph => {
          this.width = containerWidth / graphsPerRow - 16 / graphsPerRow - 2;
          this.renderer.setStyle(singleGraph.nativeElement, 'width', `${this.width}px`);
        });
      }
    }
    if ($event.edges.bottom) {
      this.height = $event.rectangle.height;
      if (!this.isGroupGraphs()) {
        this.allMetricGroups()?.forEach(metricGroup =>
          this.renderer.setStyle(metricGroup.nativeElement, 'height', `${this.height}px`));
        this.singleGraphs()?.forEach(singleGraph =>
          this.renderer.setStyle(singleGraph.nativeElement, 'height', '100%'));
      } else {
        this.singleGraphs()?.forEach(singleGraph =>
          this.renderer.setStyle(singleGraph.nativeElement, 'height', `${this.height}px`));
      }
    }
    this.changeDetection.detectChanges();
  }

  private calcGraphPerRow(userWidth: number, containerWidth: number) {
    let graphsPerRow: number;
    if (userWidth > 0.75 * containerWidth) {
      graphsPerRow = 1;
    } else if (userWidth > 0.33 * containerWidth) {
      graphsPerRow = 2;
    } else {
      graphsPerRow = Math.floor(containerWidth / userWidth);
    }
    return Math.min(graphsPerRow, this.graphsNumberLimit);
  }

  resizeStarted(metricGroup: HTMLDivElement, singleGraph?: HTMLDivElement) {
    this.activeResizeElement = singleGraph;
    this.changeDetection.detectChanges();
    this.graphsNumberLimit = this.isGroupGraphs() ? metricGroup.querySelectorAll(':not(.resize-ghost-element) > sm-single-graph').length : this.graphsState().graphList().length;
    this.resizeTextElement = singleGraph?.parentElement.querySelectorAll<HTMLDivElement>('.resize-ghost-element .resize-overlay-text')[0];
  }

  onResizing($event: ResizeEvent) {
    if ($event.edges.right && this.resizeTextElement) {
      const graphsPerRow = this.calcGraphPerRow($event.rectangle.width, this.el.nativeElement.clientWidth);
      this.store.dispatch(setGraphsPerRow({graphsPerRow: graphsPerRow}));
      const text = `${graphsPerRow > 1 ? graphsPerRow + ' graphs' : '1 graph'} per row`;
      this.renderer.setProperty(this.resizeTextElement, 'textContent', text);
    }
  }

  validateResize($event: ResizeEvent): boolean {
    return $event.rectangle.width > 350 && $event.rectangle.height > 250;
  }

  scrollToGraph(id: string, group?: boolean) {
    const allGraphElements = this.allMetrics().nativeElement.getElementsByClassName(group ? 'graph-id' : 'single-graph-container');
    const element = allGraphElements[EXPERIMENT_GRAPH_ID_PREFIX + id] as HTMLDivElement;
    if (element) {
      element.scrollIntoView({behavior: 'smooth'});
    } else if (this.singleValueData()?.length > 0 && this.hiddenList()?.includes(singleValueChartTitle)) {
      this.allMetrics().nativeElement.scrollTo({top: 0, behavior: 'smooth'});
    } else if (this.allMetrics().nativeElement.getElementsByClassName('single-value-summary-section')) {
      this.allMetrics().nativeElement.scrollTo({top: 0, behavior: 'smooth'});
    }
  }


  private addId(sortGraphsData1: Record<string, ExtFrame[]>): Record<string, VisibleExtFrame[]> {
    return Object.entries(sortGraphsData1).reduce((acc, [label, graphs]) =>
      ({
        ...acc,
        [label]: graphs.map((graph) => ({
          ...graph,
          id: v4()
        }))
      }), {} as Record<string, VisibleExtFrame[]>);
  }

  public generateIdentifier = (chartItem: ExtFrame) =>
    `${this.singleGraphidPrefix} ${this.experimentGraphidPrefix} ${chartItem.metric} ${chartItem.layout.title} ${chartItem.iter} ${chartItem.variant} ${(chartItem.layout.images && chartItem.layout.images[0]?.source)}`;


  creatingEmbedCodeGroup(metric: VisibleExtFrame[], domRect) {
    const metricName = metric[0].metric;
    const objects = metric.map(m => m.data.filter(p => !p.fakePlot).map(p => p.task)).flat().filter(obj => obj);
    const copyAllPlots = this.visibility()[metric[0].metric]?.[0] === null ||
      this.visibility()[`${metric[0].metric} - ${metric[0].variant}`] === null ||
      this.visibility()[`${metric[0].metric}${metric[0].variant}`] === null;
    this.createEmbedCode.emit({
      xaxis: this.xAxisType(),
      originalObject: objects.length > 0 ? objects : Array.from(new Set(metric.map(m => m.task))),
      metrics: [metric[0]?.metric],
      variants: copyAllPlots ? metric.map(m => m.variant) : Object.keys(this.list()[metricName] || {}).filter((metric, i) => this.visibility()[metricName]?.[i]),
      seriesName: metric.map(m => m.data[0]?.seriesName),
      ...(this.xAxisType() && {xaxis: this.xAxisType()}),
      group: true,
      plotsNames: metric.map(plot => plot.layout.name ?? plot.layout.title as string),
      domRect: domRect.getBoundingClientRect()
    });
  }

  creatingEmbedCode(chartItem: ExtFrame, {domRect, xaxis}: { xaxis: ScalarKeyEnum; domRect: DOMRect }) {
    if (!chartItem) {
      this.createEmbedCode.emit({xaxis, domRect});
      return;
    }

    if (!this.isCompare() && this.groupBy() === groupByCharts.none) {
      // split scalars by variants
      this.createEmbedCode.emit({
        metrics: [chartItem.data[0].originalMetric ?? chartItem.metric?.trim()],
        variants: [chartItem.data[0].name],
        ...((xaxis || this.xAxisType()) && {xaxis: xaxis ?? this.xAxisType()}),
        domRect
      });
    } else {
      this.createEmbedCode.emit({
        originalObject: chartItem.data.filter(p => !p.fakePlot).map(p => p.task).flat(),
        metrics: [chartItem.metric],
        variants: chartItem.variants ?? [chartItem.variant],
        ...((xaxis || this.xAxisType()) && {xaxis: xaxis ?? this.xAxisType()}),
        ...(chartItem.data.length < 2 && {originalObject: [chartItem.task]}),
        ...(chartItem.data[0]?.seriesName && {seriesName: [chartItem.data[0]?.seriesName]}),
        domRect
      });
    }
  }

  checkIfLegendToTitle(chartItem: ExtFrame) {
    return this.isGroupGraphs()! && checkIfLegendToTitle(chartItem);
  }

  inHiddenList = (metric: string, variant: string) => {
    return inHiddenList(this.isCompare(), this.hiddenList(), metric, variant);
  };

  collapseGroup(groupElement: HTMLDivElement) {
    if (groupElement.classList.contains('group-collapsed')) {
      this.renderer.removeClass(groupElement, 'group-collapsed');
    } else {
      this.renderer.addClass(groupElement, 'group-collapsed');

    }
  }

  chartPreferencesChanged(chartItem: Partial<ExtFrame>, $event: ChartPreferences) {
    this.chartSettingsChanged.emit({id: !chartItem.variant ? chartItem.metric : `${chartItem.metric}_-_${chartItem.variant}`, changes: $event});
  }
}
