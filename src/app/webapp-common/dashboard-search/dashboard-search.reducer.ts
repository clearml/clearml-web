import {ActionCreator, createFeatureSelector, createReducer, createSelector, on, ReducerTypes} from '@ngrx/store';
import {Project} from '~/business-logic/model/projects/project';
import {User} from '~/business-logic/model/users/user';
import {Task} from '~/business-logic/model/tasks/task';
import {Model} from '~/business-logic/model/models/model';
import {
  clearSearchFilters,
  clearSearchResults,
  currentPageLoadMoreResults,
  getResultsCount,
  searchActivated,
  searchClear,
  searchDeactivate,
  searchLoadMoreDeactivate,
  searchSetTableFilters,
  searchSetTerm,
  searchStart,
  setEndpointsResults,
  setExperimentsResults,
  setLoadingEndpointsResults,
  setModelsResults,
  setOpenDatasetsResults,
  setPipelinesResults,
  setProjectsResults,
  setReportsResults,
  setResultsCount,
  setSearchProjectsTags
} from './dashboard-search.actions';
import {SearchState} from '../common-search/common-search.reducer';
import {ActiveSearchLink, activeSearchLink} from '~/features/dashboard-search/dashboard-search.consts';
import {IReport} from '@common/reports/reports.consts';
import {setFilterByUser} from '@common/core/actions/users.actions';
import {FilterMetadata} from 'primeng/api';
import {TableFilter} from '@common/shared/utils/tableParamEncode';
import {selectRouterQueryParams} from '@common/core/reducers/router-reducer';
import {EndpointStats} from '~/business-logic/model/serving/endpointStats';
import {filterEndpoints} from '@common/serving/serving.consts';
import {ContainerInfo} from '~/business-logic/model/serving/containerInfo';
import {SEARCH_PAGE_SIZE} from '@common/dashboard-search/dashboard-search.consts';
import {selectCompanyTags} from '@common/core/reducers/projects.reducer';

export interface DashboardSearchState {
  projects: Project[];
  projectsTags: string[];
  tasks: Task[];
  models: Model[];
  pipelines: Project[];
  reports: IReport[];
  endpoints: EndpointStats[];
  loadingInstances: ContainerInfo[];
  openDatasets: Project[];
  users: User[];
  term: SearchState['searchQuery'];
  tabsColumnFilters: Record<string, Record<string, FilterMetadata>>;
  forceSearch: boolean;
  active: boolean;
  isAdvanced: boolean;
  loadMoreActive: boolean;
  resultsCount: Record<ActiveSearchLink, number>;
  scrollIds: Record<ActiveSearchLink, string>;
  pages: Record<ActiveSearchLink, number>;
  errors: Record<ActiveSearchLink, string>;
}


export const searchInitialState: DashboardSearchState = {
  term: null,
  tabsColumnFilters: {},
  forceSearch: false,
  projects: null,
  projectsTags: [],
  pipelines: null,
  openDatasets: null,
  users: [],
  tasks: null,
  models: null,
  reports: null,
  endpoints: null,
  loadingInstances: null,
  resultsCount: null,
  scrollIds: null,
  active: false,
  isAdvanced: false,
  loadMoreActive: false,
  pages: null,
  errors: null
};

