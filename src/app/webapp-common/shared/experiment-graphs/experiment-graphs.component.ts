import {ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, effect, ElementRef, inject, input, model, NgZone, output, Renderer2, signal, untracked, viewChild, viewChildren} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {allowedMergedTypes, checkIfLegendToTitle, sortMetricsList} from '../../tasks/tasks.utils';
import {SingleGraphComponent} from '../single-graph/single-graph.component';
import {ChartHoverModeEnum, EXPERIMENT_GRAPH_ID_PREFIX, SINGLE_GRAPH_ID_PREFIX, singleValueChartTitle} from '../../experiments/shared/common-experiments.const';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {GroupByCharts, groupByCharts} from '../../experiments/actions/common-experiment-output.actions';
import {Store} from '@ngrx/store';
import {ResizableDirective, ResizeEvent, ResizeHandleDirective} from 'angular-resizable-element';
import {distinctUntilChanged, skip, tap} from 'rxjs/operators';
import {combineLatest, Observable, of} from 'rxjs';
import {ChartPreferences, ExtFrame, ExtLegend, VisibleExtFrame} from '../single-graph/plotly-graph-base';
import {signUrls} from '../../core/actions/common-auth.actions';
import {getSignedUrlOrOrigin$} from '../../core/reducers/common-auth-reducer';
import {EventsGetTaskSingleValueMetricsResponseValues} from '~/business-logic/model/events/eventsGetTaskSingleValueMetricsResponseValues';
import {v4} from 'uuid';
import {selectChartSettings, selectExperimentOrModelId} from '@common/experiments/reducers';
import {setGraphsPerRow} from '@common/experiments/actions/common-experiment-output.actions';
import {SmoothTypeEnum} from '@common/shared/single-graph/single-graph.utils';
import {maxInArray} from '@common/shared/utils/helpers.util';
import {explicitEffect} from 'ngxtension/explicit-effect';
import {GroupedList} from '@common/tasks/tasks.model';
import {computedPrevious} from 'ngxtension/computed-previous';
import {selectPlotlyReady} from '@common/core/reducers/view.reducer';
import {injectResize} from 'ngxtension/resize';
import {MatIconModule} from '@angular/material/icon';
import {SingleValueSummaryTableComponent} from '@common/shared/single-value-summary-table/single-value-summary-table.component';
import {GetCounterStringPipe} from '@common/shared/experiment-graphs/filter-hidden.pipe';
import {PushPipe} from '@ngrx/component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatIconButton} from '@angular/material/button';
import {GraphViewerComponent} from '@common/shared/single-graph/graph-viewer/graph-viewer.component';
import {MatDialog} from '@angular/material/dialog';
import {GraphViewerData} from '@common/shared/single-graph/graph-viewer/graph-viewer.consts';
import {selectHighlightedTaskId} from '@common/experiments-compare/reducers';
import {injectParams} from 'ngxtension/inject-params';
import {toSignal} from '@angular/core/rxjs-interop';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {isEqual} from 'lodash-es';

export const inHiddenList = (isCompare: boolean, hiddenList: string[], metric: string, variant: string, isGrouped: boolean, isListFlat: boolean) => {
  if (!hiddenList) {
    return false;
  }

  if (hiddenList.length === 0) {
    return true;
  }

  if (isCompare) {
    const metricVariantWithDash = variant ? `${metric} - ${variant}` : metric;
    const metricVariantConcat = `${metric}${variant ?? ''}`;

    const isSelected = hiddenList.some(m =>
      ( isListFlat && isGrouped && m === metric) || // only for compare scalar grouped and list is nested
      m === metricVariantWithDash ||
      m === metricVariantConcat ||
      (variant === '' && (m.startsWith(`${metric} - `) || m.startsWith(metric)))
    );
    return !isSelected;
  }

  const metVar = `${metric}${variant ?? ''}`;
  if (variant) {
    return !hiddenList.includes(metVar);
  }
  return !hiddenList.includes(metric);
};

@Component({
  selector: 'sm-experiment-graphs',
  templateUrl: './experiment-graphs.component.html',
  styleUrls: ['./experiment-graphs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    SingleValueSummaryTableComponent,
    GetCounterStringPipe,
    PushPipe,
    ResizableDirective,
    ResizeHandleDirective,
    TooltipDirective,
    MatIconButton,
    SingleGraphComponent
  ]
})

