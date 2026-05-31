import * as actions from '../actions/experiments-compare-metrics-values.actions';
import {Task} from '~/business-logic/model/tasks/task';
import {createReducer, on} from '@ngrx/store';

export interface MetricSortBy {
  keyOrValue?: 'key' | 'value';
  order?: 'asc' | 'desc';
  keyOrder?: string[];
}

export interface IExperimentCompareMetricsValuesState {
  experiments: Task[];
}

export const initialState: IExperimentCompareMetricsValuesState = {
  experiments : null,
};

export const experimentsCompareMetricsValuesReducer = createReducer(
  initialState,
  on(actions.setComparedExperiments, (state, action): IExperimentCompareMetricsValuesState => ({...state, experiments: action.experiments})),
  on(actions.resetState, (): IExperimentCompareMetricsValuesState => ({...initialState})),

);
