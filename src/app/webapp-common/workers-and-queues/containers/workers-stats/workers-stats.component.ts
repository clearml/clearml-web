import {
  ChangeDetectionStrategy,
  Component,
  computed, DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild
} from '@angular/core';
import {Store} from '@ngrx/store';
import {Worker} from '~/business-logic/model/workers/worker';
import {Topic} from '@common/shared/utils/statistics';
import {IOption} from '@common/shared/ui-components/inputs/select-autocomplete-with-chips/select-autocomplete-with-chips.component';
import {getWorkerStats, setStats, setStatsParams} from '../../actions/workers.actions';
import {selectStats, selectStatsErrorNotice, selectStatsParams, selectStatsTimeFrame} from '../../reducers/index.reducer';
import {timeFrameOptions} from '@common/constants';
import {combineLatest, interval, switchMap} from 'rxjs';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {distinctUntilChanged, filter, tap} from 'rxjs/operators';
import {FormsModule} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';
import {LineChartComponent} from '@common/shared/components/charts/line-chart/line-chart.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';

@Component({
  selector: 'sm-workers-graph',
  templateUrl: './workers-stats.component.html',
  styleUrls: ['./workers-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatFormFieldModule,
    FormsModule,
    MatSelectModule,
    MatIconModule,
    LineChartComponent,
    TooltipDirective
  ]
})
export class WorkersStatsComponent {
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  protected statsError = this.store.selectSignal(selectStatsErrorNotice);
  protected currentTimeFrame = this.store.selectSignal<string>(selectStatsTimeFrame);
  protected currentParam = this.store.selectSignal<string>(selectStatsParams);
  protected chartData = this.store.selectSignal<Topic[]>(selectStats);

  protected chartRef = viewChild<ElementRef<HTMLDivElement>>('chart');
  public activeWorker = input<Worker>();
  protected chartState = computed(() => ({
    chart: this.chartData(),
    refreshChart: signal(!this.chartData())
  }))
  public yAxisLabel = computed(() => this.activeWorker() ? this.yAxisLabels[this.currentParam()] : 'Count');

  constructor() {
    combineLatest([
      toObservable(this.chartRef),
      toObservable(this.activeWorker).pipe(distinctUntilChanged((a, b) => a?.id === b?.id)),
      this.store.select(selectStatsParams),
      this.store.select(selectStatsTimeFrame),
    ])
      .pipe(
        takeUntilDestroyed(),
        filter(([chart]) => !!chart),
        switchMap(() => {
          const range = parseInt(this.currentTimeFrame(), 10);
          this.chartState().refreshChart.set(true);
          const maxPoints = Math.min(0.8 * this.chartRef().nativeElement.clientWidth || 1000, 1000);
          const granularity = Math.max(Math.floor(range / maxPoints), 40);
          this.store.dispatch(setStats({data: null}));
          this.store.dispatch(getWorkerStats({maxPoints}));

          return interval(granularity * 1000)
            .pipe(
              takeUntilDestroyed(this.destroyRef),
              tap(() => this.store.dispatch(getWorkerStats({maxPoints})))
            );
        })
      )
      .subscribe()
  }

  timeFrameOptions = timeFrameOptions;
  public chartParamOptions: IOption[] = [
    {label: 'CPU and GPU Usage', value: 'cpu_usage;gpu_usage'},
    {label: 'Memory Usage', value: 'memory_used'},
    {label: 'GPU Memory', value: 'gpu_memory_used'},
    {label: 'Network Usage', value: 'network_rx;network_tx'}
    //    {label: 'Frames Processed', value: 'frames'},
  ];

  public yAxisLabels = {
    'cpu_usage;gpu_usage': 'Usage %',
    memory_used: 'Bytes',
    gpu_memory_used: 'Bytes',
    'network_rx;network_tx': 'Bytes/sec'
  };

  chartParamChange(event: string) {
    const maxPoints = Math.min(0.8 * this.chartRef().nativeElement.clientWidth || 1000, 1000);
    this.store.dispatch(setStatsParams({timeFrame: this.currentTimeFrame(), param: event, maxPoints}));
  }

  timeFrameChange(event: string) {
    const maxPoints = Math.min(0.8 * this.chartRef().nativeElement.clientWidth || 1000, 1000);
    this.store.dispatch(setStatsParams({timeFrame: event, param: this.currentParam(), maxPoints}));
  }
}