export class ExperimentGraphsComponent {
  private renderer = inject(Renderer2);
  private destroy = inject(DestroyRef);
  private el = inject(ElementRef);
  private changeDetection = inject(ChangeDetectorRef);
  private store = inject(Store);
  private resize = injectResize();
  private readonly zone = inject(NgZone);
  private readonly dialog = inject(MatDialog);
  protected ids = injectParams.global('ids');

  readonly experimentGraphidPrefix = EXPERIMENT_GRAPH_ID_PREFIX;
  readonly singleGraphidPrefix = SINGLE_GRAPH_ID_PREFIX;
  allMetrics = viewChild<ElementRef>('allMetrics');
  public height = 450;
  public width: number;
  public activeResizeElement: HTMLDivElement;
  hiddenList = input<string[]>();
  isGroupGraphs = input<boolean>();
  legendStringLength = input(19);
  minimized = input<boolean>();
  isDarkTheme = input<boolean>();
  showLoaderOnDraw = input(true);
  legendConfiguration = input<Partial<ExtLegend>>({});
  breakPoint = input(700);
  isCompare = input(false);
  noTasks = input(false);
  hideLegend = input(false);
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
  lineWidth = input<number>();
  skipLayoutCalc = input<boolean>(false);
  metrics = input<Record<string, ExtFrame[]>>();
  list = input<GroupedList>();
  resetGraphs = output();
  createEmbedCode = output<{
    metrics?: string[];
    variants?: string[];
    originalObject?: string[];
    xaxis?: ScalarKeyEnum;
    group?: boolean;
    plotsNames?: string[];
    seriesName?: string[];
    domRect: DOMRect;
    singleValues?: boolean;
  }>();
  chartSettingsChanged = output<{ id: string, changes: ChartPreferences }>();
  allMetricGroups = viewChildren<ElementRef>('metricGroup');
  singleGraphs = viewChildren<ElementRef>('singleGraphContainer');
  singleValueGraph = viewChildren<SingleGraphComponent>('singleValueGraph');
  allGraphs = viewChildren(SingleGraphComponent);
  allGraphsPrevious = computedPrevious(this.allGraphs);
  visibility = computed(() => {
    const isCompare = this.isCompare();
    const hiddenList = this.hiddenList();
    return Object.entries(this.list() || {}).reduce((acc, [metric, plots]) => {
      const variants = Object.keys(plots);
      acc[metric] = variants.length > 0 ? variants.map(variant =>
        (isCompare && hiddenList?.includes(metric) && metric.endsWith(` - ${variant}`)) ?
          null :
          !this.inHiddenList(metric, variant)
      ) : null;
      return acc;
    }, {} as Record<string, (boolean | null)[]>);
  });
  protected readonly singleValueChartTitle = singleValueChartTitle;
  protected graphsData = signal<Record<string, VisibleExtFrame[]>>(null);
  protected graphsPerRow = signal(2);
  protected graphList = computed(() => this.graphsData() ? sortMetricsList(Object.keys(this.graphsData())) : []);
  protected noGraphs = computed(() => this.graphsData() !== null && Object.keys(this.graphsData()).length === 0);
  protected allHidden = computed(() => {
    if (this.loading()) {
      return false;
    }
    if (this.noTasks()) {
      return false;
    }

    const noGraphs = this.noGraphs() && Object.keys(this.list() || {}).length > 0;
    const anyVisibleMetric = this.graphList().some(metric => !this.inHiddenList(metric, ''));
    const singleValueVisible = this.singleValueData()?.length > 0 &&
      this.hiddenList()?.includes(this.singleValueChartTitle);

    const hasAnyCharts = this.graphList().length > 0 || !!this.singleValueData()?.length || this.isMultiSingleValuesVisible() || noGraphs;
    return hasAnyCharts && !(anyVisibleMetric || singleValueVisible || this.isMultiSingleValuesVisible());
  });
  protected numIterations = computed(() => Array.from(new Set(Object.values(this.graphsData() ?? {}).reduce((acc, frames) =>
    [...acc, ...frames.map(frame => frame.iter)], []).flat())).filter(a => Number.isInteger(a)).length);
  protected maxUserWidth = computed(() => maxInArray(Object.values(this.graphsData() ?? {}).flat().map((chart: ExtFrame) => chart.layout?.width || 0)));
  protected maxUserHeight = computed(() => maxInArray(Object.values(this.graphsData() ?? {}).flat().map((chart: ExtFrame) => chart.layout?.height || 0)));

