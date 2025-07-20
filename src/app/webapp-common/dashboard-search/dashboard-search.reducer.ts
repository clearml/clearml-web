import {ActionCreator, createFeatureSelector, createReducer, createSelector, on, ReducerTypes} from '@ngrx/store';
import {Project} from '~/business-logic/model/projects/project';
import {User} from '~/business-logic/model/users/user';
import {Task} from '~/business-logic/model/tasks/task';
import {Model} from '~/business-logic/model/models/model';
import {
  clearSearchFilters,
  clearSearchResults, currentPageLoadMoreResults,
  searchActivate,
  searchClear,
  searchDeactivate, searchLoadMoreDeactivate,
  searchSetTableFilters,
  searchSetTerm,
  setExperimentsResults,
  setModelsResults,
  setOpenDatasetsResults,
  setPipelinesResults,
  setProjectsResults,
  setReportsResults,
  setResultsCount
} from './dashboard-search.actions';
import {SearchState} from '../common-search/common-search.reducer';
import {ActiveSearchLink, activeSearchLink} from '~/features/dashboard-search/dashboard-search.consts';
import {IReport} from '@common/reports/reports.consts';
import {setFilterByUser} from '@common/core/actions/users.actions';
import {FilterMetadata} from 'primeng/api/filtermetadata';
import {TableFilter} from '@common/shared/utils/tableParamEncode';
import {selectRouterQueryParams} from '@common/core/reducers/router-reducer';

export interface DashboardSearchState {
  projects: Project[];
  tasks: Task[];
  models: Model[];
  pipelines: Project[];
  reports: IReport[];
  openDatasets: Project[];
  users: User[];
  term: SearchState['searchQuery'];
  tabsColumnFilters: Record<string, Record<string, FilterMetadata>>;
  forceSearch: boolean;
  active: boolean;
  loadMoreActive: boolean;
  resultsCount: Map<ActiveSearchLink, number>;
  scrollIds: Map<ActiveSearchLink, string>;
  pages: Map<ActiveSearchLink, number>;
}


export const searchInitialState: DashboardSearchState = {
  term: null,
  tabsColumnFilters: {},
  forceSearch: false,
  projects: [],
  pipelines: [],
  openDatasets: [],
  users: [],
  tasks: [],
  models: [],
  reports: [],
  resultsCount: null,
  scrollIds: null,
  active: false,
  loadMoreActive: false,
  pages: null,
};

export const dashboardSearchReducers = [
  on(searchActivate, (state): DashboardSearchState => ({...state, active: true})),
  on(searchLoadMoreDeactivate, (state): DashboardSearchState => ({...state, loadMoreActive: false})),
  on(currentPageLoadMoreResults, (state): DashboardSearchState => ({...state, loadMoreActive: true})),
  on(searchDeactivate, (state): DashboardSearchState => ({
    ...state,
    active: false,
    loadMoreActive: false,
    term: searchInitialState.term,
    forceSearch: false,
    scrollIds: null,
    resultsCount: null
  })),
  on(searchSetTerm, (state, action): DashboardSearchState => ({...state, term: action, forceSearch: action.force, scrollIds: null})),
  on(searchSetTableFilters, (state, action): DashboardSearchState => ({
    ...state,
    tabsColumnFilters: {
      // ...state.tabsColumnFilters,
      [action.activeLink]: {
        ...action.filters.reduce((obj, filter: TableFilter) => {
          obj[filter.col] = {value: filter.value, matchMode: filter.filterMatchMode};
          return obj;
        }, {} as Record<string, { value: string; matchMode: string }>)
      }
    }
  })),
  on(setFilterByUser, (state): DashboardSearchState => ({...state, scrollIds: null})),
  on(setProjectsResults, (state, action): DashboardSearchState => ({
    ...state,
    projects:   action.projects
  })),
  on(setPipelinesResults, (state, action): DashboardSearchState => ({
    ...state,
    pipelines: action.pipelines
  })),
  on(setOpenDatasetsResults, (state, action): DashboardSearchState => ({
    ...state,
    openDatasets:  action.datasets,
  })),
  on(setExperimentsResults, (state, action): DashboardSearchState => ({
    ...state,
    tasks:action.page && action.page !== state.pages?.[activeSearchLink.experiments] ?state.tasks.concat(action.tasks): action.tasks,
    ...(action.page !== undefined && {pages: {...state.pages, [activeSearchLink.experiments]: action.page}})
  })),
  on(setModelsResults, (state, action): DashboardSearchState => ({
    ...state,
    models: action.models,
  })),
  on(setReportsResults, (state, action): DashboardSearchState => ({
    ...state,
    reports: action.reports,
  })),
  on(setResultsCount, (state, action): DashboardSearchState => ({...state, resultsCount: action.counts})),
  on(clearSearchResults, (state, action): DashboardSearchState => ({
    ...state,
    models: [],
    tasks: [],
    pipelines: [],
    projects: [],
    openDatasets: [],
    reports: [],
    ...(!action.dontClearCount && {resultsCount: null})
  })),
  on(searchClear, (state): DashboardSearchState => ({...state, ...searchInitialState})),
  on(clearSearchFilters, (state): DashboardSearchState => ({...state, tabsColumnFilters: searchInitialState.tabsColumnFilters})),
] as ReducerTypes<DashboardSearchState, ActionCreator[]>[];

export const dashboardSearchReducer = createReducer(
  searchInitialState,
  ...dashboardSearchReducers
);

export const selectSearch = createFeatureSelector<DashboardSearchState>('search');
export const selectProjectsResults = createSelector(selectSearch, (state: DashboardSearchState): Project[] => state.projects);
export const selectExperimentsResults = createSelector(selectSearch, (state: DashboardSearchState): Task[] => state.tasks);
export const selectModelsResults = createSelector(selectSearch, (state: DashboardSearchState): Model[] => state.models);
export const selectReportsResults = createSelector(selectSearch, (state: DashboardSearchState): IReport[] => state.reports);
export const selectPipelinesResults = createSelector(selectSearch, (state: DashboardSearchState): Project[] => state.pipelines);
export const selectDatasetsResults = createSelector(selectSearch, (state: DashboardSearchState): Project[] => state.openDatasets);
export const selectActiveSearch = createSelector(selectSearch, (state: DashboardSearchState): boolean => state?.active);
export const selectLoadMoreActive = createSelector(selectSearch, (state: DashboardSearchState): boolean => state?.loadMoreActive);
export const selectSearchTerm = createSelector(selectSearch, (state: DashboardSearchState): SearchState['searchQuery'] => state.term);
export const selectSearchTableFilters = createSelector(selectSearch, selectRouterQueryParams, (state, params) => state.tabsColumnFilters?.[params?.tab || 'projects'] ?? {} as Record<string, FilterMetadata>);

export const selectResultsCount = createSelector(selectSearch, (state: DashboardSearchState): Map<ActiveSearchLink, number> => state.resultsCount);
export const selectSearchScrollIds = createSelector(selectSearch, (state: DashboardSearchState): Map<ActiveSearchLink, string> => state.scrollIds);
export const selectSearchPages = createSelector(selectSearch, (state: DashboardSearchState): Map<ActiveSearchLink, number> => state.pages);
