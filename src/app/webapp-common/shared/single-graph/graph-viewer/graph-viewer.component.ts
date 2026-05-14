import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, computed,
  effect,
  ElementRef,
  inject,
  linkedSignal,
  OnDestroy,
  OnInit,
  signal, untracked,
  viewChild
} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ExtFrame} from '../plotly-graph-base';
import {Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {MatFormField, MatOption, MatSelect, MatSelectChange} from '@angular/material/select';
import {filter, map, take} from 'rxjs/operators';
import {checkIfLegendToTitle, convertPlots, groupIterations} from '@common/tasks/tasks.utils';
import {addMessage} from '@common/core/actions/layout.actions';
import {
  getGraphDisplayFullDetailsScalars,
  getNextPlotSample,
  getPlotSample,
  setGraphDisplayFullDetailsScalars,
  setGraphDisplayFullDetailsScalarsIsOpen,
  setViewerBeginningOfTime,
  setViewerEndOfTime,
  setXtypeGraphDisplayFullDetailsScalars
} from '@common/shared/single-graph/single-graph.actions';
import {
  selectCurrentPlotViewer,
  selectFullScreenChart,
  selectFullScreenChartIsFetching,
  selectFullScreenChartXtype,
  selectMinMaxIterations,
  selectViewerBeginningOfTime,
  selectViewerEndOfTime
} from '@common/shared/single-graph/single-graph.reducer';
import {getSignedUrl} from '@common/core/actions/common-auth.actions';
import {selectSignedUrl} from '@common/core/reducers/common-auth-reducer';
import {Color, LayoutAxis} from 'plotly.js';
import {smoothTypeEnum} from '@common/shared/single-graph/single-graph.utils';
import {SingleGraphComponent} from '@common/shared/single-graph/single-graph.component';
import {GraphViewerData} from '@common/shared/single-graph/graph-viewer/graph-viewer.consts';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatSlider, MatSliderThumb} from '@angular/material/slider';
import {FormsModule} from '@angular/forms';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {MatIconModule} from '@angular/material/icon';
import {KeyValuePipe} from '@angular/common';
import {MatButton, MatIconButton} from '@angular/material/button';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {ChooseColorDirective} from '@common/shared/ui-components/directives/choose-color/choose-color.directive';

@Component({
  selector: 'sm-graph-viewer',
  templateUrl: './graph-viewer.component.html',
  styleUrls: ['./graph-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onResize()',
    '(document:keydown)': 'onKeyDown($event)',
  },
  imports: [
    SingleGraphComponent,
    MatSlideToggle,
    MatSlider,
    FormsModule,
    MatSliderThumb,
    MatSelect,
    MatFormField,
    MatFormField,
    TagListComponent,
    MatOption,
    MatIconModule,
    KeyValuePipe,
    MatIconButton,
    TooltipDirective,
    ShowTooltipIfEllipsisDirective,
    ChooseColorDirective,
    MatButton
  ]
})
export class GraphViewerComponent implements AfterViewInit, OnInit, OnDestroy {
  protected data = inject<GraphViewerData>(MAT_DIALOG_DATA);
  protected dialogRef = inject(MatDialogRef<GraphViewerComponent>);
  private store = inject(Store);
  private cdr = inject(ChangeDetectorRef);
  protected singleGraph = viewChild(SingleGraphComponent);
  private modalContainer = viewChild<ElementRef<HTMLDivElement>>('modalContainer');

