import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {activeLoader, addMessage, deactivateLoader} from '../core/actions/layout.actions';
import {
  currentPageLoadMoreResults,
  getCurrentPageResults,
  getEndpoints,
  getResultsCount,
  loadMoreExperiments,
  loadMoreModels,
  loadMoreOpenDatasets,
  loadMoreOpenDatasetsVersions,
  loadMorePipelineRuns,
  loadMorePipelines,
  loadMoreProjects,
  loadMoreReports,
  searchActivate,
  searchExperiments,
  searchLoadMoreDeactivate,
  searchModels,
  searchOpenDatasets,
  searchPipelines,
  searchProjects,
  searchReports,
  searchSetTableFilters,
  searchStart,
  searchTableFilterChanged,
  setEndpointsResults,
  setExperimentsResults, setLoadingEndpointsResults,
  setModelsResults,
  setOpenDatasetsResults,
  setPipelinesResults,
  setProjectsResults,
  setReportsResults
} from './dashboard-search.actions';
import {EXPERIMENT_SEARCH_ONLY_FIELDS, SEARCH_PAGE_SIZE} from './dashboard-search.consts';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {requestFailed} from '../core/actions/http.actions';
import {Store} from '@ngrx/store';
import {
  selectActiveSearch,
  selectSearchIsAdvance,
  selectSearchPages,
  selectSearchTableFilters,
  selectSearchTerm
} from './dashboard-search.reducer';
import {ProjectsGetAllExRequest} from '~/business-logic/model/projects/projectsGetAllExRequest';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {ApiModelsService} from '~/business-logic/api-services/models.service';
import {catchError, filter, map, mergeMap, switchMap} from 'rxjs/operators';
import {activeSearchLink} from '~/features/dashboard-search/dashboard-search.consts';
import {emptyAction} from '~/app.constants';
import {escapeRegex} from '@common/shared/utils/escape-regex';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {selectHideExamples, selectShowHidden} from '@common/core/reducers/projects.reducer';
import {ApiReportsService} from '~/business-logic/api-services/reports.service';
import {Report} from '~/business-logic/model/reports/report';
import {excludedKey} from '@common/shared/utils/tableParamEncode';
import {setURLParams} from '@common/core/actions/router.actions';
import {safeJsonParse} from '@common/shared/utils/validation-utils';
import {ServingGetEndpointsResponse} from '~/business-logic/model/serving/servingGetEndpointsResponse';
import {v5 as uuidv5} from 'uuid';
import {ApiServingService} from '~/business-logic/api-services/serving.service';
import {MESSAGES_SEVERITY} from '@common/constants';
import {ErrorService} from '@common/shared/services/error.service';
import {ServingGetLoadingInstancesResponse} from '~/business-logic/model/serving/servingGetLoadingInstancesResponse';


