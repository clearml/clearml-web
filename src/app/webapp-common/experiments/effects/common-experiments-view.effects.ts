import {inject, Injectable} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {Action, Store} from '@ngrx/store';
import {cloneDeep, flatten, get, isEqual} from 'lodash-es';
import {EMPTY, iif, interval, Observable, of} from 'rxjs';
import {
  auditTime,
  catchError,
  debounce,
  debounceTime,
  expand,
  filter,
  map,
  mergeMap,
  reduce,
  switchMap,
  tap
} from 'rxjs/operators';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {GET_ALL_QUERY_ANY_FIELDS, INITIAL_EXPERIMENT_TABLE_COLS} from '~/features/experiments/experiments.consts';
import {experimentsView, selectSelectedExperiment} from '~/features/experiments/reducers';
import {excludeTypes, EXPERIMENTS_TABLE_COL_FIELDS} from '~/features/experiments/shared/experiments.const';
import {requestFailed} from '../../core/actions/http.actions';
import {activeLoader, addMessage, deactivateLoader, setServerError} from '../../core/actions/layout.actions';
import {setURLParams} from '../../core/actions/router.actions';
import {
  selectIsArchivedMode,
  selectIsDeepMode,
  selectRouterProjectId,
  selectSelectedProjectId,
  selectShowHidden
} from '../../core/reducers/projects.reducer';
import {selectRouterConfig, selectRouterParams} from '../../core/reducers/router-reducer';
import {FilterMetadata} from 'primeng/api';
import {ISmCol} from '../../shared/ui-components/data/table/table.consts';
import {addMultipleSortColumns, getRouteFullUrl} from '../../shared/utils/shared-utils';
import {
  createFiltersFromStore,
  decodeHyperParam,
  encodeColumns,
  encodeOrder,
  excludedKey,
  getTagsFilters,
  TableFilter
} from '../../shared/utils/tableParamEncode';
import {autoRefreshExperimentInfo, getExperimentInfo} from '../actions/common-experiments-info.actions';
import * as exActions from '../actions/common-experiments-view.actions';
import {
  getSelectedExperiments,
  setActiveParentsFilter,
  setParents,
  setSelectedExperiments,
  updateManyExperiment
} from '../actions/common-experiments-view.actions';
import {ITableExperiment} from '../shared/common-experiment-model.model';
import {EXPERIMENTS_PAGE_SIZE} from '../shared/common-experiments.const';
import {convertStopToComplete} from '../shared/common-experiments.utils';
import {sortByField} from '../../tasks/tasks.utils';
import {MODEL_TAGS} from '../../models/shared/models.const';
import {emptyAction} from '~/app.constants';
import {
  selectExperimentsHiddenTableCols,
  selectExperimentsMetricsCols,
  selectExperimentsMetricsColsForProject,
  selectExperimentsTableCols,
  selectExperimentsTableColsOrder,
  selectExperimentsTableFilters,
  selectGlobalFilter,
  selectHyperParamsFiltersPage,
  selectSelectedExperiments,
  selectShowAllSelectedIsActive,
  selectTableRefreshList, selectTableSortFields,
  selectExperimentsList, selectTableFilters, selectTableMode, selectCurrentScrollId
} from '../reducers';
import {ProjectsGetTaskParentsResponse} from '~/business-logic/model/projects/projectsGetTaskParentsResponse';
import {ProjectsGetTaskParentsRequest} from '~/business-logic/model/projects/projectsGetTaskParentsRequest';
import {SearchState} from '../../common-search/common-search.reducer';
import {SortMeta} from 'primeng/api';
import {hasValue} from '../../shared/utils/helpers.util';
import {ProjectsGetHyperParametersResponse} from '~/business-logic/model/projects/projectsGetHyperParametersResponse';
import {
  CountAvailableAndIsDisableSelectedFiltered,
  MenuItems,
  selectionDisabledAbort,
  selectionDisabledAbortAllChildren,
  selectionDisabledArchive,
  selectionDisabledContinue,
  selectionDisabledDelete,
  selectionDisabledDequeue,
  selectionDisabledEnqueue,
  selectionDisabledMoveTo, selectionDisabledPipelineRun,
  selectionDisabledPublishExperiments,
  selectionDisabledQueue,
  selectionDisabledReset,
  selectionDisabledRetry,
  selectionDisabledTags,
  selectionDisabledViewWorker
} from '../../shared/entity-page/items.utils';
import {MINIMUM_ONLY_FIELDS} from '../experiment.consts';
import {ProjectsGetHyperparamValuesResponse} from '~/business-logic/model/projects/projectsGetHyperparamValuesResponse';
import {TasksGetAllExResponse} from '~/business-logic/model/tasks/tasksGetAllExResponse';
import {
  selectCompareAddTableFilters,
  selectIsCompare,
  selectIsDatasets,
  selectIsPipelines,
  selectViewArchivedInAddTable
} from '../../experiments-compare/reducers';
import {
  compareAddDialogTableSortChanged,
  compareAddTableClearAllFilters,
  compareAddTableFilterChanged,
  compareAddTableFilterInit,
  setAddTableViewArchived as setCompareAddTableViewArchived
} from '../../experiments-compare/actions/compare-header.actions';
import {TaskTypeEnum} from '~/business-logic/model/tasks/taskTypeEnum';
import {downloadForGetAll, getFilteredUsers, setProjectUsers} from '@common/core/actions/projects.actions';
import {selectActiveWorkspaceReady} from '~/core/reducers/view.reducer';
import {escapeRegex} from '@common/shared/utils/escape-regex';
import {MESSAGES_SEVERITY, rootProjectsPageSize} from '@common/constants';
import {modelExperimentsTableFilterChanged} from '@common/models/actions/models-info.actions';
import {ApiOrganizationService} from '~/business-logic/api-services/organization.service';
import {INITIAL_CONTROLLER_TABLE_COLS} from '@common/pipelines-controller/controllers.consts';
import {prepareColsForDownload} from '@common/shared/utils/download';
import {TasksGetAllExRequest} from '~/business-logic/model/tasks/tasksGetAllExRequest';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {ApiEventsService} from '~/business-logic/api-services/events.service';
import {EventTypeEnum} from '~/business-logic/model/events/eventTypeEnum';
import {EventsGetMultiTaskMetricsResponse} from '~/business-logic/model/events/eventsGetMultiTaskMetricsResponse';
import {TasksCreateResponse} from '~/business-logic/model/tasks/tasksCreateResponse';
import {ErrorService} from '@common/shared/services/error.service';
import * as menuActions from '@common/experiments/actions/common-experiments-menu.actions';
import {TasksCreateRequest} from '~/business-logic/model/tasks/tasksCreateRequest';
import * as actions from '@common/experiments/actions/common-experiments-view.actions';
import {UserPreferences} from '@common/user-preferences';
import {cloneExperiment} from '@common/experiments/actions/common-experiments-menu.actions';
import {selectModelExperimentsTableFilters} from '@common/models/reducers';


