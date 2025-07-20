import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {ProjectsGetAllExResponse} from '~/business-logic/model/projects/projectsGetAllExResponse';
import * as actions from '../actions/projects.actions';
import {
  downloadForGetAll,
  setMainPageTagsFilter,
  setProjectAncestors,
  setShowHidden,
  setTablesFilterProjectsOptions
} from '../actions/projects.actions';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  switchMap,
  withLatestFrom
} from 'rxjs/operators';
import {requestFailed} from '../actions/http.actions';
import {activeLoader, deactivateLoader, setServerError} from '../actions/layout.actions';
import {resetState} from '../../models/actions/models-view.actions';
import {MatDialog} from '@angular/material/dialog';
import {ApiOrganizationService} from '~/business-logic/api-services/organization.service';
import {OrganizationGetTagsResponse} from '~/business-logic/model/organization/organizationGetTagsResponse';
import {selectRouterConfig, selectRouterParams} from '../reducers/router-reducer';
import {EMPTY, forkJoin, Observable, of} from 'rxjs';
import {ProjectsGetTaskTagsResponse} from '~/business-logic/model/projects/projectsGetTaskTagsResponse';
import {ProjectsGetModelTagsResponse} from '~/business-logic/model/projects/projectsGetModelTagsResponse';
import {
  ScatterPlotPoint,
  selectAllProjectsUsers, selectIsDeepMode,
  selectMainPageTagsFilter,
  selectProjectsOptionsScrollId,
  selectSelectedMetricVariantForCurrProject,
  selectSelectedProjectId,
  selectShowHidden,
} from '../reducers/projects.reducer';
import {
  OperationErrorDialogComponent
} from '@common/shared/ui-components/overlay/operation-error-dialog/operation-error-dialog.component';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {createMetricColumn, excludedKey, MetricColumn} from '@common/shared/utils/tableParamEncode';
import {ITask} from '~/business-logic/model/al-task';
import {TasksGetAllExRequest} from '~/business-logic/model/tasks/tasksGetAllExRequest';
import {setSelectedExperiments} from '../../experiments/actions/common-experiments-view.actions';
import {setActiveWorkspace} from '@common/core/actions/users.actions';
import {ApiUsersService} from '~/business-logic/api-services/users.service';
import {escapeRegExp, get} from 'lodash-es';
import {escapeRegex} from '@common/shared/utils/escape-regex';
import {ProjectsGetAllExRequest} from '~/business-logic/model/projects/projectsGetAllExRequest';
import {ProjectsGetAllResponseSingle} from '~/business-logic/model/projects/projectsGetAllResponseSingle';
import {rootProjectsPageSize} from '@common/constants';
import {HTTP} from '~/app.constants';
import {cleanTag} from '@common/shared/utils/helpers.util';
import {selectExperimentsTableFilters} from '@common/experiments/reducers';
import {Params} from '@angular/router';
import {selectCompareAddTableFilters} from '@common/experiments-compare/reducers';
import {selectTableFilters} from '@common/models/reducers';
import {selectSelectModelTableFilters} from '@common/select-model/select-model.reducer';
import {TagColorMenuComponent} from '@common/shared/ui-components/tags/tag-color-menu/tag-color-menu.component';
import {selectProjectType} from '@common/core/reducers/view.reducer';

export const ALL_PROJECTS_OBJECT = {id: '*', name: 'All Tasks'};


@Injectable()
export class ProjectsEffects {

  constructor(
    private actions$: Actions, private projectsApi: ApiProjectsService, private orgApi: ApiOrganizationService,
    private store: Store, private dialog: MatDialog, private tasksApi: ApiTasksService,
    private usersApi: ApiUsersService,
  ) {
  }

  activeLoader = createEffect(() => this.actions$.pipe(
    ofType(actions.setSelectedProjectId),
    filter((action) => !!action.projectId),
    map(action => activeLoader(action.type))
  ));


  setDeep = createEffect(() => this.actions$.pipe(
    ofType(actions.setDeep),
    debounceTime(300),
    concatLatestFrom(() => [
      this.store.select(selectSelectedProjectId),
      this.store.select(selectIsDeepMode)
    ]),
    distinctUntilChanged(([, , preIsDeep], [, , currIsDeep]) => preIsDeep === currIsDeep),
    map(([, projectId,]) => actions.getProjectUsers({projectId}))));