export const getEntityStatQuery = (action, searchHidden, filters, advanced) => ({

  projects: {
    ...(advanced ?
        safeJsonParse(action.query) :
        action.query && {
          _any_: {
            pattern: action.regExp ? action.query : escapeRegex(action.query),
            fields: ['basename', 'id']
          }
        }
    ),
    search_hidden: searchHidden,
    system_tags: ['-pipeline', '-dataset']
    // ...(filters.tags && {tags: filters.tags.value}),
  },
  tasks: {
    ...(advanced ?
        safeJsonParse(action.query) :
        action.query && {
          _any_: {
            pattern: action.regExp ? action.query : escapeRegex(action.query),
            fields: ['name', 'id']
          }
        }
    ),
    search_hidden: searchHidden,
    type: [excludedKey, 'annotation_manual', excludedKey, 'annotation', excludedKey, 'dataset_import'],
    system_tags: ['-archived', '-pipeline', '-dataset']
  },
  models: {
    ...(advanced ?
        safeJsonParse(action.query) :
        action.query && {
          _any_: {
            pattern: action.regExp ? action.query : escapeRegex(action.query),
            fields: ['name', 'id']
          }
        }
    ),
    system_tags: ['-archived']
  },
  datasets: {
    ...(advanced ?
        safeJsonParse(action.query) :
        action.query && {
          _any_: {
            pattern: action.regExp ? action.query : escapeRegex(action.query),
            fields: ['basename', 'id']
          }
        }
    ),
    name: '/\\.datasets/',
    search_hidden: true,
    shallow_search: false,
    system_tags: ['dataset']
  },
  pipelines: {
    ...(advanced ?
        safeJsonParse(action.query) :
        action.query && {
          _any_: {
            pattern: action.regExp ? action.query : escapeRegex(action.query),
            fields: ['basename', 'id']
          }
        }
    ),
    search_hidden: true,
    shallow_search: false,
    system_tags: ['pipeline']
  },
  pipeline_runs: {
    ...(advanced ?
        safeJsonParse(action.query) :
        action.query && {
          _any_: {
            pattern: action.regExp ? action.query : escapeRegex(action.query),
            fields: ['name', 'id']
          }
        }
    ),
    search_hidden: true,
    shallow_search: false,
    system_tags: [-'archived', 'pipeline']
  },
  dataset_versions: {
    ...(advanced ?
        safeJsonParse(action.query) :
        action.query && {
          _any_: {
            pattern: action.regExp ? action.query : escapeRegex(action.query),
            fields: ['name', 'id']
          }
        }
    ),
    search_hidden: true,
    shallow_search: false,
    system_tags: [-'archived', 'dataset']
  },
  reports: {
    ...(advanced ?
        safeJsonParse(action.query) :
        action.query && {
          _any_: {
            pattern: action.regExp ? action.query : escapeRegex(action.query),
            fields: ['id', 'name', 'tags', 'project', 'comment', 'report']
          }
        }
    ),
    system_tags: ['-archived'],
    search_hidden: searchHidden
  }

});

export const orderBy = ['-last_update'];


@Injectable()
export class DashboardSearchEffects {
  private readonly actions = inject(Actions);
  private readonly projectsApi = inject(ApiProjectsService);
  private readonly modelsApi = inject(ApiModelsService);
  private readonly experimentsApi = inject(ApiTasksService);
  private readonly reportsApi = inject(ApiReportsService);
  private readonly servingApi = inject(ApiServingService);
  private readonly store = inject(Store);
  private errorService = inject(ErrorService);


  activeLoader = createEffect(() => this.actions.pipe(
    ofType(searchProjects, searchModels, searchExperiments, searchPipelines),
    map(action => activeLoader(action.type))
  ));

  deactivateLoadMoreLoader = createEffect(() => this.actions.pipe(
    ofType(setExperimentsResults, setProjectsResults, setModelsResults, setOpenDatasetsResults, setPipelinesResults, setReportsResults),
    filter((action) => action.page > 0),
    map(() => searchLoadMoreDeactivate())
  ));

  tableFilterChange = createEffect(() => this.actions.pipe(
    ofType(searchTableFilterChanged),
    concatLatestFrom(() => this.store.select(selectSearchTableFilters)),
    switchMap(([action, oldFilters]) => {
        return [setURLParams({
          gsFilters: {
            ...oldFilters,
            ...(action.filter.col === 'myWork' ? {['users']: {value: []}} : {}),
            [action.filter.col]: {value: action.filter.value, matchMode: action.filter.filterMatchMode}
          }, update: true
        })];
      }
    )
  ));

  startSearch = createEffect(() => this.actions.pipe(
    ofType(searchStart, searchSetTableFilters),
    concatLatestFrom(() => [
      this.store.select(selectActiveSearch),
      this.store.select(selectSearchTerm)
    ]),
    // filter(([, , term]) => term?.query && term.query.length > 0),
    switchMap(([, active, term]) => {
      const actionsToFire = [];
      if (!active) {
        // actionsToFire.push(searchClear());
        actionsToFire.push(searchActivate());
      }
      actionsToFire.push(getResultsCount(term));
      return actionsToFire;
    })
  ));

