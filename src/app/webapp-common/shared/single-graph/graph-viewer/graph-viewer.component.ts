import {AfterViewInit, ChangeDetectorRef, Component, HostListener, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ChartPreferences, ExtFrame, ExtLegend} from '../plotly-graph-base';
import {Store} from '@ngrx/store';
import {Observable, Subject, Subscription} from 'rxjs';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {MatSelectChange} from '@angular/material/select';
import {debounceTime, filter, map, take} from 'rxjs/operators';
import {checkIfLegendToTitle, convertPlots, groupIterations} from '@common/tasks/tasks.utils';
import {addMessage} from '@common/core/actions/layout.actions';
import {
  getGraphDisplayFullDetailsScalars, getNextPlotSample, getPlotSample, setGraphDisplayFullDetailsScalars, setGraphDisplayFullDetailsScalarsIsOpen, setViewerBeginningOfTime, setViewerEndOfTime,
  setXtypeGraphDisplayFullDetailsScalars
} from '@common/shared/single-graph/single-graph.actions';
import {
  selectCurrentPlotViewer, selectFullScreenChart, selectFullScreenChartIsFetching, selectFullScreenChartXtype, selectMinMaxIterations, selectViewerBeginningOfTime, selectViewerEndOfTime
} from '@common/shared/single-graph/single-graph.reducer';
import {getSignedUrl} from '@common/core/actions/common-auth.actions';
import {selectSignedUrl} from '@common/core/reducers/common-auth-reducer';
import {Color, LayoutAxis} from 'plotly.js';
import {SmoothTypeEnum, smoothTypeEnum} from '@common/shared/single-graph/single-graph.utils';
import {SingleGraphComponent} from '@common/shared/single-graph/single-graph.component';

export interface GraphViewerData {
  chart: ExtFrame;
  id: string;
  xAxisType?: 'iter' | 'timestamp' | 'iso_time';
  chartSettings?: ChartPreferences;
  smoothWeight?: number;
  smoothType?: SmoothTypeEnum;
  hideNavigation: boolean;
  isCompare: boolean;
  moveLegendToTitle: boolean;
  showOrigin: boolean;
  embedFunction: (data: { xaxis: ScalarKeyEnum; domRect: DOMRect }) => void;
  legendConfiguration: Partial<ExtLegend>;
  darkTheme?: boolean;
  dialogTitle?: string;
}

