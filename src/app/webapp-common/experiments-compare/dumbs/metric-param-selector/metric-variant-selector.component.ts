import {Component, EventEmitter, Input, Output} from '@angular/core';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {ExperimentCompareSharedModule} from '@common/experiments-compare/shared/experiment-compare-shared.module';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {uniqBy} from 'lodash-es';
import {SelectionEvent, SelectMetricForCustomColComponent} from '@common/experiments/dumb/select-metric-for-custom-col/select-metric-for-custom-col.component';
import {SelectedMetricVariant} from '@common/experiments-compare/experiments-compare.constants';
import {MetricVariantToNamePipe} from '@common/shared/pipes/metric-variant-to-name.pipe';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MetricValueTypeStrings} from '@common/shared/utils/tableParamEncode';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';

@Component({
    selector: 'sm-metric-variant-selector',
    imports: [
        MenuComponent,
        ExperimentCompareSharedModule,
        MetricVariantToNamePipe,
        TooltipDirective,
        SelectMetricForCustomColComponent,
        ShowTooltipIfEllipsisDirective
    ],
    templateUrl: './metric-variant-selector.component.html',
    styleUrl: './metric-variant-selector.component.scss'
})
export class MetricVariantSelectorComponent {
  public metricVariantsSet: MetricVariantResult[];
  @Input() selectedMetricVariants: SelectedMetricVariant[];
  @Input() multiSelect = false;
  @Input() skipValueType = false;
  @Input() title: string;
  @Input() set metricVariants(metricVariants: MetricVariantResult[]) {
    this.metricVariantsSet = uniqBy(metricVariants?.map(metricVariant => {
      return {...metricVariant, key: metricVariant.metric_hash + metricVariant.variant_hash};
    }), 'key')?.map(({key, ...metricVariant}) => metricVariant);
  }

  @Output() selectMetricVariant = new EventEmitter<SelectionEvent>();
  @Output() removeMetric = new EventEmitter<SelectedMetricVariant>();
  @Output() clearSelection = new EventEmitter();

  protected readonly MetricValueTypeStrings = MetricValueTypeStrings;
   searchText: string;
}
