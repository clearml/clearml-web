import {ChangeDetectionStrategy, Component, computed, effect, input, signal, viewChild} from '@angular/core';
import {ActiveDataPoint, ChartData, ChartEvent, ChartOptions, ChartType} from 'chart.js';
import {BaseChartDirective} from 'ng2-charts';

import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ChooseColorDirective} from '@common/shared/ui-components/directives/choose-color/choose-color.directive';
import {startWith} from 'rxjs/operators';
import {fromEvent} from 'rxjs';
import {HumanizeResultPipe} from '@common/shared/pipes/humanize-result.pipe';

export interface DonutChartData {
  name: string;
  quantity: number;
  percentage?: number;
  id?: number;
  color?: string;
}

@Component({
  selector: 'sm-donut',
  templateUrl: './donut.component.html',
  styleUrls: ['./donut.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BaseChartDirective,
    ChooseColorDirective,
    HumanizeResultPipe
  ]
})
export class DonutComponent {
  protected doughnutChartType: ChartType = 'doughnut';
  private ready = false;
  private chart = viewChild(BaseChartDirective);

  highlight = signal<number>(null);
  resizing = signal(false);
  animation = signal(true);

  data = input.required<DonutChartData[]>();
  colors = input<string[]>();
  resize = input<number>();
  units = input('');
  showPicker = input(true);

  donutOptions = computed(() => ({
    animation: {animateRotate: this.animation()},
    maintainAspectRatio: false,
    borderWidth: 0,
    layout: {
      padding: {
        top: 12,
        bottom: 12
      }
    },
    plugins: {
      legend: {display: false},
      tooltip: {enabled: false}
    },
  } as ChartOptions<'doughnut'>));

  protected donutData = computed<ChartData<'doughnut'>>(() => ({
      labels: this.data().map(slice => slice.name),
      datasets: [{
        data: this.data().map(slice => slice.quantity),
        backgroundColor: this.colors(),
        hoverOffset: 10,
      }]
    })
  );
  protected total = computed(() =>
    this.data().reduce((acc, slice) => acc + slice.quantity, 0)
  );
  protected highlightedData = computed(() => {
    if (this.highlight() !== null) {
      const value = this.donutData().datasets[0].data[this.highlight()];
      return {
        caption: this.donutData().labels[this.highlight()],
        value,
        percent: Math.round(value / this.total() * 100),
      };
    } else {
      return null;
    }
  });
  private resizeTimeout: number;

  constructor() {
    fromEvent(window, 'resize').pipe(startWith(null)).pipe(
      takeUntilDestroyed(),
    ).subscribe(() => {
      this.resizeChart();
    });

    effect(() => {
      this.resize();
      this.resizeChart();
    });


    effect(() => {
      if (this.chart()) {
        window.setTimeout(() => this.chart().update(), 50);
      }
    });

    effect(() => {
      this.data()
      this.ready = false;
      window.setTimeout(() => this.ready = true, 300);
    });

    effect(() => {
      this.colors();
      if (this.ready) {
        this.animation.set(false);
        window.setTimeout(() => {
          this.animation.set(true);
        }, 50);
      }
    });
  }

  private resizeChart() {
    this.resizing.set(true);
    window.clearTimeout(this.resizeTimeout);
    this.resizeTimeout = window.setTimeout(() => {
      this.resizing.set(false);
    }, 100);
  }

  public chartHovered({active}: { event: ChartEvent; active: object[]; }): void {
    this.highlight.set((active?.[0] as { datasetIndex: number; index: number })?.index ?? null);
  }

  hoverLegend(slice: number) {
    this.highlight.set(slice);

    const element: ActiveDataPoint = {datasetIndex: 0, index: slice};
    this.chart()?.chart.setActiveElements([element]);
    this.chart()?.chart.update('none');
  }

  leaveLegend() {
    this.highlight.set(null);
    this.chart()?.chart.setActiveElements([]);
    this.chart()?.chart.update('none');
  }

  protected readonly Number = Number;
}