@Component({
    selector: 'sm-graph-viewer',
    templateUrl: './graph-viewer.component.html',
    styleUrls: ['./graph-viewer.component.scss'],
    standalone: false
})
export class GraphViewerComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('singleGraph') singleGraph: SingleGraphComponent;
  @ViewChild('modalContainer') modalContainer;
  public height;
  public width;
  private sub = new Subscription();
  public minMaxIterations$: Observable<{ minIteration: number; maxIteration: number }>;
  public isFetchingData$: Observable<boolean>;
  public xAxisType$: Observable<GraphViewerData['xAxisType']>;
  public xAxisType: GraphViewerData['xAxisType'];
  public isCompare: boolean;
  public isFullDetailsMode: boolean;
  public iteration: number;
  public beginningOfTime$: Observable<boolean>;
  public endOfTime$: Observable<boolean>;
  public currentPlotEvent$: Observable<any>;
  private iterationChanged$ = new Subject<number>();
  private isForward = true;
  protected reportWidget = false;
  private charts: ExtFrame[];
  public index: number = null;
  public embedFunction: (data: { xaxis: ScalarKeyEnum; domRect: DOMRect }) => void;
  public showSmooth: boolean;
  protected readonly smoothTypeEnum = smoothTypeEnum;
  public smoothType: SmoothTypeEnum;
  public showOrigin: boolean;
  private _chart: ExtFrame;
  public title: string;
  public checkIfLegendToTitle = checkIfLegendToTitle;
  private range: { xaxis: LayoutAxis[]; yaxis: LayoutAxis[] };

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowRight':
        if (!this.isFullDetailsMode && !this. isCompare && !this.disableNavigation) {
          this.next();
        }
        break;
      case 'ArrowLeft':
        if (!this.isFullDetailsMode && !this. isCompare && !this.disableNavigation) {
          this.previous();
        }
        break;
      case 'ArrowUp':
        this.nextIteration();
        break;
      case 'ArrowDown':
        this.previousIteration();
        break;
    }
  }

  @HostListener('window:resize')
  onResize() {
    if (this.singleGraph) {
      this.singleGraph.shouldRefresh = true;
    }
    this.width = this.modalContainer.nativeElement.clientWidth;
    this.height = this.modalContainer.nativeElement.clientHeight - 80;
  }

  public set chart(chart: ExtFrame) {
    this._chart = chart;
    this.title = this.getTitle(chart);
  }

  get chart() {
    return this._chart;
  }

  public id: string;
  public disableNavigation: boolean;
  public chart$: Observable<ExtFrame>;
  public plotLoaded = false;
  public beginningOfTime = false;
  public endOfTime = false;
  freezeColor: Color | undefined;
  smoothWeight: number | null = 0;
  xAxisTypeOption = [
    {
      name: 'Iterations',
      value: ScalarKeyEnum.Iter
    },
    {
      name: 'Time from start',
      value: ScalarKeyEnum.Timestamp
    },
    {
      name: 'Wall time',
      value: ScalarKeyEnum.IsoTime
    }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: GraphViewerData,
    public dialogRef: MatDialogRef<GraphViewerComponent>,
    private store: Store,
    private cdr: ChangeDetectorRef
  ) {
    this.chart$ = this.store.select(selectFullScreenChart);
    this.currentPlotEvent$ = this.store.select(selectCurrentPlotViewer);
    this.xAxisType$ = this.store.select(selectFullScreenChartXtype);
    this.isFetchingData$ = this.store.select(selectFullScreenChartIsFetching);
    this.minMaxIterations$ = this.store.select(selectMinMaxIterations);
    this.beginningOfTime$ = this.store.select(selectViewerBeginningOfTime);
    this.endOfTime$ = this.store.select(selectViewerEndOfTime);
    if (data.xAxisType) {
      this.store.dispatch(setXtypeGraphDisplayFullDetailsScalars({xAxisType: data.xAxisType}));
    }
    this.store.dispatch(setGraphDisplayFullDetailsScalarsIsOpen({isOpen: true}));
    this.isCompare = data.isCompare;
    this.showSmooth = ['multiScalar', 'scalar'].includes(data.chart.layout.type);
    this.reportWidget = this.data.id === 'report-widget';
    this.isFullDetailsMode = this.showSmooth && !this.isCompare && !this.reportWidget;
    this.id = data.id;
    this.embedFunction = data.embedFunction;
    this.disableNavigation = data.hideNavigation;
    this.smoothWeight = data.smoothWeight ?? 0;
    this.smoothType = data.smoothType ?? smoothTypeEnum.exponential;
    this.showOrigin = data.showOrigin;

    const reqData = {
      task: this.data.chart.task,
      metric: this.data.chart.metric,
      iteration: this.data.chart.iter
    };
    if (this.isFullDetailsMode) {
      this.store.dispatch(setGraphDisplayFullDetailsScalars({data: data.chart}));
    } else if (this.isCompare || this.disableNavigation || this.reportWidget) {
      this.chart = data.chart;
      this.plotLoaded = true;
      setTimeout(() => {
        if (this.chart.layout.xaxis) {
          this.chart.layout.xaxis.autorange = true;
        }
        if (this.chart.layout.yaxis) {
          this.chart.layout.yaxis.autorange = true;
        }
      });
    } else {
      this.store.dispatch(getPlotSample(reqData));
      this.range = {xaxis: data.chart.layout.xaxis.range, yaxis: data.chart.layout.yaxis.range};
    }
  }


  ngOnInit(): void {
    ////////////// SCALARS //////////////////////
    if (this.isFullDetailsMode) {
      this.store.dispatch(getGraphDisplayFullDetailsScalars({
        task: this.data.chart.data[0].task,
        metric: {metric: (this.data.chart.data[0].originalMetric ?? this.data.chart.metric)}
      }));
    }
    this.sub.add(this.xAxisType$.subscribe((xType) => this.xAxisType = xType));

    ////////////// PLOTS //////////////////////

    this.sub.add(this.currentPlotEvent$
      .pipe(filter(plot => !!plot))
      .subscribe(currentPlotEvents => {
        this.plotLoaded = true;
        const groupedPlots = groupIterations(currentPlotEvents);
        const {graphs, parsingError} = convertPlots({plots: groupedPlots, id: 'viewer'});
        if (parsingError){
          this.store.dispatch(addMessage('warn', `Couldn't read all plots. Please make sure all plots are properly formatted (NaN & Inf aren't supported).`, [], true));
        }
        Object.values(graphs).forEach((graphss: ExtFrame[]) => {
          graphss.forEach((graph: ExtFrame) => {
            graph.data?.forEach((d, i) => d.visible = this.data.chart.data[i]?.visible);
            // if (this.data.chart?.layout?.showlegend === false) {
            graph.layout.showlegend = this.data.chart?.layout?.showlegend ?? false;
            // }
            if ((graph?.layout?.images?.length ?? 0) > 0) {
              graph.layout.images.forEach((image: Plotly.Image) => {
                  this.store.dispatch(getSignedUrl({
                    url: image.source,
                    config: {skipFileServer: false, skipLocalFile: false, disableCache: graph.timestamp}
                  }));
                  this.sub.add(this.store.select(selectSignedUrl(image.source))
                    .pipe(
                      filter(signed => !!signed?.signed),
                      map(({signed: signedUrl}) => signedUrl),
                      take(1)
                    ).subscribe(url => image.source = url)
                  );
                }
              );
            }
          });
        });

        this.charts = Object.values(graphs)[0];
        if (this.index === null) {
          this.index = Math.max(this.charts.findIndex(c => c.variant === this.data.chart.variant), 0);
        } else {
          this.index = this.charts.findIndex(chrt => chrt.metric === this.chart?.metric && chrt.variant === this.chart?.variant);
          this.index = this.index === -1 ? (this.isForward ? 0 : this.charts.length - 1) : this.index;
        }
        this.chart = null;
        this.cdr.detectChanges();
        this.chart = this.charts[this.index];
        if (this.range) {
          this.chart = {
            ...this.chart,
            layout: {
              ...this.chart.layout,
              xaxis: {...this.chart.layout.xaxis, range: this.range.xaxis},
              yaxis: {...this.chart.layout.yaxis, range: this.range.yaxis},
            }
          };
          this.range = null;
        }
        this.iteration = currentPlotEvents[0].iter;
      }));
    this.sub.add(this.beginningOfTime$.subscribe(beg => {
      this.beginningOfTime = beg;
      if (beg) {
        this.plotLoaded = true;
      }
    }));
    this.sub.add(this.endOfTime$.subscribe(end => {
      this.endOfTime = end;
      if (end) {
        this.plotLoaded = true;
      }
    }));
  }

  ngAfterViewInit(): void {
    if (!this.isFullDetailsMode && (this.isCompare || this.disableNavigation)) {
      this.plotLoaded = true;
      setTimeout(() => {
        this.singleGraph.redrawPlot();
        this.cdr.markForCheck();
      }, 50);
    }
    this.height = this.modalContainer.nativeElement.clientHeight - 80;
    this.sub.add(this.chart$
      .pipe(filter(plot => !!plot))
      .subscribe(chart => {
        this.plotLoaded = true;
        if (this.singleGraph) {
          this.singleGraph.shouldRefresh = true;
        }
        this.chart = {...chart, layout: {...chart.layout, yaxis: {...chart.layout.yaxis, autorange: true}, xaxis: {...chart.layout.xaxis, autorange: true}}};

        this.cdr.markForCheck();
      }));
    this.sub.add(this.iterationChanged$
      .pipe(debounceTime(100))
      .subscribe((value) => {
        const reqData = {
          task: this.chart.task,
          metric: this.chart.metric,
          iteration: value
        };
        this.store.dispatch(getPlotSample(reqData));
      }));
  }

  ngOnDestroy(): void {
    this.store.dispatch(setGraphDisplayFullDetailsScalarsIsOpen({isOpen: false}));
    this.store.dispatch(setViewerBeginningOfTime({beginningOfTime: false}));
    this.store.dispatch(setViewerEndOfTime({endOfTime: false}));
    this.sub.unsubscribe();
  }

  closeGraphViewer() {
    this.dialogRef.close();
  }

  ////////////////////// SCALARS /////////////////////////////////////
  xAxisTypeChanged($event: MatSelectChange) {
    if (
      ((ScalarKeyEnum.Iter === this.xAxisType) && [ScalarKeyEnum.IsoTime, ScalarKeyEnum.Timestamp].includes($event.value)) ||
      ([ScalarKeyEnum.IsoTime, ScalarKeyEnum.Timestamp].includes(this.xAxisType) && (ScalarKeyEnum.Iter === ($event.value)))) {
      this.store.dispatch(getGraphDisplayFullDetailsScalars({
        task: this.chart.data[0].task,
        metric: {metric: (this.data.chart.data[0].originalMetric ?? this.data.chart.metric)},
        key: $event.value
      }));
    } else {
      this.store.dispatch(setXtypeGraphDisplayFullDetailsScalars({xAxisType: $event.value}));
    }
  }

  changeWeight(value: number) {
    if (value === 0 || value === null) {
      return;
    }
    if (value > (this.smoothType === smoothTypeEnum.exponential ? 0.999 : 100) || value < (this.smoothType === smoothTypeEnum.exponential ? 0 : 1)) {
      this.smoothWeight = null;
    }
    setTimeout(() => {
      if (this.smoothType === smoothTypeEnum.exponential) {
        if (value > 0.999) {
          this.smoothWeight = 0.999;
        } else if (value < 0) {
          this.smoothWeight = 0;
        }
      } else {
        if (value > 100) {
          this.smoothWeight = 100;
        } else if (value < 1) {
          this.smoothWeight = 1;
        }
      }
      this.cdr.markForCheck();
    });
  }

  refresh() {
    this.store.dispatch(getGraphDisplayFullDetailsScalars({
      task: this.chart.data[0].task,
      metric: {metric: (this.data.chart.data[0].originalMetric ?? this.data.chart.metric)}
    }));
  }

  ////////////////////// PLOTS /////////////////////////////////////
  sigma =2;

  changeIteration(value: number) {
    this.iteration = value;
    if (this.chart) {
      this.iterationChanged$.next(value);
    }
  }

  next() {
    if (this.canGoNext() && this.chart && !this.disableNavigation) {
      this.isForward = true;
      const task = this.chart.task;
      if (this.charts?.[this.index + 1]) {
        this.chart = null;
        this.chart = this.charts[++this.index];
        this.store.dispatch(setViewerBeginningOfTime({beginningOfTime: false}));
      } else {
        this.plotLoaded = false;
        this.store.dispatch(getNextPlotSample({task, navigateEarlier: false}));
      }
    }
  }

  previous() {
    if (this.canGoBack() && this.chart && !this.disableNavigation) {
      this.isForward = false;
      const task = this.chart.task;
      if (this.charts?.[this.index - 1]) {
        this.chart = null;
        this.chart = this.charts[--this.index];
        this.store.dispatch(setViewerEndOfTime({endOfTime: false}));
      } else {
        this.plotLoaded = false;
        this.store.dispatch(getNextPlotSample({task, navigateEarlier: true}));
      }
    }
  }

  nextIteration() {
    if (!this.isFullDetailsMode && this.canGoNext() && this.chart && !this.disableNavigation) {
      this.plotLoaded = false;
      this.store.dispatch(getNextPlotSample({task: this.chart.task, navigateEarlier: false, iteration: true}));
    }
  }

  previousIteration() {
    if (!this.isFullDetailsMode && this.canGoBack() && this.chart && !this.disableNavigation) {
      this.plotLoaded = false;
      this.store.dispatch(getNextPlotSample({task: this.chart.task, navigateEarlier: true, iteration: true}));
    }
  }

  canGoNext() {
    return !this.endOfTime && this.plotLoaded;
  }

  canGoBack() {
    return !this.beginningOfTime && this.plotLoaded;
  }

  selectSmoothType($event: MatSelectChange) {
    this.smoothWeight = [smoothTypeEnum.exponential, smoothTypeEnum.any].includes($event.value) ? 0 : $event.value=== smoothTypeEnum.gaussian? 7: $event.value=== smoothTypeEnum.runningAverage? 5: 10;
    this.smoothType = $event.value;
  }

  private getTitle(chart: ExtFrame) {
    if (!chart?.layout) {
      return '';
    }
    if (this.isCompare) {
      if (this.showSmooth && this.data.id !== 'report-widget') {
        return chart.layout.title as string;
      }
      return `${chart.metric ?? ''}${chart.metric !== chart.layout.title ? (chart.metric && chart.layout.title ? ' - ' : '') + chart.layout.title : ''}
      ${chart.variants?.length > 0 ? '' : chart.variant ? ' - ' + chart.variant : ''}`;
    } else {
      if (this.disableNavigation) {
        return chart?.variants?.length > 1 ? chart.variants.join(', ') : chart?.layout?.title as string || chart?.metric;
      } else {
        return `${chart.metric}${chart.metric !== chart.layout.title ? (chart.metric && chart.layout.title ? ' - ' : '') + chart.layout.title : ''}
      ${chart.variants?.length > 1 ? ' - ' + chart.variants.join(', ') : ''}`;
      }
    }
  }

  setFreezeColor() {
    this.freezeColor = this.singleGraph.chart?.data[1]?.line?.color ?? this.singleGraph.chart?.data[0]?.line?.color ?? this.freezeColor;
  }

  shouldShowDot() {
    return this.singleGraph && this.chart && checkIfLegendToTitle(this.chart) &&
      (!Array.isArray(this.singleGraph.chart?.data[0]?.line?.color) && !Array.isArray(this.singleGraph.chart?.data[0]?.marker?.color))
      && (!this.chart.layout.showlegend || (this.chart.data.length === 1 && !this.chart.data[0].showlegend))
  }
}
