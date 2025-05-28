import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  Output,
  Renderer2,
  ViewChild
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {PALLET} from '@common/constants';
import {ColorHashService} from '@common/shared/services/color-hash/color-hash.service';
import {SmoothTypeEnum, getSmoothedLine, interpolateY, smoothTypeEnum} from '@common/shared/single-graph/single-graph.utils';
import {chooseTimeUnit} from '@common/shared/utils/choose-time-unit';
import {download} from '@common/shared/utils/download';
import {TinyColor} from '@ctrl/tinycolor';
import {select} from 'd3-selection';
import {cloneDeep} from 'lodash-es';
import plotly from 'plotly.js';
import {of, Subject, timer} from 'rxjs';
import {debounce, debounceTime, filter} from 'rxjs/operators';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {GraphViewerComponent, GraphViewerData} from './graph-viewer/graph-viewer.component';
import {
  Colors,
  ExtData,
  ExtFrame,
  ExtLayout,
  ExtLegend,
  PlotlyGraphBaseComponent
} from './plotly-graph-base';
import {showColorPicker} from '@common/shared/ui-components/directives/choose-color/choose-color.actions';
import {normalizeColorToString} from '@common/shared/services/color-hash/color-hash.utils';


declare const Plotly;
const RATIO_OFFSET_FIX = 37;

export type ChartHoverModeEnum = 'x' | 'y' | 'closest' | false | 'x unified' | 'y unified';

