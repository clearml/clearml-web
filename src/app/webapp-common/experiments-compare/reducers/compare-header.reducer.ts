import {resetSelectCompareHeader, setExperimentsUpdateTime, setExportTable, setHideIdenticalFields, setShowGlobalLegend, setShowRowExtremes} from '../actions/compare-header.actions';
import {createReducer, on} from '@ngrx/store';
import {Params} from '@angular/router';
import {FilterMetadata} from 'primeng/api';

export interface CompareHeaderState {
  hideIdenticalRows: boolean;
  showRowExtremes: boolean;
  showGlobalLegend: boolean;
  viewMode: string;
  autoRefresh: boolean;
  navigationPreferences: Params;
  experimentsUpdateTime: Record<string, Date>;
  viewArchived: boolean;
  exportTable: boolean;
}


export const initialState: CompareHeaderState = {
  hideIdenticalRows: false,
  showRowExtremes: false,
  showGlobalLegend: false,
  viewMode: 'values',
  autoRefresh: false,
  navigationPreferences: {},
  experimentsUpdateTime: {},
  viewArchived: false,
  exportTable: false
};

export const compareHeader = createReducer(
  initialState,
  on(setHideIdenticalFields, (state: CompareHeaderState, {payload}) => ({...state, hideIdenticalRows: payload})),
  on(setShowRowExtremes, (state: CompareHeaderState, {payload}) => ({...state, showRowExtremes: payload})),
  on(setShowGlobalLegend, (state: CompareHeaderState) => ({...state, showGlobalLegend: !state.showGlobalLegend})),
  on(setExperimentsUpdateTime, (state: CompareHeaderState, {payload}) => ({...state, experimentsUpdateTime: payload})),
  on(resetSelectCompareHeader, (state, action) => ({
    ...initialState,
    ...(!action.fullReset && {
      viewArchived: state.viewArchived,
      showGlobalLegend: state.showGlobalLegend,
      showRowExtremes: state.showRowExtremes,
    })
  })),
  on(setExportTable, (state, action) => ({...state, exportTable: action.export})),
);