  protected multipleSingleValueDataFiltered = computed(() => {
    const data = this.multipleSingleValueData();
    if (!this.isCompare() || !data) {
      return data;
    }
    const ids = this.ids()?.split(',');
    if (!ids) {
      return data;
    }
    return {
      ...data,
      data: data.data?.filter(trace => !trace.task || ids.includes(trace.task))
    } as ExtFrame;
  });

  protected readonly isMultiSingleValuesVisible = computed(() => {
    const hiddenList  = this.hiddenList() || [];
    const multipleSingleValueDataFiltered = this.multipleSingleValueDataFiltered();
    return (hiddenList === null || this.multipleSingleValuePlotNames().some( name => hiddenList?.includes(name))) && multipleSingleValueDataFiltered?.data?.length > 0 && this.groupBy() === 'metric'
  });

  private multipleSingleValuePlotNames = computed(() => {
    const multipleSingleValueDataFiltered = this.multipleSingleValueDataFiltered();
    if (!multipleSingleValueDataFiltered) {
      return [] as string[];
    }
    const singleMetricNames = multipleSingleValueDataFiltered.data?.[0]?.x as string[] ?? [];
    return [' Summary', ...singleMetricNames.map(singleMetricName => ` Summary${singleMetricName}`)];
  });


  loading = computed(() => this.graphsData() === null);
  protected signedImagePlots: Record<string, Observable<string[]>> = {};
  protected chartSettings: Record<string, Observable<ChartPreferences>> = {};
  protected plotlyReady = this.store.selectSignal(selectPlotlyReady);
  private storeHighlightedIds = this.store.selectSignal(selectHighlightedTaskId);
  protected highlightedTaskId = computed(() => this.ids() ? this.storeHighlightedIds() : null);
  protected highlightedTaskIdPrevious = null;
  protected hiddenTracesByPlot = signal<Record<string, number[]>>({});

  protected graphsDataHighlighted = computed(() => {
    const graphsData = this.graphsData();
    const highlighted = this.highlightedTaskId();
    if (!graphsData) {
      return graphsData;
    }
    return Object.entries(graphsData).reduce((acc, [metric, frames]) => {
      acc[metric] = frames?.map(frame => {
        const updatedData = this.getUpdatedChartWithHighlight(frame, highlighted, this.generateIdentifier(frame));
        return {...frame, data: updatedData};
      }) ?? [];
      return acc;
    }, {} as Record<string, VisibleExtFrame[]>);
  });

  protected multipleSingleValueDataFilteredHighlighted = computed(() => {
    const data = this.multipleSingleValueDataFiltered();
    const highlighted = this.highlightedTaskId();
    if (!data) {
      return data;
    }
    return {
      ...data,
      data: this.getUpdatedChartWithHighlight(data, highlighted, this.generateIdentifier(data))
    } as ExtFrame;
  });

  private isListFlat = computed(() => {
    return !Object.values(this.list()).some(item => Object.keys(item).length > 0);
  })

  private timer: number;
  private minWidth = 350;
  private resizeTextElement: HTMLDivElement;
  private graphsNumberLimit: number;
  private previousWindowWidth: number;
  private previousCompareIds: string;

