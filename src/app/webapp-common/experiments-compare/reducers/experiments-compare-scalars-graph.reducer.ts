import {createReducer, on} from '@ngrx/store';
import {
  setHyperParamsList, setMetricsHoverInfo,
  setMetricsList,
  setMetricsResults, setParamsHoverInfo,
  setShowIdenticalHyperParams,
  setTasks,
  setValueType
} from '../actions/experiments-compare-scalars-graph.actions';
import {GroupedHyperParams, MetricOption} from './experiments-compare-charts.reducer';
import {MetricValueType, SelectedMetricVariant} from '@common/experiments-compare/experiments-compare.constants';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';

export interface ScalarsGraphState {
  showIdenticalHyperParams: boolean;
  metrics: MetricOption[];
  metricVariantsResults: MetricVariantResult[];
  hyperParams: GroupedHyperParams;
  tasks: any;
  valueType: MetricValueType;
  paramsHoverInfo: {section: string; name: string}[];
  metricsHoverInfo: SelectedMetricVariant[];
}

export const initialState: ScalarsGraphState = {
  showIdenticalHyperParams: true,
  metrics: null,
  metricVariantsResults: null,
  hyperParams: null,
  tasks: [],
  valueType: 'value',
  paramsHoverInfo: [],
  metricsHoverInfo: []
};

export const scalarsGraphReducer = createReducer(initialState,
  on(setShowIdenticalHyperParams, (state): ScalarsGraphState => ({
    ...state,
    showIdenticalHyperParams: !state.showIdenticalHyperParams
  })),
  on(setMetricsList, (state, {metricsList}): ScalarsGraphState => ({...state, metrics: metricsList})),
  on(setMetricsResults, (state, {metricVariantsResults}): ScalarsGraphState => ({...state, metricVariantsResults: metricVariantsResults})),
  on(setHyperParamsList, (state, {hyperParams}): ScalarsGraphState => ({...state, hyperParams})),
  on(setParamsHoverInfo, (state, {paramsHoverInfo}): ScalarsGraphState => ({...state, paramsHoverInfo})),
  on(setMetricsHoverInfo, (state, {metricsHoverInfo}): ScalarsGraphState => ({...state, metricsHoverInfo})),
  on(setTasks, (state, {tasks}): ScalarsGraphState => ({...state, tasks})),
  on(setValueType, (state, {valueType}): ScalarsGraphState => ({...state, valueType})),
);
