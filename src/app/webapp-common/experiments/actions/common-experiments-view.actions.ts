import {createAction, props} from '@ngrx/store';
import {ITableExperiment} from '../shared/common-experiment-model.model';
import {ISmCol} from '../../shared/ui-components/data/table/table.consts';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {TableFilter} from '../../shared/utils/tableParamEncode';
import {ProjectsGetTaskParentsResponseParents} from '~/business-logic/model/projects/projectsGetTaskParentsResponseParents';
import {SortMeta} from 'primeng/api';
import {CountAvailableAndIsDisableSelectedFiltered} from '@common/shared/entity-page/items.utils';
import {TasksEnqueueManyResponseSucceeded} from '~/business-logic/model/tasks/tasksEnqueueManyResponseSucceeded';
import {EXPERIMENTS_INFO_PREFIX} from '@common/experiments/actions/common-experiments-menu.actions';
import {EXPERIMENTS_PREFIX} from '@common/experiments/experiment.consts';
import {
  OrganizationPrepareDownloadForGetAllRequest
} from '~/business-logic/model/organization/organizationPrepareDownloadForGetAllRequest';
import {ISelectedExperiment} from '~/features/experiments/shared/experiment-info.model';
import {EventTypeEnum} from '~/business-logic/model/events/eventTypeEnum';
import {
  createExperimentDialogResult
} from '@common/experiments/containers/create-experiment-dialog/create-experiment-dialog.component';

// COMMANDS:
export const getExperiments = createAction(EXPERIMENTS_PREFIX + ' [get experiments]');
export const selectNextExperiment = createAction(EXPERIMENTS_PREFIX + ' [select next experiment]');

export const getExperimentsWithPageSize = createAction(EXPERIMENTS_PREFIX + ' [get experiments with size]',
  props<{ pageSize: number }>());
export const getNextExperiments = createAction(
  EXPERIMENTS_PREFIX + '[get next experiments]',
  (allProjects = false) => ({allProjects})
);

export const setTableCols = createAction(
  EXPERIMENTS_PREFIX + ' [set table cols]',
  props<{ cols: ISmCol[] }>()
);

export const refreshExperiments = createAction(
  EXPERIMENTS_PREFIX + ' [refresh experiment]',
  props<{ hideLoader: boolean; autoRefresh?: boolean }>()
);

export const setExperiments = createAction(
  EXPERIMENTS_PREFIX + ' [set experiments]',
  props<{ experiments: ITableExperiment[]; noPreferences?: boolean }>()
);
export const setTableRefreshPending = createAction(
  EXPERIMENTS_PREFIX + ' [set experiments temporary]',
  props<{ refresh: boolean }>()
);
export const setExperimentInPlace = createAction(
  EXPERIMENTS_PREFIX + '[set experiment in place]',
  props<{ experiments: ITableExperiment[] }>()
);

export const setNoMoreExperiments = createAction(
  EXPERIMENTS_PREFIX + ' [set no more experiments]',
  props<{ hasMore: boolean }>()
);

export const addExperiments = createAction(
  EXPERIMENTS_PREFIX + ' [add many experiments]',
  props<{ experiments: ITableExperiment[] }>()
);

export const removeExperiments = createAction(
  EXPERIMENTS_PREFIX + ' [remove many experiments]',
  props<{ experiments: string[] }>()
);

export const updateExperiment = createAction(
  EXPERIMENTS_PREFIX + ' [update experiment]',
  props<{ id: string; changes: Partial<ITableExperiment> }>()
);

export const updateManyExperiment = createAction(
  EXPERIMENTS_PREFIX + 'update many experiments',
  props<{ changeList: TasksEnqueueManyResponseSucceeded[] }>()
);

export const setSelectedExperiments = createAction(
  EXPERIMENTS_PREFIX + ' [set selected experiments]',
  props<{ experiments: ISelectedExperiment[]}>()
);

export const getSelectedExperimentsByIds = createAction(
  EXPERIMENTS_PREFIX + ' [get selected experiments by id]',
  props<{ experiments: ISelectedExperiment[] }>()
);
export const getSelectedExperiments = createAction(
  EXPERIMENTS_PREFIX + ' [get selected experiments]',
  props<{ ids: string[] }>()
);
export const updateUrlParams = createAction(EXPERIMENTS_PREFIX + '[update URL params from state]');

export const setSelectedExperiment = createAction(
  EXPERIMENTS_PREFIX + ' [set selected experiment]',
  props<{ experiment: ITableExperiment }>()
);

