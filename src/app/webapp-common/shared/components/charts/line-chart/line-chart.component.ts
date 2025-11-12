import {
  Component,
  ChangeDetectionStrategy,
  viewChild,
  input, computed, effect, inject,
} from '@angular/core';
import {BaseChartDirective} from 'ng2-charts';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {
  ChartData,
  ChartOptions,
  ChartType,
  Plugin, TimeUnit, TooltipItem
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import {fileSizeConfigCount} from '@common/shared/pipes/filesize.pipe';
import {filesize} from 'filesize';
import {Store} from '@ngrx/store';
import {selectDarkTheme} from '@common/core/reducers/view.reducer';


declare module 'chart.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType extends ChartType> {
    hoverLine?: {
      color?: string;
      dash?: [number, number];
      width?: number;
      drawY?: boolean;
    };
  }
}


interface Topic {
  topicName: string;
  topic: number;
  dates: { value: number; date: string }[];
}

export interface concatLatestFrom {
  dataByTopic?: Topic[];
}

@Component({
    selector: 'sm-line-chart',
    templateUrl: './line-chart.component.html',
    styleUrls: ['./line-chart.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        BaseChartDirective,
        MatProgressSpinnerModule
    ]
})
export class LineChartComponent {
  private readonly store = inject(Store);

  lineChartPlugins: Plugin<'line'>[] = [{
    id: 'hoverLine',
    afterDatasetsDraw: (chart, _, opts) => {
      const {
        ctx,
        tooltip,
        chartArea: {top, bottom}
      } = chart;

      if (tooltip.opacity) {
        ctx.lineWidth = opts.width || 0;
        ctx.setLineDash(opts.dash || []);
        ctx.strokeStyle = opts.color || 'black';

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(tooltip.caretX, bottom);
        ctx.lineTo(tooltip.caretX, top);
        ctx.stroke();
        ctx.closePath();
        ctx.setLineDash([]);
      }

      // Hack to fix tooltip position on cursor
      if (tooltip.y < 0.1) {
        if (tooltip.caretX > chart.width / 2) {
          tooltip.x = tooltip.caretX - tooltip.width - 10;
        } else {
          tooltip.x = tooltip.caretX + 10;
        }
      }
    }
  }];
  public lineChartType: ChartType = 'line';

  colorScheme = input(['#a4a1fb', '#ff8a15']);
  yTickFormatter = input<(value: number) => string>(val => filesize(val, fileSizeConfigCount));
  yLabel = input<string>();
  hideLegend = input<boolean>();
  minUnit= input<TimeUnit>('minute');
  showLoadingOverlay = input(false);
  data = input<Topic[]>();
  private chart = viewChild(BaseChartDirective);

  darkTheme = this.store.selectSignal(selectDarkTheme);

  animationDuration = computed(() => this.data()?.[0]?.dates.length > 0 ? 0 : 500);
  chartData = computed<ChartData<'line', Topic['dates']>>(() => {
    const topics = this.data();
    if (topics && !(topics?.length > 0)) {
      return null;
    }

    return {
      datasets: topics?.map((topic, index) => this.createDataset(topic, index)) ?? []
    };
  });

  lineChartOptions = computed(() => ({
    animation: {
      duration: this.animationDuration(),
    },
    maintainAspectRatio: false,
    layout: {
      padding: {top: 24, bottom: 24, left: 24, right: 24}
    },
    elements: {
      line: {
        tension: 0
      }
    },
    interaction: {
      intersect: false,
      mode: 'nearest',
      axis: 'x'
    },
    scales: {
      x: {
        type: 'time',
        ticks: {
          autoSkip: true,
          autoSkipPadding: 50,
          maxRotation: 0,
          ...(this.darkTheme() && {color: '#c1cdf3'}),
        },
        time: {
          tooltipFormat: this.minUnit() === 'day' ? 'P' : 'P pp',
          minUnit: this.minUnit(),
          displayFormats: {
            month: 'MMM yyyy',
            day: 'dd MMM',
            hour: 'E p',
            minute: 'p',
            second: 'pp'
          }
        },
        grid: {
          display: true,
          ...(this.darkTheme() && {color: '#39405f'}),
        }
      },
      y: {
        title: {
          display: !!this.yLabel(), text: this.yLabel(),
          ...(this.darkTheme() && {color: '#c1cdf3'}),
          },
        position: 'left',
        suggestedMin: 0,
        beginAtZero: true,
        ticks: {
          autoSkip: true,
          count: 5,
          precision: 0,
          ...(this.darkTheme() && {color: '#c1cdf3'}),
          callback: value => typeof value === 'number' ? this.yTickFormatter()(value) : value
        },
        grid: {
          display: true,
          ...(this.darkTheme() && {color: '#39405f'}),
        }
      }
    },

    plugins: {
      legend: {
        display: !this.hideLegend(),
        position: 'bottom',
        labels: {
          ...(this.darkTheme() && {color: '#dce0ee'}),
          font: {weight: 'normal', size: 12},
          padding: 20,
          usePointStyle: true,
          boxWidth: 8,
          boxHeight: 8,
          }

      },
      tooltip: {
        backgroundColor: '#1a1e2c',
        borderWidth: 1,
        ...(this.darkTheme() && {
          borderColor: '#8492c2',
          bodyColor: '#c3cdf0',
        }),
        bodyFont: {weight: 'normal', size: 12},
        padding: 12,
        usePointStyle: true,
        callbacks: {
          label: (item: TooltipItem<'line'>) => `${item.dataset.label}: ${this.yTickFormatter()((item.dataset.data[item.dataIndex] as unknown as Topic['dates'][0]).value)}`
        }
      },
      hoverLine: {
        dash: [6, 6],
        ...(this.darkTheme() && { color: '#8492c2'}),
        width: 1
      }
    },

    parsing: {
      xAxisKey: 'date',
      yAxisKey: 'value'
    }
  } as ChartOptions<'line'>));

  private createDataset(topic: Topic, index: number) {
    const reservedColors: Record<string, string> = {};
    const currentChart = this.chart().chart;
    const newIndex = currentChart?.data.datasets.findIndex(dataset => dataset.label === topic.topicName);
    reservedColors[topic.topicName] = reservedColors[topic.topicName] ?? this.colorScheme()[index % this.colorScheme().length];
    return {
      data: topic.dates,
      label: topic.topicName,
      pointRadius: topic.dates?.length < 2 ? 4 : 0,
      pointBorderColor: '#1a1e2c',
      borderWidth: 1.4,
      lineTension: 0,
      pointBackgroundColor: reservedColors[topic.topicName],
      borderColor: reservedColors[topic.topicName],
      backgroundColor: reservedColors[topic.topicName],
      ...(newIndex > -1 && currentChart?.data.datasets.length > newIndex && {hidden: !currentChart.isDatasetVisible(newIndex)})
    };
  }


  constructor() {
    effect(() => {
      if (this.data()?.[0]?.dates.length > 0) {
        window.setTimeout(() => this.update(), 50);
      }
    });
  }

  update() {
    this.chart().update();
  }
}
