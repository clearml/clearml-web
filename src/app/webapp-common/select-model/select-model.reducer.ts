import {createFeatureSelector, createReducer, createSelector, on} from '@ngrx/store';

import {MODELS_VIEW_MODES, ModelsViewModesEnum} from '@common/models/models.consts';
import {TABLE_SORT_ORDER} from '@common/shared/ui-components/data/table/table.consts';
import {SelectedModel} from '@common/models/shared/models.model';
import {MODELS_TABLE_COL_FIELDS} from '@common/models/shared/models.const';
import * as actions from './select-model.actions';
import {FilterMetadata} from 'primeng/api';
import {SortMeta} from 'primeng/api';
import {unionBy} from 'lodash-es';

export interface SelectModelState {
  models: SelectedModel[];
  selectedModelsList: SelectedModel[];
  selectedModels: SelectedModel[];
  noMoreModels: boolean;
  selectedModelSource: string;
  modelToken: string;
  viewMode: ModelsViewModesEnum;
  allProjectsMode: boolean;
  tableFilters: Record<string, FilterMetadata>;
  tableSortFields: SortMeta[];
  scrollId: string;
  globalFilter: string;
  showArchive: boolean;
  frameworks: string[];
  tags: string[];
}

const selectModelInitState: SelectModelState = {
  models: null,
  selectedModelsList: null,
  selectedModels: [],
  noMoreModels: false,
  selectedModelSource: null,
  modelToken: null,
  viewMode: MODELS_VIEW_MODES.TABLE,
  allProjectsMode: true,
  tableFilters: {},
  tableSortFields: [{field: MODELS_TABLE_COL_FIELDS.CREATED, order: TABLE_SORT_ORDER.DESC}],
  scrollId: null,
  globalFilter: null,
  showArchive: null,
  frameworks: [],
  tags: []
};

export const selectModelReducer = createReducer(
  selectModelInitState,
  on(actions.resetSelectModelState, (state, action): SelectModelState => ({
    ...selectModelInitState,
    ...(!action.fullReset && {
      tableFilters: state.tableFilters,
      tableSortFields: state.tableSortFields,
      showArchive: state.showArchive})
  })),
  on(actions.addModels, (state, action): SelectModelState => ({...state, models: state.models.concat(action.models)})),
  on(actions.removeModels, (state, action): SelectModelState => ({...state, models: state.models.filter(exp => !action.models.includes(exp.id))})),
  on(actions.updateModel, (state, action): SelectModelState => ({...state, models:
      state.models.map(ex => ex.id === action.id ? {...ex, ...action.changes} : ex)})),
  on(actions.setModels, (state, action): SelectModelState => ({...state, models: action.models})),
  on(actions.setSelectedModelsList, (state, action): SelectModelState => ({...state, selectedModelsList: action.models})),
  on(actions.setNoMoreModels, (state, action): SelectModelState => ({...state, noMoreModels: action.noMore})),
  on(actions.setCurrentScrollId, (state, action): SelectModelState => ({...state, scrollId: action.scrollId})),
  on(actions.setSelectedModels, (state, action): SelectModelState => ({...state, selectedModels: action.models})),
  on(actions.setViewMode, (state, action): SelectModelState => ({...state, viewMode: action.viewMode})),
  on(actions.globalFilterChanged, (state, action): SelectModelState => ({...state, globalFilter: action.filter})),
  on(actions.setTableSort, (state, action): SelectModelState => ({...state, tableSortFields: action.orders})),
  on(actions.clearTableFilter, (state): SelectModelState => ({...state, tableFilters: {}})),
  on(actions.tableFilterChanged, (state, action): SelectModelState => ({
    ...state,
    models: selectModelInitState.models,
    tableFilters: {
      ...state.tableFilters,
      [action.col.id]: {value: action.value, matchMode: action.col.filterMatchMode || action.andFilter ? 'AND' : undefined}
    }
  })),
  on(actions.showArchive, (state, action): SelectModelState => ({...state, showArchive: action.showArchive})),
  on(actions.setFrameworks, (state, action): SelectModelState => ({...state, frameworks: action.frameworks})),
  on(actions.setTags, (state, action): SelectModelState => ({...state, tags: action.tags})),
);

export const models = createFeatureSelector<SelectModelState>('selectModel');
export const selectModels = createSelector(models, state => state?.models);
export const selectSelectedModelsList = createSelector(models, state => state?.selectedModelsList);
export const selectAllModels = createSelector(selectModels, selectSelectedModelsList, (models, addedModels) => Array.isArray(models) ?
  unionBy(addedModels, models, 'id').map(model => ({
    ...model,
    system_tags: model.system_tags?.map((t => t.replace('archive', ' archive')))
  }))
  : null
);
export const selectCurrentScrollId = createSelector(models, state => state.scrollId);
export const selectGlobalFilter = createSelector(models, state => state.globalFilter);
export const selectTableSortFields = createSelector(models, state => state.tableSortFields);
export const selectSelectModelTableFilters = createSelector(models, state => state.tableFilters);
export const selectViewMode = createSelector(models, state => state.viewMode);
export const selectSelectedModels = createSelector(models, state => state.selectedModels);
export const selectNoMoreModels = createSelector(models, state => state.noMoreModels);
export const selectShowArchive = createSelector(models, state => state.showArchive);
export const selectFrameworks = createSelector(models, state => state.frameworks);
export const selectTags = createSelector(models, state => state.tags);