  getTablesFilterProjectsOptions$ = createEffect(() => this.actions$.pipe(
    ofType(actions.getTablesFilterProjectsOptions),
    debounceTime(300),
    concatLatestFrom(() => [
      this.store.select(selectShowHidden),
      this.store.select(selectProjectsOptionsScrollId),
      this.getRelevantTableFilters(this.store.select(selectRouterConfig))
    ]),
    switchMap(([action, showHidden, scrollId, filters]) => forkJoin([
        this.projectsApi.projectsGetAllEx({

          allow_public: action.allowPublic,
          page_size: rootProjectsPageSize,
          size: rootProjectsPageSize,
          order_by: ['name'],
          only_fields: ['name', 'company'],
          search_hidden: showHidden,
            _any_: {pattern: escapeRegex(action.searchString), fields: ['name', 'id']},
          scroll_id: !!action.loadMore && scrollId ? scrollId : null
        } as ProjectsGetAllExRequest),
        !action.loadMore && action.searchString?.length > 2 ?
          this.projectsApi.projectsGetAllEx({
            only_fields: ['name', 'company'],
            search_hidden: showHidden,
              _any_: {pattern: `^${escapeRegex(action.searchString)}$`, fields: ['name', 'id']},

          } as ProjectsGetAllExRequest)
            .pipe(
              map((res: ProjectsGetAllExResponse) => res.projects.filter(project => project.name === action.searchString)),
            ) :
          of([]),
        !action.loadMore && filters['project.name']?.value.length ?
          this.projectsApi.projectsGetAllEx({
            id: filters['project.name']?.value,
            only_fields: ['name', 'company'],

          } as ProjectsGetAllExRequest).pipe(map(res => res.projects)) :
          of([]),
      ])
        .pipe(map(([allProjects, specificProjects, selectedProjects]) => ({
            projects: [
              ...(specificProjects.length > 0 && allProjects.projects.some(project => project.id === specificProjects[0]?.id) ? [] : specificProjects),
              ...allProjects.projects,
              ...selectedProjects
            ],
            scrollId: allProjects.scroll_id,
            loadMore: action.loadMore
          })
        ))
    ),
    mergeMap((projects: {
      projects: ProjectsGetAllResponseSingle[];
      scrollId: string;
    }) => [setTablesFilterProjectsOptions({...projects})])
  ));


  resetProjects$ = createEffect(() => this.actions$.pipe(
    ofType(actions.resetSelectedProject),
    mergeMap(() => [actions.resetProjectSelection()])
  ));

  resetAncestorProjects$ = createEffect(() => this.actions$.pipe(
    ofType(actions.setSelectedProjectId),
    concatLatestFrom(() => this.store.select(selectSelectedProjectId)),
    filter(([action, prevProjectId]) => action.projectId !== prevProjectId),
    mergeMap(() => [setProjectAncestors({projects: null})])
  ));

  getAncestorProjects$ = createEffect(() => this.actions$.pipe(
    ofType(actions.setSelectedProject),
    filter(action => !!action.project),
    switchMap(action => {
      const parts = action.project.name?.split('/');
      if (!action.project.id || action.project.id === ALL_PROJECTS_OBJECT.id || parts.length === 1) {
        return of([{projects: []}, []]);
      }
      parts.pop();
      const escapedParts = parts.map(escapeRegExp);
      const [simpleProjectNames, projectsNames] = parts.reduce(
        ([simpleNames, names], part, index) => [
          [...simpleNames, parts.slice(0, index + 1).join('/')],
          [...names, escapedParts.slice(0, index + 1).join('\\/')],
        ],
        [[], []]
      );
      return this.projectsApi.projectsGetAllEx({

        _any_: {fields: ['name'], pattern: projectsNames.map(name => `^${name}$`).join('|')},
        search_hidden: true

      }).pipe(map(res => [res, simpleProjectNames]));
    }),
    switchMap(([res, projectsNames]) => [actions.setProjectAncestors({
        projects: res?.projects?.filter(project => projectsNames.includes(project.name))
          .sort((projectA, projectB) => (projectA.name?.split('/').length >= projectB.name?.split('/').length) ? 1 : -1)
      })]
    )));

  resetProjectSelections$ = createEffect(() => this.actions$.pipe(
    ofType(actions.resetProjectSelection),
    mergeMap(() => [
      setSelectedExperiments({experiments: []}),
      resetState()
    ])
  ));

  updateProject$ = createEffect(() => this.actions$.pipe(
    ofType(actions.updateProject),
    switchMap((action) =>
      this.projectsApi.projectsUpdate({project: action.id, ...action.changes})
        .pipe(
          mergeMap(res => [
            actions.updateProjectCompleted({id: action.id, changes: res?.fields || action.changes})
          ]),
          catchError(err => [
            requestFailed(err),
            setServerError(err, null, 'Update project failed'),
            actions.setSelectedProjectId({projectId: action.id})
          ])
        )
    )
  ));

