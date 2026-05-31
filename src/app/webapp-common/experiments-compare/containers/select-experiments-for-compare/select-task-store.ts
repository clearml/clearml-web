import {signalStore, type, withState} from '@ngrx/signals';
import {eventGroup, Events, on, withEventHandlers, withReducer} from '@ngrx/signals/events';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {tableEvents, withTableStore} from '@common/experiments-compare/containers/select-experiments-for-compare/table-store';
import {inject} from '@angular/core';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {catchError, debounceTime, map, mergeMap, switchMap} from 'rxjs/operators';
import {decodeHyperParam, TableFilter} from '@common/shared/utils/tableParamEncode';
import {emptyAction} from '~/app.constants';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {ProjectsGetTaskTagsResponse} from '~/business-logic/model/projects/projectsGetTaskTagsResponse';
import {ProjectsGetTaskParentsRequest} from '~/business-logic/model/projects/projectsGetTaskParentsRequest';
import {ProjectsGetTaskParentsResponse} from '~/business-logic/model/projects/projectsGetTaskParentsResponse';
import {of} from 'rxjs';
import {INITIAL_EXPERIMENT_TABLE_COLS, MINIMUM_ONLY_FIELDS} from '@common/experiments/experiment.consts';
import {flatten, cloneDeep, uniqBy} from 'lodash-es';
import {ITableExperiment} from '@common/experiments/shared/common-experiment-model.model';
import {addMultipleSortColumns} from '@common/shared/utils/shared-utils';
import {selectRouterParams} from '@common/core/reducers/router-reducer';
import {Store} from '@ngrx/store';
import {concatLatestFrom} from '@ngrx/operators';
import {withViewBridge} from '@common/core/state/view.store';
import {viewEvents} from '@common/core/state/view.events';
import {MESSAGES_SEVERITY} from '@common/constants';
import {ApiUsersService} from '~/business-logic/api-services/users.service';
import {UsersGetAllExResponse} from '~/business-logic/model/users/usersGetAllExResponse';
import {getPaginatedAndSearchedAndSelectedProjects} from '@common/core/effects/projects.effects';
import {selectShowHidden} from '@common/core/reducers/projects.reducer';
import {withDevtools} from '@angular-architects/ngrx-toolkit';
import {setServerError} from '@common/core/actions/layout.actions';
import {getGetAllQuery} from '@common/experiments/effects/common-experiments-view.effects';
import {EXPERIMENTS_PAGE_SIZE} from '@common/experiments/shared/common-experiments.const';
import {FilterMetadata, SortMeta} from 'primeng/api';


export const selectTaskEvents = eventGroup({
  source: 'Select task',
  events: {
    initState: type<{ cols: ISmCol[] }>(),
    getExperiments: type<void>(),
    getProjectTypes: type<void>(),
    setProjectsTypes: type<{ types?: string[] }>(),
    hyperParamSelectedInfoExperiments: type<{ col: ISmCol; values: string[]; loadMore: boolean }>(),
    getSelectedExperimentsForCompareAddDialog: type<{ tasksIds?: string[] }>(),
    setSelectedExperiments: type<{ experiments: ITableExperiment[] }>(),
    compareAddTableFilterChanged: type<{ filter: TableFilter; projectId: string }>(),
    setAddTableViewArchived: type<{ show: boolean }>(),
    compareAddDialogTableSortChanged: type<{ sort: { isShift: boolean; colId: ISmCol['id'] }, projectId: string }>(),
    getFilterProjectsOptions: type<{ searchString: string; loadMore: boolean }>(),
    getUsers: type<void>(),
    hyperParamSelectedExperiments: type<{ col: ISmCol; searchValue: string }>(),
    getTasks: type<{
      isLoadMore?: boolean;
      isDataset: boolean;
      isPipeline: boolean;
      projectId: string;
      searchTerm: string;
      orderFields: SortMeta[];
      filters: Record<string, FilterMetadata>;
      cols: ISmCol[];
      metricCols: ISmCol[];
      showArchived: boolean
    }>(),
    setTasks: type<{ tasks: ITableExperiment[]; scrollId: string; noMore: boolean; isLoadMore: boolean }>()
  }
});


