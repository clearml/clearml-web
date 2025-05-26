import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output} from '@angular/core';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {MetricValueType} from '@common/experiments-compare/experiments-compare.constants';
import {SearchComponent} from '@common/shared/ui-components/inputs/search/search.component';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatExpansionPanel, MatExpansionPanelContent, MatExpansionPanelHeader, MatExpansionPanelTitle} from '@angular/material/expansion';
import {IsEmptyPipe} from '@common/shared/pipes/is-empty.pipe';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {AdvancedFilterPipe} from '@common/shared/pipes/advanced-filter.pipe';
import {MatRadioButton, MatRadioGroup} from '@angular/material/radio';
import {FormsModule} from '@angular/forms';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {HasSelectedPipe} from '@common/experiments/dumb/select-metric-for-custom-col/has-selected.pipe';
import {MatCheckbox} from '@angular/material/checkbox';

export interface SelectionEvent {
  variant: MetricVariantResult;
  addCol: boolean;
  valueType: MetricValueType;
}

@Component({
    selector: 'sm-select-metric-for-custom-col',
    templateUrl: './select-metric-for-custom-col.component.html',
    styleUrls: ['./select-metric-for-custom-col.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        SearchComponent,
        ClickStopPropagationDirective,
        MatProgressSpinner,
        MatExpansionPanel,
        IsEmptyPipe,
        MatExpansionPanelHeader,
        MatExpansionPanelTitle,
        TooltipDirective,
        AdvancedFilterPipe,
        MatExpansionPanelContent,
        ShowTooltipIfEllipsisDirective,
        MatRadioButton,
        MatRadioGroup,
        FormsModule,
        HasSelectedPipe,
        MatCheckbox
    ]
})
export class SelectMetricForCustomColComponent {
  public metricTree: Record<string, MetricVariantResult[]>;
  public filteredMetricTree: [string, MetricVariantResult[]][];
  public expandedMetrics = {};
  public metricsCols: Record<string, string[]>;
  public searchText: string;
  public entriesLimit = 300;
  public moreResults: number;
  private debounceTimer: number;
  public selectedMetric: Record<string, boolean>;

  @Input() set metricVariants(metricVar: MetricVariantResult[]) {
    if (metricVar === null) {
      return;
    }
    this.metricTree = metricVar?.reduce((result, metric) => {
      if (result[metric.metric]) {
        result[metric.metric].push(metric);
      } else {
        result[metric.metric] = [metric];
      }
      return result;
    }, {} as Record<string, MetricVariantResult[]>);
    this.filteredMetricTree = Object.entries(this.metricTree || {}).slice(0, this.entriesLimit);
    this.moreResults = Object.keys(this.metricTree || {}).length - this.filteredMetricTree.length;
  }

  @Input() set tableCols(tableCols) {
    this.metricsCols = {};
    this.selectedMetric = {};
    tableCols?.filter(tableCol => tableCol.metric_hash)?.forEach(tableCol => {
      this.expandedMetrics[tableCol.metric_hash] = this.expandedMetrics[tableCol.metric_hash] ?? true;
      this.selectedMetric[tableCol.metric_hash] = true;
      if (this.metricsCols[tableCol.metric_hash + tableCol.variant_hash]) {
        this.metricsCols[tableCol.metric_hash + tableCol.variant_hash].push(tableCol.valueType ?? tableCol.metricName);
      } else {
        this.metricsCols[tableCol.metric_hash + tableCol.variant_hash] = [tableCol.valueType ?? tableCol.metricName];
      }
    });
  }

  @Input() multiSelect = true;
  @Input() skipValueType = false;
  @Input() enableClearSelection: boolean;
  // @Output() getMetricsToDisplay  = new EventEmitter();
  @Output() selectedMetricToShow = new EventEmitter<SelectionEvent>();
  @Output() clearSelection = new EventEmitter();
  @Output() goBack = new EventEmitter();

  constructor(private changeDetectorRef: ChangeDetectorRef) {
  }

  toggleAllMetricsToDisplay(variant: ISmCol, on: boolean) {
    if (on) {
      this.toggleMetricToDisplay(variant, on, null);
      if (this.multiSelect) {
        this.metricsCols[variant.metric_hash + variant.variant_hash] = [];
      } else {
        this.metricsCols = {[variant.metric_hash + variant.variant_hash]: []};
      }
    } else {
      this.toggleMetricToDisplay(variant, on, 'min_value');
      this.toggleMetricToDisplay(variant, on, 'max_value');
      this.toggleMetricToDisplay(variant, on, 'value');
    }
  }

  public toggleMetricToDisplay(variant: ISmCol, value: boolean, valueType: MetricValueType) {
    this.selectedMetricToShow.emit({variant, addCol: value, valueType});
  }

  public resetSearch() {
    this.searchQ('');
  }

  public searchQ(value: string) {
    window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      this.searchText = value;
      if (value?.length > 0) {
        const query = value.toLowerCase();
        this.filteredMetricTree = Object.entries(this.metricTree).filter(([, results]) =>
          results.some(variant => variant.variant.toLowerCase().includes(query) || variant.metric.toLowerCase().includes(query))
        );
        this.moreResults = this.filteredMetricTree.length - this.entriesLimit;
        this.filteredMetricTree = this.filteredMetricTree.slice(0, this.entriesLimit);
      } else {
        this.filteredMetricTree = Object.entries(this.metricTree).slice(0, this.entriesLimit);
        this.moreResults = Object.keys(this.metricTree).length - this.filteredMetricTree.length;
      }
      this.changeDetectorRef.detectChanges();
    }, 275);
  }

}