  protected readonly checkIfLegendToTitle = checkIfLegendToTitle;
  protected readonly smoothTypeEnum = smoothTypeEnum;
  private sub = new Subscription();
  private isForward = true;
  private charts: ExtFrame[];
  private index: number = null;
  private range: { xaxis: LayoutAxis[]; yaxis: LayoutAxis[] };
  protected readonly xAxisTypeOption = [
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

  protected readonly isCompare = this.data.isCompare;
  protected readonly showSmooth = ['multiScalar', 'scalar'].includes(this.data.chart.layout.type);
  protected readonly reportWidget = this.data.id === 'report-widget';
  protected readonly isFullDetailsMode = this.showSmooth && !this.isCompare && !this.reportWidget;
  protected readonly id = this.data.id;
  protected readonly embedFunction = this.data.embedFunction;
  protected readonly disableNavigation = this.data.hideNavigation;
  protected readonly hideLegend = !this.data.chart.layout.showlegend;

  protected showOrigin = signal(this.data.showOrigin);
  protected smoothWeight = signal(this.data.chart.layout.type === 'singleValues' ? 0 : this.data.smoothWeight ?? 0);
  protected smoothType = signal(this.data.smoothType ?? smoothTypeEnum.exponential);
  protected plotLoaded = signal(false);
  protected iteration = signal<number>(null);
  protected sigma = signal(2);
  protected chart = signal<ExtFrame>(null);
  protected freezeColor = signal<Color | undefined>(undefined);
  protected hiddenTraceIndices = signal<number[]>([]);

  protected readonly chart$ = this.store.select(selectFullScreenChart);
  protected readonly currentPlotEvent$ = this.store.select(selectCurrentPlotViewer);
  protected xAxisType = this.store.selectSignal(selectFullScreenChartXtype);
  protected isFetchingData = this.store.selectSignal(selectFullScreenChartIsFetching);
  protected minMaxIterations = this.store.selectSignal(selectMinMaxIterations);
  protected beginningOfTime = this.store.selectSignal(selectViewerBeginningOfTime);
  protected endOfTime = this.store.selectSignal(selectViewerEndOfTime);

  protected dimensions = linkedSignal(() => ({
    width: this.modalContainer().nativeElement.clientWidth,
    height: this.modalContainer().nativeElement.clientHeight - 80
  }));

  canGoNext = computed(() => !this.endOfTime() && this.plotLoaded());
  canGoBack = computed(() => !this.beginningOfTime() && this.plotLoaded());

  shouldShowDot = computed(() =>
    this.singleGraph() && this.chart() && checkIfLegendToTitle(this.chart()) &&
    (!Array.isArray(this.singleGraph().chart?.data[0]?.line?.color) && !Array.isArray(this.singleGraph().chart?.data[0]?.marker?.color))
    && (!this.chart().layout.showlegend || (this.chart().data.length === 1 && !this.chart().data[0].showlegend))
  );

  protected title = computed(() => {
    const chart = this.chart();
    if (!chart?.layout) {
      return '';
    }
    const title =  (chart.layout.title as {text: string})?.text ?? chart.layout.title as string;
    if (this.isCompare) {
      if (chart.layout.type === 'singleValues' || this.showSmooth && this.data.id !== 'report-widget') {
        return chart.metric !== title ? `${chart.metric} - ${title}` : title;
      }
      return `${chart.metric ?? ''}${chart.metric !== title ? (chart.metric && title ? ' - ' : '') + title : ''}
      ${chart.variant === title ? '' : chart.variants?.length > 0 ? ' - ' + chart.variants?.join(', ') : ''}`;
    } else {
      if (this.disableNavigation) {
        return chart?.variants?.length > 0 ? chart.variants?.join(', ') : chart?.layout?.title as string || chart?.metric;
      } else {
        return `${chart.metric}${chart.metric !== title ? (chart.metric && title ? ' - ' : '') + title : ''}
      ${(chart.variants?.length > 0 && chart.variant !== title) ? ' - ' + chart.variants?.join(', ') : ''}`;
      }
    }
  });

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

  onResize() {
    if (this.singleGraph()) {
      this.singleGraph().shouldRefresh = true;
    }
    this.dimensions.set({
      width: this.modalContainer().nativeElement.clientWidth,
      height: this.modalContainer().nativeElement.clientHeight - 80
    })
  }

  constructor( ) {
    if (this.data.xAxisType) {
      this.store.dispatch(setXtypeGraphDisplayFullDetailsScalars({xAxisType: this.data.xAxisType}));
    }
    this.store.dispatch(setGraphDisplayFullDetailsScalarsIsOpen({isOpen: true}));

    if (this.isFullDetailsMode) {
      this.store.dispatch(setGraphDisplayFullDetailsScalars({data: this.data.chart}));
      this.hiddenTraceIndices.set(this.data.chart.data.reduce((acc, trace, i) =>
        (trace.visible === 'legendonly' ? [...acc, i] : acc), [] as number[]));
    } else if (this.isCompare || this.disableNavigation || this.reportWidget) {
      this.chart.set(this.data.chart);
      this.hiddenTraceIndices.set(this.data.chart.data.reduce((acc, trace, i) =>
        (trace.visible === 'legendonly' ? [...acc, i] : acc), [] as number[]));
      this.plotLoaded.set(true);
      setTimeout(() => {
        if (this.chart().layout.xaxis) {
          this.chart().layout.xaxis.autorange = true;
        }
        if (this.chart().layout.yaxis) {
          this.chart().layout.yaxis.autorange = true;
        }
      });
    } else {
      this.store.dispatch(getPlotSample({
        task: this.data.chart.task,
        metric: this.data.chart.metric,
        iteration: this.data.chart.iter
      }));
      this.range = {xaxis: this.data.chart.layout.xaxis.range, yaxis: this.data.chart.layout.yaxis.range};
    }

    let debounceIteration: number;
    effect(() => {
      const iteration = this.iteration();
      untracked(() => {
      if (iteration !== null && this.chart()?.task) {
        window.clearTimeout(debounceIteration);
        debounceIteration = window.setTimeout(() => {
          this.store.dispatch(getPlotSample({
            task: this.chart().task,
            metric: this.chart().metric,
            iteration
          }));
        }, 100);
      }
      });
    });

    effect(() => {
      if (this.beginningOfTime() || this.endOfTime()) {
        this.plotLoaded.set(true);
      }
    });
  }


  ngOnInit(): void {
    ////////////// SCALARS //////////////////////
    if (this.isFullDetailsMode) {
      this.store.dispatch(getGraphDisplayFullDetailsScalars({
        task: this.data.chart.data[0].task,
        metric: {metric: (this.data.chart.data[0].originalMetric ?? this.data.chart.metric)}
      }));
    }

    ////////////// PLOTS //////////////////////

    this.sub.add(this.currentPlotEvent$
      .pipe(filter(plot => !!plot))
      .subscribe(currentPlotEvents => {
        this.plotLoaded.set(true);
        const groupedPlots = groupIterations(currentPlotEvents);
        const {graphs, parsingError} = convertPlots({plots: groupedPlots, id: 'viewer'});
        if (parsingError){
          this.store.dispatch(addMessage('warn', `Couldn't read all plots. Please make sure all plots are properly formatted (NaN & Inf aren't supported).`, [], true));
        }
        this.hiddenTraceIndices.set(this.data.chart.data.reduce((acc, trace, i) =>
          (trace.visible === 'legendonly' ? [...acc, i] : acc), [] as number[]));
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
          this.index = this.charts.findIndex(chrt => chrt.metric === this.chart()?.metric && chrt.variant === this.chart()?.variant);
          this.index = this.index === -1 ? (this.isForward ? 0 : this.charts.length - 1) : this.index;
        }
        this.chart.set(null);
        this.cdr.detectChanges();
        this.chart.set(this.charts[this.index]);
        this.applyHiddenTraces();
        if (this.range) {
          this.chart.update(chart => ({
            ...chart,
            layout: {
              ...chart.layout,
              xaxis: {...chart.layout.xaxis, range: this.range.xaxis},
              yaxis: {...chart.layout.yaxis, range: this.range.yaxis},
            }
          }));
          this.range = null;
        }
        this.iteration.set(currentPlotEvents[0].iter);
      }));
  }

