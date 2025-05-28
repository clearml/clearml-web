import {createFeatureSelector, createSelector, ReducerTypes, on, createReducer, ActionCreator} from '@ngrx/store';
import {Project} from '~/business-logic/model/projects/project';
import {User} from '~/business-logic/model/users/user';
import {Task} from '~/business-logic/model/tasks/task';
import {Model} from '~/business-logic/model/models/model';
import {
  clearSearchResults,
  searchActivate,
  searchClear,
  searchDeactivate,
  searchSetTerm, setExperimentsResults, setModelsResults, setOpenDatasetsResults,
  setPipelinesResults,
  setProjectsResults, setReportsResults, setResultsCount
} from './dashboard-search.actions';
import {SearchState} from '../common-search/common-search.reducer';
import {ActiveSearchLink, activeSearchLink} from '~/features/dashboard-search/dashboard-search.consts';
import {IReport} from '@common/reports/reports.consts';
import {setFilterByUser} from '@common/core/actions/users.actions';

export interface DashboardSearchState {
  projects: Project[];
  tasks: Task[];
  models: Model[];
  pipelines: Project[];
  reports: IReport[];
  openDatasets: Project[];
  users: User[];
  term: SearchState['searchQuery'];
  forceSearch: boolean;
  active: boolean;
  resultsCount: Map<ActiveSearchLink, number>;
  scrollIds: Map<ActiveSearchLink, string>;
}


export const searchInitialState: DashboardSearchState = {
  term: null,
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
  active: false
};

export const dashboardSearchReducers = [
  on(searchActivate, (state): DashboardSearchState => ({...state, active: true})),
  on(searchDeactivate, (state): DashboardSearchState => ({
    ...state,
    active: false,
    term: searchInitialState.term,
    forceSearch: false,
    scrollIds: null,
    resultsCount: null
  })),
  on(searchSetTerm, (state, action): DashboardSearchState => ({...state, term: action, forceSearch: action.force, scrollIds: null})),
  on(setFilterByUser, (state): DashboardSearchState => ({...state, scrollIds: null})),

  on(setProjectsResults, (state, action): DashboardSearchState => ({
    ...state,
    projects: action.scrollId === state.scrollIds?.[activeSearchLink.projects] ? state.projects.concat(action.projects) : action.projects,
    scrollIds: {...state.scrollIds, [activeSearchLink.projects]: action.scrollId}
  })),
  on(setPipelinesResults, (state, action): DashboardSearchState => ({
    ...state,
    pipelines: action.scrollId === state.scrollIds?.[activeSearchLink.pipelines] ? state.pipelines.concat(action.pipelines) : action.pipelines,
    scrollIds: {...state.scrollIds, [activeSearchLink.pipelines]: action.scrollId}
  })),
  on(setOpenDatasetsResults, (state, action): DashboardSearchState => ({
    ...state,
    openDatasets: action.scrollId === state.scrollIds?.[activeSearchLink.openDatasets] ? state.openDatasets.concat(action.openDatasets) : action.openDatasets,
    scrollIds: {...state.scrollIds, [activeSearchLink.openDatasets]: action.scrollId}
  })),
  on(setExperimentsResults, (state, action): DashboardSearchState => ({
    ...state,
    tasks: action.scrollId === state.scrollIds?.[activeSearchLink.experiments] ? state.tasks.concat(action.tasks) : action.tasks,
    scrollIds: {...state.scrollIds, [activeSearchLink.experiments]: action.scrollId}
  })),
  on(setModelsResults, (state, action): DashboardSearchState => ({
    ...state,
    models: action.scrollId === state.scrollIds?.[activeSearchLink.models] ? state.models.concat(action.models) : action.models,
    scrollIds: {...state.scrollIds, [activeSearchLink.models]: action.scrollId}
  })),
  on(setReportsResults, (state, action): DashboardSearchState => ({
    ...state,
    reports: action.scrollId === state.scrollIds?.[activeSearchLink.reports] ? state.reports.concat(action.reports) : action.reports,
    scrollIds: {...state.scrollIds, [activeSearchLink.reports]: action.scrollId}
  })),
  on(setResultsCount, (state, action): DashboardSearchState => ({...state, resultsCount: action.counts})),
  on(clearSearchResults, (state): DashboardSearchState => ({
    ...state,
    [activeSearchLink.models]: [],
    [activeSearchLink.experiments]: [],
    [activeSearchLink.pipelines]: [],
    [activeSearchLink.projects]: [],
    [activeSearchLink.openDatasets]: [],
    [activeSearchLink.reports]: [],
  })),
  on(searchClear, (state): DashboardSearchState => ({...state, ...searchInitialState})),
] as ReducerTypes<DashboardSearchState, ActionCreator[]>[];

export const dashboardSearchReducer = createReducer(
  searchInitialState,
  ...dashboardSearchReducers
);

export const selectSearch = createFeatureSelector<DashboardSearchState>('search');
export const selectProjectsResults = createSelector(selectSearch, (state: DashboardSearchState): Array<Project> => state.projects);
export const selectExperimentsResults = createSelector(selectSearch, (state: DashboardSearchState): Array<Task> => state.tasks);
export const selectModelsResults = createSelector(selectSearch, (state: DashboardSearchState): Array<Model> => state.models);
export const selectReportsResults = createSelector(selectSearch, (state: DashboardSearchState): Array<IReport> => state.reports);
export const selectPipelinesResults = createSelector(selectSearch, (state: DashboardSearchState): Array<Project> => state.pipelines);
export const selectDatasetsResults = createSelector(selectSearch, (state: DashboardSearchState): Array<Project> => state.openDatasets);
export const selectActiveSearch = createSelector(selectSearch, (state: DashboardSearchState): boolean => state.term?.query?.length >= 3 || state.forceSearch);
export const selectSearchTerm = createSelector(selectSearch, (state: DashboardSearchState): SearchState['searchQuery'] => state.term);
export const selectResultsCount = createSelector(selectSearch, (state: DashboardSearchState): Map<ActiveSearchLink, number> => state.resultsCount);
export const selectSearchScrollIds = createSelector(selectSearch, (state: DashboardSearchState): Map<ActiveSearchLink, string> => state.scrollIds);
