import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {activeLoader, deactivateLoader} from '../core/actions/layout.actions';
import {
  currentPageLoadMoreResults,
  getCurrentPageResults,
  getResultsCount, searchLoadMoreDeactivate,
  loadMoreOpenDatasetsVersions,
  loadMorePipelineRuns,
  searchActivate,
  searchExperiments,
  searchModels,
  searchOpenDatasets,
  searchPipelines,
  searchProjects,
  searchReports,
  searchSetTableFilters,
  searchStart,
  searchTableFilterChanged,
  setExperimentsResults,
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
  selectSearchPages,
  selectSearchScrollIds,
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

export const getEntityStatQuery = (action, searchHidden, filters) => ({

  projects: {
    _any_: {
      ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
      fields: ['basename', 'id']
    },
    search_hidden: searchHidden,
    system_tags: ['-pipeline', '-dataset'],
    // ...(filters.tags && {tags: filters.tags.value}),
  },
  tasks: {
    _any_: {
      ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
      fields: ['name', 'id']
    },
    search_hidden: searchHidden,
    type: [excludedKey, 'annotation_manual', excludedKey, 'annotation', excludedKey, 'dataset_import'],
    system_tags: ['-archived', '-pipeline', '-dataset'],
  },
  models: {
    _any_: {
      ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
      fields: ['name', 'id']
    },
    system_tags: ['-archived']
  },
  datasets: {
    _any_: {
      ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
      fields: ['basename', 'id']
    },
    name:	'/\\.datasets/',
    search_hidden: true,
    shallow_search: false,
    system_tags: ['dataset'],
  },
  pipelines: {
    _any_: {
      ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
      fields: ['basename', 'id']
    },
    search_hidden: true,
    shallow_search: false,
    system_tags: ['pipeline'],
  },
  pipeline_runs:{
    _any_: {
      ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
      fields: ['name', 'id']
    },
    search_hidden: true,
    shallow_search: false,
    system_tags: [-'archived', 'pipeline'],
  },
  dataset_versions:{
    _any_: {
      ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
      fields: ['name', 'id']
    },
    search_hidden: true,
    shallow_search: false,
    system_tags: [-'archived', 'dataset'],
  },
  reports: {
    _any_: {
      ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
      fields: ['id', 'name', 'tags', 'project', 'comment', 'report']
    },
    system_tags: ['-archived'],
    search_hidden: searchHidden,
  },

});

export const orderBy = ['-last_update'];


@Injectable()
export class DashboardSearchEffects {
  constructor(
    private actions: Actions,
    public projectsApi: ApiProjectsService,
    public modelsApi: ApiModelsService,
    public experimentsApi: ApiTasksService,
    public reportsApi: ApiReportsService,
    private store: Store
  ) {
  }

  activeLoader = createEffect(() => this.actions.pipe(
    ofType(searchProjects, searchModels, searchExperiments, searchPipelines),
    map(action => activeLoader(action.type))
  ));

  deactivateLoadMoreLoader = createEffect(() => this.actions.pipe(
    ofType(setExperimentsResults),
    filter((action)=> action.page> 0),
    map(() => searchLoadMoreDeactivate())
  ));

  tableFilterChange = createEffect(() => this.actions.pipe(
    ofType(searchTableFilterChanged),
    concatLatestFrom(() => this.store.select(selectSearchTableFilters)),
    switchMap(([action, oldFilters]) =>{
      return [setURLParams({
        gsFilters: {
          ...oldFilters,
          [action.filter.col]:{value: action.filter.value, matchMode: action.filter.filterMatchMode},
        }, update: true
      })]}
    )
  ));

  startSearch = createEffect(() => this.actions.pipe(
    ofType(searchStart, searchSetTableFilters),
    concatLatestFrom(() => [
      this.store.select(selectActiveSearch),
      this.store.select(selectSearchTerm)
    ]),
    filter(([, , term])=> term?.query && term.query.length > 0 ),
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
    filter(([, term]) => !!term),
    map(([action, term]) => {
        switch (action.activeLink) {
          case activeSearchLink.pipelines:
            return loadMorePipelineRuns(term);
          case activeSearchLink.datasets:
            return loadMoreOpenDatasetsVersions(term);
        }
        return emptyAction();
      }
    )
  ));


  searchProjects = createEffect(() => this.actions.pipe(
    ofType(searchProjects),
    concatLatestFrom(() => [
      this.store.select(selectSearchScrollIds),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
      this.store.select(selectShowHidden),
      this.store.select(selectSearchTableFilters),
    ]),
    switchMap(([action, scrollIds, user, hideExamples, showHidden, filters]) => this.projectsApi.projectsGetAllEx({
      _any_: {
        ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
        fields: ['basename', 'id']
      },

      system_tags: ['-pipeline', '-dataset'],
      stats_for_state: ProjectsGetAllExRequest.StatsForStateEnum.Active,
      ...(!showHidden && {include_stats_filter: {system_tags: ['-pipeline', '-dataset', '-Annotation']}}),
      search_hidden: showHidden,
      scroll_id: scrollIds?.[activeSearchLink.projects] || null,
      size: SEARCH_PAGE_SIZE,
      ...(filters.tags && {tags: filters.tags.value}),
      ...(filters.myWork?.value?.[0]==='true' && {active_users: [user.id]}),
      ...(hideExamples && {allow_public: false}),
      include_stats: true,
      only_fields: ['name', 'company', 'user.name', 'created', 'default_output_destination', 'basename'],
      order_by: orderBy,

    }).pipe(
      switchMap(res => [setProjectsResults({
        projects: res.projects,
      }), deactivateLoader(action.type)]),
      catchError(error => [deactivateLoader(action.type), requestFailed(error)])))
  ));

  searchPipelines = createEffect(() => this.actions.pipe(
    ofType(searchPipelines),
    concatLatestFrom(() => [
      this.store.select(selectSearchScrollIds),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
      this.store.select(selectSearchTableFilters),
    ]),
    switchMap(([action, scrollIds, user, hideExamples, filters]) => this.projectsApi.projectsGetAllEx({
      _any_: {
        ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
        fields: ['basename', 'id']
      },

      search_hidden: true,
      ...(hideExamples && {allow_public: false}),
      shallow_search: false,
      system_tags: ['pipeline'],
      stats_for_state: ProjectsGetAllExRequest.StatsForStateEnum.Active,
      scroll_id: scrollIds?.[activeSearchLink.pipelines] || null,
      ...(filters.tags && {tags: filters.tags.value}),
      size: SEARCH_PAGE_SIZE,
      ...(filters.myWork?.value?.[0]==='true' && {active_users: [user.id]}),
      include_stats: true,
      only_fields: ['name', 'company', 'user.name', 'created','last_update', 'default_output_destination', 'tags', 'system_tags', 'basename'],
      order_by: orderBy,

    }).pipe(
      mergeMap(res => [setPipelinesResults({
        pipelines: res.projects
      }), deactivateLoader(action.type)]),
      catchError(error => [deactivateLoader(action.type), requestFailed(error)])))
  ));

  searchOpenDatasets = createEffect(() => this.actions.pipe(
    ofType(searchOpenDatasets),
    concatLatestFrom(() => [
      this.store.select(selectSearchScrollIds),
      this.store.select(selectSearchTableFilters),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
    ]),
    switchMap(([action, scrollIds, filters, user, hideExamples]) => this.projectsApi.projectsGetAllEx({

      _any_: {
        ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
        fields: ['basename', 'id']
      },
      search_hidden: true,
      shallow_search: false,
      system_tags: ['dataset'],
      name: '/\\.datasets/',
      stats_for_state: ProjectsGetAllExRequest.StatsForStateEnum.Active,
      scroll_id: scrollIds?.[activeSearchLink.datasets] || null,
      size: SEARCH_PAGE_SIZE,
      ...(filters.myWork?.value?.[0]==='true' && {active_users: [user.id]}),
      ...(hideExamples && {allow_public: false}),
      ...(filters.tags && {tags: filters.tags.value}),
      include_dataset_stats: true,
      stats_with_children: false,
      include_stats: true,
      only_fields: ['name', 'company', 'user', 'created', 'default_output_destination', 'tags', 'system_tags', 'basename', 'user.name'],
      order_by: orderBy,

    }).pipe(
      mergeMap(res => [setOpenDatasetsResults({
        datasets: res.projects,
        scrollId: res.scroll_id
      }), deactivateLoader(action.type)]),
      catchError(error => [deactivateLoader(action.type), requestFailed(error)])))
  ));




  searchModels = createEffect(() => this.actions.pipe(
    ofType(searchModels),
    concatLatestFrom(() => [
      this.store.select(selectSearchTableFilters),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
    ]),
    switchMap(([action, filters, user, hideExamples]) => this.modelsApi.modelsGetAllEx({
      _any_: {
        ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
        fields: ['name', 'id']
      },
      page_size: SEARCH_PAGE_SIZE,
      ...(filters.myWork?.value?.[0]==='true' && {user: [user.id]}),
      ...(filters.status && filters.status.value.length === 1 && {ready: (filters.status.value.includes('published')) }),
      ...(filters.tags && {tags: filters.tags.value}),
      ...(hideExamples && {allow_public: false}),
      system_tags: ['-archived'],
      include_stats: true,
      only_fields: ['ready', 'created', 'framework', 'user.name', 'name', 'parent.name', 'task.name', 'id', 'company','tags','project.name'],
      order_by: orderBy,

    }).pipe(
      mergeMap(res => [setModelsResults({models: res.models, scrollId: res.scroll_id}), deactivateLoader(action.type)]),
      catchError(error => [deactivateLoader(action.type), requestFailed(error)])))
  ));

  searchExperiments = createEffect(() => this.actions.pipe(
    ofType(searchExperiments, searchPipelines, searchOpenDatasets, loadMoreOpenDatasetsVersions, loadMorePipelineRuns),
    concatLatestFrom(() => [
      this.store.select(selectSearchPages),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
      this.store.select(selectShowHidden),
      this.store.select(selectSearchTableFilters),
    ]),
    switchMap(([action, pages, user, hideExamples, showHidden, filters]) => this.experimentsApi.tasksGetAllEx({
      _any_: {
        ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
        fields: ['name', 'id']
      },
      page_size: SEARCH_PAGE_SIZE,
      page: [loadMoreOpenDatasetsVersions.type, loadMorePipelineRuns.type].includes(action.type)? (pages[activeSearchLink.experiments] || 0) + 1: 0,
      ...(filters.myWork?.value?.[0]==='true' && {user: [user.id]}),
      ...(hideExamples && {allow_public: false}),
      only_fields: EXPERIMENT_SEARCH_ONLY_FIELDS,
      order_by: orderBy,
      ...(filters.status && {status: filters.status.value}),
      ...(filters.tags && {tags: filters.tags.value}),
      type: [...filters.type?.value?.length > 0 ? filters.type.value : [] ,...action.type=== searchPipelines.type ? ['controller']:action.type=== searchOpenDatasets.type? ['data_processing']: [], excludedKey, 'annotation_manual', excludedKey, 'annotation', excludedKey, 'dataset_import'],
      system_tags: action.type === searchExperiments.type? ['-archived', '-pipeline', '-dataset']:
      action.type === searchPipelines.type? ['-archived', 'pipeline', '-dataset'] : ['-archived', '-pipeline', 'dataset'],
      search_hidden: showHidden,

    })
      .pipe(
      mergeMap(res => [setExperimentsResults({
        tasks: res.tasks,
        page: [loadMoreOpenDatasetsVersions.type, loadMorePipelineRuns.type].includes(action.type) ?  (pages[activeSearchLink.experiments] || 0) + 1 : 0,
      }), deactivateLoader(action.type)]),
      catchError(error => [deactivateLoader(action.type), requestFailed(error)])))
  ));

  searchReports = createEffect(() => this.actions.pipe(
    ofType(searchReports),
    concatLatestFrom(() => [
      this.store.select(selectSearchScrollIds),
      this.store.select(selectSearchTableFilters),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
    ]),
    switchMap(([action, scrollIds, filters, user, hideExamples]) => this.reportsApi.reportsGetAllEx({
      _any_: {
        ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
        fields: ['id', 'name', 'tags', 'project', 'comment', 'report']
      },

      scroll_id: scrollIds?.[activeSearchLink.reports] || null,
      ...(hideExamples && {allow_public: false}),
      size: SEARCH_PAGE_SIZE,
      ...(filters.myWork?.value?.[0]==='true' && {user: [user.id]}),
      ...(filters.status && {status: filters.status.value}),
      ...(filters.tags && {tags: filters.tags.value}),
      system_tags: ['-archived'],
      only_fields: ['name', 'comment', 'company', 'tags', 'report', 'project.name', 'user.name', 'status', 'last_update', 'system_tags'] as (keyof Report)[],
      order_by: orderBy,
    }).pipe(
      mergeMap(res => [setReportsResults({
        reports: res.tasks,
        scrollId: res.scroll_id
      }), deactivateLoader(action.type)]),
      catchError(error => [deactivateLoader(action.type), requestFailed(error)])))
  ));
}