  getCurrentPageResults = createEffect(() => this.actions.pipe(
    ofType(getCurrentPageResults),
    concatLatestFrom(() => [
      this.store.select(selectSearchTerm)
    ]),
    filter(([, term]) => !!term),
    map(([action, term]) => {
        switch (action.activeLink) {
          case activeSearchLink.experiments:
            return searchExperiments(term);
          case activeSearchLink.models:
            return searchModels(term);
          case activeSearchLink.projects:
            return searchProjects(term);
          case activeSearchLink.pipelines:
            return searchPipelines(term);
          case activeSearchLink.datasets:
            return searchOpenDatasets(term);
          case activeSearchLink.reports:
            return searchReports(term);
        }
        return emptyAction();
      }
    )
  ));

  loadMore = createEffect(() => this.actions.pipe(
    ofType(currentPageLoadMoreResults),
    concatLatestFrom(() => [
      this.store.select(selectSearchTerm)
    ]),
    map(([action, term]) => {
        switch (action.activeLink) {
          case activeSearchLink.pipelineRuns:
            return loadMorePipelineRuns(term);
          case activeSearchLink.pipelines:
            return loadMorePipelines(term);
          case activeSearchLink.datasets:
            return loadMoreOpenDatasets(term);
          case activeSearchLink.openDatasetVersions:
            return loadMoreOpenDatasetsVersions(term);
          case activeSearchLink.experiments:
            return loadMoreExperiments(term);
          case activeSearchLink.projects:
            return loadMoreProjects(term);
          case activeSearchLink.models:
            return loadMoreModels(term);
          case activeSearchLink.reports:
            return loadMoreReports(term);
        }
        return emptyAction();
      }
    )
  ));


  searchProjects = createEffect(() => this.actions.pipe(
    ofType(searchProjects, loadMoreProjects),
    concatLatestFrom(() => [
      this.store.select(selectSearchPages),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
      this.store.select(selectShowHidden),
      this.store.select(selectSearchTableFilters),
      this.store.select(selectSearchIsAdvance)
    ]),
    switchMap(([action, pages, user, hideExamples, showHidden, filters, advanced]) =>
      this.projectsApi.projectsGetAllEx({
        system_tags: ['-pipeline', '-dataset'],
        stats_for_state: ProjectsGetAllExRequest.StatsForStateEnum.Active,
        ...(!showHidden && {include_stats_filter: {system_tags: ['-pipeline', '-dataset', '-Annotation']}}),
        search_hidden: showHidden,
        page: [loadMoreProjects.type].includes(action.type) ? (pages[activeSearchLink?.projects] || 0) + 1 : 0,
        page_size: SEARCH_PAGE_SIZE,
        only_fields: ['name', 'company', 'user.name', 'created', 'default_output_destination', 'basename'],
        include_stats: true,
        order_by: orderBy,
        ...(advanced ?
            safeJsonParse(action.query) :
            {
              ...(action.query && {
                _any_: {
                  pattern: action.regExp ? action.query : escapeRegex(action.query),
                  fields: ['basename', 'id']
                }
              }),
              ...(filters.tags && {tags: filters.tags.value}),
              ...(filters.myWork?.value?.[0] === 'true' && {active_users: [user.id]}),
              ...(hideExamples && {allow_public: false}),
              ...(filters.users?.value?.length && {active_users: filters.users.value})
            }
        ),
      }).pipe(
        switchMap(res => [setProjectsResults({
          projects: res.projects,
          page: [loadMoreProjects.type].includes(action.type) ? (pages[activeSearchLink.projects] || 0) + 1 : 0
        }), deactivateLoader(action.type)]),
        catchError(error => [deactivateLoader(action.type), requestFailed(error), addMessage(MESSAGES_SEVERITY.ERROR, `Server error: ${this.errorService.getErrorMsg(error?.error)}`)])))
  ));