@Injectable()
export class CommonExperimentsViewEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private apiTasks = inject(ApiTasksService);
  private projectsApi = inject(ApiProjectsService);
  private eventsApi = inject(ApiEventsService);
  private router = inject(Router);
  private orgApi = inject(ApiOrganizationService);
  private errService = inject(ErrorService);
  private route = inject(ActivatedRoute);
  private userPreferences = inject(UserPreferences);

  activeLoader = createEffect(() => this.actions$.pipe(
    ofType(
      exActions.getNextExperiments, exActions.getExperiments, exActions.globalFilterChanged,
      compareAddDialogTableSortChanged, compareAddTableFilterChanged, setCompareAddTableViewArchived,
      compareAddTableClearAllFilters, exActions.selectAllExperiments, exActions.getCustomMetrics
    ),
    filter((action) => !(action as ReturnType<typeof exActions.refreshExperiments>).hideLoader),
    map(action => activeLoader(action.type))
  ));

  private getPathsFromAction(action): string[] {
    switch (action.type) {
      case actions.setTableSort.type:
      case actions.resetSortOrder.type:
        return [`experiments.view.projectColumnsSortOrder.${action.projectId}`];
      case actions.clearHyperParamsCols.type:
        return [
          `experiments.view.projectColumnsSortOrder.${action.projectId}`,
          `experiments.view.metricsCols.${action.projectId}`
        ];
      case actions.setExtraColumns.type:
        return [`experiments.view.metricsCols.${action.projectId}`];
      case actions.removeCol.type:
        return [
          `experiments.view.projectColumnsSortOrder.${action.projectId}`,
          `experiments.view.metricsCols.${action.projectId}`,
          `experiments.view.projectColumnsWidth.${action.projectId}`,
          `experiments.view.colsOrder.${action.projectId}`
        ];
      case actions.addColumn.type:
        return [
          `experiments.view.hiddenProjectTableCols.${action.projectId}`,
          `experiments.view.metricsCols.${action.projectId}`
        ];
      case actions.setTableFilters.type:
        return [`experiments.view.projectColumnFilters.${action.projectId}`];
      case actions.setColumnWidth.type:
        return [`experiments.view.projectColumnsWidth.${action.projectId}`];
      case actions.toggleColHidden.type:
      case actions.setVisibleColumnsForProject.type:
        return [`experiments.view.hiddenProjectTableCols.${action.projectId}`];
      case actions.setColsOrderForProject.type:
        return [`experiments.view.colsOrder.${action.projectId}`];
      case cloneExperiment.type:
        return ['experiments.view.cloneForceParent'];
    }
    return [];
  }

  setUserPreferences = createEffect(() => this.actions$.pipe(
    ofType(actions.setTableSort, actions.clearHyperParamsCols, actions.resetSortOrder, actions.setExtraColumns,
      actions.removeCol, actions.addColumn, actions.setTableFilters, actions.setColumnWidth, actions.toggleColHidden,
      actions.setColsOrderForProject, actions.setVisibleColumnsForProject, cloneExperiment),
    concatLatestFrom(() => this.store.select(experimentsView)),
    map(([action, state]) => {
      const paths = this.getPathsFromAction(action);
      paths.forEach(path => this.userPreferences.setPreferences(path, get(state, path.split('.').slice(2).join('.'))));
    })), {dispatch: false});

  tableSortChange = createEffect(() => this.actions$.pipe(
    ofType(exActions.tableSortChanged),
    concatLatestFrom(() => this.store.select(selectTableSortFields)),
    switchMap(([action, oldOrders]) => {
      const orders = addMultipleSortColumns(oldOrders, action.colId, action.isShift);
      return [setURLParams({orders, update: true})];
    })
  ));

  tableFilterChange = createEffect(() => this.actions$.pipe(
    ofType(exActions.tableFilterChanged),
    concatLatestFrom(() => this.store.select(selectTableFilters)),
    switchMap(([action, oldFilters]) =>
      [setURLParams({
        filters: {
          ...oldFilters,
          ...action.filters.reduce((acc, updatedFilter) => {
            acc[updatedFilter.col] = {value: updatedFilter.value, matchMode: updatedFilter.filterMatchMode};
            return acc;
          }, {} as Record<string, FilterMetadata>)
        }, update: true
      })]
    )
  ));

  private refreshActions = [];

  prepareTableForDownload = createEffect(() => this.actions$.pipe(
      ofType(exActions.prepareTableForDownload),
      concatLatestFrom(() => [
        this.store.select(selectRouterParams).pipe(map(params => params?.projectId)),
        this.store.select(selectIsArchivedMode),
        this.store.select(selectGlobalFilter),
        this.store.select(selectTableSortFields),
        this.store.select(selectTableFilters),
        this.store.select(selectSelectedExperiments),
        this.store.select(selectShowAllSelectedIsActive),
        this.store.select(selectExperimentsTableCols),
        this.store.select(selectExperimentsMetricsColsForProject),
        this.store.select(selectIsDeepMode),
        this.store.select(selectShowHidden),
        this.store.select(selectIsCompare),
        this.store.select(selectViewArchivedInAddTable),
        this.store.select(selectIsPipelines),
        this.store.select(selectIsDatasets)
      ]),
      switchMap(([
                   , projectId, isArchived, gb, orderFields, filters, selectedExperiments,
                   showAllSelectedIsActive, cols, metricCols, deep, showHidden, isCompare, showArcived,
                   isPipeline, isDataset
                 ]) => {
          const tableFilters = cloneDeep(filters) || {} as Record<string, FilterMetadata>;
          if (tableFilters && tableFilters.status && tableFilters.status.value.includes('completed')) {
            tableFilters.status.value.push('closed');
          }
          const selectedIds = showAllSelectedIsActive ? selectedExperiments.map(exp => exp.id) : [];
          return this.orgApi.organizationPrepareDownloadForGetAll({
            entity_type: 'task', only_fields: [],
            field_mappings: prepareColsForDownload(cols.concat(metricCols)),
            ...this.getGetAllQuery({
              projectId,
              searchQuery: gb,
              archived: isArchived,
              orderFields,
              tableFilters,
              selectedIds,
              cols,
              metricCols,
              deep,
              showHidden,
              isCompare,
              showArchived: isCompare && showArcived,
              isPipeline,
              isDataset
            })
          })
            .pipe(
              map((res) => downloadForGetAll({prepareId: res.prepare_id})),
              catchError(error => [requestFailed(error)])
            );
        }
      )
    )
  );

  reFetchExperiment = createEffect(() => this.actions$.pipe(
    ofType(
      exActions.getExperiments, exActions.getExperimentsWithPageSize, exActions.globalFilterChanged,
      exActions.setTableSort, exActions.tableFilterChanged, exActions.setTableFilters, exActions.showOnlySelected,
      compareAddDialogTableSortChanged, compareAddTableFilterChanged, compareAddTableFilterInit,
      compareAddTableClearAllFilters, setCompareAddTableViewArchived, modelExperimentsTableFilterChanged
    ),
    tap(action => this.refreshActions.push(action.type)),
    switchMap((action) => this.store.select(selectActiveWorkspaceReady).pipe(
      filter(ready => ready),
      map(() => action))),
    auditTime(50),
    switchMap((action) => this.fetchExperiments$(null, true, action.type === modelExperimentsTableFilterChanged.type, (action as ReturnType<typeof exActions.getExperimentsWithPageSize>).pageSize as number)
      .pipe(
        mergeMap(res => {
          res.tasks = convertStopToComplete(res.tasks);
          const deactivate = this.refreshActions.map(a => deactivateLoader(a));
          this.refreshActions = [];
          return [
            exActions.setNoMoreExperiments({hasMore: (res.tasks.length < EXPERIMENTS_PAGE_SIZE)}),
            exActions.setExperiments({experiments: res.tasks as ITableExperiment[]}),
            exActions.setCurrentScrollId({scrollId: res.scroll_id}),
            ...deactivate
          ];
        }),
        catchError(error => [
          requestFailed(error),
          deactivateLoader(action.type),
          addMessage('warn', 'Fetch Tasks failed', error?.meta && [{
            name: 'More info',
            actions: [setServerError(error, null, 'Fetch Tasks failed')]
          }])
        ])
      )
    )
  ));

  lockRefresh = false;
  refreshExperiments = createEffect(() => this.actions$.pipe(
    ofType(exActions.refreshExperiments),
    filter(() => !this.lockRefresh),
    concatLatestFrom(() => [
      this.store.select(selectCurrentScrollId),
      this.store.select(selectSelectedExperiment),
      this.store.select(selectExperimentsList),
      this.store.select(selectTableRefreshList)
    ]),
    switchMap(([action, currentScrollId, selectedExperiment, experiments, refreshPending]) => {
        this.lockRefresh = !action.autoRefresh;
        return this.fetchExperiments$(currentScrollId, true)
          .pipe(
            mergeMap(res => {
              res.tasks = convertStopToComplete(res.tasks);
              this.lockRefresh = false;
              const actions: Action[] = [deactivateLoader(action.type)];
              if (refreshPending) {
                return [
                  exActions.getExperimentsWithPageSize({pageSize: experiments.length}),
                  exActions.setTableRefreshPending({refresh: false}),
                  deactivateLoader(action.type)
                ];
              }
              if (res.scroll_id !== currentScrollId && currentScrollId) {
                actions.push(
                  exActions.setCurrentScrollId({scrollId: res.scroll_id}),
                  exActions.setNoMoreExperiments({hasMore: (res.tasks.length < EXPERIMENTS_PAGE_SIZE)}));
                if (!action.autoRefresh) {
                  actions.push(
                    addMessage(MESSAGES_SEVERITY.WARN, 'Session expired'),
                    exActions.setTableRefreshPending({refresh: true}));
                }
              }
              if (action.autoRefresh || res.scroll_id === currentScrollId) {
                if (selectedExperiment && isEqual(experiments.map(exp => exp.id).sort(), res.tasks.map(exp => exp.id).sort())) {
                  actions.push(exActions.setExperimentInPlace({experiments: res.tasks as ITableExperiment[]}));
                } else {
                  // SetExperiments must be before GetExperimentInfo!
                  actions.push(exActions.setExperiments({
                    experiments: res.tasks as ITableExperiment[],
                    noPreferences: true
                  }));
                }
              }
              if (selectedExperiment) {
                if (action.autoRefresh) {
                  actions.push(autoRefreshExperimentInfo({id: selectedExperiment.id}));
                } else {
                  // SetExperiments must be before GetExperimentInfo!
                  actions.push(getExperimentInfo({id: selectedExperiment.id, autoRefresh: null}));
                }
              }
              return actions;
            }),
            catchError(error => {
              this.lockRefresh = false;
              return [
                requestFailed(error),
                deactivateLoader(action.type),
                ...(action.autoRefresh ? [] : [addMessage('warn', 'Fetch Tasks failed', error?.meta && [{
                  name: 'More info',
                  actions: [setServerError(error, null, 'Fetch Tasks failed')]
                }])])
              ];
            })
          );
      }
    )
  ));

  getNextExperiments = createEffect(() => this.actions$.pipe(
    ofType(exActions.getNextExperiments),
    concatLatestFrom(() => [
      this.store.select(selectCurrentScrollId),
      this.store.select(selectExperimentsList),
      this.store.select(selectTableRefreshList)
    ]),
    switchMap(([action, scrollId, tasks, refreshPending]) => this.fetchExperiments$(scrollId, false, action.allProjects)
      .pipe(
        mergeMap(res => {
          if (refreshPending) {
            return [
              exActions.getExperimentsWithPageSize({pageSize: tasks.length}),
              exActions.setTableRefreshPending({refresh: false}),
              deactivateLoader(action.type)
            ];
          }
          res.tasks = convertStopToComplete(res.tasks);
          const addTasksAction = scrollId === res.scroll_id || !scrollId
            ? [exActions.addExperiments({experiments: res.tasks as ITableExperiment[]})]
            : [exActions.setTableRefreshPending({refresh: true}), addMessage(MESSAGES_SEVERITY.WARN, 'Session expired')];

          return [
            exActions.setNoMoreExperiments({hasMore: (res.tasks.length < EXPERIMENTS_PAGE_SIZE)}),
            ...addTasksAction,
            exActions.setCurrentScrollId({scrollId: res.scroll_id}),
            deactivateLoader(action.type)
          ];
        }),
        catchError(error => [
          requestFailed(error),
          deactivateLoader(action.type),
          addMessage('warn', 'Fetch Tasks failed', error?.meta && [{
            name: 'More info',
            actions: [setServerError(error, null, 'Fetch Tasks failed')]
          }])
        ])
      )
    )
  ));

  experimentSelectionChanged = createEffect(() => this.actions$.pipe(
    ofType(exActions.experimentSelectionChanged),
    concatLatestFrom(() => this.store.select(selectRouterConfig)),
    tap(([action, routeConfig]) =>
      this.navigateAfterExperimentSelectionChanged(action.experiment as ITableExperiment, action.project, routeConfig, action.replaceURL)),
    mergeMap(() => [exActions.setTableMode({mode: 'info'})])
  ));

  selectNextExperimentEffect = createEffect(() => this.actions$.pipe(
    ofType(exActions.selectNextExperiment),
    concatLatestFrom(() => [
      this.store.select(selectRouterConfig),
      this.store.select(selectExperimentsList),
      this.store.select(selectRouterParams).pipe(map(params => params?.projectId)),
      this.store.select(selectTableMode)
    ]),
    filter(([, , , , tableMode]) => tableMode === 'info'),
    tap(([, routeConfig, tasks, projectId]) => this.navigateAfterExperimentSelectionChanged(tasks[0] as ITableExperiment, projectId, routeConfig, true)),
    mergeMap(([, , , , tableMode]) => [exActions.setTableMode({mode: tableMode}), exActions.setSelectedExperiments({experiments: []})])
  ));

  selectNextExperimentEffectForCompareView = createEffect(() => this.actions$.pipe(
    ofType(exActions.selectNextExperiment),
    debounceTime(500),
    concatLatestFrom(() => [
      this.store.select(selectRouterConfig),
      this.store.select(selectRouterParams).pipe(map(params => params?.projectId)),
      this.store.select(selectTableMode)
    ]),
    filter(([, , , tableMode]) => tableMode === 'compare'),
    tap(([, routeConfig, projectId]) => {
      const url = routeConfig.map(conf => conf === ':projectId' ? projectId : conf);
      setTimeout(() => this.router.navigate([...url, {ids: []}], {queryParamsHandling: 'preserve'}));
    }),
    map(() => exActions.setSelectedExperiments({experiments: []}))
  ));

  getTypesEffect = createEffect(() => this.actions$.pipe(
    ofType(exActions.getProjectTypes),
    concatLatestFrom(() =>
      this.store.select(selectRouterParams).pipe(map(params => params?.projectId))
    ),
    switchMap(([action, projectId]) =>
      this.apiTasks.tasksGetTypes({projects: (action.allProjects || projectId === '*' ? [] : [projectId])}).pipe(
        concatLatestFrom(() => this.store.select(selectTableFilters)),
        mergeMap(([res, tableFilters]) => {
          let shouldFilterFilters: boolean;
          let filteredTableFilter = {} as TableFilter;
          if (tableFilters?.type?.value) {
            filteredTableFilter = {
              col: 'type',
              value: tableFilters.type.value.filter(filterType => res.types.includes(filterType))
            };
            shouldFilterFilters = filteredTableFilter.value.length !== tableFilters.type.value.length;
          }
          return [
            shouldFilterFilters ? exActions.tableFilterChanged({
              filters: [filteredTableFilter],
              projectId
            }) : emptyAction(),
            exActions.setProjectsTypes(res),
            deactivateLoader(action.type)
          ];
        }),
        catchError(error => [
          requestFailed(error),
          deactivateLoader(action.type),
          addMessage('warn', 'Fetch types failed', error?.meta && [{
            name: 'More info',
            actions: [setServerError(error, null, 'Fetch types failed')]
          }])]
        )
      ))));

  getUsersEffect = createEffect(() => this.actions$.pipe(
    ofType(setProjectUsers),
    concatLatestFrom(() => this.isModel() ?
      this.store.select(selectModelExperimentsTableFilters) :
      this.isCompare() ?
        this.store.select(selectCompareAddTableFilters) :
        this.store.select(selectExperimentsTableFilters)
    ),
    map(([action, filters]) => {
      const userFiltersValue = filters?.[EXPERIMENTS_TABLE_COL_FIELDS.USER]?.value ?? [];
      const resIds = action.users.map(user => user.id);
      const shouldGetFilteredUsersNames = !(userFiltersValue.every(id => resIds.includes(id)));
      return shouldGetFilteredUsersNames ? getFilteredUsers({filteredUsers: userFiltersValue}) : emptyAction();
    }),
    catchError(error => [
      requestFailed(error),
      addMessage('warn', 'Fetch users failed', error?.meta && [{
        name: 'More info',
        actions: [setServerError(error, null, 'Fetch users failed')]
      }])]
    )
  ));

  getParentsEffect = createEffect(() => this.actions$.pipe(
    ofType(exActions.getParents),
    debounceTime(300),
    concatLatestFrom(() => [
      this.store.select(selectRouterParams).pipe(map(params => params?.projectId)),
      this.store.select(selectIsArchivedMode)
    ]),
    switchMap(([action, projectId, isArchive]) => this.projectsApi.projectsGetTaskParents({
      projects: (projectId === '*' || action.allProjects) ? [] : [projectId],
      tasks_state: isArchive ?
        ProjectsGetTaskParentsRequest.TasksStateEnum.Archived :
        ProjectsGetTaskParentsRequest.TasksStateEnum.Active,
      ...(action.searchValue && {task_name: `(?i)${action.searchValue}`}) // (?i) is case insensitive
    }).pipe(
      concatLatestFrom(() => this.store.select(selectTableFilters).pipe(map(filters => filters?.['parent.name']?.value || []))),
      mergeMap(([{parents}, filteredParentIds]: [ProjectsGetTaskParentsResponse, string[]]) => {
        const missingParentsIds = filteredParentIds.filter(parentId => !parents.find(parent => parent.id === parentId));
        return (missingParentsIds.length ? this.apiTasks.tasksGetAllEx({
          id: missingParentsIds,
          only_fields: ['name', 'project.name']
        }) : of({tasks: []})).pipe(
          mergeMap((parentsTasks) => [
            setActiveParentsFilter({parents: parentsTasks.tasks || []}),
            setParents({parents: parents})])
        );
      }),
      catchError(error => [
          requestFailed(error),
          addMessage('warn', 'Fetch parents failed', error?.meta && [{
            name: 'More info',
            actions: [setServerError(error, null, 'Fetch parents failed')]
          }])
        ]
      )
    ))
  ));

  getCustomMetrics = createEffect(() => this.actions$.pipe(
    ofType(exActions.getCustomMetrics),
    concatLatestFrom((action) => [
      this.store.select(selectRouterParams).pipe(map(params => action.projectId ?? params?.projectId)),
      this.store.select(selectIsDeepMode)
    ]),
    switchMap(([action, projectId, isDeep]) => this.projectsApi.projectsGetUniqueMetricVariants({
        project: projectId === '*' ? null : projectId,
        include_subprojects: isDeep
      })
        .pipe(
          mergeMap(res => [
            exActions.setCustomMetrics({metrics: sortByField(res.metrics, 'metric'), projectId, compareView: EventTypeEnum.TrainingStatsScalar}),
            deactivateLoader(action.type)
          ]),
          catchError(error => [
            requestFailed(error),
            deactivateLoader(action.type),
            addMessage('warn', 'Fetch custom metrics failed', error?.meta && [{
              name: 'More info',
              actions: [setServerError(error, null, 'Fetch custom metrics failed')]
            }]),
            exActions.setCustomHyperParams({params: []})])
        )
    )
  ));

  getCustomMetricsPerType = createEffect(() => this.actions$.pipe(
    ofType(exActions.getCustomMetricsPerType),
    concatLatestFrom(() => [
      this.store.select(selectRouterParams).pipe(map(params => params?.projectId))
    ]),
    switchMap(([action, projectId]) => {
        if (action.ids.length > 0) {
          return this.eventsApi.eventsGetMultiTaskMetrics({
            tasks: action.ids,
            ...(action.metricsType && {event_type: action.metricsType}),
            model_events: action.isModel
          })
            .pipe(
              map((res: EventsGetMultiTaskMetricsResponse) => [
                // {metric: singleValueChartTitle, variant: '', metric_hash: singleValueChartTitle, variant_hash: singleValueChartTitle},
                ...res.metrics.map(metric => metric.variants.map(variant => (
                  {metric: metric.metric.replace(/^Summary$/, ' Summary'), metric_hash: metric.metric, variant: variant, variant_hash: variant}))).flat(1)
              ] as MetricVariantResult[]),
              mergeMap(metrics => [
                exActions.setCustomMetrics({metrics: sortByField(metrics, 'metric'), projectId, compareView: action.metricsType}),
                deactivateLoader(action.type)
              ]),
              catchError(error => [
                requestFailed(error),
                deactivateLoader(action.type),
                addMessage('warn', 'Fetch custom metrics failed', error?.meta && [{
                  name: 'More info',
                  actions: [setServerError(error, null, 'Fetch custom metrics failed')]
                }]),
                exActions.setCustomHyperParams({params: []})])
            );
        } else {
          return of(action)
            .pipe(map((action) => exActions.setCustomMetrics({metrics: [], projectId, compareView: action.metricsType})));
        }
      }
    )));

  getCustomHyperParams = createEffect(() => this.actions$.pipe(
    ofType(exActions.getCustomHyperParams),
    concatLatestFrom(() => [
      this.store.select(selectRouterParams).pipe(map(params => params?.projectId)),
      this.store.select(selectIsDeepMode)
    ]),
    switchMap(([action, projectId, isDeep]) => this.projectsApi.projectsGetHyperParameters({
        project: projectId === '*' ? null : projectId,
        page_size: 5000,
        include_subprojects: isDeep
      })
        .pipe(
          mergeMap((res: ProjectsGetHyperParametersResponse) => [
            exActions.setCustomHyperParams({params: res.parameters}),
            deactivateLoader(action.type)
          ]),
          catchError(error => [
            requestFailed(error),
            deactivateLoader(action.type),
            addMessage('warn', 'Fetch hyperparameters failed', error?.meta && [{
              name: 'More info',
              actions: [setServerError(error, null, 'Fetch hyperparameters failed')]
            }]),
            exActions.setCustomHyperParams({params: []})])
        )
    )
  ));

  hyperParameterMenuClicked = createEffect(() => this.actions$.pipe(
    ofType(exActions.hyperParamSelectedExperiments),
    debounce((action) => interval(action.searchValue ? 300 : 0)),
    concatLatestFrom(() => [
      this.store.select(selectIsDeepMode),
      this.store.select(selectRouterProjectId),
      this.store.select(selectIsCompare),
      this.store.select(selectHyperParamsFiltersPage)
    ]),
    switchMap(([action, isDeep, selectedProjectId, isCompare, page]) => {
      const projectId = action.col.projectId || selectedProjectId;
      const {section, name} = decodeHyperParam(action.col);
      return this.projectsApi.projectsGetHyperparamValues({
        include_subprojects: isDeep,
        section,
        name,
        ...((!isCompare && projectId !== '*') && {projects: [projectId]}),
        page,
        page_size: rootProjectsPageSize,
        pattern: escapeRegex(action.searchValue)
      }).pipe(
        map((data: ProjectsGetHyperparamValuesResponse) => {
          const values = data.values.filter(x => hasValue(x) && x !== '');
          return exActions.hyperParamSelectedInfoExperiments({col: action.col, values, loadMore: page > 0});
        })
      );
    })
  ));

  selectAll = createEffect(() => this.actions$.pipe(
    ofType(exActions.selectAllExperiments),
    concatLatestFrom(() => [
      this.store.select(selectRouterParams).pipe(map(params => params?.projectId)),
      this.store.select(selectIsArchivedMode),
      this.store.select(selectGlobalFilter),
      this.store.select(selectExperimentsTableCols),
      this.store.select(selectExperimentsMetricsColsForProject),
      this.store.select(selectTableFilters),
      this.store.select(selectIsDeepMode),
      this.store.select(selectShowHidden),
      this.store.select(selectIsPipelines),
      this.store.select(selectIsDatasets)
    ]),
    switchMap(([
                 action, projectId, archived, globalSearch, cols, metricCols,
                 tableFilters, deep, showHidden, isPipeline, isDataset
               ]) => {
      const pageSize = 5000;
      const query = this.getGetAllQuery({
        projectId,
        searchQuery: globalSearch,
        archived,
        cols,
        metricCols,
        tableFilters: action.filtered ? tableFilters : {},
        orderFields: [{order: -1, field: EXPERIMENTS_TABLE_COL_FIELDS.LAST_UPDATE}],
        deep,
        showHidden,
        pageSize,
        isPipeline,
        isDataset
      });
      query.only_fields = [EXPERIMENTS_TABLE_COL_FIELDS.NAME, EXPERIMENTS_TABLE_COL_FIELDS.PARENT,
        EXPERIMENTS_TABLE_COL_FIELDS.STATUS, EXPERIMENTS_TABLE_COL_FIELDS.TYPE, 'company.id', 'system_tags'];
      return this.apiTasks.tasksGetAllEx(query).pipe(
        expand((res: TasksGetAllExResponse) => res.tasks.length === pageSize ? this.apiTasks.tasksGetAllEx({
          ...query,
          scroll_id: res.scroll_id
        }) : EMPTY),
        reduce((acc, res) => acc.concat(res.tasks), [])
      );
    }),
    switchMap(experiments => [exActions.setSelectedExperiments({experiments}), deactivateLoader(exActions.selectAllExperiments.type)]),
    catchError(error => [
      requestFailed(error),
      deactivateLoader(exActions.selectAllExperiments.type),
      setServerError(error, null, 'Fetch tasks for selection failed')
    ])
  ));

  getSelectedExperiments = createEffect(() => this.actions$.pipe(
    ofType(getSelectedExperiments),
    concatLatestFrom(() => [
      this.store.select(selectSelectedExperiments),
      this.store.select(selectExperimentsList)
    ]),
    mergeMap(([action, selectedExperiments, experiments]) =>
      iif(() => selectedExperiments.length > 0,
        [setSelectedExperiments({experiments: selectedExperiments.slice(0, 100)})],
        iif(() => {
            const experimentsFromStore = experiments.filter(entity => action.ids.includes(entity.id));
            return experimentsFromStore.length === action.ids.length;
          },
          [setSelectedExperiments({experiments: experiments.filter(entity => action.ids.includes(entity.id)).slice(0, 100)})],
          this.apiTasks.tasksGetAllEx({id: action.ids}).pipe(
            map(res => setSelectedExperiments({experiments: res.tasks}))
          ))))
  ));

  setURLParams = createEffect(() => this.actions$.pipe(
    ofType(exActions.updateUrlParams, exActions.toggleColHidden),
    concatLatestFrom(() => [
      this.store.select(selectRouterParams).pipe(map(params => params?.projectId)),
      this.store.select(selectGlobalFilter),
      this.store.select(selectTableSortFields),
      this.isModel() ?
        this.store.select(selectModelExperimentsTableFilters) :
        this.isCompare() ?
          this.store.select(selectCompareAddTableFilters) :
          this.store.select(selectExperimentsTableFilters),
      this.store.select(selectExperimentsTableCols),
      this.store.select(selectExperimentsHiddenTableCols),
      this.store.select(selectExperimentsMetricsCols),
      this.store.select(selectExperimentsTableColsOrder),
      this.store.select(selectIsDeepMode),
      this.route.queryParams
    ]),
    map(([, projectId, , sortFields, filters,
           cols, hiddenCols, metricsCols, colsOrder, isDeep, queryParams
         ]) => {
      const columns = encodeColumns(cols, hiddenCols, metricsCols[projectId], colsOrder ? colsOrder : queryParams.columns);
      return setURLParams({
        columns,
        filters,
        orders: sortFields,
        isDeep,
        update: true
      });
    })
  ));

  navigateAfterExperimentSelectionChanged(selectedExperiment: ITableExperiment, experimentProject: string, routeConfig: string[], replaceUrl = false) {
    const module = routeConfig.includes('datasets') ? 'datasets/simple' : routeConfig.includes('pipelines') ? 'pipelines' : 'projects';
    // wow angular really suck...
    const activeChild = this.route?.firstChild?.firstChild?.firstChild?.firstChild?.firstChild?.firstChild?.firstChild;
    const activeChildUrl = activeChild && module === 'projects' && !routeConfig.includes('compare') ? getRouteFullUrl(activeChild) : '';
    if (selectedExperiment) {
      this.router.navigate(
        [module, experimentProject, 'tasks', selectedExperiment.id].concat(activeChildUrl ? activeChildUrl.split('/') : []),
        {queryParamsHandling: 'preserve'}
      );
    } else {
      this.router.navigate([module, experimentProject, 'tasks'], {
        queryParamsHandling: 'preserve',
        replaceUrl
      });
    }
  }

  getGetAllQuery({
                   refreshScroll = false,
                   scrollId = null,
                   projectId,
                   searchQuery,
                   archived,
                   orderFields = [],
                   tableFilters,
                   selectedIds = [],
                   cols = [],
                   metricCols = [],
                   deep = false,
                   showHidden = false,
                   isCompare,
                   showArchived = false,
                   isPipeline = false,
                   isDataset = false,
                   pageSize = EXPERIMENTS_PAGE_SIZE
                 }: {
    refreshScroll?: boolean;
    scrollId?: string;
    projectId: string;
    searchQuery?: SearchState['searchQuery'];
    archived: boolean;
    orderFields?: SortMeta[];
    tableFilters: Record<string, FilterMetadata>;
    selectedIds?: string[];
    cols?: ISmCol[];
    metricCols?: ISmCol[];
    deep?: boolean;
    showHidden?: boolean;
    isCompare?: boolean;
    showArchived?: boolean;
    isPipeline?: boolean;
    isDataset?: boolean;
    pageSize?: number;
  }): TasksGetAllExRequest {
    const projectFilter = tableFilters?.[EXPERIMENTS_TABLE_COL_FIELDS.PROJECT]?.value;
    const typeFilter = tableFilters?.[EXPERIMENTS_TABLE_COL_FIELDS.TYPE]?.value;
    const statusFilter = tableFilters?.[EXPERIMENTS_TABLE_COL_FIELDS.STATUS]?.value;
    const userFilter = tableFilters?.[EXPERIMENTS_TABLE_COL_FIELDS.USER]?.value;
    const tagsFilter = tableFilters?.[EXPERIMENTS_TABLE_COL_FIELDS.TAGS]?.value;
    const tagsFilterAnd = tableFilters?.[EXPERIMENTS_TABLE_COL_FIELDS.TAGS]?.matchMode === 'AND';
    const parentFilter = tableFilters?.[EXPERIMENTS_TABLE_COL_FIELDS.PARENT]?.value;
    const systemTags = tableFilters?.system_tags?.value as string[];

    let systemTagsFilter = (showArchived ? [] : archived ? ['__$and', MODEL_TAGS.HIDDEN] : [excludedKey, MODEL_TAGS.HIDDEN]);
    if (isDataset) {
      systemTagsFilter.push('dataset');
    } else if (!isPipeline && !showHidden) {
      systemTagsFilter = systemTagsFilter.concat([excludedKey, 'pipeline', excludedKey, 'dataset', excludedKey, 'reports']);
    }
    if (systemTags) {
      systemTagsFilter = systemTagsFilter.concat(systemTags);
    }

    let filters = createFiltersFromStore(tableFilters, true);
    const tableCols = cols.length > 0 ? cols : isDataset ? INITIAL_CONTROLLER_TABLE_COLS : INITIAL_EXPERIMENT_TABLE_COLS;
    filters = Object.keys(filters).reduce((acc, colId) => {
      const col = [...metricCols, ...tableCols].find(c => c.id === colId);
      let key = col?.getter || colId;
      if (col?.isParam && typeof col.getter === 'string') {
        key = col.getter;
      }
      if (Array.isArray(key)) {
        key = key[0];
      }
      acc[key] = filters[colId];
      return acc;
    }, {});

    orderFields = orderFields.map(field => {
      let getter;
      const col = metricCols.find(c => c.id === field.field);
      if (col?.isParam && typeof col.getter === 'string') {
        getter = col.getter;
      } else {
        getter = Array.isArray(col?.getter) ? col.getter[0] : col?.getter;
      }
      return getter ? {...field, field: getter} : field;
    });

    const colsFilters = flatten(tableCols.filter(col => col.id !== 'selected' && !col.hidden).map(col => col.getter || col.id));
    const metricColsFilters = metricCols ? flatten(metricCols.map(col => col.getter || col.id)) : [];
    const only_fields = [...new Set([...MINIMUM_ONLY_FIELDS, ...colsFilters, ...metricColsFilters]
      .concat(isPipeline || isDataset ? ['parent.name', 'runtime._pipeline_hash', 'runtime.version', 'execution.queue', 'type', 'hyperparams.properties.version'] : []))];
    delete filters['tags'];
    return {
      ...filters,
      id: selectedIds,
      ...(searchQuery?.query && {
        _any_: {
          pattern: searchQuery.regExp ? searchQuery.query : escapeRegex(searchQuery.query),
          fields: GET_ALL_QUERY_ANY_FIELDS
        }
      }),
      project: ((!filters['project.name'] && (!projectId || projectId === '*'))) ? undefined : isCompare ? ((filters['project.name'] || undefined)) : (filters['project.name'] || [projectId]),
      scroll_id: scrollId || null, // null to create new scroll (undefined doesn't generate scroll)
      refresh_scroll: refreshScroll,
      size: pageSize,
      order_by: encodeOrder(orderFields),
      status: (statusFilter && statusFilter.length > 0) ? statusFilter : undefined,
      type: isPipeline ? [TaskTypeEnum.Controller] : isDataset ? [TaskTypeEnum.DataProcessing] : (typeFilter?.length > 0) ? typeFilter : excludeTypes,
      user: (userFilter?.length > 0) ? userFilter : [],
      ...(parentFilter?.length > 0 && {parent: parentFilter}),
      ...(systemTagsFilter?.length > 0 && {system_tags: systemTagsFilter}),
      ...(tagsFilter?.length > 0 && {
        filters: {
          tags: getTagsFilters(tagsFilterAnd, tagsFilter)
        }
      }),
      include_subprojects: deep && !projectFilter,
      search_hidden: showHidden,
      only_fields
    };
  }

  fetchExperiments$(scrollId1: string, refreshScroll = false, allProjects = false, pageSize = EXPERIMENTS_PAGE_SIZE): Observable<TasksGetAllExResponse> {
    return of(scrollId1)
      .pipe(
        concatLatestFrom(() => [
          this.store.select(selectRouterProjectId),
          this.store.select(selectIsArchivedMode),
          this.store.select(selectGlobalFilter),
          this.store.select(selectTableSortFields),
          this.isModel() ?
            this.store.select(selectModelExperimentsTableFilters) :
            this.isCompare() ?
              this.store.select(selectCompareAddTableFilters) :
              this.store.select(selectExperimentsTableFilters),
          this.store.select(selectSelectedExperiments),
          this.store.select(selectShowAllSelectedIsActive),
          this.store.select(selectExperimentsTableCols),
          this.store.select(selectExperimentsMetricsColsForProject),
          this.store.select(selectIsDeepMode),
          this.store.select(selectShowHidden),
          this.store.select(selectIsCompare),
          this.store.select(selectViewArchivedInAddTable),
          this.store.select(selectIsPipelines),
          this.store.select(selectIsDatasets)
        ]),
        switchMap(([
                     scrollId, projectId, isArchived, gb, orderFields, filters, selectedExperiments,
                     showAllSelectedIsActive, cols, metricCols, deep, showHidden, isCompare, showArcived,
                     isPipeline, isDataset
                   ]) => {
          const tableFilters = cloneDeep(filters) || {} as Record<string, FilterMetadata>;
          if (tableFilters && tableFilters.status && tableFilters.status.value.includes('completed')) {
            tableFilters.status.value.push('closed');
          }
          const selectedIds = showAllSelectedIsActive ? selectedExperiments.map(exp => exp.id) : [];
          return this.apiTasks.tasksGetAllEx(this.getGetAllQuery({
            refreshScroll,
            scrollId,
            projectId: allProjects ? '*' : projectId,
            searchQuery: gb,
            archived: isArchived,
            orderFields,
            tableFilters,
            selectedIds,
            cols,
            metricCols,
            deep,
            showHidden,
            isCompare,
            showArchived: isCompare && showArcived,
            isPipeline,
            pageSize,
            isDataset
          }));
        })
      );
  }

  getTagsEffect = createEffect(() => this.actions$.pipe(
    ofType(exActions.getTags),
    concatLatestFrom(() => this.store.select(selectRouterParams).pipe(map(params => params?.projectId))),
    switchMap(([action, projectId]) => this.projectsApi.projectsGetTaskTags({
      projects: (projectId === '*' || action.allProjects) ? [] : [projectId]
    }).pipe(
      mergeMap(res => [
        exActions.setTags({tags: res.tags.concat(null)}),
        deactivateLoader(action.type)
      ]),
      catchError(error => [
        requestFailed(error),
        deactivateLoader(action.type),
        addMessage('warn', 'Fetch tags failed', error?.meta && [{
          name: 'More info',
          actions: [setServerError(error, null, 'Fetch tags failed')]
        }])]
      )
    ))
  ));

  setSelectedExperiments = createEffect(() => this.actions$.pipe(
      ofType(exActions.setSelectedExperiments, exActions.updateExperiment, updateManyExperiment.type),
      concatLatestFrom(() =>
        this.store.select(selectSelectedExperiments)
      ),
      switchMap(([action, selectSelectedExperiments]) => {
        const experiments = action.type === exActions.setSelectedExperiments.type ?
          (action as ReturnType<typeof exActions.setSelectedExperiments>).experiments : selectSelectedExperiments;
        const selectedExperimentsDisableAvailable: Record<string, CountAvailableAndIsDisableSelectedFiltered> = {
          [MenuItems.abort]: selectionDisabledAbort(experiments),
          [MenuItems.abortAllChildren]: selectionDisabledAbortAllChildren(experiments),
          [MenuItems.publish]: selectionDisabledPublishExperiments(experiments),
          [MenuItems.reset]: selectionDisabledReset(experiments),
          [MenuItems.delete]: selectionDisabledDelete(experiments),
          [MenuItems.moveTo]: selectionDisabledMoveTo(experiments),
          [MenuItems.continue]: selectionDisabledContinue(experiments),
          [MenuItems.enqueue]: selectionDisabledEnqueue(experiments),
          [MenuItems.retry]: selectionDisabledRetry(experiments),
          [MenuItems.dequeue]: selectionDisabledDequeue(experiments),
          [MenuItems.queue]: selectionDisabledQueue(experiments),
          [MenuItems.viewWorker]: selectionDisabledViewWorker(experiments),
          [MenuItems.archive]: selectionDisabledArchive(experiments),
          [MenuItems.tags]: selectionDisabledTags(experiments),
          [MenuItems.run]: selectionDisabledPipelineRun(experiments)
        };
        //allHasExamples: selectionAllExamples(action.experiments),
        // allArchive: selectionAllIsArchive(action.experiments),
        return [exActions.setSelectedExperimentsDisableAvailable({selectedExperimentsDisableAvailable})];
      })
    )
  );

  createExperiment = createEffect(() => {
    return this.actions$.pipe(
      ofType(exActions.createExperiment),
      concatLatestFrom(() => this.store.select(selectSelectedProjectId)),
      switchMap(([action, projectId]) => this.apiTasks.tasksCreate({
        project: projectId,
        name: action.data.name,
        type: action.data.taskType ?? 'training',
        script: {
          repository: action.data.repo,
          ...(action.data.type === 'branch' ?
              {branch: action.data.branch ?? 'master'} :
              action.data.type === 'tag' ?
                {tag: action.data.tag} :
                {version_num: action.data.commit}
          ),
          working_dir: action.data.directory,
          entry_point: action.data.script,
          binary: action.data.binary,
          requirements: action.data.requirements === 'manual' ? {pip: action.data.pip} : null,
          diff: action.data.uncommited
        },
        hyperparams: {
          Args: action.data.args
            .filter(arg => arg.key?.length > 0)
            .reduce((acc, arg) => {
              const name = arg.key.startsWith('--') ? arg.key.slice(2) : arg.key;
              acc[name] = {name, value: arg.value, section: 'Args'};
              return acc;
            }, {})
        },
        ...(action.data.output && {output_dest: action.data.output}),
        container: {
          ...(action.data.docker.image && {
            image: action.data.docker.image,
            setup_shell_script: action.data.docker.script
          }),
          arguments: `${action.data.docker.args}${action.data.taskInit ? ' -e CLEARML_AGENT_FORCE_TASK_INIT=1' : ''}${action.data.poetry ? ' -e CLEARML_AGENT_FORCE_POETRY' : ''}${action.data.venvType === 'manual' ? ' -e CLEARML_AGENT_SKIP_PIP_VENV_INSTALL=' + action.data.venv : ''}${action.data.requirements === 'skip' ? ' -e CLEARML_AGENT_SKIP_PYTHON_ENV_INSTALL=1' : ''}`
            .concat(action.data.vars?.map(v => ` -e ${v.key}:${v.value}`).join('') ?? '')
            .trimStart()
        }
      } as TasksCreateRequest).pipe(
        map((res: TasksCreateResponse) => exActions.createExperimentSuccess({data: {...action.data, id: res.id}, project: projectId}))
      )),
      catchError(error => [addMessage(MESSAGES_SEVERITY.ERROR, `Failed to create tasks.\n${this.errService.getErrorMsg(error.error)}`)])
    );
  });

  createExperimentSuccess = createEffect(() => {
    return this.actions$.pipe(
      ofType(exActions.createExperimentSuccess),
      map(action => addMessage(MESSAGES_SEVERITY.SUCCESS, `Successfully created task ${action.data.name}`, [{name: 'open task', actions: [exActions.openExperiment({id: action.data.id, project: action.project})]}]))
    );
  });

  updateExperimentsAfterCreate = createEffect(() => {
    return this.actions$.pipe(
      ofType(exActions.createExperimentSuccess),
      map(() => exActions.refreshExperiments({autoRefresh: false, hideLoader: false}))
    );
  });

  openExperiment = createEffect(() => {
    return this.actions$.pipe(
      ofType(exActions.openExperiment),
      map(action => this.router.navigate(['projects', action.project, 'tasks', action.id]))
    );
  }, {dispatch: false});

  enqueueCreateExperiment = createEffect(() => {
    return this.actions$.pipe(
      ofType(exActions.createExperimentSuccess),
      filter(action => !!action.data.queue),
      switchMap(action => this.apiTasks.tasksEnqueue({
        queue: action.data.queue.id,
        task: action.data.id,
        verify_watched_queue: true
      }).pipe(
        map(res => res.queue_watched === false ? menuActions.openEmptyQueueMessage({queue: action.data.queue, entityName: action.data.name}) : {type: 'EMPTY'})
      )),
      catchError(error => [addMessage(MESSAGES_SEVERITY.ERROR, `Failed to enqueue tasks.\n${this.errService.getErrorMsg(error.error)}`)])
    );
  });

  isModel() {
    let route = this.route.snapshot;
    while (route.firstChild) {
      if (route.url[0]?.path === 'models') {
        return true
      }
      route = route.firstChild;
    }
    return false;
  }

  isCompare() {
    let route = this.route.snapshot;
    while (route.firstChild) {
      if (route.url[0]?.path === 'compare-tasks') {
        return true
      }
      route = route.firstChild;
    }
    return false;
  }
}
