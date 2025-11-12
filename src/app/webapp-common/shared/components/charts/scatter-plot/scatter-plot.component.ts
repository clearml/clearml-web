import {
  ChangeDetectionStrategy,
  Component, inject,
  output, input, computed, untracked
} from '@angular/core';
import {ScatterPlotSeries} from '@common/core/reducers/projects.reducer';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {Chart, ChartData, ChartOptions, ChartType, TooltipItem} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-date-fns';
import {TinyColor} from '@ctrl/tinycolor';
import {BaseChartDirective} from 'ng2-charts';
import {Store} from '@ngrx/store';
import {selectThemeMode} from '@common/core/reducers/view.reducer';

Chart.register(zoomPlugin);


@Component({
    selector: 'sm-scatter-plot',
    templateUrl: './scatter-plot.component.html',
    styleUrls: ['./scatter-plot.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatProgressSpinnerModule,
        BaseChartDirective
    ]
})
export class ScatterPlotComponent {
  public scatterChartType: ChartType = 'scatter';

  private store = inject(Store);

  colors = input<string[]>();
  xAxisLabel = input<string>();
  yAxisLabel = input<string>();
  extraHoverInfoParams = input<{section: string; name: string}[]>([]);
  data = input<ScatterPlotSeries[]>();
  showLoadingOverlay = input<boolean>();
  xAxisType = input<'linear' | 'logarithmic' | 'category' | 'time' | 'timeseries'>();
  clicked = output<string>();

  loading = computed(() => this.showLoadingOverlay() && !!this.data());
  theme = this.store.selectSignal(selectThemeMode);

  protected chartData = computed<ChartData<'scatter'>>(() => ({
    datasets: this.data()?.map(series => ({
      ...series,
      pointBackgroundColor: series.backgroundColor,
      pointBorderColor: (new TinyColor(series.backgroundColor)).lighten(20).toHex(),
      pointBorderWidth: 1,
      pointRadius: 5,
    }))
  }));
  protected scatterChartOptions = computed<ChartOptions<'scatter'>>(() => {
    const options: ChartOptions<'scatter'> = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {display: true, text: this.xAxisLabel()},
          type: 'time',
          grid: {
            display: true
          }
        },
        y: {
          title: {display: true, text: this.yAxisLabel()},
          suggestedMin: 0,
          ticks: {
            autoSkip: true,
            stepSize: 2,
            count: 5
          },
          grid: {
            display: true
          }
        }
      },
      plugins: {
        legend: {
          display: untracked(() => this.data()?.some(series => series.label)),
          position: 'bottom',
          labels: {
            usePointStyle: true,
            boxWidth: 8,
            boxHeight: 8,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          borderWidth: 2,
          bodyFont: {weight: 'normal', size: 12},
          usePointStyle: true,
          boxWidth: 6,
          callbacks: {
            beforeLabel: (item: TooltipItem<'scatter'>): string | string[] =>
              (this.chartData().datasets[item.datasetIndex].data as ScatterPlotSeries['data'])[item.dataIndex].description,
            label: (item: TooltipItem<'scatter'>): string | string[] => {
              const data = this.chartData().datasets[item.datasetIndex].data as ScatterPlotSeries['data'];
              return [`${data[item.dataIndex].name}`,
                ...(this.yAxisLabel() ? [`${this.yAxisLabel()}: ${data[item.dataIndex].y}`] : []),
                ...(this.xAxisLabel() ? [`${this.xAxisLabel()}: ${data[item.dataIndex].x}`] : []),
                ...(data[item.dataIndex]?.extraParamsHoverInfo?.length > 0 ? ['', 'Additional info:'] : []),
                ...(data[item.dataIndex]?.extraParamsHoverInfo?.length === 0 ? ['', 'To see more info here please add additional data point information'] : []),
                ...(data[item.dataIndex]?.extraParamsHoverInfo?.length > 0 ? data?.[item.dataIndex]?.extraParamsHoverInfo ?? [] : [])
              ];
            },
            afterLabel: (item: TooltipItem<'scatter'>): string | string[] =>
              !this.yAxisLabel()! ? `${(this.chartData().datasets[item.datasetIndex].data as ScatterPlotSeries['data'])[item.dataIndex].y}` : ''
          }
        },
        zoom: {
          pan: {
            enabled: true,
            modifierKey: 'shift'
          },
          zoom: {
            wheel: {enabled: true},
            drag: {enabled: true}
          }
        }
      }
    };

    if (this.xAxisType() === 'time') {
      options.scales.x = {
        ...options.scales.x,
        type: this.xAxisType(),
        ticks: {
          autoSkip: true,
          autoSkipPadding: 50,
          maxRotation: 0,
          ...(this.theme() === 'dark' && {color: '#c1cdf3'})
        },
        time: {
          displayFormats: {
            month: 'MMM yyyy',
            day: 'dd MMM',
            hour: 'p',
            minute: 'p',
            second: 'pp'
          }
        }
      } as unknown; // ChartOptions<'scatter'>['scatter']['datasets']
    } else {
      options.scales.x.type = this.xAxisType();
      options.plugins.zoom.pan.mode = 'y';
      options.plugins.zoom.zoom.mode = 'y';
    }

    if (this.theme() === 'dark') {
      options.scales.x = {
        ...options.scales.x,
        title: {
          ...options.scales.x.title,
          color: '#c1cdf3'
        },
        ticks: {color: '#c1cdf3'}, grid: {color: '#39405f'}
      };
      options.scales.y = {
        ...options.scales.y,
        title: {
          ...options.scales.y.title,
          color: '#c1cdf3'
        },
        ticks: {color: '#c1cdf3'}, grid: {color: '#39405f'}
      };
      options.plugins.tooltip = {
        ...options.plugins.tooltip,
        backgroundColor: 'black',
        borderColor: '#8492c2',
        bodyColor: '#c3cdf0'
      };
      options.plugins.legend.labels.color = '#c1cdf3';
    }
    return options;
  });

  chartClicked(active: object[]) {
    if (active.length < 1) {
      return;
    }
    const {index, datasetIndex} = active[0] as { index: number; datasetIndex: number };
    this.clicked.emit((this.chartData().datasets[datasetIndex].data as ScatterPlotSeries['data'])[index].id);
  }
}