  searchPipelines = createEffect(() => this.actions.pipe(
    ofType(searchPipelines, loadMorePipelines),
    concatLatestFrom(() => [
      this.store.select(selectSearchPages),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
      this.store.select(selectSearchTableFilters),
      this.store.select(selectSearchIsAdvance)
    ]),
    switchMap(([action, pages, user, hideExamples, filters, advanced]) => this.projectsApi.projectsGetAllEx({
      search_hidden: true,
      ...(hideExamples && {allow_public: false}),
      shallow_search: false,
      system_tags: ['pipeline'],
      stats_for_state: ProjectsGetAllExRequest.StatsForStateEnum.Active,
      page_size: SEARCH_PAGE_SIZE,
      page: [loadMorePipelines.type].includes(action.type) ? (pages[activeSearchLink.pipelines] || 0) + 1 : 0,
      include_stats: true,
      only_fields: ['name', 'company', 'user.name', 'created', 'last_update', 'default_output_destination', 'tags', 'system_tags', 'basename'],
      order_by: orderBy,
      ...(advanced ?
          safeJsonParse(action.query) :
          {
            ...(action.query && {
              _any_: {
                pattern: action.regExp ? action.query : escapeRegex(action.query),
                fields: ['basename', 'id']
              }
            }),
            ...(filters.tags && {tags: filters.tags.value}),
            ...(filters.myWork?.value?.[0] === 'true' && {active_users: [user.id]}),
            ...(filters.users?.value?.length && {active_users: filters.users.value})
          }
      ),
    }).pipe(
      mergeMap(res => [setPipelinesResults({
        pipelines: res.projects,
        page: [loadMorePipelines.type].includes(action.type) ? (pages[activeSearchLink.pipelines] || 0) + 1 : 0
      }), deactivateLoader(action.type)]),
      catchError(error => [deactivateLoader(action.type), requestFailed(error), addMessage(MESSAGES_SEVERITY.ERROR, `Server error: ${this.errorService.getErrorMsg(error?.error)}`)])))
  ));

  searchOpenDatasets = createEffect(() => this.actions.pipe(
    ofType(searchOpenDatasets, loadMoreOpenDatasets),
    concatLatestFrom(() => [
      this.store.select(selectSearchPages),
      this.store.select(selectSearchTableFilters),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
      this.store.select(selectSearchIsAdvance)
    ]),
    switchMap(([action, pages, filters, user, hideExamples, advanced]) => this.projectsApi.projectsGetAllEx({
      search_hidden: true,
      shallow_search: false,
      system_tags: ['dataset'],
      name: '/\\.datasets/',
      stats_for_state: ProjectsGetAllExRequest.StatsForStateEnum.Active,
      page_size: SEARCH_PAGE_SIZE,
      page: [loadMoreOpenDatasets.type].includes(action.type) ? (pages[activeSearchLink.datasets] || 0) + 1 : 0,
      include_dataset_stats: true,
      stats_with_children: false,
      include_stats: true,
      only_fields: ['name', 'company', 'user', 'created', 'default_output_destination', 'tags', 'system_tags', 'basename', 'user.name'],
      order_by: orderBy,
      ...(advanced ?
          safeJsonParse(action.query) :
          {
            ...(action.query && {
              _any_: {
                pattern: action.regExp ? action.query : escapeRegex(action.query),
                fields: ['basename', 'id']
              }
            }),
            ...(filters.myWork?.value?.[0] === 'true' && {active_users: [user.id]}),
            ...(hideExamples && {allow_public: false}),
            ...(filters.tags && {tags: filters.tags.value}),
            ...(filters.users?.value?.length && {active_users: filters.users.value})
          }
      ),
    }).pipe(
      mergeMap(res => [setOpenDatasetsResults({
        datasets: res.projects,
        page: [loadMoreOpenDatasets.type].includes(action.type) ? (pages[activeSearchLink.datasets] || 0) + 1 : 0
      }), deactivateLoader(action.type)]),
      catchError(error => [deactivateLoader(action.type), requestFailed(error), addMessage(MESSAGES_SEVERITY.ERROR, `Server error: ${this.errorService.getErrorMsg(error?.error)}`)])))
  ));


