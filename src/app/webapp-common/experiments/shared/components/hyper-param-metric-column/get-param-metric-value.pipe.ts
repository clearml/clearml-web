import {Pipe, PipeTransform} from '@angular/core';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {ITask} from '~/business-logic/model/al-task';
import {GetVariantWithoutRoundPipe} from './get-variant-without-round.pipe';
import {getRoundedNumber} from '../../common-experiments.utils';
import {decodeHyperParam} from '@common/shared/utils/tableParamEncode';

@Pipe({
  name: 'getParamMetricValue',
  })
export class GetParamMetricValuePipe implements PipeTransform {

  transform(col: ISmCol, experiment: ITask, roundedMetricValue: any) {
    return col.isParam ?
      this.getHyperParam(experiment?.hyperparams, col) :
      (col.metric_hash ? this.getVariant(experiment?.last_metrics, col, roundedMetricValue) : experiment[col.id]);
  }

  getHyperParam(params, col) {
    if (params) {
      const {name, section} = decodeHyperParam(col);
      return params?.[section]?.[name]?.value;
    }
    return '';
  }

  getVariant(metrics, col, roundedMetricValue) {
    return (roundedMetricValue?.noRound ? new GetVariantWithoutRoundPipe().transform(col, metrics) : this.getVariantRound(metrics, col)) || '';
  }

  getVariantRound(metrics, col) {
    const value = new GetVariantWithoutRoundPipe().transform(col, metrics);
    return value ? getRoundedNumber(value) : value;
  }
}


