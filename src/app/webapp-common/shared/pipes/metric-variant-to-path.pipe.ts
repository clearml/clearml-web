import {Pipe, PipeTransform} from '@angular/core';
import {SelectedMetricVariant} from '@common/experiments-compare/experiments-compare.constants';

@Pipe({
  name: 'metricVariantToPath',
  })
export class MetricVariantToPathPipe implements PipeTransform {

  transform(metricVariant: SelectedMetricVariant, includeValueType: boolean = false): string {
    if(!metricVariant)
    {
      return null
    }
    return `${metricVariant.metric_hash}.${metricVariant.variant_hash}${includeValueType ? ('.' + (metricVariant.valueType ?? 'value')) : ''}`;
  }

}
