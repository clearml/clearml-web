import {createAction, props} from '@ngrx/store';
import {TableModel} from '../models/shared/models.model';
import {ISmCol} from '../shared/ui-components/data/table/table.consts';
import {ModelsViewModesEnum} from '../models/models.consts';
import {SortMeta} from 'primeng/api';

const SELECT_MODEL_PREFIX = '[select model]';

export const getNextModels = createAction(`${SELECT_MODEL_PREFIX} get next models`);
export const getSelectedModels = createAction(`${SELECT_MODEL_PREFIX} get selected models`, props<{selectedIds: string[]}>());

export const setModels = createAction(`${SELECT_MODEL_PREFIX} set models`, props<{ models: TableModel[] }>());
export const setSelectedModelsList = createAction(`${SELECT_MODEL_PREFIX} set selected models list`, props<{ models: TableModel[] }>());

export const setNoMoreModels = createAction(`${SELECT_MODEL_PREFIX} set no more models`, props<{ noMore: boolean }>());

export const addModels = createAction(`${SELECT_MODEL_PREFIX} add many models`, props<{ models: TableModel[] }>());

export const removeModels = createAction(`${SELECT_MODEL_PREFIX} remove many models`, props<{ models: string[] }>());

export const updateModel = createAction(`${SELECT_MODEL_PREFIX} update one models`, props<{ id: string; changes: Partial<TableModel> }>());

export const setSelectedModels = createAction(`${SELECT_MODEL_PREFIX} set selected models`, props<{ models: any}>());

export const tableSortChanged = createAction(`${SELECT_MODEL_PREFIX} table sort changed`, props<{ isShift: boolean; colId: ISmCol['id'] }>());

export const setTableSort = createAction(`${SELECT_MODEL_PREFIX} 'set table sort`,  props<{ orders: SortMeta[] }>());

export const showArchive = createAction(`${SELECT_MODEL_PREFIX} show archive`, props<{showArchive: boolean}>());
export const clearTableFilter = createAction(`${SELECT_MODEL_PREFIX} table filter clear`);
export const tableFilterChanged = createAction(`${SELECT_MODEL_PREFIX} table filter changed`, props<{ col: ISmCol; value: any; andFilter?: boolean}>());
export const globalFilterChanged = createAction(`${SELECT_MODEL_PREFIX} global filter changed`, props<{ filter: string }>());

export const setCurrentScrollId = createAction(SELECT_MODEL_PREFIX + 'set current scrollId', props<{ scrollId: string }>());

export const setViewMode = createAction(`${SELECT_MODEL_PREFIX} set view mode`, props<{ viewMode: ModelsViewModesEnum }>());

export const resetSelectModelState = createAction(`${SELECT_MODEL_PREFIX} reset state`, props<{fullReset: boolean}>());

export const getFrameworks = createAction(`${SELECT_MODEL_PREFIX} get frameworks`);
export const setFrameworks = createAction(`${SELECT_MODEL_PREFIX} set frameworks`, props<{ frameworks: string[] }>());
export const getTags = createAction(`${SELECT_MODEL_PREFIX} get tags`);
export const setTags = createAction(`${SELECT_MODEL_PREFIX} set tags`, props<{ tags: string[] }>());
