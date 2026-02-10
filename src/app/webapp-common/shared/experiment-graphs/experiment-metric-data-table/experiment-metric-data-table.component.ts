import {ChangeDetectionStrategy, Component, computed, input, OnInit, output, signal} from '@angular/core';
import {Task} from '~/business-logic/model/tasks/task';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {sortMetricsList} from '@common/tasks/tasks.utils';
import {GroupedList} from '@common/tasks/tasks.model';
import {ExperimentCompareSettings} from '@common/experiments-compare/reducers/experiments-compare-charts.reducer';
import {
  SelectableGroupedFilterListComponent
} from '@common/shared/ui-components/data/selectable-grouped-filter-list/selectable-grouped-filter-list.component';
import {MatFormField, MatSuffix} from '@angular/material/form-field';
import {MatDrawer, MatDrawerContainer, MatDrawerContent} from '@angular/material/sidenav';
import {TableModule} from 'primeng/table';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {MatIconButton} from '@angular/material/button';
import {MatInput} from '@angular/material/input';
import {UpperCasePipe} from '@angular/common';
import {MatIconModule} from '@angular/material/icon';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SelectableGroupedFilterListComponent,
    MatFormField,
    MatIconModule,
    MatDrawerContainer,
    MatDrawer,
    MatDrawerContent,
    TableModule,
    ShowTooltipIfEllipsisDirective,
    TooltipDirective,
    ClickStopPropagationDirective,
    ReactiveFormsModule,
    MatIconButton,
    MatInput,
    UpperCasePipe,
    MatSuffix
  ]
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
      sortMetricsList(Object.keys(this.lastMetrics())).map((metricId) => {
        this.initialSelectedMetricsScalar.push((Object.values(this.lastMetrics()[metricId])[0] as any).metric);
        Object.keys(this.lastMetrics()[metricId])
          .map(variantId => {
            this.initialSelectedMetricsScalar.push(`${this.lastMetrics()[metricId][variantId].metric}${this.lastMetrics()[metricId][variantId].variant}`);
          })
      });
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
}