interface SelectEntityDialogState {
  hyperParamsFiltersPage: number;
  hyperParamsOptions: Record<string, string[]>;
  viewArchived: boolean;
  selectedExperiments: ITableExperiment[];
  tasks: ITableExperiment[];
  scrollId: string;
  noMoreExperiments: boolean;
}

const selectEntityDialogState: SelectEntityDialogState = {
  hyperParamsFiltersPage: 0,
  hyperParamsOptions: undefined,
  viewArchived: false,
  selectedExperiments: [],
  tasks: null,
  scrollId: null,
  noMoreExperiments: false
};


export const selectTaskStore = signalStore(
  withState(selectEntityDialogState),
  withTableStore(),
  withViewBridge(),
  withDevtools('selectTask'),
  withReducer(
    on(selectTaskEvents.initState, ({payload}) => ({columns: payload.cols})),
    on(selectTaskEvents.setProjectsTypes, ({payload}) => ({types: payload.types})),
    on(selectTaskEvents.hyperParamSelectedInfoExperiments, ({payload}, state) => ({
      ...state,
      hyperParamsOptions: {
        ...state.hyperParamsOptions,
        [payload.col.id]: payload.loadMore ? (state.hyperParamsOptions?.[payload.col.id] || []).concat(payload.values) : payload.values
      },
      hyperParamsFiltersPage: payload.loadMore ? state.hyperParamsFiltersPage + 1 : 0
    })),
    on(selectTaskEvents.compareAddTableFilterChanged, ({payload}, state) => ({
      projectColumnFilters: {
        ...state.projectColumnFilters,
        [payload.projectId]: {
          ...state.projectColumnFilters[payload.projectId],
          [payload.filter.col]: {value: payload.filter.value, matchMode: payload.filter.filterMatchMode}
        }
      }
    })),
    on(selectTaskEvents.setAddTableViewArchived, ({payload}) => ({viewArchived: payload.show})),
    on(selectTaskEvents.setSelectedExperiments, ({payload}) => ({selectedExperiments: payload.experiments})),
    on(selectTaskEvents.setTasks, ({payload}, state) => ({
      tasks: payload.isLoadMore ? [...state.tasks, ...payload.tasks] : payload.tasks,
      scrollId: payload.scrollId,
      noMoreExperiments: payload.noMore
    }))
  ),
  withEventHandlers(
    (
      store,
      events = inject(Events),
      tasksService = inject(ApiTasksService),
      projectsService = inject(ApiProjectsService),
      usersService = inject(ApiUsersService),
      globalStore = inject(Store)
    ) => ({
      activateLoader$: events
        .on(selectTaskEvents.getTasks, selectTaskEvents.getSelectedExperimentsForCompareAddDialog)
        .pipe(
          map(() => viewEvents.activateLoader({endpoint: 'select task'}))
        ),
      getTasks$: events
        .on(selectTaskEvents.getTasks)
        .pipe(
          concatLatestFrom(() => globalStore.select(selectShowHidden)),
          switchMap(([{payload}, showHidden]) => {
            const tableFilters = cloneDeep(payload.filters) || {} as Record<string, FilterMetadata>;
            if (tableFilters?.status?.value.includes('completed')) {
              tableFilters.status.value.push('closed');
            }
            const scrollId = payload.isLoadMore ? store.scrollId() : null;

            globalStore.dispatch(viewEvents.activateLoader({endpoint: 'select task'}));
            return tasksService.tasksGetAllEx(getGetAllQuery({
              refreshScroll: false,
              scrollId: scrollId,
              projectId: payload.projectId,
              searchQuery: {query: payload.searchTerm},
              archived: payload.showArchived,
              orderFields: payload.orderFields,
              tableFilters,
              selectedIds: [],
              cols: payload.cols,
              metricCols: payload.metricCols,
              deep: false,
              showHidden: showHidden,
              isCompare: true,
              isPipeline: payload.isPipeline,
              pageSize: EXPERIMENTS_PAGE_SIZE,
              isDataset: payload.isDataset
            })).pipe(
              mergeMap((res) => [
                selectTaskEvents.setTasks({
                  tasks: res.tasks as ITableExperiment[],
                  scrollId: res.scroll_id,
                  noMore: res.tasks.length < EXPERIMENTS_PAGE_SIZE,
                  isLoadMore: payload.isLoadMore
                }),
                viewEvents.deactivateLoader({endpoint: 'select task'})
              ]),
              catchError((error) => [
                viewEvents.requestFailed(error),
                viewEvents.deactivateLoader({endpoint: 'select task'})
              ])
            );
          })
        ),
      getTags$: events
        .on(tableEvents.getTags)
        .pipe(
          switchMap((event) => {
            return projectsService.projectsGetTaskTags({
              projects: [],
              include_system: true
            }).pipe(
              mergeMap((res: ProjectsGetTaskTagsResponse) => [
                tableEvents.setTags({tags: res.tags.concat(null)}),
                tableEvents.setSystemTags({tags: res.system_tags})
              ]),
              catchError(error => [
                viewEvents.requestFailed(error),
                viewEvents.addMessage({
                  severity: MESSAGES_SEVERITY.WARN,
                  msg: 'Fetch tags failed',
                  userActions: error?.meta && [
                    {
                      name: 'More info',
                      actions: [setServerError(error, null, 'Fetch tags failed')]
                    }]
                })]
              )
            );
          })
        ),
      getParents$: events
        .on(tableEvents.getParents)
        .pipe(
          concatLatestFrom(() => globalStore.select(selectRouterParams).pipe(map(params => params?.projectId))),
          switchMap(([{payload}, projectId]) => projectsService.projectsGetTaskParents({
              projects: (projectId === '*' || payload.allProjects) ? [] : [projectId],
              tasks_state: ProjectsGetTaskParentsRequest.TasksStateEnum.Active,
              ...(payload.searchValue && {task_name: `(?i)${payload.searchValue}`}) // (?i) is case insensitive
            }).pipe(
              mergeMap(({parents}: ProjectsGetTaskParentsResponse) => {
                const filteredParentIds = store.tableFilters?.['parent.name']?.value || [];
                const missingParentsIds = filteredParentIds.filter(parentId => !parents.find(parent => parent.id === parentId));
                return (missingParentsIds.length ? tasksService.tasksGetAllEx({
                  id: missingParentsIds,
                  only_fields: ['name', 'project.name']
                }) : of({tasks: []})).pipe(
                  mergeMap((parentsTasks) => [
                    tableEvents.setActiveParentsFilter({parents: parentsTasks.tasks || []}),
                    tableEvents.setParents({parents: parents})])
                );
              }),
              catchError(error => [
                  viewEvents.requestFailed(error),
                  viewEvents.addMessage({
                    severity: MESSAGES_SEVERITY.WARN,
                    msg: 'Fetch parents failed',
                    userActions: error?.meta && [
                      {
                        name: 'More info',
                        actions: [setServerError(error, null, 'Fetch parents failed')]
                      }]
                  })
                ]
              )
            )
          )
        ),
      getProjectsTypes$: events
        .on(selectTaskEvents.getProjectTypes)
        .pipe(
          switchMap((event) => tasksService.tasksGetTypes({projects: []}).pipe(
              mergeMap((res) => {
                let shouldFilterFilters: boolean;
                let filteredTableFilter = {} as TableFilter;
                if (store.tableFilters?.['type']?.value) {
                  filteredTableFilter = {
                    col: 'type',
                    value: store.tableFilters?.['type'].value.filter(filterType => res.types.includes(filterType))
                  };
                  shouldFilterFilters = filteredTableFilter.value.length !== store.tableFilters?.['type'].value.length;
                }
                return [
                  shouldFilterFilters ? tableEvents.tableFilterChanged({
                    filters: [filteredTableFilter],
                    projectId: '*'
                  }) : emptyAction(),
                  selectTaskEvents.setProjectsTypes(res)
                ];
              }),
              catchError(error => [
                viewEvents.requestFailed(error),
                viewEvents.addMessage({
                  severity: MESSAGES_SEVERITY.WARN,
                  msg: 'Fetch types failed',
                  userActions: error?.meta && [
                    {
                      name: 'More info',
                      actions: [setServerError(error, null, 'Fetch types failed')]
                    }]
                })
              ])
            )
          )
        ),
      getSelectedExperimentsForCompareAddDialog$: events
        .on(selectTaskEvents.getSelectedExperimentsForCompareAddDialog)
        .pipe(
          debounceTime(500),
          concatLatestFrom(() => globalStore.select(selectRouterParams).pipe(map(params => params?.ids?.split(',')))),
          switchMap(([event, ids]) => tasksService.tasksGetAllEx({
              id: event.payload.tasksIds ? event.payload.tasksIds : ids,
              only_fields: [...new Set([...MINIMUM_ONLY_FIELDS,
                ...flatten((store.tableCols().length > 0 ? store.tableCols() : INITIAL_EXPERIMENT_TABLE_COLS).filter(col => col.id !== 'selected' && !col.hidden).map(col => col.getter || col.id)),
                ...(store.metricsColsForProject() ? flatten(store.metricsColsForProject().map(col => col.getter || col.id)) : [])])] as string[]
            }).pipe(
              mergeMap((res) => [
                selectTaskEvents.setSelectedExperiments({experiments: [...res?.tasks ?? []]}),
                viewEvents.deactivateLoader({endpoint: event.type})
              ])
            )
          )
        ),
      compareAddDialogTableSortChanged$: events
        .on(selectTaskEvents.compareAddDialogTableSortChanged)
        .pipe(
          concatLatestFrom(() => globalStore.select(selectRouterParams).pipe(map(params => params?.projectId))),
          map(([{payload}, projectId]) => {
            const orders = addMultipleSortColumns(store.projectColumnsSortOrder()[payload.projectId], payload.sort.colId, payload.sort.isShift);
            return tableEvents.setTableSort({orders, projectId: payload.projectId ?? projectId});
          })
        ),
      getFilterProjectsOptions$: events
        .on(selectTaskEvents.getFilterProjectsOptions)
        .pipe(
          debounceTime(300),
          concatLatestFrom(() => [
            globalStore.select(selectShowHidden),
            globalStore.select(selectRouterParams).pipe(map(params => params?.projectId))
          ]),
          switchMap(([action, showHidden, projectId]) => getPaginatedAndSearchedAndSelectedProjects(action.payload, projectsService, showHidden, store.projectsFilterOptionsScrillId(), store.projectColumnFilters()[projectId])
            .pipe(
              mergeMap(res => [
                tableEvents.setProjectsOptions({
                  projects: action.payload.loadMore ? uniqBy([...store.projectsFilterOptions(), ...res.projects], 'id') : uniqBy(res.projects, 'id'),
                  projectsFilterOptionsScrillId: res.scrollId
                })
              ]),
              catchError(error => [
                viewEvents.requestFailed(error)
              ])
            ))
        ),
      getUsers$: events
        .on(selectTaskEvents.getUsers)
        .pipe(
          switchMap((action) => usersService.usersGetAllEx({
            order_by: ['name'],
            only_fields: ['name']
          }).pipe(
            mergeMap((res: UsersGetAllExResponse) => [
              tableEvents.setUsers({users: res.users})
            ]),
            catchError(error => [
              viewEvents.requestFailed(error)
            ])
          ))
        ),
      hyperParamSelectedExperiments$: events
        .on(selectTaskEvents.hyperParamSelectedExperiments)
        .pipe(
          debounceTime(300),
          concatLatestFrom(() => [
            globalStore.select(selectRouterParams).pipe(map(params => params?.projectId))
          ]),
          switchMap(([action, selectedProjectId]) => {
            const projectId = action.payload.col.projectId || selectedProjectId;
            const {section, name} = decodeHyperParam(action.payload.col);
            return projectsService.projectsGetHyperparamValues({
              include_subprojects: true,
              section,
              name,
              ...((projectId !== '*') && {projects: [projectId]}),
              page: store.hyperParamsFiltersPage(),
              page_size: 100,
              pattern: action.payload.searchValue
            }).pipe(
              mergeMap((data) => [
                selectTaskEvents.hyperParamSelectedInfoExperiments({
                  col: action.payload.col,
                  values: data.values.filter(x => !!x),
                  loadMore: store.hyperParamsFiltersPage() > 0
                }),
                viewEvents.deactivateLoader({endpoint: action.type})
              ]),
              catchError(error => [
                viewEvents.requestFailed(error),
                viewEvents.deactivateLoader({endpoint: action.type})
              ])
            );
          })
        )
    })
  )
);