export const experimentSelectionChanged = createAction(
  EXPERIMENTS_PREFIX + ' [experiment selection changed]',
  props<{ experiment: { id?: string }; project?: string; replaceURL?: boolean }>()
);


export const selectAllExperiments = createAction(
  EXPERIMENTS_PREFIX + ' [select all experiments]',
  props<{ filtered: boolean }>()
);

export const toggleColHidden = createAction(
  EXPERIMENTS_PREFIX + ' [toggle column hidden state]',
  props<{ columnId: string; projectId: string }>()
);

export const toggleSelectedMetricCompare = createAction(
  EXPERIMENTS_PREFIX + ' [toggle metric selected state]',
  props<{ columnId: string; projectId: string }>()
);

export const setVisibleColumnsForProject = createAction(
  EXPERIMENTS_PREFIX + 'SET_HIDDEN_COLS_FOR_PROJECT',
  props<{ visibleColumns: string[]; projectId: string }>()
);

export const setParents = createAction(
  EXPERIMENTS_PREFIX + '[set project experiment parents]',
  props<{ parents: ProjectsGetTaskParentsResponseParents[] }>()
);

export const resetTablesFilterParentsOptions = createAction(
  EXPERIMENTS_PREFIX + '[reset project experiment parents]'
);

export const setActiveParentsFilter = createAction(
  EXPERIMENTS_PREFIX + '[set active parents filter]',
  props<{ parents: ProjectsGetTaskParentsResponseParents[] }>()
);

export const getParents = createAction(
  EXPERIMENTS_PREFIX + '[get project experiments parents]',
  props<{searchValue: string; allProjects?: boolean}>());

export const tableFilterChanged = createAction(
  EXPERIMENTS_PREFIX + '[table filter changed]',
  props<{ filters: TableFilter[]; projectId: string }>()
);

export const tableSortChanged = createAction(
  EXPERIMENTS_PREFIX + ' [table sort changed]',
  props<{ isShift: boolean; colId: ISmCol['id'] }>()
);

export const setTableSort = createAction(
  EXPERIMENTS_PREFIX + ' [set table sort]',
  props<{ orders: SortMeta[]; projectId: string }>()
);

export const setTableFilters = createAction(
  EXPERIMENTS_PREFIX + ' [set table filters]',
  props<{ filters: TableFilter[]; projectId: string }>()
);

export const setProjectsTypes = createAction(
  EXPERIMENTS_PREFIX + 'SET_PROJECT_TYPES',
  props<{ types?: Array<string> }>()
);

export const getProjectTypes = createAction(EXPERIMENTS_PREFIX + 'GET_PROJECT_TYPES',
  props<{allProjects?: boolean}>());

export const showOnlySelected = createAction(
  EXPERIMENTS_PREFIX + ' [show only selected]',
  props<{ active: boolean; projectId: string }>()
);

export const globalFilterChanged = createAction(
  EXPERIMENTS_PREFIX + 'GLOBAL_FILTER_CHANGED',
  props<{ query: string; regExp?: boolean }>()
);

export const resetGlobalFilter = createAction(EXPERIMENTS_PREFIX + 'RESET_GLOBAL_FILTER');

export const setCurrentScrollId = createAction(
  EXPERIMENTS_PREFIX + ' [set current scrollId]',
  props<{ scrollId: string }>()
);
export const setHyperParamsFiltersPage = createAction(
  EXPERIMENTS_PREFIX + ' [set hyper params filters page]',
  props<{ page: number }>()
);
export const resetExperiments = createAction(
  EXPERIMENTS_PREFIX + ' [reset experiments]',
  props<{skipResetMetric?: boolean}>());
export const getCustomMetrics = createAction(
  EXPERIMENTS_PREFIX + ' [get custom metrics]',
  props<{hideLoader?: boolean; projectId?: string}>()
);
export const getCustomMetricsPerType = createAction(
  EXPERIMENTS_PREFIX + ' [get custom metrics per type]',
  props<{ids?: string[]; metricsType?: EventTypeEnum; isModel?: boolean}>());

export const getCustomHyperParams = createAction(EXPERIMENTS_PREFIX + ' [get custom hyper parameter]');

export const setCustomMetrics = createAction(
  EXPERIMENTS_PREFIX + ' [set custom metrics]',
  props<{ metrics: MetricVariantResult[], projectId: string; compareView: EventTypeEnum}>()
);
export const setCustomHyperParams = createAction(
  EXPERIMENTS_PREFIX + ' [set custom hyper params]',
  props<{ params: any[] }>()
);

