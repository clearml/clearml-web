import {Component, computed, effect, input, OnInit, output, signal, viewChild} from '@angular/core';
import {trackById, trackByIndex, trackByValue} from '@common/shared/utils/forms-track-by';
import {Task} from '~/business-logic/model/tasks/task';
import {FormControl} from '@angular/forms';
import {sortMetricsList} from '@common/tasks/tasks.utils';
import {GroupedList} from '@common/tasks/tasks.model';
import {ExperimentCompareSettings} from '@common/experiments-compare/reducers/experiments-compare-charts.reducer';
import {Table} from 'primeng/table';

interface tableRow {
  metricId: string;
  variantId: string;
  metric: string;
  variant: string;
  firstMetricRow: boolean;
  lastInGroup: boolean;
  last: number;
  min: number;
  max: number;
}

@Component({
    selector: 'sm-experiment-metric-data-table',
    styleUrls: [
        '../../../experiments-compare/containers/experiment-compare-metric-values/experiment-compare-metric-values.component.scss',
        './experiment-metric-data-table.component.scss'
    ],
    templateUrl: './experiment-metric-data-table.component.html',
    standalone: false
})


export class ExperimentMetricDataTableComponent implements OnInit {
  protected settings: ExperimentCompareSettings = {selectedMetricsScalar: []} as ExperimentCompareSettings;
  protected initialSelectedMetricsScalar: string[] = [];
  protected variantFilter = new FormControl('');

  selectedExperiment = input<string>();
  selectedMetricsScalar = input<string[]>();
  lastMetrics = input<Task['last_metrics']>();
  selectedMetricsChanged = output<string[]>();
  protected filterOpen: boolean;
  protected filterValue = signal<string>('');
  protected listSearchTerm = signal<string>('');
  private table = viewChild(Table);

  constructor() {
    effect(() => {
      if (this.table() && this.dataTableFiltered()) {
        window.setTimeout(() => this.table().scroller?.setSize(), 50);
      }
    });
  }

  ngOnInit(): void {
    this.variantFilter.valueChanges.subscribe((value) => this.filterValue.set(value));
  }

  searchTermChanged(searchTerm: string) {
    this.listSearchTerm.set(searchTerm);
  }

  public scrolled: boolean;
  public showFilterTooltip: boolean;

  trackByFunction(index: number, item) {
    return item?.id || item?.name || index;
  }

  clear() {
    this.variantFilter.reset('');
    this.selectedMetricsChanged.emit(null);
  }
  clearSearch() {
    this.variantFilter.reset('');  }

  computedSelectedMetricsScalar = computed<string[]>(() => {
    if (this.selectedMetricsScalar() === null) {
      if (!this.lastMetrics()) {
        return [];
      }
      this.initialSelectedMetricsScalar = [];
      sortMetricsList(Object.keys(this.lastMetrics())).map((metricId) => Object.keys(this.lastMetrics()[metricId])
        .map(variantId => {
          this.initialSelectedMetricsScalar.push(`${this.lastMetrics()[metricId][variantId].metric}${this.lastMetrics()[metricId][variantId].variant}`);
        }));
      return this.initialSelectedMetricsScalar;
    } else {
      return this.selectedMetricsScalar();
    }
  });


  dataTable = computed<tableRow[]>(() => {
    this.filterOpen = false;
    if (!this.lastMetrics()) {
      return [];
    }
    return sortMetricsList(Object.keys(this.lastMetrics())).map((metricId) => Object.keys(this.lastMetrics()[metricId]).map(variantId => {
      return {
        metricId,
        variantId,
        metric: this.lastMetrics()[metricId][variantId].metric,
        variant: this.lastMetrics()[metricId][variantId].variant,
        firstMetricRow: false,
        lastInGroup: false,
        last: this.lastMetrics()[metricId][variantId].value,
        min: this.lastMetrics()[metricId][variantId].min_value,
        max: this.lastMetrics()[metricId][variantId].max_value,
        mean: this.lastMetrics()[metricId][variantId].mean_value,
        first: this.lastMetrics()[metricId][variantId].first_value
      };
    })).flat(1);
  });

  metricVariantList$ = computed<GroupedList>(() => {
    if (!this.lastMetrics()) {
      return null;
    }
    const metricVariantList = {};
    sortMetricsList(Object.keys(this.lastMetrics() ?? {})).map((metricId) => Object.keys(this.lastMetrics()[metricId]).map(variantId => {
      const metric = this.lastMetrics()[metricId][variantId].metric;
      const variant = this.lastMetrics()[metricId][variantId].variant;
      if (metricVariantList[metric]) {
        metricVariantList[metric][variant] = {};
      } else {
        metricVariantList[metric] = {[variant]: {}};
      }
    }));
    return metricVariantList;
  });

  dataTableFiltered = computed<tableRow[]>(() => {
    const filteredData = this.dataTable()
      .filter(row => !this.selectedMetricsScalar() || this.selectedMetricsScalar()?.includes(`${row.metric}${row.variant}`))
      .filter(row => row.metric.toLowerCase().includes(this.filterValue().toLowerCase()) || row.variant.toLowerCase().includes(this.filterValue().toLowerCase()));
    return filteredData.map((row, i) => {
      row.firstMetricRow = row.metric !== filteredData[i - 1]?.metric;
      row.lastInGroup = row.metric !== filteredData[i + 1]?.metric;
      return row;
    });
  });

  colKeys = ['first', 'last', 'min', 'max', 'mean'];
  protected readonly trackById = trackById;
  protected readonly trackByValue = trackByValue;
  protected readonly trackByIndex = trackByIndex;


}