  searchModels = createEffect(() => this.actions.pipe(
    ofType(searchModels, loadMoreModels),
    concatLatestFrom(() => [
      this.store.select(selectSearchPages),
      this.store.select(selectSearchTableFilters),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
      this.store.select(selectSearchIsAdvance)
    ]),
    switchMap(([action, pages, filters, user, hideExamples, advanced]) => this.modelsApi.modelsGetAllEx({
      system_tags: ['-archived'],
      include_stats: true,
      only_fields: ['ready', 'created', 'last_change', 'framework', 'user.name', 'name', 'parent.name', 'task.name', 'id', 'company', 'tags', 'project.name'],
      order_by: orderBy,
      page_size: SEARCH_PAGE_SIZE,
      page: [loadMoreModels.type].includes(action.type) ? (pages[activeSearchLink.models] || 0) + 1 : 0,
      ...(advanced ?
          safeJsonParse(action.query) :
          {
            ...(action.query && {
              _any_: {
                pattern: action.regExp ? action.query : escapeRegex(action.query),
                fields: ['name', 'id']
              }
            }),
            ...(filters.myWork?.value?.[0] === 'true' && {user: [user.id]}),
            ...(filters.users?.value?.length && {user: filters.users.value}),
            ...(filters.status && filters.status.value.length === 1 && {ready: (filters.status.value.includes('published'))}),
            ...(filters.tags && {tags: filters.tags.value}),
            ...(hideExamples && {allow_public: false})
          }
      ),
    }).pipe(
      mergeMap(res => [setModelsResults({
        models: res.models,
        page: [loadMoreModels.type].includes(action.type) ? (pages[activeSearchLink.models] || 0) + 1 : 0
      }), deactivateLoader(action.type)]),
      catchError(error => [deactivateLoader(action.type), requestFailed(error), addMessage(MESSAGES_SEVERITY.ERROR, `Server error: ${this.errorService.getErrorMsg(error?.error)}`)])))
  ));

  searchExperiments = createEffect(() => this.actions.pipe(
    ofType(searchExperiments, searchPipelines, searchOpenDatasets, loadMoreOpenDatasetsVersions, loadMorePipelineRuns, loadMoreExperiments),
    concatLatestFrom(() => [
      this.store.select(selectSearchPages),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
      this.store.select(selectShowHidden),
      this.store.select(selectSearchTableFilters),
      this.store.select(selectSearchIsAdvance)
    ]),
    switchMap(([action, pages, user, hideExamples, showHidden, filters, advanced]) => this.experimentsApi.tasksGetAllEx({
      page_size: SEARCH_PAGE_SIZE,
      type: [...filters.type?.value?.length > 0 ? filters.type.value : [], ...action.type === searchPipelines.type ? ['controller'] : action.type === searchOpenDatasets.type ? ['data_processing'] : [], excludedKey, 'annotation_manual', excludedKey, 'annotation', excludedKey, 'dataset_import'],
      page: [loadMoreOpenDatasetsVersions.type, loadMorePipelineRuns.type, loadMoreExperiments.type].includes(action.type) ? (pages[activeSearchLink.experiments] || 0) + 1 : 0,
      only_fields: EXPERIMENT_SEARCH_ONLY_FIELDS,
      order_by: orderBy,
      system_tags: ([searchExperiments.type, loadMoreExperiments.type].includes(action.type)) ? ['-archived', '-pipeline', '-dataset'] :
        [searchPipelines.type, loadMorePipelineRuns.type].includes(action.type) ? ['-archived', 'pipeline', '-dataset'] : ['-archived', '-pipeline', 'dataset'],
      search_hidden: showHidden,
      ...(advanced ?
          safeJsonParse(action.query) :
          {
            ...(action.query && {
              _any_: {
                pattern: action.regExp ? action.query : escapeRegex(action.query),
                fields: ['name', 'id']
              }
            }),
            ...(filters.myWork?.value?.[0] === 'true' && {user: [user.id]}),
            ...(filters.users?.value?.length && {user: filters.users.value}),
            ...(hideExamples && {allow_public: false}),
            ...(filters.status && {status: filters.status.value}),
            ...(filters.tags && {tags: filters.tags.value})
          }
      ),
    })
      .pipe(
        mergeMap(res => [setExperimentsResults({
          tasks: res.tasks,
          page: [loadMoreOpenDatasetsVersions.type, loadMorePipelineRuns.type, loadMoreExperiments.type].includes(action.type) ? (pages[activeSearchLink.experiments] || 0) + 1 : 0
        }), deactivateLoader(action.type)]),
        catchError(error => [
          deactivateLoader(action.type),
          requestFailed(error),
          addMessage(MESSAGES_SEVERITY.ERROR, `Server error: ${this.errorService.getErrorMsg(error?.error)}`)])))
  ));

