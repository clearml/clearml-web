import {createAction, props} from '@ngrx/store';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';

export const EXPERIMENTS_COMPARE_SELECT_EXPERIMENT_ = 'EXPERIMENTS_COMPARE_SELECT_EXPERIMENT_';

export const RESET_SELECT_EXPERIMENT_FOR_COMPARE = EXPERIMENTS_COMPARE_SELECT_EXPERIMENT_ + 'RESET_SELECT_EXPERIMENT_FOR_COMPARE';
export const SET_HIDE_IDENTICAL_ROWS = EXPERIMENTS_COMPARE_SELECT_EXPERIMENT_ + 'SET_HIDE_IDENTICAL_ROWS';
export const SET_SHOW_ROW_EXTREMES = EXPERIMENTS_COMPARE_SELECT_EXPERIMENT_ + 'SET_SHOW_ROW_EXTREMES';
export const SET_SHOW_GLOBAL_LEGEND = EXPERIMENTS_COMPARE_SELECT_EXPERIMENT_ + 'SET_SHOW_GLOBAL_LEGEND';
export const SET_EXPERIMENTS_UPDATE_TIME = EXPERIMENTS_COMPARE_SELECT_EXPERIMENT_ + 'SET_EXPERIMENTS_UPDATE_TIME';
export const REFRESH_IF_NEEDED = EXPERIMENTS_COMPARE_SELECT_EXPERIMENT_ + 'REFRESH_IF_NEEDED';
export const REFETCH_EXPERIMENT_REQUESTED = EXPERIMENTS_COMPARE_SELECT_EXPERIMENT_ + 'REFETCH_EXPERIMENT_REQUESTED';


export const setHideIdenticalFields = createAction(SET_HIDE_IDENTICAL_ROWS, props<{payload: boolean}>());
export const setShowRowExtremes = createAction(SET_SHOW_ROW_EXTREMES, props<{payload: boolean}>());
export const setShowGlobalLegend = createAction(SET_SHOW_GLOBAL_LEGEND);
export const setExperimentsUpdateTime = createAction(SET_EXPERIMENTS_UPDATE_TIME, props<{ payload: Record<string, Date>}>());
export const refreshIfNeeded = createAction(REFRESH_IF_NEEDED, props<{ payload: boolean; autoRefresh?: boolean; entityType: string }>());
export const resetSelectCompareHeader = createAction(RESET_SELECT_EXPERIMENT_FOR_COMPARE, props<{fullReset?: boolean}>());

export const refetchExperimentRequested = createAction(REFETCH_EXPERIMENT_REQUESTED, props<{ autoRefresh: boolean; entity: EntityTypeEnum }>());

export const setExportTable = createAction(
  EXPERIMENTS_COMPARE_SELECT_EXPERIMENT_ + '[set export table]',
  props<{export: boolean}>()
);