  openTagColor = createEffect(() => this.actions$.pipe(
    ofType(actions.openTagColorsMenu),
    map(action => {
      this.dialog.open(TagColorMenuComponent, {data: {tags: action.tags}});
    })
  ), {dispatch: false});

  //getAll but not projects'
  getAllTags = createEffect(() => this.actions$.pipe(
    ofType(actions.getCompanyTags),
    switchMap(() => this.orgApi.organizationGetTags({include_system: true})
      .pipe(
        map((res: OrganizationGetTagsResponse) => actions.setCompanyTags({
          tags: res.tags,
          systemTags: res.system_tags
        })),
        catchError(error => [requestFailed(error)])
      )
    )
  ));

  getProjectsTags = createEffect(() => this.actions$.pipe(
    ofType(actions.getProjectsTags),
    switchMap(action => this.projectsApi.projectsGetProjectTags({filter: {system_tags: [action.entity]}})
      .pipe(
        withLatestFrom(this.store.select(selectMainPageTagsFilter), this.store.select(selectProjectType)),
        mergeMap(([res, fTags, projectType]) => [
          actions.setTags({tags: res.tags}),
          ...(fTags?.length > 0 && fTags.some(fTag => !res.tags.includes(cleanTag(fTag))) ? [setMainPageTagsFilter({
            tags: fTags.filter(fTag => res.tags.includes(cleanTag(fTag))),
            feature: projectType
          })] : []),
        ]),
        catchError(error => [requestFailed(error)])
      )
    )
  ));

  getTagsEffect = createEffect(() => this.actions$.pipe(
    ofType(actions.getTags),
    concatLatestFrom(() => this.store.select(selectRouterParams).pipe(
      map(params => (params === null || params?.projectId === '*') ? [] : [params.projectId]))),
    mergeMap(([action, projects]) => {
      const ids = action?.projectId ? [action.projectId] : projects;
      if (ids.length === 0 || !ids[0]) {
        return EMPTY;
      }
      return forkJoin([
        this.projectsApi.projectsGetTaskTags({projects: action?.projectId ? [action.projectId] : projects}),
        this.projectsApi.projectsGetModelTags({projects: action?.projectId ? [action.projectId] : projects})]
      ).pipe(
        map((res: [ProjectsGetTaskTagsResponse, ProjectsGetModelTagsResponse]) =>
          Array.from(new Set(res[0].tags.concat(res[1].tags))).sort()),
        mergeMap((tags: string[]) => [
          actions.setTags({tags}),
          deactivateLoader(action.type)
        ]),
        catchError(error => [
          requestFailed(error),
          deactivateLoader(action.type),
          setServerError(error, null, 'Fetch tags failed')]
        )
      );
    })
  ));

  openMoreInfoPopupEffect = createEffect(() => this.actions$.pipe(
    ofType(actions.openMoreInfoPopup),
    switchMap(action => this.dialog.open(OperationErrorDialogComponent, {
        data: {
          title: `${action.operationName} ${action.entityType}`,
          action,
          iconClass: `d-block al-ico-${action.operationName} al-icon w-auto`,
        }
      }).afterClosed()
    )
  ), {dispatch: false});

  fetchProjectStats = createEffect(() => this.actions$.pipe(
    ofType(actions.fetchGraphData),
    concatLatestFrom(() => [
      this.store.select(selectSelectedProjectId),
      this.store.select(selectSelectedMetricVariantForCurrProject),
    ]),
    filter(([, , variant]) => !!variant),
    switchMap(([, projectId, cols]) => {
      if (cols && !Array.isArray(cols)) {
        cols = [createMetricColumn(cols as unknown as MetricColumn, projectId)];
      }
      return forkJoin(cols.map(col => this.tasksApi.tasksGetAllEx({

        project: [projectId],
        only_fields: ['started', 'last_iteration', 'user.name', 'type', 'name', 'status', 'active_duration', col.id],
        [col.id]: [0, null],
        started: ['2000-01-01T00:00:00', null],
        status: ['-draft'],
        order_by: ['-started'],
        type: [excludedKey, 'annotation_manual', excludedKey, 'annotation', excludedKey, 'dataset_import'],
        system_tags: ['-archived'],
        scroll_id: null,
        size: 1000

      } as unknown as TasksGetAllExRequest)
        .pipe(map(({tasks}) => tasks))
      ))
      .pipe(
        map(tasksList => tasksList.flat()),
        map((tasks: ITask[]) =>
          actions.setGraphData({
            stats: tasks.map((task: ITask) => {
              const started = new Date(task.started).getTime();
              const end = started + (task.active_duration ?? 0) * 1000;
              return cols.map(col => ({
                id: task.id,
                variant: col.id,
                y: get(task, col.id), // col.id is a path (e.g.) last_metric.x.max_value, must use lodash get
                x: end,
                name: `${task.name} (${task.id.slice(0, 6)})`,
                status: task.status,
                type: task.type,
                user: task.user.name,
              } as ScatterPlotPoint ));
            }).flat().filter(point => point.y > 0)
          }))
      );
    })
  ));

