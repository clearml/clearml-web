import {createReducer, createSelector, on} from '@ngrx/store';
import {
  addReports, addReportsTags,
  removeReport,
  resetReports,
  setArchive, setDirty, setEditMode,
  setReport,
  setReportChanges,
  setReports,
  setReportsOrderBy,
  setReportsSearchQuery,
  setReportsTags
} from './reports.actions';
import {IReport} from './reports.consts';
import {TABLE_SORT_ORDER, TableSortOrderEnum} from '../shared/ui-components/data/table/table.consts';
import {selectRouterConfig, selectRouterParams} from '@common/core/reducers/router-reducer';

const getCorrectSortingOrder = (currentSortOrder: TableSortOrderEnum, currentOrderField: string, nextOrderField: string) => {
  if (currentOrderField === nextOrderField) {
    return currentSortOrder === TABLE_SORT_ORDER.DESC ? TABLE_SORT_ORDER.ASC : TABLE_SORT_ORDER.DESC;
  } else {
    return nextOrderField === 'last_update' ? TABLE_SORT_ORDER.DESC : TABLE_SORT_ORDER.ASC;
  }
};

export const REPORTS_KEY = 'reports';

export interface ReportsState {
  reports: IReport[];
  reportsTags: string[];
  scroll: string;
  report: IReport;
  orderBy: string;
  sortOrder: TableSortOrderEnum;
  archive: boolean;
  noMoreReports: boolean;
  queryString: { query: string; regExp?: boolean };
  editing: boolean;
  dirty: boolean;
}

export const reportsInitState: ReportsState = {
  reportsTags: [],
  orderBy: 'last_update',
  sortOrder: TABLE_SORT_ORDER.DESC,
  reports: null,
  scroll: null,
  report: null,
  archive: false,
  noMoreReports: null,
  queryString: null,
  editing: false,
  dirty: false
};

export const reportsReducer = createReducer(
  reportsInitState,
  on(setReports, (state, action): ReportsState => ({
      ...state,
      reports: action.reports,
      scroll: action.scroll,
      noMoreReports: action.noMoreReports
    })
  ),
  on(addReports, (state, action): ReportsState  => ({
      ...state,
      reports: [...(action.scroll && state.reports || []), ...action.reports],
      scroll: action.scroll,
      noMoreReports: action.noMoreReports
    })
  ),
  on(setReportsTags, (state, action): ReportsState  => ({
      ...state,
      reportsTags: action.tags
    })
  ),
  on(addReportsTags, (state, action): ReportsState  => ({
    ...state,
    reportsTags: Array.from(new Set(state.reportsTags.concat(action.tags))).sort()
  })),
  on(setReport, (state, action): ReportsState  => ({...state, report: action.report})),
  on(setReportChanges, (state, action): ReportsState  => ({
    ...state,
    report: {...state.report, ...action.changes},
    reports: (action.filterOut ?
        state.reports?.filter(report => report.id != action.id) :
        state.reports
    )?.map(report => report.id !== action.id ? report : {...report, ...action.changes})
  })),
  on(setArchive, (state, action): ReportsState  => ({...state, archive: action.archive, scroll: null, reports: null})),
  on(resetReports, (state): ReportsState  => ({
    ...state,
    reports: reportsInitState.reports,
    scroll: reportsInitState.scroll,
    noMoreReports: reportsInitState.noMoreReports
  })),
  on(setReportsOrderBy, (state, action): ReportsState  => ({
    ...state,
    orderBy: action.orderBy,
    sortOrder: getCorrectSortingOrder(state.sortOrder, state.orderBy, action.orderBy),
  })),
  on(removeReport, (state, action): ReportsState  => ({...state, reports: state.reports?.filter(report => report.id !== action.id)})),
  on(setReportsSearchQuery, (state, action): ReportsState  => ({
    ...state,
    queryString: (action as ReturnType<typeof setReportsSearchQuery>),
  })),
  on(setEditMode, (state, action): ReportsState => ({...state, editing: action.editing})),
  on(setDirty, (state, action): ReportsState => ({...state, dirty: action.dirty})),
);

export const selectReportsState = state => state[REPORTS_KEY] as ReportsState;
export const selectReportsTags = createSelector(selectReportsState, state => state.reportsTags);
export const selectReportsScrollId = createSelector(selectReportsState, state => state.scroll);
export const selectReport = createSelector(selectReportsState, state => state?.report ?? null);
export const selectArchiveView = createSelector(selectReportsState, state => state.archive);
export const selectReports = createSelector(selectReportsState, selectArchiveView, (state, isArchiveView) => state.reports ?
  state.reports.filter(report => isArchiveView ? report.system_tags.includes('archived') : !report.system_tags.includes('archived')) : null);
export const selectNoMoreReports = createSelector(selectReportsState, state => state.noMoreReports);
export const selectReportsOrderBy = createSelector(selectReportsState, state => state ? state.orderBy : reportsInitState.orderBy);
export const selectReportsSortOrder = createSelector(selectReportsState, state => state ? state.sortOrder : reportsInitState.sortOrder);
export const selectReportsQueryString = createSelector(selectReportsState, state => state ? state.queryString : reportsInitState.queryString);
export const selectEditingReport = createSelector(selectReportsState, state => state.editing);
export const selectDirtyReport = createSelector(selectReportsState, state => state.dirty);
export const selectNestedReports = createSelector(selectRouterConfig, config => config?.length === 3 && config.at(-1) === 'reports');
export const selectReportId = createSelector(selectRouterParams, params => params?.reportId);
