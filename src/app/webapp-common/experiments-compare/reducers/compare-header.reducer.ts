import {
  compareAddDialogSetTableSort,
  compareAddTableClearAllFilters,
  compareAddTableFilterChanged,
  compareAddTableFilterInit, setAddTableViewArchived,
  resetSelectCompareHeader,
  setExperimentsUpdateTime,
  setHideIdenticalFields,
  setSearchExperimentsForCompareResults,
  setShowSearchExperimentsForCompare,
  setShowRowExtremes, setExportTable, setShowGlobalLegend
} from '../actions/compare-header.actions';
import {createReducer, on} from '@ngrx/store';
import {Params} from '@angular/router';
import {ITableExperiment} from '../../experiments/shared/common-experiment-model.model';
import {SortMeta} from 'primeng/api';
import {FilterMetadata} from 'primeng/api';

export interface CompareHeaderState {
  searchResultsExperiments: ITableExperiment[];
  searchTerm: string;
  showSearch: boolean;
  hideIdenticalRows: boolean;
  showRowExtremes: boolean;
  showGlobalLegend: boolean;
  viewMode: string;
  autoRefresh: boolean;
  navigationPreferences: Params;
  experimentsUpdateTime: Record<string, Date>;
  projectColumnsSortOrder: Record<string, SortMeta[]>;
  projectColumnFilters: Record<string, Record<string, FilterMetadata>>;
  viewArchived: boolean;
  exportTable: boolean;
}


export const initialState: CompareHeaderState = {
  searchResultsExperiments: null,
  searchTerm: null,
  showSearch: false,
  hideIdenticalRows: false,
  showRowExtremes: false,
  showGlobalLegend: false,
  viewMode: 'values',
  autoRefresh: false,
  navigationPreferences: {},
  experimentsUpdateTime: {},
  projectColumnsSortOrder: {},
  projectColumnFilters: {},
  viewArchived: false,
  exportTable: false
};

export const compareHeader = createReducer(
  initialState,
  on(setHideIdenticalFields, (state: CompareHeaderState, {payload}) => ({...state, hideIdenticalRows: payload})),
  on(setShowRowExtremes, (state: CompareHeaderState, {payload}) => ({...state, showRowExtremes: payload})),
  on(setShowGlobalLegend, (state: CompareHeaderState) => ({...state, showGlobalLegend: !state.showGlobalLegend})),
  on(setSearchExperimentsForCompareResults, (state: CompareHeaderState, {payload}) => ({
    ...state,
    searchResultsExperiments: payload
  })),
  on(setExperimentsUpdateTime, (state: CompareHeaderState, {payload}) => ({...state, experimentsUpdateTime: payload})),
  on(setShowSearchExperimentsForCompare, (state: CompareHeaderState, {payload}) => ({...state, showSearch: payload})),
  on(resetSelectCompareHeader, (state, action) => ({
    ...initialState,
    ...(!action.fullReset && {
      projectColumnFilters: state.projectColumnFilters,
      viewArchived: state.viewArchived,
      showGlobalLegend: state.showGlobalLegend,
      showRowExtremes: state.showRowExtremes,
      projectColumnsSortOrder: state.projectColumnsSortOrder
    })
  })),
  on(compareAddDialogSetTableSort, (state, action) => {
    let orders = action.orders.filter(order => action.colIds.includes(order.field));
    orders = orders.length > 0 ? orders : null;
    return {...state, projectColumnsSortOrder: {...state.projectColumnsSortOrder, [action.projectId]: orders}};
  }),
  on(compareAddTableFilterInit, (state, action) => ({
    ...state,
    projectColumnFilters: {
      ...state.projectColumnFilters,
      [action.projectId]: {...state.projectColumnFilters[action.projectId], ['project.name']: {value: [action.projectId], matchMode: undefined}}
    }
  })),
  on(compareAddTableClearAllFilters, (state, action) => ({
    ...state,
    projectColumnFilters: {
      ...state.projectColumnFilters,
      [action.projectId]: {}
    }
  })),
  on(compareAddTableFilterChanged, (state, action) => ({
    ...state,
    // activeParentsFilter: action.filter.col === EXPERIMENTS_TABLE_COL_FIELDS.PARENT ?
    //   action.filter.value.map(parentId => state.parents.find(parent => parent.id === parentId)).filter(p => !!p) : [],
    projectColumnFilters: {
      ...state.projectColumnFilters,
      [action.projectId]: {
        ...state.projectColumnFilters[action.projectId],
        [action.filter.col]: {value: action.filter.value, matchMode: action.filter.filterMatchMode}
      }
    }
  })),
  on(setAddTableViewArchived, (state, action) => ({...state, viewArchived: action.show})),
  on(setExportTable, (state, action) => ({...state, exportTable: action.export})),
);
