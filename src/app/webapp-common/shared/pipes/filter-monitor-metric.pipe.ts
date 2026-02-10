import { Pipe, PipeTransform } from '@angular/core';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';

@Pipe({
  name: 'filterMonitorMetric',
  })
export class FilterMonitorMetricPipe implements PipeTransform {

  transform(value: {key: string; value: MetricVariantResult}[]) {
    return value.filter(({value}) => !value.metric.startsWith(':monitor:'));
  }

}
