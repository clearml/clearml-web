import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {requestFailed} from '../core/actions/http.actions';
import {activeLoader, deactivateLoader, setServerError} from '../core/actions/layout.actions';
import {addToProjectsList, getAllProjectsPageProjects, setCurrentScrollId, setNoMoreProjects, setProjectsOrderBy, setProjectsSearchQuery, showExampleDatasets, showExamplePipelines, updateProject, updateProjectSuccess} from './common-projects.actions';
import {selectProjectsOrderBy, selectProjectsScrollId, selectProjectsSearchQuery, selectProjectsSortOrder} from './common-projects.reducer';
import {Store} from '@ngrx/store';
import {TABLE_SORT_ORDER} from '../shared/ui-components/data/table/table.consts';
import {ProjectsGetAllExRequest} from '~/business-logic/model/projects/projectsGetAllExRequest';
import {isExample} from '../shared/utils/shared-utils';
import {catchError, debounceTime, filter, map, mergeMap, switchMap} from 'rxjs/operators';
import {pageSize} from './common-projects.consts';
import {selectRouterParams} from '../core/reducers/router-reducer';
import {selectCurrentUser, selectShowOnlyUserWork} from '../core/reducers/users-reducer';
import {ProjectsGetAllExResponse} from '~/business-logic/model/projects/projectsGetAllExResponse';
import {selectHideExamples, selectMainPageTagsFilter, selectMainPageTagsFilterMatchMode, selectSelectedProject, selectSelectedProjectId, selectShowHidden} from '../core/reducers/projects.reducer';
import {forkJoin, of} from 'rxjs';
import {Project} from '~/business-logic/model/projects/project';
import {setSelectedProjectStats} from '../core/actions/projects.actions';
import {ActivatedRoute} from '@angular/router';
import {ProjectsUpdateResponse} from '~/business-logic/model/projects/projectsUpdateResponse';
import {setFilterByUser} from '@common/core/actions/users.actions';
import {escapeRegex} from '@common/shared/utils/escape-regex';
import {isPipelines, isReports} from './common-projects.utils';
import {getFeatureProjectRequest, getSelfFeatureProjectRequest, isDatasets} from '~/features/projects/projects-page.utils';
import {TaskTypeEnum} from '~/business-logic/model/tasks/taskTypeEnum';
import {getTagsFilters} from '@common/shared/utils/tableParamEncode';

@Injectable()
export class CommonProjectsEffects {
  private store = inject(Store);
  private actions = inject(Actions);
  private route = inject(ActivatedRoute);
  private projectsApi = inject(ApiProjectsService);

  activeLoader = createEffect(() => this.actions.pipe(
    ofType(updateProject, getAllProjectsPageProjects),
    map(action => activeLoader(action.type))
  ));

  updateProject = createEffect(() => this.actions.pipe(
    ofType(updateProject),
    mergeMap(action => this.projectsApi.projectsUpdate({project: action.id, ...action.changes})
      .pipe(
        mergeMap((res: ProjectsUpdateResponse) => [
          deactivateLoader(action.type),
          updateProjectSuccess({id: action.id, changes: res.fields})
        ]),
        catchError(error => [deactivateLoader(action.type), requestFailed(error),
          setServerError(error, undefined, error?.error?.meta?.result_subcode === 800 ?
            'Name should be 3 characters long' : error?.error?.meta?.result_subcode === 801 ? 'Name' +
              ' already' +
              ' exists in this project' : undefined)])
      )
    )
  ));

