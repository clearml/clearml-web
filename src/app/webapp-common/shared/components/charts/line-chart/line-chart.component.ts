import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {humanizeUsage} from '@common/shared/utils/time-util';
import {BaseChartDirective} from 'ng2-charts';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {
  Chart,
  ChartData,
  ChartDataset,
  ChartOptions,
  ChartType,
  Plugin,
  TimeUnit,
  TooltipItem,
  TooltipLabelStyle,
  TooltipModel
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

export interface Topic {
  topicID: string;
  topicName: string;
  topic: number;
  secondAxis?: boolean;
  dashed?: boolean;
  dates: { value: number; date: string; originalDate?: number}[];
  fillBackground?: string;
  order?: number;
}

interface DataPoint extends TooltipItem<'line'> {
  color: TooltipLabelStyle;
  striped?: boolean;
}

@Component({
  selector: 'sm-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective, MatProgressSpinnerModule],
  })
export class LineChartComponent {
  lineChartPlugins: Plugin<'line'>[] = [{
    id: 'hoverLine',
    afterDatasetsDraw: (chart, _, opts) => {
      const {
        ctx,
        tooltip,
        chartArea: {top, bottom},
      } = chart;

      if (tooltip?.opacity) {
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
    },
  },
  ];
  public lineChartType: ChartType = 'line';
  colorScheme = input(['#a4a1fb', '#ff8a15']);
  yTickFormatter = input<(value: number) => string>(val =>
    filesize(val, fileSizeConfigCount)
  );
  yLabel = input<string>();
  unit = input<string>();
  hideLegend = input<boolean>();
  hideTooltipTitle = input<boolean>();
  minUnit = input<TimeUnit>('minute');
  showLoadingOverlay = input(false);
  showGrid = input(true);
  showTicks = input(true);
  precision = input(0);
  data = input<Topic[]>();
  animationDuration = computed(() =>
    this.data()?.[0]?.dates?.length > 0 ? 0 : 500
  );
  chartData = computed<ChartData<'line', Topic['dates']>>(() => {
    const topics = this.data();
    if (topics && !(topics?.length > 0)) {
      return null;
    }

    return {
      datasets: topics?.map((topic, index) => this.createDataset(topic, index)) ?? [],
    };
  });
  lineChartOptions = computed(
    () =>
      ({
        animation: {
          duration: this.animationDuration(),
        },
        maintainAspectRatio: false,
        layout: {
          padding: {top: 24, bottom: 24, left: 24, right: 24},
        },
        elements: {
          line: {
            tension: 0,
          },
        },
        interaction: {
          intersect: false,
          mode: 'nearest',
          axis: 'x',
        },
        scales: {
          x: {
            type: 'time',
            ticks: {
              display: this.showTicks(),
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
                second: 'pp',
              },
            },
            grid: {
              display: this.showGrid(),
              ...(this.darkTheme() && {color: '#39405f'}),
            },
          },
          y: {
            title: {
              display: !!this.yLabel(),
              text: this.yLabel(),
              ...(this.darkTheme() && {color: '#c1cdf3'}),
            },
            position: 'left',
            suggestedMin: 0,
            beginAtZero: true,
            ticks: {
              display: this.showTicks(),
              autoSkip: true,
              count: 5,
              precision:this.precision(),
              ...(this.darkTheme() && {color: '#c1cdf3'}),
              callback: value =>
                typeof value === 'number' ? this.yTickFormatter()(value) : value,
            },
            grid: {
              display: this.showGrid(),
              ...(this.darkTheme() && {color: '#39405f'}),
            },
          },
          ...(this.data()?.some(topic => topic.secondAxis) && {y1: {
              type: 'linear',
              display: 'auto',
              position: 'right',
              suggestedMin: 0,
              beginAtZero: true,
              title: {
                display: true,
                color: this.colorScheme()[this.data().findIndex(topic => topic.secondAxis) % this.colorScheme()?.length],
                text: 'Total',
              },
              ticks: {
                display: this.showTicks(),
                autoSkip: true,
                count: 5,
                precision: 0,
                ...(this.darkTheme() && {color: '#c1cdf3'}),
                callback: value =>
                  typeof value === 'number' ? this.yTickFormatter()(value) : value,
              },
              grid: {
                drawOnChartArea: false,
              },
            }}),
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
            },
          },
          // Configuration for the custom HTML tooltip
          tooltip: {
            enabled: false, // Disable the built-in tooltip
            external: this.externalTooltipHandler.bind(this), // Register our custom handler
          },
          hoverLine: {
            dash: [6, 6],
            ...(this.darkTheme() && {color: '#8492c2'}),
            width: 1,
          },
        },

        parsing: {
          xAxisKey: 'date',
          yAxisKey: 'value',
        },
      } as ChartOptions<'line'>)
  );
  protected tooltipData = signal<{
    title: string;
    dataPoints?: DataPoint[];
    columns: number;
    position?: { x: number, y: number };
  }>(null);
  private readonly store = inject(Store);
  darkTheme = this.store.selectSignal(selectDarkTheme);
  private chart = viewChild(BaseChartDirective);
  private customTooltip = viewChild<ElementRef<HTMLDivElement>>('chartjsTooltip');

  constructor() {
    effect(() => {
      if (this.data()?.[0]?.dates?.length > 0) {
        window.setTimeout(() => this.update(), 50);
      }
    });
  }

  update() {
    this.chart()?.update(); // Use optional chaining
  }

  private createDataset(topic: Topic, index: number) {
    const reservedColors: Record<string, string> = {};
    const currentChart = this.chart()?.chart; // Use optional chaining
    const newIndex = currentChart?.data.datasets.findIndex(
      dataset => dataset.label === topic.topicName
    );
    reservedColors[topic.topicName] =
      reservedColors[topic.topicName] ??
      this.colorScheme()?.[index % this.colorScheme()?.length];
    return {
      data: topic.dates,
      order: topic.order,
      label: topic.topicName,
      pointRadius: topic.dates?.length < 2 ? 4 : 0,
      pointBorderColor: '#1a1e2c',
      borderWidth: topic.secondAxis ? 2 : 1.4,
      ...(topic.dashed && {borderDash: [15, 5]}),
      lineTension: 0,
      pointBackgroundColor: reservedColors[topic.topicName],
      borderColor: reservedColors[topic.topicName],
      backgroundColor: reservedColors[topic.topicName],
      ...(topic.fillBackground && {
        fill: 'origin',
        backgroundColor: topic.fillBackground
      }),
      yAxisID: topic.secondAxis ? 'y1' : 'y',
      ...(newIndex > -1 &&
        currentChart?.data.datasets.length > newIndex && {
          hidden: !currentChart.isDatasetVisible(newIndex),
        }),
      ...(newIndex > -1 &&
        currentChart?.data.datasets.length > newIndex && {
          hidden: !currentChart.isDatasetVisible(newIndex),
        }),
    } as ChartDataset<'line', {date: string; value: number}[]>;
  }

  // Custom Tooltip Handler
  private externalTooltipHandler(context: { chart: Chart; tooltip: TooltipModel<'line'> }) {
    const {chart, tooltip} = context;
    // Hide if no tooltip
    if (tooltip.opacity === 0) {
      this.tooltipData.set(null);
      return;
    }

    // --- Set Content ---
    const title = tooltip.title?.join('\n') || '';

    // --- Position ---
    const canvasRect = chart.canvas.getBoundingClientRect(); // Get canvas position relative to viewport
    const tooltipWidth = this.customTooltip()?.nativeElement.offsetWidth ?? 300;
    const viewportWidth = window.innerWidth; // Get viewport width

    // Default position (relative to viewport)
    let x = canvasRect.left + tooltip.caretX + 10;
    const y = Math.max(0, canvasRect.top + tooltip.y - (tooltip.height / 2) + 10);

    // Flip to the left if it goes off-screen to the right
    if (x + tooltipWidth > viewportWidth) {
      x = canvasRect.left + tooltip.caretX - tooltipWidth - 10;
    }

    // Handle case where flipping left makes it go off-screen to the left
    if (x < 0) {
      x = 10; // Add some padding from the left edge
    }

    this.tooltipData.set({
      title,
      dataPoints: tooltip.dataPoints.map((item, i) => {
        const rawValue = (item.raw as any).value;
        const humanizedResult = humanizeUsage(this.unit(), rawValue);
        const formattedValue = `${humanizedResult.humanizedValue} ${humanizedResult.humanizedUnit}`;
        return {
        ...item, formattedValue: formattedValue,
        ...(item.raw['overrideTooltipLabel'] && { overrideTooltipLabel: item.raw['overrideTooltipLabel']}),
        color: tooltip.labelColors[i],
        striped: item.dataset.borderDash?.length > 0}
      }),
      columns: Math.floor(tooltip.dataPoints.length / 20) + 1,
      position: {x, y}
    });
  }
}
