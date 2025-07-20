import {createAction, props} from '@ngrx/store';
import {ISmCol} from '../../shared/ui-components/data/table/table.consts';
import {SelectedModel, TableModel} from '../shared/models.model';
import {TableFilter} from '../../shared/utils/tableParamEncode';
import {SortMeta} from 'primeng/api';
import {CountAvailableAndIsDisableSelectedFiltered} from '@common/shared/entity-page/items.utils';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {
  OrganizationPrepareDownloadForGetAllRequest
} from '~/business-logic/model/organization/organizationPrepareDownloadForGetAllRequest';

const MODELS_PREFIX = 'MODELS_';

export const fetchModelsRequested = createAction(MODELS_PREFIX + '[fetch models requested]');

export const refreshModels = createAction(
  MODELS_PREFIX + '[refresh models]',
  props<{ hideLoader: boolean; autoRefresh: boolean }>()
);

export const getNextModels = createAction(MODELS_PREFIX + '[get next model]');
export const selectNextModel = createAction(MODELS_PREFIX + '[select next model]');
export const getNextModelsWithPageSize = createAction(MODELS_PREFIX + '[get next model with page size]',
  props<{ pageSize: number }>());
export const setModels = createAction(
  MODELS_PREFIX + '[set models]',
  props<{ models: TableModel[] }>()
);

export const setModelsInPlace = createAction(
  MODELS_PREFIX + '[set models in place]',
  props<{ models: TableModel[] }>()
);

export const setNoMoreModels = createAction(
  MODELS_PREFIX + '[set no more models]',
  props<{ payload: boolean }>()
);

export const toggleColHidden = createAction(
  MODELS_PREFIX + 'TOGGLE_COL_HIDDEN',
  props<{ columnId: string; projectId: string }>()
);

export const getTags = createAction(
  MODELS_PREFIX + 'GET_TAGS');

export const getTagsForAllProjects = createAction(
  MODELS_PREFIX + 'GET_TAGS_ALL_PROJECTS');

export const setTags = createAction(
  MODELS_PREFIX + 'SET_TAGS',
  props<{ tags: string[] }>()
);

export const addProjectTag = createAction(
  MODELS_PREFIX + 'Add project tag',
  props<{ tag: string[] }>()
);

export const setMetadataKeys = createAction(
  MODELS_PREFIX + 'SET_METADATA_KEYS',
  props<{ keys: string[] }>()
);

export const setMetadataColValuesOptions = createAction(
  MODELS_PREFIX + '[setMetadataColValuesOptions]',
  props<{ col: ISmCol; values: string[] }>()
);

export const setHiddenCols = createAction(
  MODELS_PREFIX + 'SET_HIDDEN_COLS',
  props<{ hiddenCols: Record<string, boolean> }>()
);

export const setColsOrderForProject = createAction(
  MODELS_PREFIX + 'SET_COLS_ORDER',
  props<{ cols: string[]; projectId: string }>()
);

export const setExtraColumns = createAction(
  MODELS_PREFIX + 'SET_EXTRA_COLUMNS',
  props<{ columns: any[] ; projectId: string }>()
);

export const getMetadataKeysForProject = createAction(
  MODELS_PREFIX + 'GET_METADATA_FOR_PROJECT'
);
export const addColumn = createAction(
  MODELS_PREFIX + ' [ add column ]',
  props<{col: ISmCol}>()
);

export const removeCol = createAction(
  MODELS_PREFIX + ' [ remove column ]',
  props<{ id: string; projectId: string }>()
);

export const removeMetricCol = createAction(
  MODELS_PREFIX + ' [ remove metric column ]',
  props<{ id: string; projectId: string }>()
);

export const setFrameworks = createAction(
  MODELS_PREFIX + 'SET_FRAMEWORKS',
  props<{ frameworks: string[] }>()
);

export const getFrameworks = createAction(
  MODELS_PREFIX + 'GET_FRAMEWORKS');

export const getAllProjectsFrameworks = createAction(
  MODELS_PREFIX + 'GET_ALL_PROJECTS_FRAMEWORKS');

export const getFilteredUsers = createAction(
  MODELS_PREFIX + 'GET_FILTERED_USERS');

