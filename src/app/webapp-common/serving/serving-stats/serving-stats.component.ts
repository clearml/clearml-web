import {ChangeDetectionStrategy, Component, computed, effect, inject, input, signal} from '@angular/core';
import {Store} from '@ngrx/store';
import {servingFeature} from '@common/serving/serving.reducer';
import {ServingActions} from '@common/serving/serving.actions';
import {FormsModule} from '@angular/forms';
import {LineChartComponent} from '@common/shared/components/charts/line-chart/line-chart.component';
import {ServingGetEndpointMetricsHistoryRequest} from '~/business-logic/model/serving/servingGetEndpointMetricsHistoryRequest';
import {interval, switchMap} from 'rxjs';
import {filter, withLatestFrom} from 'rxjs/operators';
import {selectAppVisible, selectAutoRefresh} from '@common/core/reducers/view.reducer';
import {EndpointStats} from '~/business-logic/model/serving/endpointStats';
import {presetColorsDark} from '@common/shared/ui-components/inputs/color-picker/color-picker-wrapper.component';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';

const REFRESH_INTERVAL = 45000;

@Component({
    selector: 'sm-serving-stats',
    templateUrl: './serving-stats.component.html',
    styleUrls: ['./serving-stats.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        FormsModule,
        LineChartComponent
    ]
})
export class ServingStatsComponent {
  private store = inject(Store);

  public metricType = input<{ label: string; value: ServingGetEndpointMetricsHistoryRequest.MetricTypeEnum }>();
  public currentTimeFrame = input<string>();

  protected allChartsData = this.store.selectSignal(servingFeature.selectStats);
  protected selectedEndpoint = this.store.selectSignal(servingFeature.selectSelectedEndpoint);
  protected allSeriesLegends = this.store.selectSignal(servingFeature.selectAllSeriesLegends);

  protected refreshChart = signal(true);
  protected yAxisLabel = signal('');

  chartData = computed(() => this.allChartsData()?.[this.metricType().value] ?? null);
  private selectedWorkerId: string | undefined;

  // Keep same series (topics) in same colors in all plots even if different order (plot has color persistent when order changes)
  legends = computed(() => this.chartData()?.map(a => a.topicName))
  protected presetColors = computed(() => this.legends()?.map(series => presetColorsDark[this.allSeriesLegends().findIndex(leg => leg === series)]));

  protected yAxisLabels = {
    'cpu_usage;gpu_usage': 'Usage %',
    memory_used: 'Bytes',
    gpu_memory_used: 'Bytes',
    'network_rx;network_tx': 'Bytes/sec'
  };
  private previousEndpoint: EndpointStats;
  private previousTimeFrame: string;

  tickFormater = (value) => value;

  constructor() {
    effect(() => {
      if (this.selectedEndpoint()?.id !== this.selectedWorkerId) {
        if (this.selectedEndpoint()) {
          this.yAxisLabel.update(label => label?.[this.metricType().value]);
        }
      }
      this.selectedWorkerId = this.selectedEndpoint()?.id;
    });

    effect(() => {
      if (!!this.currentTimeFrame() && !!this.metricType() && this.selectedEndpoint()) {
        this.yAxisLabel.set(this.yAxisLabels[this.metricType().value]);
        if (this.selectedEndpoint()?.id !== this.previousEndpoint?.id || this.currentTimeFrame() !== this.previousTimeFrame) {
          this.chartChanged();
        }
        this.previousEndpoint = this.selectedEndpoint();
        this.previousTimeFrame = this.currentTimeFrame();
      }
    });

    effect(() => {
      if (this.chartData()) {
        this.refreshChart.set(false);
      }
    });

    this.autoRefreshSubscription();
  }

  chartChanged() {
    this.refreshChart.set(true);
    this.store.dispatch(ServingActions.getStats({metricType: this.metricType().value}));
  }

  autoRefreshSubscription() {
    toObservable(this.currentTimeFrame)
      .pipe(
        takeUntilDestroyed(),
        filter(timeFrame => !!timeFrame),
        switchMap(() => interval(REFRESH_INTERVAL)
          .pipe(
            withLatestFrom(
              this.store.select(selectAutoRefresh),
              this.store.select(selectAppVisible)
            ),
            filter(([, auto, visible]) => auto && visible)
          )
        ),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        // Many charts with many points stuck the UI. Better show loader
        if (Object.keys(this.allChartsData() ?? {}).length > 4 && parseInt(this.currentTimeFrame()) > 604000) {
          this.refreshChart.set(true);
        }
        this.store.dispatch(ServingActions.getStats({refresh: true, metricType: this.metricType().value}));
      });
  }
}
