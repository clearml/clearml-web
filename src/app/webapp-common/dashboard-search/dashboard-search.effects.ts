import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {activeLoader, deactivateLoader} from '../core/actions/layout.actions';
import {
  getCurrentPageResults,
  getResultsCount,
  searchActivate,
  searchExperiments,
  searchModels,
  searchOpenDatasets,
  searchPipelines,
  searchProjects, searchReports,
  searchStart,
  setExperimentsResults,
  setModelsResults, setOpenDatasetsResults,
  setPipelinesResults,
  setProjectsResults, setReportsResults
} from './dashboard-search.actions';
import {EXPERIMENT_SEARCH_ONLY_FIELDS, SEARCH_PAGE_SIZE} from './dashboard-search.consts';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {requestFailed} from '../core/actions/http.actions';
import {Store} from '@ngrx/store';
import {selectActiveSearch, selectSearchScrollIds, selectSearchTerm} from './dashboard-search.reducer';
import {ProjectsGetAllExRequest} from '~/business-logic/model/projects/projectsGetAllExRequest';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {ApiModelsService} from '~/business-logic/api-services/models.service';
import {catchError, mergeMap, map, switchMap} from 'rxjs/operators';
import {activeSearchLink} from '~/features/dashboard-search/dashboard-search.consts';
import {emptyAction} from '~/app.constants';
import {escapeRegex} from '@common/shared/utils/escape-regex';
import {selectCurrentUser, selectShowOnlyUserWork} from '@common/core/reducers/users-reducer';
import {selectHideExamples, selectShowHidden} from '@common/core/reducers/projects.reducer';
import {ApiReportsService} from '~/business-logic/api-services/reports.service';
import {Report} from '~/business-logic/model/reports/report';
import {excludedKey} from '@common/shared/utils/tableParamEncode';

