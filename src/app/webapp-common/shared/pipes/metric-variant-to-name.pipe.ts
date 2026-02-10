import {Pipe, PipeTransform} from '@angular/core';
import {SelectedMetricVariant} from '@common/experiments-compare/experiments-compare.constants';
import {MetricValueTypeStrings} from '@common/shared/utils/tableParamEncode';

@Pipe({
  name: 'metricVariantToName',
  })
export class MetricVariantToNamePipe implements PipeTransform {

  transform(metricVariant: SelectedMetricVariant, includeValueType?: boolean): string {
    if (!metricVariant) {
      return '';
    }
    return `${metricVariant.metric}/${metricVariant.variant}${includeValueType ?(' '+ MetricValueTypeStrings[metricVariant.valueType]) : ''}`;
  }

}
