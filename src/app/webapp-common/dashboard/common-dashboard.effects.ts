import {Injectable} from '@angular/core';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {requestFailed} from '../core/actions/http.actions';
import {activeLoader, deactivateLoader} from '../core/actions/layout.actions';
import {
  getRecentExperiments,
  getRecentProjects, getRecentReports,
  setRecentExperiments,
  setRecentProjects, setRecentReports,
} from './common-dashboard.actions';
import {CARDS_IN_ROW} from './common-dashboard.const';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {ProjectsGetAllExRequest} from '~/business-logic/model/projects/projectsGetAllExRequest';
import {catchError, mergeMap, map, switchMap} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {selectCurrentUser, selectShowOnlyUserWork} from '../core/reducers/users-reducer';
import {selectHideExamples, selectShowHidden} from '@common/core/reducers/projects.reducer';
import {excludedKey} from '@common/shared/utils/tableParamEncode';
import {Report} from '~/business-logic/model/reports/report';
import {ApiReportsService} from '~/business-logic/api-services/reports.service';

@Injectable()
export class CommonDashboardEffects {
  constructor(
    private actions: Actions, private projectsApi: ApiProjectsService,
    private tasksApi: ApiTasksService, private store: Store,
    private reportsApiService: ApiReportsService,
  ) {}

  activeLoader = createEffect(() => this.actions.pipe(
    ofType(getRecentExperiments),
    map(action => activeLoader(action.type))
  ));

  getRecentProjects = createEffect(() => this.actions.pipe(
    ofType(getRecentProjects),
    concatLatestFrom(() => [
      this.store.select(selectCurrentUser),
      this.store.select(selectShowOnlyUserWork),
      this.store.select(selectShowHidden),
      this.store.select(selectHideExamples),
    ]),
    mergeMap(([action, user, showOnlyUserWork, showHidden, hideExamples]) =>
      this.projectsApi.projectsGetAllEx({
        stats_for_state: ProjectsGetAllExRequest.StatsForStateEnum.Active,
        include_stats: true,
        check_own_contents: true,
        order_by: ['featured', '-last_update'],
        page: 0,
        page_size: CARDS_IN_ROW,
        ...(showOnlyUserWork && {active_users: [user.id]}),
        ...(showHidden && {search_hidden: true}),
        ...(!showHidden && {include_stats_filter: {system_tags: ['-pipeline']}}),
        ...(hideExamples && {allow_public: false}),
        only_fields: ['name', 'basename', 'company', 'user', 'created', 'default_output_destination']
      }).pipe(
          mergeMap(({projects}) => [
            setRecentProjects({projects}),
            deactivateLoader(action.type)
          ]),
          catchError(error => [deactivateLoader(action.type), requestFailed(error)])
        )
    )
  ));

  getRecentTasks = createEffect(() => this.actions.pipe(
    ofType(getRecentExperiments),
    concatLatestFrom(() => [
      this.store.select(selectCurrentUser),
      this.store.select(selectShowOnlyUserWork),
      this.store.select(selectHideExamples),
    ]),
    switchMap(([action, user, showOnlyUserWork, hideExamples]) => this.tasksApi.tasksGetAllEx({
        page: 0,
        page_size: 5,
        order_by: ['-last_update'],
        status: ['published', 'closed', 'failed', 'stopped', 'in_progress', 'completed'],
        type: [excludedKey, 'annotation_manual', excludedKey, 'annotation', excludedKey, 'dataset_import'],
        only_fields: ['type', 'status', 'created', 'name', 'id', 'last_update', 'started', 'project.name'],
        system_tags: ['-archived', '-pipeline'],
        user: showOnlyUserWork ? [user.id] : null,
        ...(hideExamples && {allow_public: false}),
      })
        .pipe(
          mergeMap(({tasks: experiments}) => [setRecentExperiments({experiments}), deactivateLoader(action.type)]),
          catchError(err => [requestFailed(err), deactivateLoader(action.type)])
        )
    )
  ));

  getReports = createEffect(() => {
    return this.actions.pipe(
      ofType(getRecentReports),
      concatLatestFrom(() => [
        this.store.select(selectCurrentUser),
        this.store.select(selectShowOnlyUserWork),
        this.store.select(selectHideExamples),
      ]),
      switchMap(([, user, showOnlyUserWork, hideExamples]) =>
        this.reportsApiService.reportsGetAllEx({
          only_fields: ['name', 'comment', 'company', 'tags', 'report', 'project.name', 'user.name', 'status', 'last_update', 'system_tags'] as (keyof Report)[],
          size: 6,
          scroll_id: null,
          ...(hideExamples && {allow_public: false}),
          ...(showOnlyUserWork && {user: [user.id]}),
          order_by: ['-last_update'],
          system_tags: [excludedKey, 'archived'],
        })
      ),
      map(res => setRecentReports({reports: res.tasks})),
    )
  })
}
