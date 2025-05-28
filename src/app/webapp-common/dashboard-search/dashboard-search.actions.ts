import {createAction, props} from '@ngrx/store';
import {SEARCH_PREFIX} from './dashboard-search.consts';
import {Project} from '~/business-logic/model/projects/project';
import {Task} from '~/business-logic/model/tasks/task';
import {Model} from '~/business-logic/model/models/model';
import {ActiveSearchLink} from '~/features/dashboard-search/dashboard-search.consts';
import {DASHBOARD_PREFIX} from '@common/dashboard/common-dashboard.const';
import {IReport} from '@common/reports/reports.consts';


export const searchSetTerm = createAction(
  SEARCH_PREFIX + 'SET_TERM',
  props<{ query: string; regExp?: boolean; force?: boolean }>()
);

export const searchStart = createAction(
  SEARCH_PREFIX + 'SEARCH_START',
  props<{ query: string; regExp?: boolean }>()
);

export const searchClear = createAction(SEARCH_PREFIX + 'SEARCH_CLEAR');
export const searchActivate = createAction(SEARCH_PREFIX + 'ACTIVATE');
export const searchDeactivate = createAction(SEARCH_PREFIX + 'DEACTIVATE');

export const searchProjects = createAction(
  SEARCH_PREFIX + 'SEARCH_PROJECTS',
  props<{ query: string; regExp?: boolean }>()
);

export const searchPipelines = createAction(
  SEARCH_PREFIX + 'SEARCH_PIPELINES',
  props<{ query: string; regExp?: boolean }>()
);

export const searchReports = createAction(
  SEARCH_PREFIX + 'SEARCH_REPORTS',
  props<{ query: string; regExp?: boolean }>()
);

export const setReportsResults = createAction(
  'Set Reports Results',
  props<{ reports: IReport[]; scrollId: string }>()
);

export const searchOpenDatasets = createAction(
  SEARCH_PREFIX + 'SEARCH_OPEN_"DATASETS',
  props<{ query: string; regExp?: boolean }>()
);

export const setPipelinesResults = createAction(
  'Set Pipelines Results',
  props<{ pipelines: Project[]; scrollId: string }>()
);

export const setOpenDatasetsResults = createAction(
  'Set open datasets Results',
  props<{ openDatasets: Project[]; scrollId: string }>()
);

export const setProjectsResults = createAction(SEARCH_PREFIX + 'SET_PROJECTS',
  props<{ projects: Project[]; scrollId: string }>()
);

export const searchExperiments = createAction(
  SEARCH_PREFIX + 'SEARCH_EXPERIMENTS',
  props<{ query: string; regExp?: boolean }>()
);

export const setExperimentsResults = createAction(
  SEARCH_PREFIX + 'SET_EXPERIMENTS',
  props<{ tasks: Task[]; scrollId: string }>()
);

export const searchModels = createAction(
  SEARCH_PREFIX + 'SEARCH_MODELS',
  props<{ query: string; regExp?: boolean }>()
);

export const setModelsResults = createAction(
  SEARCH_PREFIX + 'SET_MODELS',
  props<{ models: Model[]; scrollId: string }>()
);

export const setResultsCount = createAction(
  SEARCH_PREFIX + 'SET_COUNTS',
  props<{ counts: Map<ActiveSearchLink, number> }>()
);
export const getCurrentPageResults = createAction(
  DASHBOARD_PREFIX + '[get current page results]',
  props<{ activeLink: ActiveSearchLink }>()
);
export const getResultsCount = createAction(
  DASHBOARD_PREFIX + '[get results count]',
  props<{ query: string; regExp?: boolean; force?: boolean }>());

export const clearSearchResults = createAction(DASHBOARD_PREFIX + '[clear search results]');