export const dashboardSearchReducers = [
  on(searchActivated, (state): DashboardSearchState => ({...state, active: true})),
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
  on(searchSetTerm, (state, action): DashboardSearchState => ({
    ...state,
    term: action,
    forceSearch: action.force,
    scrollIds: null
  })),
  on(searchSetTableFilters, (state, action): DashboardSearchState => ({
    ...state,
    tabsColumnFilters: {
      ...state.tabsColumnFilters,
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
    projects: action.page && action.page !== state.pages?.[activeSearchLink.projects] ? state.projects.concat(action.projects) : action.projects,
    ...(action.page !== undefined && {pages: {...state.pages, [activeSearchLink.projects]: action.page}})
  })),
  on(setPipelinesResults, (state, action): DashboardSearchState => ({
    ...state,
    pipelines: action.page && action.page !== state.pages?.[activeSearchLink.pipelines] ? state.pipelines.concat(action.pipelines) : action.pipelines,
    ...(action.page !== undefined && {pages: {...state.pages, [activeSearchLink.pipelines]: action.page}})
  })),
  on(setOpenDatasetsResults, (state, action): DashboardSearchState => ({
    ...state,
    openDatasets: action.page && action.page !== state.pages?.[activeSearchLink.datasets] ? state.openDatasets.concat(action.datasets) : action.datasets,
    ...(action.page !== undefined && {pages: {...state.pages, [activeSearchLink.datasets]: action.page}})
  })),
  on(setExperimentsResults, (state, action): DashboardSearchState => ({
    ...state,
    tasks: action.page && action.page !== state.pages?.[activeSearchLink.experiments] ? state.tasks.concat(action.tasks) : action.tasks,
    ...(action.page !== undefined && {pages: {...state.pages, [activeSearchLink.experiments]: action.page}})
  })),
  on(setModelsResults, (state, action): DashboardSearchState => ({
    ...state,
    models: action.page && action.page !== state.pages?.[activeSearchLink.models] ? state.models.concat(action.models) : action.models,
    ...(action.page !== undefined && {pages: {...state.pages, [activeSearchLink.models]: action.page}})
  })),
  on(setReportsResults, (state, action): DashboardSearchState => ({
    ...state,
    reports: action.page && action.page !== state.pages?.[activeSearchLink.reports] ? state.reports.concat(action.reports) : action.reports,
    ...(action.page !== undefined && {pages: {...state.pages, [activeSearchLink.reports]: action.page}})
  })),
  on(setEndpointsResults, (state, action): DashboardSearchState => ({
    ...state,
    endpoints: action.endpoints,
  })),
  on(setLoadingEndpointsResults, (state, action): DashboardSearchState => ({
    ...state,
    loadingInstances: action.instances,
  })),
  on(setSearchProjectsTags, (state, action): DashboardSearchState => ({
    ...state,
    projectsTags: action.tags,
  })),
  on(getResultsCount, (state): DashboardSearchState => ({...state, errors: searchInitialState.errors, active: true})),
  on(setResultsCount, (state, action): DashboardSearchState => ({
    ...state,
    resultsCount: action.counts,
    errors: action.errors
  })),
  on(clearSearchResults, searchStart, (state): DashboardSearchState => ({
    ...state,
    models: searchInitialState.models,
    tasks: searchInitialState.tasks,
    pipelines: searchInitialState.pipelines,
    projects: searchInitialState.projects,
    openDatasets: searchInitialState.openDatasets,
    reports: searchInitialState.reports,
  })),
  on(searchClear, (state): DashboardSearchState => ({...state, ...searchInitialState})),
  on(clearSearchFilters, (state): DashboardSearchState => ({
    ...state,
    tabsColumnFilters: searchInitialState.tabsColumnFilters
  })),
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
export const selectEndpointsResults = createSelector(selectSearch, (state: DashboardSearchState): EndpointStats[] => state.endpoints);
export const selectLoadingEndpointsResults = createSelector(selectSearch, (state: DashboardSearchState): ContainerInfo[] => state.loadingInstances);
export const selectPipelinesResults = createSelector(selectSearch, (state: DashboardSearchState): Project[] => state.pipelines);
export const selectDatasetsResults = createSelector(selectSearch, (state: DashboardSearchState): Project[] => state.openDatasets);
export const selectActiveSearch = createSelector(selectSearch, (state: DashboardSearchState): boolean => state?.active);
export const selectLoadMoreActive = createSelector(selectSearch, (state: DashboardSearchState): boolean => state?.loadMoreActive);
export const selectSearchTerm = createSelector(selectSearch, (state: DashboardSearchState): SearchState['searchQuery'] => state.term);
export const selectAdvancedSearch = createSelector(selectSearchTerm, (term: SearchState['searchQuery']) => term?.advanced);
export const selectFilters = createSelector(selectSearch, state => state.tabsColumnFilters);
export const selectTabFilters = createSelector(selectFilters, selectAdvancedSearch, selectRouterQueryParams,
  (filters, advanced, params) => (!advanced && filters?.[params?.tab || 'projects']) ?? {} as Record<string, FilterMetadata>);
export const selectFilteredEndpointsResults =
  createSelector(selectEndpointsResults, selectSearchTerm, (endpoints, searchTerm): EndpointStats[] =>
    filterEndpoints(endpoints, searchTerm)?.slice(0, SEARCH_PAGE_SIZE) ?? null);
export const selectFilteredLoadingEndpointsResults =
  createSelector(selectLoadingEndpointsResults, selectSearchTerm, (loadingEndpoints, searchTerm): EndpointStats[] =>
    filterEndpoints(loadingEndpoints, searchTerm)?.slice(0, SEARCH_PAGE_SIZE) ?? null);
export const selectResultsCount = createSelector(selectSearch, (state: DashboardSearchState) => state.resultsCount);
export const selectSearchScrollIds = createSelector(selectSearch, (state: DashboardSearchState) => state.scrollIds);
export const selectSearchPages = createSelector(selectSearch, (state: DashboardSearchState) => state.pages);
export const selectSearchProjectsTags = createSelector(selectSearch, (state: DashboardSearchState) => state.projectsTags);
export const selectSearchTags = createSelector(selectCompanyTags, selectSearchProjectsTags, selectRouterQueryParams, (companyTags, projectsTags, params) => params?.tab === 'projects' ? projectsTags : companyTags);
export const selectResultErrors = createSelector(selectSearch, (state: DashboardSearchState) => state.errors ?
  Object.entries(Object.groupBy(Object.keys(state.errors), entity => {
    const error = state.errors[entity];
    const matches = Array.from(error.matchAll(/field=(.*),|field=(.*)$/gm));
    if (matches?.length > 0) {
      const fields = Array.from(new Set(matches.map(match => match[1] || match[2])));
      return `Invalid Fields ${fields.join(', ')}`;
    } else {
      return error;
    }
  })).reduce((acc, [error, entities]) => {
    return `Entities ${acc}\n${entities.join(', ')} had an issue: ${error}`;
  }, '') :
  null
);
