import {Component, ChangeDetectionStrategy, signal, effect, input, computed, viewChild} from '@angular/core';
import {ActiveDataPoint, ChartData, ChartEvent, ChartOptions, ChartType} from 'chart.js';
import {BaseChartDirective} from 'ng2-charts';

import {ChooseColorModule} from '@common/shared/ui-components/directives/choose-color/choose-color.module';
import {toObservable} from '@angular/core/rxjs-interop';
import {combineLatest, fromEvent, of} from 'rxjs';
import {delay, startWith, switchMap} from 'rxjs/operators';
import {PushPipe} from '@ngrx/component';

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
        ChooseColorModule,
        PushPipe
    ]
})
export class DonutComponent {
  public doughnutChartType: ChartType = 'doughnut';
  private chart = viewChild(BaseChartDirective);

  highlight = signal<number>(null);
  donutOptions = {
    maintainAspectRatio: false,
    borderWidth: 0,
    plugins: {
      legend: {display: false},
      tooltip: {enabled: false}
    },
  } as ChartOptions<'doughnut'>;

  data = input.required<DonutChartData[]>();
  colors = input<string[]>();
  resize = input<number>();
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
      return  {
        caption: this.donutData().labels[this.highlight()],
        value,
        percent: Math.round(value / this.total() * 100),
      };
    } else {
      return null;
    }
  });
  resizing$ = combineLatest([
    fromEvent(window, 'resize').pipe(startWith(null)),
    toObservable(this.resize)
  ])
    .pipe(
      switchMap(() => of(of(true), of(false).pipe(delay(100)))),
      switchMap(v => v)
    );

  constructor() {
    effect(() => {
      if (this.chart()) {
        window.setTimeout(() => this.chart().update(), 50)
      }
    });
  }

  public chartHovered({ active }: { event: ChartEvent; active: object[]; }): void {
    this.highlight.set((active?.[0] as {datasetIndex: number; index: number})?.index ?? null);
  }

  hoverLegend(slice: number) {
    this.highlight.set(slice);

    const element: ActiveDataPoint  = {datasetIndex: 0, index: slice};
    this.chart()?.chart.setActiveElements([element]);
    this.chart()?.chart.update('none');
  }

  leaveLegend() {
    this.highlight.set(null);
    this.chart()?.chart.setActiveElements([]);
    this.chart()?.chart.update('none');
  }
}