  ngAfterViewInit(): void {
    if (!this.isFullDetailsMode && (this.isCompare || this.disableNavigation)) {
      this.plotLoaded.set(true);
      setTimeout(() => {
        this.singleGraph().redrawPlot();
        this.cdr.markForCheck();
      }, 50);
    }
    this.sub.add(this.chart$
      .pipe(filter(plot => !!plot))
      .subscribe(chart => {
        this.plotLoaded.set(true);
        if (this.singleGraph()) {
          this.singleGraph().shouldRefresh = true;
        }
        this.chart.set({...chart, layout: {
            ...chart.layout,
            yaxis: {...chart.layout.yaxis, autorange: true},
            xaxis: {...chart.layout.xaxis, autorange: true}
        }});
        this.applyHiddenTraces();
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
      ((ScalarKeyEnum.Iter === this.xAxisType()) && [ScalarKeyEnum.IsoTime, ScalarKeyEnum.Timestamp].includes($event.value)) ||
      ([ScalarKeyEnum.IsoTime, ScalarKeyEnum.Timestamp].includes(this.xAxisType()) && (ScalarKeyEnum.Iter === ($event.value)))) {
      this.store.dispatch(getGraphDisplayFullDetailsScalars({
        task: this.chart().data[0].task,
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
    if (value > (this.smoothType() === smoothTypeEnum.exponential ? 0.999 : 100) || value < (this.smoothType() === smoothTypeEnum.exponential ? 0 : 1)) {
      this.smoothWeight.set(null);
    }
    setTimeout(() => {
      if (this.smoothType() === smoothTypeEnum.exponential) {
        if (value > 0.999) {
          this.smoothWeight.set(0.999);
        } else if (value < 0) {
          this.smoothWeight.set(0);
        }
      } else {
        if (value > 100) {
          this.smoothWeight.set(100);
        } else if (value < 1) {
          this.smoothWeight.set(1);
        }
      }
      this.cdr.markForCheck();
    });
  }

  refresh() {
    this.store.dispatch(getGraphDisplayFullDetailsScalars({
      task: this.chart().data[0].task,
      metric: {metric: (this.data.chart.data[0].originalMetric ?? this.data.chart.metric)}
    }));
  }

  ////////////////////// PLOTS /////////////////////////////////////

  next() {
    if (this.canGoNext() && this.chart() && !this.disableNavigation) {
      this.isForward = true;
      const task = this.chart().task;
      if (this.charts?.[this.index + 1]) {
        this.chart.set(null);
        this.chart.set(this.charts[++this.index]);
        this.store.dispatch(setViewerBeginningOfTime({beginningOfTime: false}));
      } else {
        this.plotLoaded.set(false);
        this.store.dispatch(getNextPlotSample({task, navigateEarlier: false}));
      }
    }
  }

  previous() {
    if (this.canGoBack() && this.chart() && !this.disableNavigation) {
      this.isForward = false;
      const task = this.chart().task;
      if (this.charts?.[this.index - 1]) {
        this.chart.set(null);
        this.chart.set(this.charts[--this.index]);
        this.store.dispatch(setViewerEndOfTime({endOfTime: false}));
      } else {
        this.plotLoaded.set(false);
        this.store.dispatch(getNextPlotSample({task, navigateEarlier: true}));
      }
    }
  }

  nextIteration() {
    if (!this.isFullDetailsMode && this.canGoNext() && this.chart() && !this.disableNavigation) {
      this.plotLoaded.set(false);
      this.store.dispatch(getNextPlotSample({task: this.chart().task, navigateEarlier: false, iteration: true}));
    }
  }

  previousIteration() {
    if (!this.isFullDetailsMode && this.canGoBack() && this.chart() && !this.disableNavigation) {
      this.plotLoaded.set(false);
      this.store.dispatch(getNextPlotSample({task: this.chart().task, navigateEarlier: true, iteration: true}));
    }
  }

  selectSmoothType($event: MatSelectChange) {
    this.smoothWeight.set([smoothTypeEnum.exponential, smoothTypeEnum.any].includes($event.value) ?
      0 :
      $event.value === smoothTypeEnum.gaussian ?
        7 :
        $event.value=== smoothTypeEnum.runningAverage ?
          5 :
          10
    );
    this.smoothType.set($event.value);
  }

  setFreezeColor() {
    this.freezeColor.update(color => this.singleGraph().chart?.data[1]?.line?.color ?? this.singleGraph().chart?.data[0]?.line?.color ?? color);
  }

  updateTracesVisibility(hiddenIndices: number[]) {
    this.hiddenTraceIndices.set(hiddenIndices);
    this.applyHiddenTraces();
  }

  protected applyHiddenTraces() {
    const hidden = this.hiddenTraceIndices();
    this.chart.update(chart => ({
      ...chart,
      data: chart.data.map((trace, i) => ({...trace, visible: hidden.includes(i) ? 'legendonly' : true}))
    }));
  }
}