  searchReports = createEffect(() => this.actions.pipe(
    ofType(searchReports, loadMoreReports),
    concatLatestFrom(() => [
      this.store.select(selectSearchPages),
      this.store.select(selectSearchTableFilters),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
      this.store.select(selectSearchIsAdvance)
    ]),
    switchMap(([action, pages, filters, user, hideExamples, advanced]) => this.reportsApi.reportsGetAllEx({
      page_size: SEARCH_PAGE_SIZE,
      page: [loadMoreReports.type].includes(action.type) ? (pages[activeSearchLink.reports] || 0) + 1 : 0,
      system_tags: ['-archived'],
      only_fields: ['name', 'comment', 'company', 'tags', 'report', 'project.name', 'user.name', 'status', 'last_update', 'system_tags'] as (keyof Report)[],
      order_by: orderBy,
      ...(advanced ?
          safeJsonParse(action.query) :
          {
            ...(action.query && {
              _any_: {
                pattern: action.regExp ? action.query : escapeRegex(action.query),
                fields: ['id', 'name', 'tags', 'project', 'comment', 'report']
              }
            }),
            ...(hideExamples && {allow_public: false}),
            ...(filters.myWork?.value?.[0] === 'true' && {user: [user.id]}),
            ...(filters.users?.value?.length && {user: filters.users.value}),
            ...(filters.status && {status: filters.status.value}),
            ...(filters.tags && {tags: filters.tags.value})
          }
      ),
    }).pipe(
      mergeMap(res => [setReportsResults({
        reports: res.tasks,
        page: [loadMoreReports.type].includes(action.type) ? (pages[activeSearchLink.reports] || 0) + 1 : 0

      }), deactivateLoader(action.type)]),
      catchError(error => [deactivateLoader(action.type), requestFailed(error), addMessage(MESSAGES_SEVERITY.ERROR, `Server error: ${this.errorService.getErrorMsg(error?.error)}`)])))
  ));

  getEndpoints = createEffect(() => this.actions.pipe(
    ofType(getEndpoints),
    concatLatestFrom(() => [
      this.store.select(selectSearchTableFilters),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
      this.store.select(selectSearchIsAdvance)
    ]),
    switchMap(([action]) => this.servingApi.servingGetEndpoints({})
      .pipe(
        mergeMap((res: ServingGetEndpointsResponse) => [setEndpointsResults({
          endpoints: res.endpoints.map(endpoint => ({
            ...endpoint,
            id: uuidv5(endpoint.url, uuidv5.URL)
          })).sort((a, b)=> (new Date(b.last_update).getTime() - new Date(a.last_update).getTime()))
        }), deactivateLoader(action.type)]),
        catchError(error => [deactivateLoader(action.type), requestFailed(error)])))
  ));

  getLoadingEndpoints = createEffect(() => this.actions.pipe(
    ofType(getEndpoints),
    concatLatestFrom(() => [
      this.store.select(selectSearchTableFilters),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
      this.store.select(selectSearchIsAdvance)
    ]),
    switchMap(([action]) => this.servingApi.servingGetLoadingInstances({})
      .pipe(
        mergeMap((res: ServingGetLoadingInstancesResponse) => [setLoadingEndpointsResults({
          instances: res.instances.sort((a, b)=> (new Date(b.last_update).getTime() - new Date(a.last_update).getTime()))
        }), deactivateLoader(action.type)]),
        catchError(error => [deactivateLoader(action.type), requestFailed(error)])))
  ));

}