export const setExtraColumns = createAction(
  EXPERIMENTS_PREFIX + 'SET_EXTRA_COLUMNS',
  props<{ columns: ISmCol[]; projectId: string }>()
);

export const addColumn = createAction(
  EXPERIMENTS_PREFIX + ' [add column]',
  props<{ col: ISmCol }>()
);

export const addSelectedMetric = createAction(
  EXPERIMENTS_PREFIX + ' [add selected metric scalars]',
  props<{ col: Partial<ISmCol>; projectId: string }>()
);

export const addSelectedMetricPlots = createAction(
  EXPERIMENTS_PREFIX + ' [add selected metric plots]',
  props<{ col: Partial<ISmCol>; projectId: string }>()
);

export const removeCol = createAction(
  EXPERIMENTS_PREFIX + ' [remove column]',
  props<{ id: string; projectId: string }>()
);

export const removeSelectedMetric = createAction(
  EXPERIMENTS_PREFIX + ' [remove selected metric]',
  props<{ id: string; projectId: string }>()
);

export const setColumnWidth = createAction(
  EXPERIMENTS_PREFIX + ' [set column width]',
  props<{ projectId: string; columnId: string; widthPx: number }>()
);

export const setColsOrderForProject = createAction(
  EXPERIMENTS_PREFIX + ' [set cols order]',
  props<{ cols: string[]; projectId: string }>()
);

export const clearHyperParamsCols = createAction(
  EXPERIMENTS_PREFIX + ' [Clear HyperParam Cols]',
  props<{ projectId: string }>()
);

export const resetSortOrder = createAction(
  EXPERIMENTS_PREFIX + 'RESET_SORT_ORDER',
  props<{ sortIndex: number; projectId: string }>()
);

export const setSplitSize = createAction(EXPERIMENTS_PREFIX + 'SET_SPLIT_SIZE', props<{ splitSize: number }>());

export const hyperParamSelectedInfoExperiments = createAction(
  EXPERIMENTS_PREFIX + '[hyper param option add filter experiments]',
  props<{ col: ISmCol; values: string[]; loadMore: boolean }>()
);

export const hyperParamSelectedExperiments = createAction(
  EXPERIMENTS_INFO_PREFIX + '[hyper param selected in the menu filter experiments]',
  props<{ col: ISmCol; searchValue: string }>()
);

export const getTags = createAction(EXPERIMENTS_PREFIX + ' [get experiments tags]' ,
  props<{allProjects?: boolean}>());

export const setTags = createAction(
  EXPERIMENTS_PREFIX + '[set experiment tags]',
  props<{ tags: string[] }>()
);
export const addProjectsTag = createAction(
  EXPERIMENTS_PREFIX + '[add experiment tag]',
  props<{tag: string}>()
);
export const setSelectedExperimentsDisableAvailable = createAction(
  EXPERIMENTS_PREFIX + 'setSelectedExperimentsDisableAvailable',
  props<{ selectedExperimentsDisableAvailable: Record<string, CountAvailableAndIsDisableSelectedFiltered> }>()
);
export const setTableMode = createAction(
  EXPERIMENTS_PREFIX + '[set table view mode]',
  props<{ mode: 'info' | 'table' | 'compare'}>()
);
export const setCompareView= createAction(
  EXPERIMENTS_PREFIX + '[set table compare view]',
  props<{ mode: 'scalars' | 'plots' }>()
);

export const toggleCompareScalarSettings = createAction(
  EXPERIMENTS_PREFIX + '[toggle compare scalars settings]'
);
export const prepareTableForDownload = createAction(
  EXPERIMENTS_PREFIX + ' [prepareTableForDownload]',
  props<{ entityType: OrganizationPrepareDownloadForGetAllRequest.EntityTypeEnum }>()
);
export const createExperiment = createAction(
  EXPERIMENTS_PREFIX + ' [create experiment]',
  props<{data: createExperimentDialogResult}>()
);
export const createExperimentSuccess = createAction(
  EXPERIMENTS_PREFIX + ' [create experiment success]',
  props<{data: createExperimentDialogResult, project: string}>()
);
export const openExperiment = createAction(
  EXPERIMENTS_PREFIX + ' [open experiment]',
  props<{id: string; project: string}>()
);