  getAllProjects = createEffect(() => this.actions.pipe(
    ofType(getAllProjectsPageProjects),
    concatLatestFrom(() => [
      this.store.select(selectRouterParams).pipe(map(params => params?.projectId)),
      this.store.select(selectSelectedProjectId),
      this.store.select(selectSelectedProject),
    ]),
    switchMap(([action, routerProjectId, projectId, selectedProject]) =>
      ((selectedProject && selectedProject.id === routerProjectId) || !projectId && !routerProjectId ? of(selectedProject) : this.projectsApi.projectsGetAllEx({
        id: routerProjectId || projectId,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        only_fields: ['name']
      }).pipe(map(res => res.projects[0])))
        .pipe(
          concatLatestFrom(() => [
            this.store.select(selectProjectsOrderBy),
            this.store.select(selectProjectsSortOrder),
            this.store.select(selectProjectsSearchQuery),
            this.store.select(selectProjectsScrollId),
            this.store.select(selectCurrentUser),
            this.store.select(selectShowOnlyUserWork),
            this.store.select(selectShowHidden),
            this.store.select(selectHideExamples),
            this.store.select(selectMainPageTagsFilter),
            this.store.select(selectMainPageTagsFilterMatchMode),
          ]),

          switchMap(([currentProject,
                       orderBy, sortOrder, searchQuery, scrollId, user, showOnlyUserWork, showHidden, hideExamples,
                       mainPageTagsFilter, mainPageTagsFilterMatchMode]
            ) => {
              const selectedProjectId = routerProjectId || projectId; // In rare cases where router not updated yet with
              const selectedProjectName = selectSelectedProjectId && selectedProjectId !== '*' ? currentProject?.name : null;
              const selectedProjectBasename = selectedProjectName?.split('/').at(-1);
              // current project id
              const projectsView = this.route.snapshot.firstChild.routeConfig.path === 'projects';
              const nested = this.route.snapshot.firstChild?.firstChild?.firstChild?.routeConfig?.path === 'projects';
              const datasets = isDatasets(this.route.snapshot);
              const pipelines = isPipelines(this.route.snapshot);
              const reports = isReports(this.route.snapshot);
              let statsFilter;
              /* eslint-disable @typescript-eslint/naming-convention */
              if (!nested) {
                if (pipelines) {
                  statsFilter = {system_tags: ['pipeline'], type: [TaskTypeEnum.Controller]};
                } else if (datasets) {
                  statsFilter = {system_tags: ['dataset'], type: [TaskTypeEnum.DataProcessing]};
                }
              }
              if (projectsView && !showHidden) {
                statsFilter = {system_tags: ['-pipeline', '-dataset', '-Annotation', '-report']};
              }
              return forkJoin([
                // projects list
                this.projectsApi.projectsGetAllEx({
                  ...(!projectsView && !nested && mainPageTagsFilter?.length > 0 && {
                    filters: {
                      tags: getTagsFilters(mainPageTagsFilterMatchMode === 'AND', mainPageTagsFilter),
                    }
                  }),
                  ...(nested && mainPageTagsFilter?.length > 0 && {
                    children_tags_filter: getTagsFilters(mainPageTagsFilterMatchMode === 'AND', mainPageTagsFilter)
                  }),
                  stats_for_state: ProjectsGetAllExRequest.StatsForStateEnum.Active,
                  include_stats: true,
                  shallow_search: !searchQuery?.query,
                  ...(((projectsView || nested) && !searchQuery?.query) && {permission_roots_only: true}),
                  ...((projectsView && selectedProjectId && selectedProjectId !== '*') && {parent: [selectedProjectId]}),
                  scroll_id: scrollId || null, // null to create new scroll (undefined doesn't generate scroll)
                  size: pageSize,
                  ...(showOnlyUserWork && {active_users: [user?.id]}),
                  ...((showHidden) && {search_hidden: true}),
                  ...(hideExamples && {allow_public: false}),
                  order_by: ['featured', ...(orderBy ? [sortOrder === TABLE_SORT_ORDER.DESC ? '-' + orderBy : orderBy] : [])],
                  only_fields: ['name', 'company', 'user', 'created', 'default_output_destination', 'basename', 'system_tags']
                    .concat(pipelines || datasets ? ['tags', 'last_update'] : []),
                  ...(searchQuery?.query && {
                    _any_: {
                      pattern: searchQuery.regExp ? searchQuery.query : escapeRegex(searchQuery.query),
                      fields: ['id', 'basename', 'description']
                    }
                  }),
                  ...(!projectsView && getFeatureProjectRequest(this.route.snapshot, nested, searchQuery, selectedProjectName, selectedProjectId)),
                }),
                // Getting [current project] stats from server
                ((nested || projectsView) && selectedProjectId && selectedProjectId !== '*' && !scrollId && !searchQuery?.query) ?
                  this.projectsApi.projectsGetAllEx({
                    ...(!datasets && !pipelines && !reports && {id: selectedProjectId}),
                    ...(datasets && {
                      name: `^${escapeRegex(selectedProjectName)}/\\.datasets$`,
                      search_hidden: true,
                      children_type: 'dataset'
                    }),
                    ...(pipelines && {
                      name: `^${escapeRegex(selectedProjectName)}/\\.pipelines$`,
                      search_hidden: true,
                      children_type: 'pipeline'
                    }),
                    ...(reports && {
                      name: `^${escapeRegex(selectedProjectName)}/\\.reports$`,
                      search_hidden: true,
                      children_type: 'report'
                    }),
                    ...((!showHidden && projectsView) && {include_stats_filter: statsFilter}),
                    ...((pipelines && !nested) && {
                      include_stats_filter: {
                        system_tags: ['pipeline'],
                        type: ['controller']
                      }
                    }),
                    ...(datasets && !nested ? {include_dataset_stats: true} : {include_stats: true}),
                    stats_with_children: reports || pipelines || datasets,
                    stats_for_state: ProjectsGetAllExRequest.StatsForStateEnum.Active,
                    ...(showHidden && {search_hidden: true}),
                    check_own_contents: true, // in order to check if project is empty
                    ...(showOnlyUserWork && {active_users: [user.id]}),
                    only_fields: ['name', 'company', 'user', 'created', 'default_output_destination'],
                    ...(!projectsView && getSelfFeatureProjectRequest(this.route.snapshot)),
                  }) : nested && reports && selectedProjectId === '*' && !scrollId && !searchQuery?.query ?
                    // nested reports virtual card
                    this.projectsApi.projectsGetAllEx({
                      name: '^\\.reports$',
                      search_hidden: true,
                      children_type: 'report',
                      stats_with_children: false,
                      stats_for_state: ProjectsGetAllExRequest.StatsForStateEnum.Active,
                      include_stats: true,
                      check_own_contents: true, // in order to check if project is empty
                      ...(showOnlyUserWork && {active_users: [user.id]}),
                      only_fields: ['id', 'company'],
                      ...(mainPageTagsFilter?.length > 0 && {
                          children_tags_filter: getTagsFilters(mainPageTagsFilterMatchMode === 'AND', mainPageTagsFilter)
                      }),

                      /* eslint-enable @typescript-eslint/naming-convention */
                    }) :
                    of(null),
              ]).pipe(
                debounceTime(0),
                map(([projectsRes, currentProjectRes]: [ProjectsGetAllExResponse, ProjectsGetAllExResponse]) => ({
                    newScrollId: projectsRes.scroll_id,
                    projects: currentProjectRes !== null && currentProjectRes.projects.length !== 0 &&
                    this.isNotEmptyExampleProject(currentProjectRes.projects[0]) ?
                      /* eslint-disable @typescript-eslint/naming-convention */
                      [(currentProjectRes?.projects?.length === 0 ?
                        {
                          isRoot: true,
                          sub_projects: null,
                          name: `[${selectedProjectName}]`,
                          basename: `[${selectedProjectBasename}]`
                        } :
                        {
                          ...currentProjectRes.projects[0],
                          id: selectedProjectId,
                          isRoot: true,
                          // eslint-disable-next-line @typescript-eslint/naming-convention
                          sub_projects: null,
                          name: !selectedProjectName && currentProjectRes.projects[0].stats ? '[Root]' : `[${selectedProjectName}]`,
                          basename: !selectedProjectName && currentProjectRes.projects[0].stats ? '[Root]' : `[${selectedProjectBasename}]`
                        }),
                        ...projectsRes.projects
                        /* eslint-enable @typescript-eslint/naming-convention */
                      ] :
                      projectsRes.projects
                  }
                )),
                mergeMap(({newScrollId, projects}) => [
                  addToProjectsList({
                    projects, reset: !scrollId
                  }),
                  deactivateLoader(action.type),
                  setCurrentScrollId({scrollId: newScrollId}),
                  setNoMoreProjects({payload: projects.length < pageSize})]),
                catchError(error => [deactivateLoader(action.type), requestFailed(error)])
              );
            }
          )
        )
    ),
  ));

