import {Pipe, PipeTransform} from '@angular/core';
import {SelectedMetric, SelectedMetricVariant} from '@common/experiments-compare/experiments-compare.constants';

@Pipe({
  name: 'metricResultToSelectedMetric',
  })
export class MetricResultToSelectedMetricPipe implements PipeTransform {

  transform(metricVariant: SelectedMetricVariant): SelectedMetric {
    if (!metricVariant) {
      return null;
    }
    return {
      name: `${metricVariant.metric}/${metricVariant.variant}`,
      path: `${metricVariant.metric_hash}.${metricVariant.variant_hash}`,
      valueType: metricVariant.valueType
    };
  }
}