  resetRootProjects = createEffect(() => this.actions$.pipe(
    ofType(setActiveWorkspace, actions.refetchProjects, setShowHidden),
    mergeMap(() => [
      actions.resetProjects(),
      actions.getAllSystemProjects()
    ])
  ));

  getAllProjectsUsersEffect = createEffect(() => this.actions$.pipe(
    ofType(actions.getAllSystemProjects),
    switchMap(() => this.projectsApi.projectsGetUserNames({

      include_subprojects: true

    }, {adminQuery: true}).pipe(
      mergeMap(res => [actions.setAllProjectUsers(res)]),
      catchError(error => [
        requestFailed(error),
        setServerError(error, null, 'Fetch all projects users failed')]
      )
    ))
  ));

  getUsersEffect = createEffect(() => this.actions$.pipe(
    ofType(actions.getProjectUsers),
    concatLatestFrom(() => [this.store.select(selectAllProjectsUsers), this.store.select(selectIsDeepMode)]
    ),
    switchMap(([action, all, isDeep]) => (!action.projectId || action.projectId === '*' ?
      of({users: all}) :
      this.projectsApi.projectsGetUserNames({
        projects: [action.projectId],

        include_subprojects: isDeep
      }, {adminQuery: true})).pipe(
      mergeMap(res => [actions.setProjectUsers(res)]),
      catchError(error => [
        requestFailed(error),
        setServerError(error, null, 'Fetch users failed')]
      )
    ))
  ));

  getExtraUsersEffect = createEffect(() => this.actions$.pipe(
    ofType(actions.getFilteredUsers),
    switchMap(action => this.usersApi.usersGetAllEx({

      order_by: ['name'],
      only_fields: ['name'],
      id: action.filteredUsers || []

    }, {adminQuery: true}).pipe(
      mergeMap(res => [
        actions.setProjectExtraUsers(res),
        deactivateLoader(action.type)
      ]),
      catchError(error => [
        requestFailed(error),
        deactivateLoader(action.type),
        setServerError(error, null, 'Fetch users failed')]
      )
    ))
  ));

  // downloadForGetAll$ = createEffect(() => this.actions$.pipe(
  //   ofType(downloadForGetAll),
  //   filter(action => !!action.prepareId),
  //   withLatestFrom(this.store.select(selectActiveWorkspace)),
  //   switchMap(([action, workspace]) => fromFetch(`${HTTP.API_BASE_URL}/organization.download_for_get_all`,
  //     {
  //       ...(workspace?.id && {headers: {[TENANT_HEADER] : workspace.id}}),
  //       method: 'POST',
  //       credentials: 'include',
  //       // eslint-disable-next-line @typescript-eslint/naming-convention
  //       body: JSON.stringify({prepare_id: action.prepareId})
  //     })
  //     .pipe(
  //       switchMap(res => from(res.blob())),
  //       map(fileBlob => {
  //         const url = window.URL.createObjectURL(fileBlob);
  //         const a = document.createElement('a');
  //         a.href = url;
  //         a.target = '_blank';
  //         a.download = `full-table.csv`;
  //         a.click();
  //       })
  //     )),
  // ), {dispatch: false});

  downloadForGetAll$ = createEffect(() => this.actions$.pipe(
    ofType(downloadForGetAll),
    filter(action => !!action.prepareId),
  )).subscribe((action) => {
      const a = document.createElement('a');
      a.href = `${HTTP.API_BASE_URL}/organization.download_for_get_all?prepare_id=${action.prepareId}`;
      a.target = '_blank';
      a.click();
    }
  );

  private getRelevantTableFilters(routerConfig$: Observable<Params>) {
    return routerConfig$.pipe(switchMap(config => {
      if (config.includes('compare-tasks')) {
        return this.store.select(selectCompareAddTableFilters);
      } else if (config?.includes('models')) {
        return this.store.select(selectTableFilters);
      } else if (config?.includes('compare-models') || config?.includes('input-model')) {
        return this.store.select(selectSelectModelTableFilters);
      } else {
        return this.store.select(selectExperimentsTableFilters);
      }
    }));
  }
}