  constructor() {
    // reset graphs only when compare IDs actually change
    effect(() => {
      const ids = this.ids() as string | undefined;
      if (this.isCompare() && ids !== this.previousCompareIds) {
        if (ids === '') {
          this.graphsData.set({});
        } else {
          this.graphsData.set(null);
        }
        this.hiddenTracesByPlot.set({});
        this.previousCompareIds = ids;
      }
    });

    effect(() => {
      if (this.isCompare() && this.noTasks()) {
        this.graphsData.set({});
      this.hiddenTracesByPlot.set({});
      }
    });

    effect(() => {
      if (this.allGraphsPrevious()?.length === 0 && this.allGraphs()?.length > 0) {
        this.calculateGraphsLayout(0);
      }
    });


    effect(() => {
      if (this.graphsData() || this.splitSize() || this.groupBy()) {
        untracked(() => {
          // Enter only if caused by non-highlight actions
          if (this.allGraphs() && this.highlightedTaskId() === null && this.highlightedTaskIdPrevious === null) {
            this.allMetricGroups()?.forEach(metricGroup => this.renderer.removeStyle(metricGroup.nativeElement, 'width'));
            this.calculateGraphsLayout(0);
          }
          this.highlightedTaskIdPrevious = this.highlightedTaskId();
        });
      }
    });

    effect(() => {
      if (this.maxUserHeight()) {
        this.height = this.maxUserHeight();
      }
    });

    explicitEffect(
      [this.metrics, this.ids, this.singleValueData, this.multipleSingleValueData, this.list],
      ([metrics, paramIds]) => {
        let filteredMetrics = metrics;
        if (this.isCompare() && paramIds) {
          const ids = paramIds.split(',');
          filteredMetrics = Object.entries(metrics || {}).reduce((acc, [metric, frames]) => {
            const filteredFrames = frames.map(frame => {
              if (frame.task && !ids.includes(frame.task)) {
                return null;
              }
              const filteredData = frame.data?.filter(trace => !trace.task || ids.includes(trace.task));
              if (filteredData?.length === 0 && !frame.task) {
                return null;
              }
              return {...frame, data: filteredData};
            }).filter(f => !!f);

            if (filteredFrames.length > 0) {
              acc[metric] = filteredFrames;
            }
            return acc;
          }, {} as Record<string, ExtFrame[]>);
        }

        const hasData = (filteredMetrics && Object.keys(filteredMetrics).length > 0) ||
          (this.singleValueData()?.length > 0) || this.multipleSingleValueDataFiltered()?.data?.length > 0;

        if (!hasData) {
          if (metrics !== undefined) {
            this.graphsData.set({});
          }
          return;
        }
        const graphsData = this.addId(this.sortGraphsData(filteredMetrics || {}));
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
        this.singleValueData.set([]);
        this.multipleSingleValueData.set(null);
        this.hiddenTracesByPlot.set({});
      });

    this.resize
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.onResize());

