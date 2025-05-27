import {ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {
  Colors, ExtData,
  ExtFrame,
  ExtLayout,
  PlotlyGraphBaseComponent
} from '@common/shared/single-graph/plotly-graph-base';
import {SlicePipe} from '@angular/common';
import {debounceTime, filter, take} from 'rxjs/operators';
import {from} from 'rxjs';
import {cloneDeep, get, isEqual, max, min, uniq} from 'lodash-es';
import domtoimage from 'dom-to-image';
import {Axis, Color, ColorBar, ColorScale} from 'plotly.js';
import {select} from 'd3-selection';
import {ColorHashService} from '@common/shared/services/color-hash/color-hash.service';
import {Task} from '~/business-logic/model/tasks/task';
import {sortCol} from '@common/shared/utils/sortCol';
import {MetricValueType, SelectedMetricVariant} from '@common/experiments-compare/experiments-compare.constants';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {GraphViewerComponent, GraphViewerData} from '@common/shared/single-graph/graph-viewer/graph-viewer.component';
import {MatDialog} from '@angular/material/dialog';
import {ChooseColorModule} from '@common/shared/ui-components/directives/choose-color/choose-color.module';
import {MetricVariantToPathPipe} from '@common/shared/pipes/metric-variant-to-path.pipe';
import {MetricVariantToNamePipe} from '@common/shared/pipes/metric-variant-to-name.pipe';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';


declare let Plotly;

export interface ExtraTask extends Task {
  duplicateName?: boolean;
  hidden?: boolean;
}

interface Dimension extends Partial<Axis> {
  label: string;
  values: number[];
  constraintrange;
}

interface ParaPlotData {
  type: string;
  labelangle: 'auto' | number;
  labelside?: 'top' | 'bottom';
  dimensions: Dimension[];
  line: {
    color: Color;
    colorscale?: ColorScale;
    colorbar?: Partial<ColorBar>;
  };
}


@Component({
    selector: 'sm-parallel-coordinates-graph',
    templateUrl: './parallel-coordinates-graph.component.html',
    styleUrls: ['./parallel-coordinates-graph.component.scss'],
    imports: [
        SlicePipe,
        TooltipDirective,
        ChooseColorModule,
        ShowTooltipIfEllipsisDirective,
        MatIconButton,
        MatIcon
    ]
})
export class ParallelCoordinatesGraphComponent extends PlotlyGraphBaseComponent implements OnInit, OnChanges {
  private metricVariantToPathPipe = new MetricVariantToPathPipe();
  private metricVariantToNamePipe = new MetricVariantToNamePipe();
  private data: ParaPlotData[];
  private _experiments: ExtraTask[];
  public experimentsColors = {};
  public filteredExperiments = [];
  private timer: number;
  private _parameters: string[];

  @ViewChild('parallelGraph', {static: true}) parallelGraph: ElementRef;
  @ViewChild('legend', {static: true}) legend: ElementRef;
  @ViewChild('container') container: ElementRef<HTMLDivElement>;
  private graphWidth: number;
  private _metricValueType: MetricValueType;
  private highlighted: ExtraTask;
  private dimensionsOrder: string[];

  @HostListener('window:resize')
  redrawChart() {
    this.drawGraph$.next({});
  }

  @Input() set metricValueType(metricValueType: MetricValueType) {
    this._metricValueType = metricValueType;
    if (this.experiments) {
      window.clearTimeout(this.timer);
      this.timer = window.setTimeout(() => this.prepareGraph(), 200);
    }
  }

  get metricValueType() {
    return this._metricValueType;
  }

  @Input() set parameters(parameters) {
    if (!isEqual(parameters, this.parameters)) {
      this._parameters = parameters;
      if (this.experiments) {
        clearTimeout(this.timer);
        this.timer = window.setTimeout(() => this.prepareGraph(), 200);
      }
    }
  }

  get parameters(): string[] {
    return this._parameters;
  }

  @Input() metrics: SelectedMetricVariant[];

  @Input() set experiments(experiments) {
    let experimentsCopy = cloneDeep(experiments) ?? [];
    if (experimentsCopy && (!this.experiments || !isEqual(experimentsCopy.map(experiment => experiment.id), this.experiments.map(experiment => experiment.id)))) {

      const experimentsNames = experimentsCopy.map(experiment => experiment.name);
      experimentsCopy = experimentsCopy.map(experiment => ({
        ...experiment,
        duplicateName: experimentsNames.filter(name => name === experiment.name).length > 1,
        hidden: this.filteredExperiments.includes(experiment.id)
      }));
      this._experiments = experimentsCopy;
      if (experimentsCopy) {
        this.prepareGraph();
      }
    }
  }


  get experiments(): ExtraTask[] {
    return this._experiments;
  }


  @Input() reportMode = false;
  @Output() createEmbedCode = new EventEmitter<{ tasks: string[]; valueType: MetricValueType; metrics?: string[]; variants?: string[]; domRect: DOMRect }>();

  constructor(
    private colorHash: ColorHashService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    super();

    this.sub.add(this.drawGraph$
      .pipe(
        debounceTime(75),
        filter(() => !!this.parallelGraph)
      ).subscribe(() => this.drawChart()));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.metrics && this.experiments) {
      this.prepareGraph();
    }

  }

  ngOnInit(): void {
    this.initColorSubscription();
  }

  private initColorSubscription(forceRedraw = false): void {
    if (this.colorSub) {
      // Subscription is already running
      if (forceRedraw) {
        this.colorSub.unsubscribe();
      } else {
        return;
      }
    }
    this.colorSub = this.colorHash.getColorsObservable()
      .pipe(
        filter(colorObj => !!colorObj),
        debounceTime(100)
      )
      .subscribe(() => {
        this.prepareGraph();
        window.setTimeout(() => this.cdr.detectChanges());
      });
  }

  toggleHideExperiment(experimentId): void {
    if (this.filteredExperiments.includes(experimentId)) {
      this.filteredExperiments = this.filteredExperiments.filter(id => id !== experimentId);
    } else {
      this.filteredExperiments.push(experimentId);
    }
    this._experiments = this.experiments.map(experiment => ({
      ...experiment,
      hidden: this.filteredExperiments.includes(experiment.id)
    }));
    this.prepareGraph();
  }

  getStringColor(experiment: ExtraTask): string {
    const colorArr = this.colorHash.initColor(this.getExperimentNameForColor(experiment), null, this.isDarkTheme());
    return `rgb(${colorArr[0]},${colorArr[1]},${colorArr[2]})`;
  }

  getExperimentNameForColor(experiment): string {
    return `${experiment.name}-${experiment.id}`;
  }

  getColorsArray(experiments): number[] {
    return experiments.map((experiment, index) => index / (experiments.length - 1));
  }

  private prepareGraph(): void {
    this.experiments.forEach(experiment => this.experimentsColors[experiment.id] = this.getStringColor(experiment));
    const filteredExperiments = this.experiments.filter(experiment => !experiment.hidden);
    if (this.parameters && filteredExperiments.length > 0) {
      const trace = {
        type: 'parcoords',
        labelangle: 30,
        dimensions: this.parameters.map((parameter) => {
          const splitted = parameter.split('.');
          const newParameter = [splitted.shift(), splitted.join('.'), 'value'];
          parameter = `${parameter}.value`;
          const allValuesIncludingNull = this.experiments.map(experiment => get(experiment.hyperparams, newParameter));
          const allValues = allValuesIncludingNull.filter(value => (value !== undefined)).filter(value => (value !== ''));
          const textVal = {} as Record<string, number>;
          let ticktext = this.naturalCompare(uniq(allValues).filter(text => text !== ''));
          (allValuesIncludingNull.length > allValues.length) && (ticktext = ['N/A'].concat(ticktext));
          const tickvals = ticktext.map((text, index) => {
            textVal[text] = index;
            return index;
          });
          let constraintrange;
          if (this.parallelGraph.nativeElement?.data?.[0]?.dimensions) {
            const currDimention = this.parallelGraph.nativeElement.data[0].dimensions.find(d => d.label === parameter);
            if (currDimention?.constraintrange) {
              constraintrange = currDimention.constraintrange;
            }
          }
          return {
            label: parameter.replace(/\.value$/, ''),
            ticktext,
            tickvals,
            values: filteredExperiments.map((experiment) => (textVal[['', undefined].includes(get(experiment.hyperparams, parameter)) ? 'N/A' : get(experiment.hyperparams, parameter)])),
            range: [0, max(tickvals)],
            constraintrange

          };
        })
      } as ParaPlotData;
      if (filteredExperiments.length > 1) {
        trace.line = {
          color: this.getColorsArray(filteredExperiments),
          colorscale: filteredExperiments.map((experiment, index) =>
            [index / (filteredExperiments.length - 1), this.getStringColor(experiment)] as [number, string])
        };
      } else {
        trace.line = {
          color: this.getStringColor(filteredExperiments[0])
        };
      }

      // this is to keep the metric last in html so that bold scss will take place.
      // this.data = [trace];
      // this.drawChart();

      if (this.metrics) {
        this.metrics.map(metric => {
          const allValuesIncludingNull = this.experiments.map(experiment => get(experiment.last_metrics, this.metricVariantToPathPipe.transform(metric, true)));
          const allValues = allValuesIncludingNull.filter(value => value !== undefined);
          const naVal = this.getNAValue(allValues);
          const ticktext = uniq(allValuesIncludingNull.map(value => value !== undefined ? value : 'N/A'));
          const tickvals = ticktext.map(text => text === 'N/A' ? naVal : text);
          let constraintrange;
          if (this.parallelGraph.nativeElement?.data?.[0]?.dimensions) {
            const currDimention = this.parallelGraph.nativeElement.data[0].dimensions.find(d => d.label === this.metricVariantToNamePipe.transform(metric, true));
            if (currDimention?.constraintrange) {
              constraintrange = currDimention.constraintrange;
            }
          }
          trace.dimensions.push({
            label: this.metricVariantToNamePipe.transform(metric, true),
            ticktext,
            tickvals,
            values: filteredExperiments.map((experiment) =>
              parseFloat(get(experiment.last_metrics, this.metricVariantToPathPipe.transform(metric, true), naVal))
            ),
            range: [min(tickvals), max(tickvals)],
            constraintrange,
            color: 'red',
            gridcolor: 'red',
            linecolor: 'green',
            tickcolor: 'red',
            dividercolor: 'green',
            spikecolor: 'yellow',
            dividerwidth: 3,
            tickwidth: 2,
            linewidth: 4
          });
        });

      }

      this.data = [trace];
      if (this.dimensionsOrder) {
        this.data[0].dimensions.sort((a, b) => sortCol(a.label, b.label, this.dimensionsOrder));
      }
      this.drawGraph$.next({});
    }
  }

  private getNAValue(values: number[]): number {
    if (!(values.length > 0)) {
      return 0;
    }
    const valuesMax = max(values);
    const valuesMin = min(values);
    return valuesMax === valuesMin ? (valuesMin - 1) : valuesMin - ((valuesMax - valuesMin) / values.length);
  }

  getLayout(setDimentiosn = true, margins?) {
    return {
      margin: margins ? margins : {l: 120, r: 120, b: this.container.nativeElement.clientHeight < 350 ? 40 : 60},
      ...(setDimentiosn && {
        height: Math.min(Math.max(this.container.nativeElement.clientHeight - this.legend.nativeElement.offsetHeight - 40, 300), 600),
        width: this.parallelGraph.nativeElement.offsetWidth
      }),
      ...(this.reportMode && {
        height: this.parallelGraph.nativeElement.parentElement.offsetHeight - this.legend.nativeElement.offsetHeight - 40,
        margin: {l: 120, r: 120, b: 20}
      }),
      ...(this.isDarkTheme() && {
        paper_bgcolor: 'transparent',
        font: {
          color: Colors.dark.tick
        }
      })
    } as ExtLayout;
  }

  private drawChart() {
    Plotly.react(this.parallelGraph.nativeElement, this.data, this.getLayout(), {
      displaylogo: false,
      displayModeBar: false,
      modeBarButtonsToRemove: ['toggleHover']
    });
    this.postRenderingGraphManipulation();
  }

  private postRenderingGraphManipulation() {
    if (this.parameters) {
      const graph = select(this.parallelGraph.nativeElement);
      this.graphWidth = graph.node().getBoundingClientRect().width;
      graph.selectAll('.y-axis')
        .filter((d: { key: string }) => this.metrics?.map(mv => this.metricVariantToNamePipe.transform(mv, true)).includes(d.key))
        .classed('metric-column', true);
      graph.selectAll('.axis-title')
        .text((d: { key: string }) => this.wrap(d.key))
        .append('title')
        .text(d => (d as { key: string }).key);
      graph.selectAll('.axis .tick text').text((d: string) => this.wrap(d)).append('title').text((d: string) => d);
      graph.selectAll('.axis .tick text').style('pointer-events', 'auto');
      if (this.isDarkTheme()) {
        graph.selectAll('.axis .domain').style('stroke', Colors.dark.lines).style('stroke-opacity', 1);
      }
      graph.selectAll('.tick').on('mouseover', (event: MouseEvent) => {
        const tick = event.currentTarget as SVGGElement;
        const axis = tick.parentNode as SVGGElement;
        if (axis && axis.lastChild !== tick) {
          axis.removeChild(tick);
          axis.appendChild(tick);
        }
      });
    }
  }

  wrap(key) {
    key = key.toString();
    if (key.length > 20) {
      return `${key.slice(0, 18)}...`;
    }
    return key;
  }

  private naturalCompare(myArray) {
    const collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
    const compare = (a: string, b: string) => {
      const aFloat = parseFloat(a);
      const bFloat = parseFloat(b);
      if (!Number.isNaN(a) && !Number.isNaN(b)) {
        return aFloat - bFloat;
      }
      return collator.compare(a, b);
    };

    return (myArray.sort(compare));

  }

  highlightExperiment(experiment: ExtraTask) {
    if (this.highlighted?.id != experiment?.id) {
      this.highlighted = experiment;
      this.dimensionsOrder = this.parallelGraph.nativeElement.data?.[0].dimensions.map(d => d.label);
      this._experiments = this.experiments.map(exp => ({...exp, hidden: exp.id !== experiment.id}));
      this.prepareGraph();
    }
  }

  removeHighlightExperiment() {
    this.highlighted = null;
    this._experiments = this.experiments.map(experiment => ({
      ...experiment,
      hidden: this.filteredExperiments.includes(experiment.id)
    }));
    this.prepareGraph();
    this.dimensionsOrder = null;
  }

  downloadImage() {
    this.container.nativeElement.classList.add('downloading');
    from(domtoimage.toBlob(this.container.nativeElement))
      .pipe(take(1))
      .subscribe((blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.download = `Hyperparameters ${this.metrics[0].metric} ${this.metrics[0].variant}.png`;
        a.click();
        this.container.nativeElement.classList.remove('downloading');
      });
  }

  creatingEmbedCode(domRect: DOMRect) {
    this.createEmbedCode.emit({
      tasks: this.experiments.map(exp => exp.id),
      valueType: this.metricValueType,
      metrics: this.metrics.map(mv => this.metricVariantToPathPipe.transform(mv, true)),
      variants: this.parameters, domRect
    });
  }

  maximize() {
    this.dialog.open(GraphViewerComponent, {
      data: {
        embedFunction: (data) => this.creatingEmbedCode(data.domRect),
        // signed url are updated after originChart was cloned - need to update images urls!
        chart: cloneDeep({
          data: this.data as unknown as ExtData[],
          layout: {
            ...this.getLayout(false, {l: 120, r: 120, t: 150, b: 40}),
            title: 'Parallel coordinates',
          },
          config: {
            displaylogo: false,
            displayModeBar: false
          }
        } as ExtFrame),
        id: `compare params ${this.experiments?.map(e => e.id).join(',')}`,
        hideNavigation: false,
        isCompare: true
      } as GraphViewerData,
      panelClass: ['image-viewer-dialog', 'full-screen'],
    });
  }
}