@Component({
    selector: 'sm-single-graph',
    templateUrl: './single-graph.component.html',
    styleUrls: ['./single-graph.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class SingleGraphComponent extends PlotlyGraphBaseComponent {
  public loading: boolean;
  public type: (plotly.PlotData['type'] | 'table')[];
  public ratio: number;
  public title: string;
  private originalChart: ExtFrame;
  private _chart: ExtFrame;
  private chartData: HTMLDivElement;
  private previousOffsetWidth: number;
  private modeBar: HTMLElement;
  private ratioEnable: boolean;
  private smooth$ = new Subject<number>();
  private sigma$ = new Subject<number>();
  private _height: number;
  private _hoverMode: ChartHoverModeEnum;
  public singleColorKey: string;

  @Input() identifier: string;
  @Input() hideTitle = false;
  @Input() hideLegend = false;
  @Input() showLoaderOnDraw = true;
  @Input() hideMaximize: 'show' | 'hide' | 'disabled' = 'show';
  @Input() legendConfiguration: Partial<ExtLegend> = {};
  @Input() yAxisType: plotly.AxisType = 'linear';
  private previousHoverMode: 'x' | 'y' | 'closest' | false | 'x unified' | 'y unified';
  private plotlyElement: plotly.PlotlyHTMLElement;
  private _smoothSigma: number;


  @Input() set height(height: number) {
    this._height = height;
    if (this.chart) {
      this.drawGraph$.next({forceRedraw: true, forceSkipReact: false});
    }
  }

  get height() {
    return this._height;
  }

  @Input() set width(width: number) {
    if (this.chart) {
      this.drawGraph$.next({forceRedraw: true, forceSkipReact: false});
    }
  }

  get chart(): ExtFrame {
    return this._chart;
  }

  @Input() set chart(chart: ExtFrame) {
    if (chart) {
      this.ratioEnable = !!chart.layout.width && !!chart.layout.height;
      this.ratio = this.ratioEnable ? chart.layout.width / chart.layout.height : null;
      this._height = chart.layout.height || this.height || 450;
      if (this.originalChart?.data.length === chart.data.length) {
        this.rebootGraph(chart, true);
      } else {
        this._chart = cloneDeep(chart);
      }
      this.originalChart = chart;
      this.drawGraph$.next({forceRedraw: true, forceSkipReact: false});
    }
  }

  private rebootGraph(chart: ExtFrame, clean?: boolean) {
    const hidden = this._chart?.data
      .filter(d => !d.isSmoothed)
      .map((d, i) => d.visible === 'legendonly' && (d.fakePlot === chart.data[i].fakePlot) ? i : null)
      .filter(index => index !== null);
    if (clean && this.alreadyDrawn && this.type[0] === 'scatter' && chart.data[0]?.x?.length === 1) {
      (Plotly.deleteTraces as typeof plotly.deleteTraces)(this.chartElm, Array.from({length: this.chartElm.data.length ?? 0}, (v, i) => i));
      this.modeBar = null;
    }
    this._chart = cloneDeep(chart);
    if (hidden?.length > 0) {
      this._chart.data.forEach((d, i) => d.visible = hidden.includes(i) ? 'legendonly' : true);
    }
  }

  @Input() moveLegendToTitle = false;
  @Input() legendStringLength = 19;
  @Input() graphsNumber: number;
  @Input() xAxisType: ScalarKeyEnum;

  @Input() set hoverMode(hoverMode) {
    this._hoverMode = hoverMode;
    this.previousHoverMode = this.previousHoverMode ?? hoverMode;
    if (this.chart) {
      this.updateHoverMode(this.plotlyContainer.nativeElement);
      this.drawGraph$.next({forceRedraw: true, forceSkipReact: false});
    }
  }

  get hoverMode() {
    return this._hoverMode;
  }

  @Input() set smoothType(smoothType: SmoothTypeEnum) {
    this._smoothType = smoothType;
    this.isSmooth = this.smoothWeight > 0;
    if (this.alreadyDrawn) {
      this.smooth$.next(null);
      this.sigma$.next(null);
    }
  }

  get smoothType() {
    return this._smoothType;
  }
  @Input() set smoothSigma(ratio: number) {
    this._smoothSigma = ratio;
    this.isSmooth = ratio > 0;
    if (this.alreadyDrawn) {
      this.sigma$.next(ratio);
    }
  }

  get smoothSigma() {
    return this._smoothSigma;
  }

  @Input() set smoothWeight(ratio: number) {
    this._smoothWeight = ratio;
    this.isSmooth = ratio > 0;
    if (this.alreadyDrawn) {
      this.smooth$.next(ratio);
    }
  }

  get smoothWeight() {
    return this._smoothWeight;
  }

  @Input() exportForReport = false;
  @Input() hideDownloadButtons = false;
  @Input() noMargins = false;
  @Input() graphTitle: string;
  @Input() disableNavigation: boolean;
  @Output() hoverModeChanged = new EventEmitter<ChartHoverModeEnum>();
  @Output() createEmbedCode = new EventEmitter<{ xaxis: ScalarKeyEnum; domRect: DOMRect }>();
  @Output() maximizeClicked = new EventEmitter();
  @ViewChild('drawHere', {static: true}) plotlyContainer: ElementRef;
  private chartElm;
  private _smoothWeight: number;
  private _smoothType: SmoothTypeEnum;


  constructor(
    protected renderer: Renderer2,
    private colorHash: ColorHashService,
    public changeDetector: ChangeDetectorRef,
    private dialog: MatDialog,
    private readonly zone: NgZone
  ) {
    super();
    this.initColorSubscription();

    this.sub.add(this.smooth$
      .pipe(
        debounceTime(50),
        filter(() => !!this.chart))
      .subscribe(() => {
        this.rebootGraph(this.originalChart);
        this.drawGraph$.next({forceRedraw: true, forceSkipReact: false});
      })
    );

    this.sub.add(this.sigma$
      .pipe(
        debounceTime(50),
        filter(() => !!this.chart))
      .subscribe(() => {
        this.rebootGraph(this.originalChart);
        this.drawGraph$.next({forceRedraw: true, forceSkipReact: false});
      })
    );

    this.sub.add(this.drawGraph$
      .pipe(
        debounce(({forceRedraw, forceSkipReact, noTimer}) => noTimer ? of({forceRedraw, forceSkipReact}) : timer(100)),
        filter(() => !!this.chart)
      )
      .subscribe(({forceRedraw, forceSkipReact}) => {
        if (this.showLoaderOnDraw) {
          this.loading = true;
          this.changeDetector.detectChanges();
        }
        const container = this.plotlyContainer.nativeElement;
        if (this.alreadyDrawn && !forceRedraw && !this.shouldRefresh) {
          return;
        }
        this.alreadyDrawn = this.alreadyDrawn && !forceRedraw;
        this.shouldRefresh = false;
        const [root, data, layout, config, graphEl] = this.drawPlotly();
        if (!document.body.contains(graphEl)) {
          container.appendChild(graphEl);
        }

        let skipReact = false;
        // root.height > 0 to avoid rare plotly exception
        if ((this.plotlyContainer.nativeElement.offsetWidth !== this.previousOffsetWidth || forceSkipReact) &&
          (root as HTMLElement).offsetHeight > 0) {
          skipReact = this.plotlyContainer.nativeElement.offsetWidth === this.previousOffsetWidth;
          this.zone.runOutsideAngular(() => Plotly.relayout(root, {
            width: this.ratio ? this.height * this.ratio + RATIO_OFFSET_FIX : Math.max((data?.['data']?.[0]?.cells?.values?.length ?? 0) * 100, this.plotlyContainer.nativeElement.offsetWidth - 3),
            height: this.height
          }).then(() => {
            this.loading = false;
            this.changeDetector.detectChanges();
            this.updateLegend();
            if ((data[0] as ExtData)?.mode === 'gauge+number') {
              this.fixGaugeValuePositionAfterResize();
            }
          }));
        }
        this.previousOffsetWidth = this.plotlyContainer.nativeElement.offsetWidth;

        if (!skipReact) {
          this.zone.runOutsideAngular(() => (Plotly.react as typeof plotly.react)(root, data, layout, config).then(res => {
            this.plotlyElement = res;
            this.loading = false;
            this.changeDetector.detectChanges();
          }));
        }

        // We don't color pie charts labels (just like in histograms)
        if (!this.alreadyDrawn && this.chart.type !== 'pie') {
          setTimeout(() => {
            this.repositionModeBar(this.plotlyContainer.nativeElement);
            this.subscribeColorButtons();
            this.updateLegend();
          });
        }
        this.alreadyDrawn = true;
      }));
  }

  drawPlotly(): [plotly.Root, plotly.Data[], Partial<ExtLayout>, Partial<plotly.Config>, Element] {
    this.chartData = this.chartData || this.renderer.createElement('div');
    this.chartElm = this.chartElm || this.renderer.createElement('div');
    this.chartElm.classList.add('chart');
    if (!document.body.contains(this.chartElm)) {
      this.chartData.appendChild(this.chartElm);
    }

    const graph = this.formatChartLines() as ExtFrame;
    this.type = (graph?.data?.map(dat => dat?.type ?? graph?.layout?.type)) as plotly.PlotType[];
    this.title = this.hideTitle ? '' : this.getTitle(graph);
    let layout = {
      ...this.hideDownloadButtons ? {} : this.addParametersIfDarkTheme({
        paper_bgcolor: PALLET.blue950
      }),
      ...this.addParametersIfDarkTheme({
        font: {
          color: '#FFFFFF',
          family: '"Heebo", sans-serif'
        }
      }),
      ...graph.layout,
      ...this.addParametersIfDarkTheme({plot_bgcolor: 'transparent'}),
      height: this.type[0] === 'table' ? this.height - 30 : this.height,
      width: this.ratio ? (this.height * this.ratio) + RATIO_OFFSET_FIX : undefined,
      modebar: {
        color: this.themeColors().icon,
        activecolor: this.themeColors().iconActive,
        ...this.addParametersIfDarkTheme({
          bgcolor: 'transparent'
        })
      },
      title: {
        ...this.addParametersIfDarkTheme({
          font: {
            color: this.isDarkTheme() ? 'PALLET.blue100' : 'dce0ee'
          }
        })
      },
      xaxis: {
        automargin: true,
        color: this.themeColors().tick,
        gridcolor: this.themeColors().lines,
        zerolinecolor: this.themeColors().lines,
        linecolor: this.themeColors().lines,
        tickfont: {
          color: this.themeColors().tick
        },
        ...(graph.layout.xaxis?.title && {
          title: {

            text: (graph.layout.xaxis.title as plotly.DataTitle)?.text ?? graph.layout.xaxis.title,
            font: {
              color: this.themeColors().font
            }
          }
        }),
        ...graph.layout.xaxis
      },
      yaxis: {
        color: this.themeColors().tick,
        gridcolor: this.themeColors().lines,
        zerolinecolor: this.themeColors().lines,
        linecolor: this.themeColors().lines,
        tickfont: {
          color: this.themeColors().tick
        },
        ...(graph.layout.yaxis?.title && {
          title: {
            text: (graph.layout.yaxis.title as plotly.DataTitle)?.text ?? graph.layout.yaxis.title,
            font: {
              color: this.themeColors().font
            }
          }
        }),
        ...graph.layout.yaxis
      },
      uirevision: 'static', // Saves the UI state between redraws https://plot.ly/javascript/uirevision/
      hoverlabel: {namelength: -1},
      legend: {
        traceorder: 'normal',
        xanchor: 'left',
        yanchor: 'top',
        orientation: 'h',
        y: -0.2,
        borderwidth: 2,
        valign: 'top',
        font: {color: this.themeColors().font, size: 12, family: 'sans-serif'},
        bgcolor: 'transparent',
        bordercolor: 'transparent',
        ...this.legendConfiguration,
        ...graph.layout.legend
      },
      showlegend: !this.moveLegendToTitle && !this.hideLegend && (this.chartElm.layout && Object.prototype.hasOwnProperty.call(this.chartElm.layout, 'showlegend') ? this.chartElm.layout.showlegend : graph.layout?.showlegend !== false),
      margin: graph.layout.margin ? graph.layout.margin : this.noMargins ? {
        l: 50,
        r: 50,
        t: 80,
        b: 50,
        pad: 0,
        autoexpand: true
      } : {
        l: 70,
        r: 50,
        t: this.hideTitle ? 60 : 80,
        b: 90,
        pad: 0,
        autoexpand: true
      } as Partial<plotly.Margin>
    } as Partial<ExtLayout>;

    graph.data.forEach(data => {
      if (data.type === 'table') {
        this.changeDetector.detectChanges();
        // override header design
        data.header = {
          ...data.header,
          line: {width: 1, color: this.isDarkTheme() ? '#5a658e' : '#d4d6e0'},
          height: 29,
          align: 'left',
          font: {
            color: [this.themeColors().font],
            size: 12
          },
          fill: {...data.header?.fill, color: this.isDarkTheme() ? '#262a31' : '#e5e8f1'}
        };

        // override cells design
        const isFireFox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        data.cells = {
          ...data.cells,
          align: 'left',
          height: (isFireFox && this.isDarkTheme()) ? 'auto' : 30,
          font: {
            color: [this.themeColors().font],
            size: 12
          },
          fill: {...data.cells, color: this.isDarkTheme() ? '#0f141a' : '#ffffff'},
          line: {width: 1, color: this.themeColors().lines}
        };
        layout.width = Math.max((data?.cells?.values?.length ?? 0) * 100, this.plotlyContainer.nativeElement.offsetWidth - 3);
        layout.title = {
          ...layout.title as Record<string, string>,
          xanchor: 'left',
          xref: 'paper',
          x: 0
        };
        layout.margin = {
          l: 24,
          t: 62,
          r: 24,
          b: 0
        };
      }
    });
    const barLayoutConfig = {
      hovermode: this.hoverMode ?? 'closest'
    };

    const scatterLayoutConfig: Partial<ExtLayout> = {
      // spikedistance: -1,
      // hoverdistance: -1,
      // hovermode    : 'x',
      xaxis: {
        ...graph.layout.xaxis,
        spikecolor: '#000000FF',
        showspikes: true,
        spikemode: 'across',
        spikesnap: 'cursor',
        spikethickness: 1,
        spikedash: 'solid',
        rangeslider: {visible: false},
        fixedrange: false,
        color: this.themeColors().tick,
        gridcolor: this.themeColors().lines,
        zerolinecolor: this.themeColors().lines,
        linecolor: this.themeColors().lines,
        tickfont: {
          color: this.themeColors().tick
        },
        ...(graph.layout.xaxis?.title && {
          title: {
            text: (graph.layout.xaxis.title as plotly.DataTitle)?.text ?? graph.layout.xaxis.title as string,
            font: {
              color: this.themeColors().font
            }
          }
        })
      },
      yaxis: {
        ...graph.layout.yaxis,
        spikecolor: '#000000FF',
        showspikes: false,
        spikemode: 'across',
        spikesnap: 'cursor',
        spikethickness: 1,
        spikedash: 'dash',
        rangeslider: {visible: false},
        fixedrange: false,
        type: this.yAxisType,
        color: this.themeColors().tick,
        gridcolor: this.themeColors().lines,
        zerolinecolor: this.themeColors().lines,
        linecolor: this.themeColors().lines,
        tickfont: {
          color: this.themeColors().tick
        },
        ...(graph.layout.yaxis?.title && {
          title: {
            text: (graph.layout.yaxis.title as plotly.DataTitle)?.text ?? graph.layout.yaxis.title as string,
            font: {
              color: this.themeColors().font
            }
          }
        })
      }
    };

    if (['multiScalar', 'scalar'].includes(graph.layout.type) || ['scatter', 'scatter3d', 'surface'].includes(graph.data[0]?.type)) {
      if (this.type.includes('scatter') || this.type.includes('scatter3d')) {
        layout = {hovermode: this.hoverMode, ...layout, ...scatterLayoutConfig} as Partial<ExtLayout>;
      }
      if (['scatter3d', 'surface'].includes(graph.data[0].type)) {
        layout.scene = {
          ...graph.layout.scene,
          xaxis: {
            gridcolor: this.themeColors().tick,
            backgroundcolor: this.themeColors().lines
          },
          yaxis: {
            gridcolor: this.themeColors().tick,
            backgroundcolor: this.themeColors().lines
          },
          zaxis: {
            gridcolor: this.themeColors().tick,
            backgroundcolor: this.themeColors().lines
          }
        };
      }
    }
    if (this.type.includes('bar')) {
      layout = {...layout, ...barLayoutConfig} as Partial<ExtLayout>;
    }

    const modeBarButtonsToAdd = ['v1hovermode', 'togglespikelines'] as undefined as plotly.ModeBarButton[];

    if (!['scatter3d', 'surface'].includes(graph.type)) {
      modeBarButtonsToAdd.push({
        name: 'Hover mode',
        title: this.getHoverModeTitle(this.hoverMode),
        icon: {
          width: 24,
          height: 24,
          // fill: 'rgb(77, 102, 255)',
          path: this.getHoverModePath(this.hoverMode)
        },
        click: (gd: plotly.PlotlyHTMLElement) => {
          switch (this.hoverMode) {
            case 'closest':
              this.hoverMode = 'x';
              break;
            case 'x':
              this.hoverMode = 'x unified';
              break;
            default:
              this.hoverMode = 'closest';
          }
          this.hoverModeChanged.emit(this.hoverMode);
          this.updateHoverMode(gd);
        }
      });
    }

    if (['multiScalar', 'scalar'].includes(graph.layout.type)) {
      modeBarButtonsToAdd.push({
        name: 'Log view',
        title: this.getLogButtonTitle(this.yAxisType === 'log'),
        icon: this.getLogIcon(this.yAxisType === 'log'),
        click: (gd: plotly.PlotlyHTMLElement, ev: MouseEvent) => {
          this.yAxisType = this.yAxisType === 'log' ? 'linear' : 'log';
          const icon = this.getLogIcon(this.yAxisType === 'log');
          let path: SVGPathElement;
          let svg: HTMLElement;
          if ((ev.target as SVGElement).tagName === 'svg') {
            svg = ev.target as HTMLElement;
            path = (ev.target as SVGElement).firstChild as SVGPathElement;
          } else {
            path = ev.target as SVGPathElement;
            svg = path.parentElement as HTMLElement;
          }
          svg.parentElement.attributes['data-title'].value = this.getLogButtonTitle(this.yAxisType === 'log');
          path.attributes[0].value = icon.path;
          this.smooth$.next(this.smoothWeight);
        }
      });
    }
    if (!['table', 'parcoords'].includes(graph?.data?.[0]?.type) && !this.moveLegendToTitle) {
      modeBarButtonsToAdd.push({
        name: 'Hide legend',
        title: graph.layout?.showlegend !== false ? 'Hide legend' : 'Show legend',
        icon: this.getToggleLegendIcon(),
        click: (element, ev: MouseEvent) => {
          const pathElement = (ev.target as HTMLElement).tagName === 'path' ? (ev.target as HTMLElement) : (ev.target as HTMLElement).querySelector('path');
          const svg = pathElement.parentElement;
          pathElement.style.fill = this.chartElm.layout?.showlegend ? 'rgb(77, 102, 255)' : 'rgb(143, 157, 201)';
          svg.parentElement.attributes['data-title'].value = this.getHideButtonTitle();
          this.chartElm.layout.showlegend = !this.chartElm.layout.showlegend;
          if (this.chartElm.layout.showlegend && this.chart.type !== 'pie') {
            setTimeout(() => {
              this.repositionModeBar(this.plotlyContainer.nativeElement);
              this.subscribeColorButtons();
              this.updateLegend();
            }, 20);
          }
          this.zone.runOutsideAngular(() => Plotly.relayout(this.chartElm, {showlegend: this.chartElm.layout.showlegend}));
        }
      });
    }
    if (!['table', 'parcoords'].includes(graph?.data?.[0]?.type) && this.ratioEnable && !this.moveLegendToTitle) {
      modeBarButtonsToAdd.push({
        name: 'Auto Layout',
        title: 'Auto Layout',
        icon: this.getToggleRatioIcon(),
        click: (element, ev: MouseEvent) => {
          const pathElement = (ev.target as HTMLElement).tagName === 'path' ? (ev.target as HTMLElement) : (ev.target as HTMLElement).querySelector('path');
          const svg = pathElement.parentElement;
          pathElement.style.fill = this.ratio ? 'rgb(77, 102, 255)' : 'rgb(143, 157, 201)';
          svg.parentElement.attributes['data-title'].value = this.getLockRatioTitle();
          this.ratio = this.ratio ? null : this.originalChart.layout.width / this.originalChart.layout.height;
          this.drawGraph$.next({forceRedraw: true, forceSkipReact: true});
        }
      });
    }
    if (!this.hideDownloadButtons) {
      modeBarButtonsToAdd.push({
        name: 'Download JSON',
        title: 'Download JSON',
        icon: this.getJsonDownloadIcon(),
        click: () => {
          this.downloadGraphAsJson(this.originalChart);
        }
      });
    }
    if (this.type[0] === 'table') {
      modeBarButtonsToAdd.push({
        name: 'Download CSV',
        title: 'Download CSV',
        icon: this.getCSVDownloadIcon(),
        click: () => {
          this.downloadTableAsCSV();
        }
      });
    }

    if (this.exportForReport) {
      const button: plotly.ModeBarButton = {
        name: 'Embed',
        title: 'Copy embed code',
        attr: 'plotly-embedded-modebar-button',
        icon: this.getEmbedIcon(),
        click: (event) => {
          this.createEmbedCode.emit({
            xaxis: this.xAxisType,
            domRect: event.querySelector('[data-title="Copy embed code"]').getBoundingClientRect()
          });
        }
      };
      modeBarButtonsToAdd.push(button);
    }

    if (this.hideMaximize !== 'hide') {
      const maximizeButton: plotly.ModeBarButton = {
        name: 'Maximize',
        title: this.hideMaximize === 'disabled' ? `Can't maximize because an iframe with the same name exists` : 'Maximize Graph',
        attr: this.hideMaximize === 'disabled' ? 'plotly-disabled-maximize' : '',
        icon: this.getMaximizeIcon(),
        click: () => this.hideMaximize !== 'disabled' && this.maximizeGraph()
      };
      modeBarButtonsToAdd.push(maximizeButton);
    }

    const config = {
      modeBarButtonsToRemove: ['sendDataToCloud', 'hoverClosestCartesian', 'hoverCompareCartesian'].concat(this.hideDownloadButtons ? ['toImage'] : []) as plotly.ModeBarDefaultButtons[],
      displaylogo: false,
      modeBarButtonsToAdd,
      toImageButtonOptions: {
        filename: this.getExportName(this.chart),
        scale: 3
      }
    } as plotly.Config;

    return [this.chartElm, graph.data, layout, config, this.chartData];
  }

  private updateHoverMode(gd: HTMLElement) {
    const elm = gd.querySelectorAll('.modebar-btn[data-title^="Hover: "]')[0];
    if (elm) {
      elm.setAttribute('data-title', this.getHoverModeTitle(this.hoverMode));
      const path = elm.querySelectorAll('svg path')[0];
      path.setAttribute('d', this.getHoverModePath(this.hoverMode));
    }
  }

  private getTitle(graph: ExtFrame) {
    if (this.hideTitle && this.graphTitle) {
      return this.graphTitle;
    }
    if (graph.layout.title) {
      const title = (typeof graph.layout.title === 'string') ? graph.layout.title : graph.layout.title.text;
      return this.addIterationString(title?.trim(), graph.iter);
    }
    return '';
  }

  private getExportName(graph: ExtFrame) {
    const title = this.getTitle(graph);
    if (title) {
      return title;
    }
    const metric = this.chart.metric?.trim();
    const variant = this.chart.variant?.trim();
    if (metric && variant) {
      return `${metric} - ${variant}`;
    }
    return (metric || variant) ? `${metric || variant}` : 'chart';
  }

  private updateLegend() {
    const graph = select(this.plotlyContainer.nativeElement);
    if (this.isDarkTheme()) {
      graph.selectAll('.axis .domain')
        .style('stroke', Colors.dark.lines)
        .style('stroke-opacity', 1);
    }
    graph.selectAll('.legendpoints path')
      .attr('d', 'M5.5,0A5.5,5.5 0 1,1 0,-5.5A5.5,5.5 0 0,1 5.5,0Z');
    graph.selectAll('.legendtoggle')
      .on('click', () => window.setTimeout(() => graph.selectAll('.legendpoints path')
        .attr('d', 'M5.5,0A5.5,5.5 0 1,1 0,-5.5A5.5,5.5 0 0,1 5.5,0Z'), 300)
      );
  }

  private formatChartLines() {
    if (this.alreadyDrawn || !this.chart) {
      return this.chart;
    }


    const graph = this.chart;
    if (this.isCompare) {
      graph.data = this.addIdToDuplicateExperiments(this.chart);
    }
    const smoothLines = [];
    const timeUnit = chooseTimeUnit(graph.data) as { time: number; str: string };

    for (let i = 0; i < graph.data.length; i++) {
      // In bug cases where the variant is empty causing name to be empty string
      if (graph.data[i].name === '') {
        graph.data[i].name = this.addIterationString((graph.layout.title as string || graph.metric)?.trim(), graph.iter);
      }
      if (!graph.data[i].name) {
        graph.data[i].name = this.getTitle(graph);
      }

      if (this.isCompare) {
        this.removeUserColorFromPlot(graph.data[i]);
      }
      const originalColor = this.isCompare ? undefined : this.getOriginalColor(i);
      const task = graph.data[i].task ?? graph.task;
      const colorKey = this.generateColorKey(graph.data[i].name.trim(), task, graph.data[i].colorKey);
      if (!this.alreadyDrawn) {
        graph.data[i].originalColor = originalColor;
        graph.data[i].fullName = colorKey.replace(`.${task?.substring(0, 6)}-`, '-') ?? graph.data[i].name;

        if (this.xAxisType === ScalarKeyEnum.Timestamp) {
          const zeroTime = graph.data[i].x[0] as number;
          // If already calculated => zeroTime = 0
          if (zeroTime > 0) {
            graph.data[i].x = (graph.data[i].x as plotly.Datum[]).map((timestamp: number) => (timestamp - zeroTime) / timeUnit.time);
          }
          // graph.data[i].hovertext = graph.data[i].x.map(timestamp => timeInWords((timestamp - zeroTime)));
        }
        if (graph.data[i].type === 'bar' && !graph.data[i].marker) {
          graph.data[i].marker = {} as Partial<plotly.PlotMarker>;
        }
        this.singleColorKey = colorKey.replace(/ \(Smoothed\)\?$/, '?');
        graph.data[i].name = (this.scaleFactor() === 100 || this.isSmooth) ? graph.data[i].name : `${graph.data[i].name.trim()}      `;
      }

      if (!Array.isArray(originalColor)) {
        let color;
        if (originalColor && !this.colorHash.hasColor(colorKey)) {
          const c = new TinyColor(this.getOriginalColor(i)).toRgb();
          color = [c.r, c.g, c.b];
        } else {
          color = this.colorHash.initColor(colorKey, null, this.isDarkTheme());
        }
        // if (this.colorHash.hasColor(colorKey)) { // We don't save init color in color cache, so we need to recolor everytime
        this._reColorTrace(graph.data[i], color);
        // }
        if (this.isSmooth && !graph.data[i].isSmoothed) {
          graph.data[i].legendgroup = graph.data[i].name;
          graph.data[i].showlegend = false;
          graph.data[i].hoverinfo = 'skip';
          smoothLines.push(this.resmoothDataset(graph.data[i], color, graph.data[i].visible === 'legendonly'));
        }
      }
    }
    this.setAxisText(graph, timeUnit);
    graph.data = graph.data.filter(line => !line.isSmoothed);
    graph.data = graph.data.concat(smoothLines);
    return graph;
  }

  private removeUserColorFromPlot(data) {
    if (data?.marker) {
      data.marker.color = undefined;
    }
    if (data?.line) {
      data.line.color = undefined;
    }
  }

  private getOriginalColor(i: number) {
    return (this.originalChart.data[i]?.marker?.color || this.originalChart.data[i]?.line?.color) as string;
  }

  public generateColorKey(name: string, task: string, colorKey: string) {
    const variant = colorKey || name;
    if (!this.isCompare) {
      // "?" to adjust desired colors (legend title is removing this ?)
      // trim() because in hiDpi we add spaces to name
      return `${variant?.trim()}?`;
    } else {
      return variant?.endsWith(task) ? variant : `${variant}-${task}`;
    }
  }

  private resmoothDataset(data: ExtData, color, hidden: boolean) {
    if (this.smoothType=== smoothTypeEnum.gaussian && data.y.length> 5 ){
      interpolateY(data.y)
    }
    return {
      ...data,
      line: {width: 1, ...data.line, color: `rgb(${color[0]},${color[1]},${color[2]})`},
      legendgroup: data.name,
      name: `${data.name} (Smoothed)${this.scaleFactor() === 100 ? '' : '      '}`,
      showlegend: true,
      isSmoothed: true,
      ...(hidden && {visible: 'legendonly'}),
      hoverinfo: 'all',
      y: getSmoothedLine(data.y, this.smoothWeight, this.smoothType, this.smoothSigma),
    } as ExtData;
  }

  private initColorSubscription(forceRedraw = false) {
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
      .subscribe(colorObj => {
        const graph = this.chart;
        let changed = false;
        graph?.data.forEach(trace => {
          const name = trace.name;
          const colorKey = this.generateColorKey(trace.name, trace.task, trace.colorKey);
          if (!name || !this.colorHash.hasColor(colorKey)) {
            return;
          }
          const oldColor = this._getTraceColor(trace);
          const newColorArr = colorObj[colorKey];
          const newColor = newColorArr ? `rgb(${newColorArr[0]},${newColorArr[1]},${newColorArr[2]})` : null;
          if (oldColor !== newColor && newColor) {
            changed = true;
            this._reColorTrace(trace, newColorArr);
          }
        });
        if (changed) {
          this.drawGraph$.next({forceRedraw: true});
          this.updateLegend();
        }

      });
  }

  private subscribeColorButtons = () => {
    select(this.plotlyContainer.nativeElement)
      .selectAll('.traces .layers')
      .raise()
      .on('click', (event, data) => {
        const colorKey = data[0].trace._input.colorKey;
        const name = data[0].trace._input.name.trim().replace(/ \(Smoothed\)$/, '');
        const task = data[0].trace._input.task;
        const originalColor = data[0].trace._input.originalColor;
        const colorKey2 = this.generateColorKey(name, task, colorKey);
        this.store.dispatch(showColorPicker({
          top: event.y,
          left: event.x,
          theme: 'light',
          defaultColor: normalizeColorToString(this.colorHash.initColor(colorKey2, originalColor)),
          cacheKey: colorKey2,
          alpha: null
        }));
        event.stopPropagation();
      });

    select(this.plotlyContainer.nativeElement)
      .selectAll('.traces .legendtoggle')
      .append('title')
      .text((data, i) => this.chart.data[i]?.fullName ?? data[0].trace.name);
  };


  private setAxisText(chart: ExtFrame, timeUnit?: { time: number; str: string }) {
    const title = this.getAxisText(timeUnit);
    if (!chart.layout.xaxis) {
      chart.layout.xaxis = {};
    }
    if (title) {
      chart.layout.xaxis.title = {text: title, standoff: 10};
    }
    return chart;
  }

  downloadGraphAsJson(chart: ExtFrame) {
    let timeUnit;
    let data;
    if (this.xAxisType === ScalarKeyEnum.Timestamp) {
      data = chart.data.map(graphData => {
        if (!graphData.name) {
          return graphData;
        }
        timeUnit = typeof timeUnit === 'undefined' ? chooseTimeUnit(chart.data) : timeUnit;
        const zeroTime = graphData.x[0] as number;
        return {...graphData, x: (graphData.x as number[]).map(timestamp => (timestamp - zeroTime) / timeUnit.time)};
      });
    } else {
      data = chart.data;
    }
    const exportName = `${this.getExportName(this.chart)}.json`;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
    download(dataStr, exportName);
  }

  getJsonDownloadIcon() {
    return {
      path: 'M21,6H15V0ZM14,7h7V22a2,2,0,0,1-2,2H5a2,2,0,0,1-2-2V2A2,2,0,0,1,5,0h9Zm1.34,13.22h.58a2.09,2.09,0,0,0,1.3-.28,1.59,1.59,0,0,0,.32-1.16v-.84a1.14,1.14,0,0,1,.22-.81,1,1,0,0,1,.76-.23h.24v-.74h-.24a1,1,0,0,1-.76-.23,1.14,1.14,0,0,1-.22-.81v-.84a1.55,1.55,0,0,0-.32-1.15,2.08,2.08,0,0,0-1.3-.29h-.58v.74h.47a.71.71,0,0,1,.55.17,1.25,1.25,0,0,1,.14.72v.82a1.54,1.54,0,0,0,.19.9.94.94,0,0,0,.68.34,1,1,0,0,0-.68.35,1.56,1.56,0,0,0-.19.9v.8a1.27,1.27,0,0,1-.14.73.72.72,0,0,1-.55.17h-.47ZM9.11,12.84H8.53a2.12,2.12,0,0,0-1.31.29,1.5,1.5,0,0,0-.33,1.15v.84a1.29,1.29,0,0,1-.2.82,1.08,1.08,0,0,1-.76.22H5.69v.74h.24a1,1,0,0,1,.76.23,1.26,1.26,0,0,1,.2.81v.84a1.54,1.54,0,0,0,.33,1.16,2.13,2.13,0,0,0,1.31.28h.58v-.74H8.63a.68.68,0,0,1-.54-.17A1.27,1.27,0,0,1,8,18.58v-.8a1.56,1.56,0,0,0-.19-.9,1,1,0,0,0-.68-.35,1,1,0,0,0,.68-.34,1.54,1.54,0,0,0,.19-.9v-.82a1.25,1.25,0,0,1,.14-.72.68.68,0,0,1,.54-.17h.48Zm4,1.7H10.83v.88H12v3.33a1.21,1.21,0,0,1-.16.73.61.61,0,0,1-.54.22h-.91v.88h1.23a1.44,1.44,0,0,0,1.17-.42,2.17,2.17,0,0,0,.36-1.41Zm0-2.12H12v1.33h1.15Z',
      width: 24,
      height: 24
    };
  }

  getCSVDownloadIcon() {
    return {
      path: 'M15,6V0l6,6Zm6,1V22a2,2,0,0,1-2,2H5a2,2,0,0,1-2-2V2A2,2,0,0,1,5,0h9V7ZM8.83,14.28a2.78,2.78,0,0,0-.57-.21A2.67,2.67,0,0,0,7.62,14a2.18,2.18,0,0,0-1.8.78A3.57,3.57,0,0,0,5.2,17a3.54,3.54,0,0,0,.62,2.24,2.18,2.18,0,0,0,1.8.78A2.59,2.59,0,0,0,8.25,20a2.66,2.66,0,0,0,.58-.21V18.49a2.42,2.42,0,0,1-.58.4,1.44,1.44,0,0,1-.57.13,1.06,1.06,0,0,1-1-.51A2.8,2.8,0,0,1,6.4,17a2.82,2.82,0,0,1,.32-1.49,1.05,1.05,0,0,1,1-.5,1.42,1.42,0,0,1,.57.12,2.42,2.42,0,0,1,.58.4Zm4.93,4a1.72,1.72,0,0,0-.33-1.08,2.27,2.27,0,0,0-1-.68l-.49-.19a2,2,0,0,1-.68-.35.52.52,0,0,1-.16-.4.55.55,0,0,1,.22-.48,1.06,1.06,0,0,1,.64-.17,2.31,2.31,0,0,1,.76.14,3,3,0,0,1,.75.4V14.36a4,4,0,0,0-.8-.27,3.57,3.57,0,0,0-.8-.09,2,2,0,0,0-1.4.45,1.61,1.61,0,0,0-.5,1.25,1.44,1.44,0,0,0,.31,1,2.87,2.87,0,0,0,1.17.7l.57.21a1,1,0,0,1,.45.31.72.72,0,0,1,.16.46.67.67,0,0,1-.23.54,1,1,0,0,1-.66.2,2.61,2.61,0,0,1-.86-.16,4,4,0,0,1-.89-.49v1.19a3.71,3.71,0,0,0,1.71.41,2.44,2.44,0,0,0,1.58-.43A1.64,1.64,0,0,0,13.76,18.3Zm5.07-4.19H17.67l-1,4.87-1-4.87H14.46l1.39,5.83h1.6Z',
      width: 24,
      height: 24
    };
  }

  getToggleLegendIcon() {
    return {
      width: 24,
      height: 24,
      fill: 'rgb(77, 102, 255)',
      path: 'm6,7h-3c-.55,0-1-.45-1-1s.45-1,1-1h3c.55,0,1,.45,1,1s-.45,1-1,1Zm16-1c0-.55-.45-1-1-1h-11c-.55,0-1,.45-1,1s.45,1,1,1h11c.55,0,1-.45,1-1Zm-15,4c0-.55-.45-1-1-1h-3c-.55,0-1,.45-1,1s.45,1,1,1h3c.55,0,1-.45,1-1Zm15,0c0-.55-.45-1-1-1h-11c-.55,0-1,.45-1,1s.45,1,1,1h11c.55,0,1-.45,1-1Zm-15,4c0-.55-.45-1-1-1h-3c-.55,0-1,.45-1,1s.45,1,1,1h3c.55,0,1-.45,1-1Zm15,0c0-.55-.45-1-1-1h-11c-.55,0-1,.45-1,1s.45,1,1,1h11c.55,0,1-.45,1-1Zm-15,4c0-.55-.45-1-1-1h-3c-.55,0-1,.45-1,1s.45,1,1,1h3c.55,0,1-.45,1-1Zm15,0c0-.55-.45-1-1-1h-11c-.55,0-1,.45-1,1s.45,1,1,1h11c.55,0,1-.45,1-1Z'
    };
  }

  getToggleRatioIcon() {
    return {
      width: 500,
      height: 500,
      fill: 'rgb(77, 102, 255)',
      path: 'M419.3,256.4H373v69.9h-69.9v46.3h116.2V256.4z M139.8,186.5h69.9v-46.3h-117v116.2H139v-69.9H139.8z M465.7,46.7H46.3C20.6,46.7,0,68,0,93.1V419c0,25.7,20.6,46.3,46.3,46.3h419.3c25.7,0,46.3-21.3,46.3-46.3V93.1C512,68,491.4,46.7,465.7,46.7z M465.7,419.7H46.3V93.1h419.3v326.6H465.7z',
      ascent: 300,
      descent: 0,
      transform: 'translate(0, -50)'
    };
  }

  getMaximizeIcon() {
    return {
      width: 1000,
      height: 1000,
      fill: 'rgb(77, 102, 255)',
      path: 'M920,80V436.38L771.51,287.89,559.4,500,500,440.6,712.11,228.49,563.62,80ZM500,559.4,440.6,500,228.49,712.11,80,563.62V920H436.38L287.89,771.51Z',
      ascent: 1000,
      descent: 0,
      transform: 'translate(0, -100)'
    };
  }

  getEmbedIcon = () => ({
    width: 24,
    height: 24,
    fill: 'rgb(77, 102, 255)',
    path: 'M22,0H2C.9,0,0,.9,0,2V22c0,1.1,.9,2,2,2H22c1.1,0,2-.9,2-2V2c0-1.1-.9-2-2-2ZM8.02,9.54l-2.59,2.59,2.59,2.58v2.83L2.6,12.13l5.42-5.42v2.83Zm3.11,11.59l-1.96-.4L12.91,3.13l1.96,.4-3.74,17.6Zm4.89-3.59v-2.83l2.59-2.58-2.59-2.59v-2.83l5.42,5.42-5.42,5.41Z'
  });

  getHoverModePath = (mode: ChartHoverModeEnum) =>
    mode === 'x'
      ? 'm22,4v6c0,.55-.45,1-1,1H7c-.55,0-1-.45-1-1v-1.17l-3.83-1.83,3.83-1.83v-1.17c0-.55.45-1,1-1h14c.55,0,1,.45,1,1Zm0,10v6c0,.55-.45,1-1,1H7c-.55,0-1-.45-1-1v-1.17l-3.83-1.83,3.83-1.83v-1.17c0-.55.45-1,1-1h14c.55,0,1,.45,1,1Z' :
      mode === 'x unified' ?
        'm21,3H7c-.55,0-1,.45-1,1v5.17l-3.83,2.83,3.83,2.83v5.17c0,.55.45,1,1,1h14c.55,0,1-.45,1-1V4c0-.55-.45-1-1-1Zm-2,14h-10v-2h10v2Zm0-4h-10v-2h10v2Zm0-4h-10v-2h10v2Z' :
        'm22,9v6c0,.55-.45,1-1,1H7c-.55,0-1-.45-1-1v-1.17l-3.83-1.83,3.83-1.83v-1.17c0-.55.45-1,1-1h14c.55,0,1,.45,1,1Z';


  getLogIcon(onOrOff: boolean) {
    if (!onOrOff) {
      return {
        width: 1000,
        path: 'M797,772a29.4,29.4,0,0,1-3.1-.16c-130-13.31-240.09-51.57-327.17-113.74-70.33-50.2-125.62-115.78-164.34-194.91C236.94,329.34,241.79,203.92,242,198.64A30,30,0,0,1,302,201.31h0c-.05,1.16-4.17,117.36,55.41,237.65,34.47,69.59,83.42,127.19,145.5,171.2,78.3,55.51,178.29,89.82,297.18,102A30,30,0,0,1,797,772Zm111,80.5H147.5V92H38v28H92.5v29H37v28H92.5v41H38v28H92.5v64H38v28H92.5V446H38v28H92.5V639H38v28H92.5V852.5H0v55H92.5V1000h55V907.5H908Z',
        ascent: 1000,
        descent: 0,
        transform: 'translate(0, -100)'
      };
    }
    return {
      width: 1000,
      path: 'M908,907.5H147.5V1000h-55V907.5H0v-55H92.5V120H37V92H147.5V852.5H908ZM883.79,239.14a30,30,0,0,0-41.65,8.07L672,499.21,471.48,411.78a59.49,59.49,0,0,0-117.89-.59l-154.22,71.6a30,30,0,1,0,25.26,54.42l151.74-70.45a59.48,59.48,0,0,0,71.85.33L667,562.5A29.91,29.91,0,0,0,679,565c.85,0,1.68,0,2.52-.12s1.65.11,2.47.11a30,30,0,0,0,24.89-13.21l183-271A30,30,0,0,0,883.79,239.14ZM894,627a30,30,0,0,0-41-11l-129.1,74.28a59.5,59.5,0,0,0-87.83,25.11L219.32,711H219a30,30,0,0,0-.31,60l424.43,4.47a59.48,59.48,0,0,0,106.65-30.82L883,668A30,30,0,0,0,894,627Z',
      ascent: 1000,
      descent: 0,
      transform: 'translate(0, -100)'
    };
  }

  getLogButtonTitle(onOrOff: boolean) {
    return `Switch to ${onOrOff ? 'Linear' : 'Logarithmic'} scale`;
  }

  private getAxisText(timeUnit: { time: number; str: string }) {
    switch (this.xAxisType) {
      case ScalarKeyEnum.Iter:
        return this.areAllSameXaxis() ? this.chart.data[0].x_axis_label ?? 'Iterations' : 'Iterations';
      case ScalarKeyEnum.IsoTime:
        return 'Wall Time';
      case ScalarKeyEnum.Timestamp:
        return (timeUnit && timeUnit.str) ? `${timeUnit.str} From Start` : 'Relative Time';
      default:
        return null;
    }
  }

  private areAllSameXaxis() {
    return new Set(this.chart.data.map(g => g.x_axis_label)).size === 1;
  }

  private getHideButtonTitle() {
    return this.chartElm.layout?.showlegend ? 'Show legend' : 'Hide legend';
  }

  private getLockRatioTitle() {
    return this.ratio ? 'Original Layout' : 'Auto Layout';
  }

  private maximizeGraph() {
    this.maximizeClicked.emit();
    this.zone.run(() => {
      this.dialog.open<GraphViewerComponent, GraphViewerData>(GraphViewerComponent, {
        data: {
          ...(this.exportForReport && {
            embedFunction: (data) => this.createEmbedCode.emit({
              xaxis: data.xaxis,
              domRect: data.domRect
            })
          }),
          // signed url are updated after originChart was cloned - need to update images urls!
          chart: cloneDeep({
            ...this.originalChart,
            data: this.originalChart.data.map((d, i) => ({...d, visible: this._chart.data[i].visible})),
            layout: {
              ...this.originalChart.layout,
              showlegend: this.moveLegendToTitle || this.chartElm.layout.showlegend,
              images: this.chart.layout?.images,
              margin: {...this.chart.layout.margin, t: 80},
              xaxis: {...this.originalChart.layout.xaxis, range: this.plotlyElement.layout.xaxis.range},
              yaxis: {...this.originalChart.layout.yaxis, range: this.plotlyElement.layout.yaxis.range}
            }
          }),
          id: this.identifier,
          xAxisType: this.xAxisType,
          yAxisType: this.yAxisType,
          smoothWeight: this.smoothWeight,
          smoothType: this.smoothType,
          hoverMode: this.hoverMode,
          hideNavigation: this.disableNavigation,
          isCompare: this.isCompare,
          moveLegendToTitle: this.moveLegendToTitle,
          legendConfiguration: this.legendConfiguration,
          darkTheme: this.darkTheme(),
          dialogTitle: this.graphTitle
        },
        panelClass: ['image-viewer-dialog', 'full-screen'],
        maxWidth: this.maximizeClicked.observed ? '100%' : 'auto'
      }).beforeClosed().subscribe(() => this.maximizeClicked.emit());
    });
  }

  private addParametersIfDarkTheme(object: Record<string, unknown>) {
    return this.isDarkTheme() ? object : {};
  }

  private addIterationString(name: string, iter: number) {
    if (!name) {
      return name;
    }
    return name + ((iter || (this.graphsNumber > 1 && iter === 0)) && !name.includes('(iteration') ? ` - Iteration ${iter}` : '');
  }

  public repositionModeBar(singleGraphEl) {
    if (this.type[0] === 'table') {
      this.modeBar = this.modeBar || this.chartElm.querySelector('.modebar-container');
      this.modeBar.style.right = `${singleGraphEl.scrollWidth - singleGraphEl.clientWidth - singleGraphEl.scrollLeft}px`;
    }
  }

  private downloadTableAsCSV() {
    const vals = this.chart?.data?.[0]?.cells?.values;
    const headers = this.chart?.data?.[0]?.header?.values;
    if (vals && headers) {
      let data = headers.flat().join(',') + '\n';
      for (let i = 0; i < vals[0].length; ++i) {
        for (let j = 0; j < headers.length; ++j) {
          data += `${vals[j][i]},`;
        }
        data = data.slice(0, -1) + '\n';
      }
      const exportName = `${this.getExportName(this.chart)}.csv`;
      data = 'data:text/csv;charset=utf-8,' + encodeURIComponent(data);
      download(data, exportName);
    }
  }

  public redrawPlot() {
    this.drawGraph$.next({forceRedraw: true, forceSkipReact: false});
  }

  private fixGaugeValuePositionAfterResize() {
    select(this.plotlyContainer.nativeElement)
      .selectAll('.main-svg .indicatorlayer .trace')
      .each((datum, index, group) => {
        const node = select(group[index]);
        const graphPosition = node.selectAll('.angular').attr('transform');
        node.selectAll('.numbers').attr('transform', graphPosition);
      });
  }

  private getHoverModeTitle(hoverMode: 'x' | 'y' | 'closest' | false | 'x unified' | 'y unified') {
    let mode: string;
    if (typeof hoverMode === 'string') {
      mode = hoverMode.charAt(0).toUpperCase() + hoverMode.slice(1);
    } else {
      mode = 'None';
    }
    return `Hover: ${mode}`;
  }
}