export const getEntityStatQuery = (action, searchHidden) => ({
  /* eslint-disable @typescript-eslint/naming-convention */
  projects: {
    _any_: {
      ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
      fields: ['basename', 'id']
    },
    search_hidden: searchHidden,
    system_tags: ['-pipeline', '-dataset'],
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
  reports: {
    _any_: {
      ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
      fields: ['id', 'name', 'tags', 'project', 'comment', 'report']
    },
    system_tags: ['-archived'],
    search_hidden: searchHidden,
  },
  /* eslint-enable @typescript-eslint/naming-convention */
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

  startSearch = createEffect(() => this.actions.pipe(
    ofType(searchStart),
    concatLatestFrom(() => [
      this.store.select(selectActiveSearch),
      this.store.select(selectSearchTerm)
    ]),
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
          case activeSearchLink.openDatasets:
            return searchOpenDatasets(term);
          case activeSearchLink.reports:
            return searchReports(term);
        }
        return emptyAction();
      }
    )
  ));

  searchProjects = createEffect(() => this.actions.pipe(
    ofType(searchProjects),
    concatLatestFrom(() => [
      this.store.select(selectSearchScrollIds),
      this.store.select(selectShowOnlyUserWork),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
      this.store.select(selectShowHidden),
    ]),
    switchMap(([action, scrollIds, userFocus, user, hideExamples, showHidden]) => this.projectsApi.projectsGetAllEx({
      _any_: {
        ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
        fields: ['basename', 'id']
      },
      /* eslint-disable @typescript-eslint/naming-convention */
      system_tags: ['-pipeline', '-dataset'],
      stats_for_state: ProjectsGetAllExRequest.StatsForStateEnum.Active,
      ...(!showHidden && {include_stats_filter: {system_tags: ['-pipeline', '-dataset', '-Annotation']}}),
      search_hidden: showHidden,
      scroll_id: scrollIds?.[activeSearchLink.projects] || null,
      size: SEARCH_PAGE_SIZE,
      ...(userFocus && {active_users: [user.id]}),
      ...(hideExamples && {allow_public: false}),
      include_stats: true,
      only_fields: ['name', 'company', 'user', 'created', 'default_output_destination', 'basename'],
      order_by: orderBy,
      /* eslint-enable @typescript-eslint/naming-convention */
    }).pipe(
      switchMap(res => [setProjectsResults({
        projects: res.projects,
        scrollId: res.scroll_id
      }), deactivateLoader(action.type)]),
      catchError(error => [deactivateLoader(action.type), requestFailed(error)])))
  ));

  searchPipelines = createEffect(() => this.actions.pipe(
    ofType(searchPipelines),
    concatLatestFrom(() => [
      this.store.select(selectSearchScrollIds),
      this.store.select(selectShowOnlyUserWork),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
    ]),
    switchMap(([action, scrollIds, userFocus, user, hideExamples]) => this.projectsApi.projectsGetAllEx({
      _any_: {
        ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
        fields: ['basename', 'id']
      },
      /* eslint-disable @typescript-eslint/naming-convention */
      search_hidden: true,
      ...(hideExamples && {allow_public: false}),
      shallow_search: false,
      system_tags: ['pipeline'],
      stats_for_state: ProjectsGetAllExRequest.StatsForStateEnum.Active,
      scroll_id: scrollIds?.[activeSearchLink.pipelines] || null,
      size: SEARCH_PAGE_SIZE,
      ...(userFocus && {active_users: [user.id]}),
      include_stats: true,
      only_fields: ['name', 'company', 'user', 'created', 'default_output_destination', 'tags', 'system_tags', 'basename'],
      order_by: orderBy,
      /* eslint-enable @typescript-eslint/naming-convention */
    }).pipe(
      mergeMap(res => [setPipelinesResults({
        pipelines: res.projects,
        scrollId: res.scroll_id
      }), deactivateLoader(action.type)]),
      catchError(error => [deactivateLoader(action.type), requestFailed(error)])))
  ));

  searchOpenDatasets = createEffect(() => this.actions.pipe(
    ofType(searchOpenDatasets),
    concatLatestFrom(() => [
      this.store.select(selectSearchScrollIds),
      this.store.select(selectShowOnlyUserWork),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
    ]),
    switchMap(([action, scrollIds, userFocus, user, hideExamples]) => this.projectsApi.projectsGetAllEx({
      /* eslint-disable @typescript-eslint/naming-convention */
      _any_: {
        ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
        fields: ['basename', 'id']
      },
      search_hidden: true,
      shallow_search: false,
      system_tags: ['dataset'],
      name: '/\\.datasets/',
      stats_for_state: ProjectsGetAllExRequest.StatsForStateEnum.Active,
      scroll_id: scrollIds?.[activeSearchLink.openDatasets] || null,
      size: SEARCH_PAGE_SIZE,
      ...(userFocus && {active_users: [user.id]}),
      ...(hideExamples && {allow_public: false}),
      include_dataset_stats: true,
      stats_with_children: false,
      include_stats: true,
      only_fields: ['name', 'company', 'user', 'created', 'default_output_destination', 'tags', 'system_tags', 'basename'],
      order_by: orderBy,
      /* eslint-enable @typescript-eslint/naming-convention */
    }).pipe(
      mergeMap(res => [setOpenDatasetsResults({
        openDatasets: res.projects,
        scrollId: res.scroll_id
      }), deactivateLoader(action.type)]),
      catchError(error => [deactivateLoader(action.type), requestFailed(error)])))
  ));


  searchModels = createEffect(() => this.actions.pipe(
    ofType(searchModels),
    concatLatestFrom(() => [
      this.store.select(selectSearchScrollIds),
      this.store.select(selectShowOnlyUserWork),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
    ]),
    switchMap(([action, scrollIds, userFocus, user, hideExamples]) => this.modelsApi.modelsGetAllEx({
      /* eslint-disable @typescript-eslint/naming-convention */
      _any_: {
        ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
        fields: ['name', 'id']
      },
      scroll_id: scrollIds?.[activeSearchLink.models] || null,
      size: SEARCH_PAGE_SIZE,
      ...(userFocus && {user: [user.id]}),
      ...(hideExamples && {allow_public: false}),
      system_tags: ['-archived'],
      include_stats: true,
      only_fields: ['ready', 'created', 'framework', 'user.name', 'name', 'parent.name', 'task.name', 'id', 'company'],
      order_by: orderBy,
      /* eslint-enable @typescript-eslint/naming-convention */
    }).pipe(
      mergeMap(res => [setModelsResults({models: res.models, scrollId: res.scroll_id}), deactivateLoader(action.type)]),
      catchError(error => [deactivateLoader(action.type), requestFailed(error)])))
  ));

  searchExperiments = createEffect(() => this.actions.pipe(
    ofType(searchExperiments),
    concatLatestFrom(() => [
      this.store.select(selectSearchScrollIds),
      this.store.select(selectShowOnlyUserWork),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
      this.store.select(selectShowHidden),
    ]),
    switchMap(([action, scrollIds, userFocus, user, hideExamples, showHidden]) => this.experimentsApi.tasksGetAllEx({
      /* eslint-disable @typescript-eslint/naming-convention */
      _any_: {
        ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
        fields: ['name', 'id']
      },
      scroll_id: scrollIds?.[activeSearchLink.experiments] || null,
      size: SEARCH_PAGE_SIZE,
      ...(userFocus && {user: [user.id]}),
      ...(hideExamples && {allow_public: false}),
      only_fields: EXPERIMENT_SEARCH_ONLY_FIELDS,
      order_by: orderBy,
      type: [excludedKey, 'annotation_manual', excludedKey, 'annotation', excludedKey, 'dataset_import'],
      system_tags: ['-archived', '-pipeline', '-dataset'],
      search_hidden: showHidden,
      /* eslint-enable @typescript-eslint/naming-convention */
    }).pipe(
      mergeMap(res => [setExperimentsResults({
        tasks: res.tasks,
        scrollId: res.scroll_id
      }), deactivateLoader(action.type)]),
      catchError(error => [deactivateLoader(action.type), requestFailed(error)])))
  ));

  searchReports = createEffect(() => this.actions.pipe(
    ofType(searchReports),
    concatLatestFrom(() => [
      this.store.select(selectSearchScrollIds),
      this.store.select(selectShowOnlyUserWork),
      this.store.select(selectCurrentUser),
      this.store.select(selectHideExamples),
    ]),
    switchMap(([action, scrollIds, userFocus, user, hideExamples]) => this.reportsApi.reportsGetAllEx({
      _any_: {
        ...(action.query && {pattern: action.regExp ? action.query : escapeRegex(action.query)}),
        fields: ['id', 'name', 'tags', 'project', 'comment', 'report']
      },
      /* eslint-disable @typescript-eslint/naming-convention */
      scroll_id: scrollIds?.[activeSearchLink.reports] || null,
      ...(hideExamples && {allow_public: false}),
      size: SEARCH_PAGE_SIZE,
      ...(userFocus && {user: [user.id]}),
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