    this.destroy.onDestroy(() => {
      this.store.dispatch(setGraphsPerRow({graphsPerRow: 2}));
    });
  }

  onResize() {
    clearTimeout(this.timer);
    if (window.innerWidth !== this.previousWindowWidth) {
      this.graphsPerRow.set(this.allGroupsSingleGraphs() ? 1 : this.graphsPerRow());
    }
    this.calculateGraphsLayout();
    this.previousWindowWidth = window.innerWidth;
  }

  sortGraphsData = (data: Record<string, ExtFrame[]>) =>
    Object.entries(data).reduce((acc, [label, graphs]) =>
      ({
        ...acc,
        [label]: graphs.sort((a, b) => {
          const aTitle = (a.layout.title as { text: string })?.text ?? a.layout.title as string;
          const bTitle = (b.layout.title as { text: string })?.text ?? b.layout.title as string;
          a.layout.title = {text: aTitle || ''};
          b.layout.title = {text: bTitle || ''};
          return aTitle === bTitle ?
            b.iter - a.iter :
            aTitle.localeCompare(bTitle, undefined, {
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

  public calculateGraphsLayout(delay = 200, graphsPerRow?: number) {
    if (this.noGraphs() || this.skipLayoutCalc()) {
      return;
    }
    this.timer = window.setTimeout(() => {
      const containerWidth = this.el.nativeElement.clientWidth;
      graphsPerRow = graphsPerRow ?? (this.allGroupsSingleGraphs() ? 1 : this.graphsPerRow());
      if (this.allGraphs()?.length > 0 || this.allMetricGroups()?.length > 0 && containerWidth) {
        while (containerWidth / graphsPerRow < this.minWidth && graphsPerRow > 1 || containerWidth / graphsPerRow < this.maxUserWidth()) {
          graphsPerRow -= 1;
        }
        const width = Math.floor(containerWidth / graphsPerRow);
        this.width = width - 16 / graphsPerRow;
        this.height = this.maxUserHeight() || this.height;
        if (!this.isGroupGraphs()) {
          this.singleGraphs()?.forEach(metricGroup => this.renderer.removeStyle(metricGroup.nativeElement, 'width'));
          this.singleGraphs()?.forEach(metricGroup => this.renderer.removeStyle(metricGroup.nativeElement, 'height'));
          this.allMetricGroups()?.forEach(metricGroup => this.renderer.setStyle(metricGroup.nativeElement, 'width', `${this.width}px`));
          this.allMetricGroups()?.forEach(metricGroup => this.renderer.setStyle(metricGroup.nativeElement, 'height', `${this.height}px`));
        } else {
          this.allMetricGroups()?.forEach(metricGroup => this.renderer.removeStyle(metricGroup.nativeElement, 'width'));
          this.allMetricGroups()?.forEach(metricGroup => this.renderer.removeStyle(metricGroup.nativeElement, 'height'));
          this.singleGraphs()?.forEach(singleGraph => this.renderer.setStyle(singleGraph.nativeElement, 'width', `${this.width}px`));
          this.singleGraphs()?.forEach(singleGraph => this.renderer.setStyle(singleGraph.nativeElement, 'height', `${this.height}px`));
        }
      }
      this.graphsPerRow.set(graphsPerRow);
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
      this.graphsPerRow.set(graphsPerRow);
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

  resizeStarted(metricGroup: HTMLDivElement, singleGraph?: HTMLDivElement) {
    this.activeResizeElement = singleGraph;
    this.changeDetection.detectChanges();
    this.graphsNumberLimit = this.isGroupGraphs() ? metricGroup.querySelectorAll(':not(.resize-ghost-element) > sm-single-graph').length : this.graphList().length;
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

  public generateIdentifier = (chartItem: ExtFrame) =>
    `${this.singleGraphidPrefix} ${this.experimentGraphidPrefix} ${chartItem.metric} ${chartItem.layout.title?.text} ${chartItem.iter} ${chartItem.variant} ${(chartItem.layout.images && chartItem.layout.images[0]?.source)}`;

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
      singleValues: metric[0].layout.type === 'singleValues',
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
        singleValues: chartItem.layout.type === 'singleValues',
        domRect
      });
    }
  }

  checkIfLegendToTitle(chartItem: ExtFrame) {
    return this.isGroupGraphs()! && checkIfLegendToTitle(chartItem);
  }

  inHiddenList = (metric: string, variant: string) => {
    return inHiddenList(this.isCompare(), this.hiddenList(), metric, variant, this.isGroupGraphs(), this.isListFlat());
  };

  collapseGroup(groupElement: HTMLDivElement) {
    if (groupElement.classList.contains('group-collapsed')) {
      this.renderer.removeClass(groupElement, 'group-collapsed');
    } else {
      this.renderer.addClass(groupElement, 'group-collapsed');

    }
  }

  chartPreferencesChanged(chartItem: Partial<ExtFrame>, $event: ChartPreferences) {
    this.chartSettingsChanged.emit({
      id: !chartItem.variant ? chartItem.metric : `${chartItem.metric}_-_${chartItem.variant}`,
      changes: $event
    });
  }

  private allGroupsSingleGraphs() {
    const groups = Object.values(this.graphsData() || {});
    return (this.isGroupGraphs() || this.disableResize() || groups.length === 1) && groups.length !== 0 && groups.every(group => group.length === 1);
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

  private getUpdatedChartWithHighlight(frame: ExtFrame, highlighted: string, identifier: string) {
    const hiddenIndices = this.hiddenTracesByPlot()[identifier] || [];
    return frame.data?.map((trace, i) => {
      if (!allowedMergedTypes.includes(trace.type)) {
        return trace;
      }
      const taskId = trace.task || frame.task;
      const isHighlighted = trace.type && highlighted && taskId === highlighted;
      const isHidden = hiddenIndices.includes(i);
      const effectiveOpacity = highlighted ? (isHighlighted ? 1 : 0.3) : 1;
      return {
        ...trace,
        opacity: effectiveOpacity,
        visible: (isHidden ? 'legendonly' : true) as boolean | 'legendonly'
      };
    });
  }

  onHiddenTracesChanged(plotId: string, hiddenIndices: number[]) {
    this.hiddenTracesByPlot.update(all => ({...all, [plotId]: hiddenIndices}));
  }

  protected maximize(data: GraphViewerData) {
    this.zone.run(() => {
      this.dialog.open<GraphViewerComponent, GraphViewerData>(GraphViewerComponent, {
        data,
        panelClass: ['image-viewer-dialog', 'full-screen'],
        maxWidth: 'auto'
      });
    });
  }
}
