import {createAction, props} from '@ngrx/store';
import {GroupedHyperParams, MetricOption} from '../reducers/experiments-compare-charts.reducer';
import {MetricValueType, SelectedMetricVariant} from '@common/experiments-compare/experiments-compare.constants';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';

export const EXPERIMENTS_COMPARE_SCALARS_GRAPH = 'EXPERIMENTS_COMPARE_SCALARS_GRAPH_';


export const getExperimentsHyperParams = createAction(
  EXPERIMENTS_COMPARE_SCALARS_GRAPH + 'GET_EXPERIMENTS_PARAMS',
  props<{ experimentsIds: string[]; autoRefresh?: boolean; scatter?: boolean }>()
);
export const setMetricsList = createAction(
  EXPERIMENTS_COMPARE_SCALARS_GRAPH + 'SET_METRICS_LIST',
  props<{ metricsList: MetricOption[] }>()
);

export const setMetricsResults = createAction(
  EXPERIMENTS_COMPARE_SCALARS_GRAPH + 'SET_METRICS_RESULTS',
  props<{   metricVariantsResults: MetricVariantResult[] }>()
);
export const setTasks = createAction(
  EXPERIMENTS_COMPARE_SCALARS_GRAPH + 'SET_TASKS',
  props<{ tasks: any }>()
);
export const setValueType = createAction(
  EXPERIMENTS_COMPARE_SCALARS_GRAPH + 'SET_VALUE_TYPE',
  props<{ valueType: MetricValueType }>()
);

export const setParamsHoverInfo = createAction(
  EXPERIMENTS_COMPARE_SCALARS_GRAPH + 'SET_PARAMS_HOVER_INFO',
  props<{ paramsHoverInfo: {section: string; name: string}[] }>()
);

export const setMetricsHoverInfo = createAction(
  EXPERIMENTS_COMPARE_SCALARS_GRAPH + 'SET_METRICS_HOVER_INFO',
  props<{ metricsHoverInfo: SelectedMetricVariant[] }>()
);
export const setHyperParamsList = createAction(
  EXPERIMENTS_COMPARE_SCALARS_GRAPH + 'SET_PARAMS_LIST',
  props<{ hyperParams: GroupedHyperParams }>()
);
export const setShowIdenticalHyperParams = createAction(EXPERIMENTS_COMPARE_SCALARS_GRAPH + 'SET_HIDE_IDENTICAL_HYPER_PARAMS');