export const addModels = createAction(
  MODELS_PREFIX + '[add models]',
  props<{ models: TableModel[] }>()
);

export const removeModels = createAction(
  MODELS_PREFIX + '[remove models]',
  props<{ modelIds: string[] }>()
);

export const updateModel = createAction(
  MODELS_PREFIX + '[update model]',
  props<{ id: SelectedModel['id']; changes: Partial<SelectedModel> }>()
);

export const setSelectedModels = createAction(
  MODELS_PREFIX + '[set selected models]',
  props<{ models: SelectedModel[] }>()
);

export const setSelectedModel = createAction(
  MODELS_PREFIX + '[set selected model]',
  props<{ model: SelectedModel }>()
);

export const selectAllModels = createAction(
  MODELS_PREFIX + ' [select all models]',
  props<{ filtered: boolean }>()
);

export const tableSortChanged = createAction(
  MODELS_PREFIX + 'TABLE_SORT_CHANGED',
  props<{ isShift: boolean; colId: ISmCol['id'] }>()
);

export const setTableSort = createAction(
  MODELS_PREFIX + 'SET_TABLE_SORT',
  props<{ orders: SortMeta[]; projectId: string }>()
);

export const tableFilterChanged = createAction(
  MODELS_PREFIX + '[table filters changed]',
  props<{ filters: TableFilter[]; projectId: string }>()
);

export const getModelsMetadataValuesForKey = createAction(
  MODELS_PREFIX + '[getModelsMetadataValuesForKey]',
  props<{  col: ISmCol  }>()
);

export const getCustomMetrics = createAction(
  MODELS_PREFIX + '[get custom metrics]',
);

export const setTableFilters = createAction(
  MODELS_PREFIX + 'SET_TABLE_FILTERS',
  props<{ filters: TableFilter[]; projectId: string }>()
);

export const setColumnWidth = createAction(
  MODELS_PREFIX + ' [set column width]',
  props<{ projectId: string; columnId: string; widthPx: number }>()
);



export const updateUrlParams = createAction(MODELS_PREFIX + '[update URL params from state]');

export const modelSelectionChanged = createAction(
  MODELS_PREFIX + '[model selection changed]',
  props<{ model: SelectedModel; project?: string }>()
);

export const showSelectedOnly = createAction(
  MODELS_PREFIX + '[show selected only]',
  props<{ active: boolean; projectId: string }>()
);

export const globalFilterChanged = createAction(
  MODELS_PREFIX + 'GLOBAL_FILTER_CHANGED',
  props<{ query: string; regExp?: boolean }>()
);

export const resetGlobalFilter = createAction(MODELS_PREFIX + 'RESET_GLOBAL_FILTER');
export const resetState = createAction(MODELS_PREFIX + '[reset state]');

export const setCurrentScrollId = createAction(
  MODELS_PREFIX + ' [set current scrollId]',
  props<{ scrollId: string }>()
);

export const afterSetArchive = createAction(MODELS_PREFIX + 'AFTER_SET_ARCHIVE');

export const setSplitSize = createAction(MODELS_PREFIX + 'SET_SPLIT_SIZE', props<{ splitSize: number }>());
export const setSelectedModelsDisableAvailable = createAction(
  MODELS_PREFIX + 'setSelectedModelsDisableAvailable',
  props<{ selectedModelsDisableAvailable: Record<string, CountAvailableAndIsDisableSelectedFiltered> }>()
);
export const setTableMode = createAction(
  MODELS_PREFIX + '[set table view mode]',
  props<{mode: 'info' | 'table'}>()
);

export const setCustomMetrics = createAction(
  MODELS_PREFIX + ' [set custom metrics]',
  props<{ metrics: MetricVariantResult[] }>()
);
export const prepareTableForDownload = createAction(
  MODELS_PREFIX + ' [prepareTableForDownload]',
  props<{ entityType: OrganizationPrepareDownloadForGetAllRequest.EntityTypeEnum }>()
);
export const updateManyModels = createAction(
  MODELS_PREFIX + 'update many models',
  props<{ changeList: Record<string, Partial<TableModel>>}>()
);