  updateProjectStats = createEffect(() => this.actions.pipe(
    ofType(setFilterByUser),
    concatLatestFrom(() => [
      this.store.select(selectSelectedProject),
      this.store.select(selectCurrentUser),
      this.store.select(selectShowHidden)
    ]),
    filter(([, project]) => !!project),
    switchMap(([action, project, user, showHidden]) => this.projectsApi.projectsGetAllEx({
      /* eslint-disable @typescript-eslint/naming-convention */
      id: [project.id],
      include_stats: true,
      ...(showHidden && {search_hidden: true}),
      ...(!showHidden && {include_stats_filter: {system_tags: ['-pipeline', '-dataset']}}),
      ...(action.showOnlyUserWork && {active_users: [user.id]}),
      /* eslint-enable @typescript-eslint/naming-convention */
    })),
    switchMap(({projects}) => [setSelectedProjectStats({project: projects[0]})]),
    catchError(error => [requestFailed(error)])
  ));

  setProjectsOrderBy = createEffect(() => this.actions.pipe(
    ofType(setProjectsOrderBy),
    mergeMap(() => [getAllProjectsPageProjects()])
  ));

  showExamplePipeline = createEffect(() => this.actions.pipe(
    ofType(showExamplePipelines),
    map(() => localStorage.setItem('_saved_pipeline_state_', JSON.stringify(
      {...JSON.parse(localStorage.getItem('_saved_pipeline_state_')), showPipelineExamples: true}
    )))
  ), {dispatch: false});

  showExampleDataset = createEffect(() => this.actions.pipe(
    ofType(showExampleDatasets),
    map(() => localStorage.setItem('_saved_pipeline_state_', JSON.stringify(
      {...JSON.parse(localStorage.getItem('_saved_pipeline_state_')), showDatasetExamples: true})))
  ), {dispatch: false});

  setProjectsSearchQuery = createEffect(() => this.actions.pipe(
    ofType(setProjectsSearchQuery),
    filter(action => !action.skipGetAll),
    mergeMap(() => [getAllProjectsPageProjects()])
  ));

  private isNotEmptyExampleProject(project: Project) {
    return !(isExample(project) && project.own_models === 0 && project.own_tasks === 0);
  }

}
