import {createAction, props} from '@ngrx/store';
import {Task} from '~/business-logic/model/tasks/task';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';

export const EXPERIMENTS_COMPARE_METRICS_VALUES_ = 'EXPERIMENTS_COMPARE_METRICS_VALUES_';

export const getComparedExperimentsMetricsValues = createAction(
  EXPERIMENTS_COMPARE_METRICS_VALUES_ + 'GET_COMPARED_EXPERIMENTS_METRICS_VALUES',
  props<{ taskIds: string[]; entity: EntityTypeEnum; autoRefresh?: boolean }>()
);
export const setComparedExperiments = createAction(
  EXPERIMENTS_COMPARE_METRICS_VALUES_ + 'SET_COMPARED_EXPERIMENTS',
  props<{ experiments: Task[] }>()
);


export const resetState = createAction(EXPERIMENTS_COMPARE_METRICS_VALUES_ + 'RESET_STATE');
