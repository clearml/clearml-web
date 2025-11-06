import {Injectable, inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {Action, Store} from '@ngrx/store';
import {flatten, get, isEqual} from 'lodash-es';
import {EMPTY, of} from 'rxjs';
import {auditTime, catchError, expand, filter, map, mergeMap, reduce, switchMap, tap} from 'rxjs/operators';
import {ApiModelsService} from '~/business-logic/api-services/models.service';
import {requestFailed} from '../../core/actions/http.actions';
import {activeLoader, addMessage, deactivateLoader, setServerError} from '../../core/actions/layout.actions';
import {downloadForGetAll, getFilteredUsers, setProjectUsers} from '../../core/actions/projects.actions';
import {setURLParams} from '../../core/actions/router.actions';
import {selectIsArchivedMode, selectIsDeepMode, selectSelectedProject} from '../../core/reducers/projects.reducer';
import {selectRouterParams} from '../../core/reducers/router-reducer';
import {selectAppVisible} from '../../core/reducers/view.reducer';
import {addMultipleSortColumns} from '../../shared/utils/shared-utils';
import {getModelInfo, refreshModelInfo} from '../actions/models-info.actions';
import * as actions from '../actions/models-view.actions';
import {setMetadataKeys, setSelectedModelsDisableAvailable} from '../actions/models-view.actions';
import {MODELS_PAGE_SIZE, MODELS_TABLE_COLS} from '../models.consts';
import * as modelsSelectors from '../reducers';
import {
  selectModelsList, selectModelsView,
  selectSelectedModels,
  selectTableFilters,
  selectTableMode,
  selectTableSortFields
} from '../reducers';
import {MODEL_TAGS, MODELS_ONLY_FIELDS, MODELS_TABLE_COL_FIELDS} from '../shared/models.const';
import {SelectedModel} from '../shared/models.model';
import {ModelsGetAllExRequest} from '~/business-logic/model/models/modelsGetAllExRequest';
import {createFiltersFromStore, encodeColumns, encodeOrder, getTagsFilters} from '../../shared/utils/tableParamEncode';
import {emptyAction} from '~/app.constants';
import {ApiProjectsService} from '~/business-logic/api-services/projects.service';
import {SearchState} from '../../common-search/common-search.reducer';
import {SortMeta} from 'primeng/api';
import {
  CountAvailableAndIsDisableSelectedFiltered,
  MenuItems,
  selectionDisabledArchive,
  selectionDisabledDelete,
  selectionDisabledMoveTo,
  selectionDisabledPublishModels,
  selectionDisabledTags
} from '../../shared/entity-page/items.utils';
import {FilterMetadata} from 'primeng/api';
import {ModelsGetAllExResponse} from '~/business-logic/model/models/modelsGetAllExResponse';
import {ISmCol} from '../../shared/ui-components/data/table/table.consts';
import {hasValue} from '../../shared/utils/helpers.util';
import {
  ProjectsGetModelMetadataValuesResponse
} from '~/business-logic/model/projects/projectsGetModelMetadataValuesResponse';
import {selectActiveWorkspaceReady} from '~/core/reducers/view.reducer';
import {escapeRegex} from '@common/shared/utils/escape-regex';
import {MESSAGES_SEVERITY} from '@common/constants';
import {sortByField} from '@common/tasks/tasks.utils';
import {ApiOrganizationService} from '~/business-logic/api-services/organization.service';
import {prepareColsForDownload} from '@common/shared/utils/download';
import {UserPreferences} from '@common/user-preferences';

@Injectable()
export class ModelsViewEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private apiModels = inject(ApiModelsService);
  private projectsApi = inject(ApiProjectsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private orgApi = inject(ApiOrganizationService);
  private userPreferences = inject(UserPreferences);

  activeLoader = createEffect(() => this.actions$.pipe(
    ofType(actions.getNextModels, actions.globalFilterChanged, actions.fetchModelsRequested, actions.selectAllModels),
    filter((action) => !(action as ReturnType<typeof actions.refreshModels>).hideLoader),
    map(() => activeLoader('Fetch Models'))
  ));

  private getPathsFromAction(action): string[] {
    switch (action.type) {
      case actions.setTableSort.type:
        return [`models.view.projectColumnsSortOrder.${action.projectId}`];
      case actions.removeMetricCol.type:
        return [
          `models.view.metadataCols.${action.projectId}`,
          `models.view.projectColumnsSortOrder.${action.projectId}`,
          `models.view.projectColumnsWidth.${action.projectId}`,
          `models.view.colsOrder.${action.projectId}`
        ];
      case actions.setTableFilters.type:
        return [`models.view.projectColumnFilters.${action.projectId}`];
      case actions.setColumnWidth.type:
        return [`models.view.projectColumnsWidth.${action.projectId}`];
      case actions.toggleColHidden.type:
        return [`models.view.hiddenProjectTableCols.${action.projectId}`];
      case actions.removeCol.type:
        return [
          `models.view.colsOrder.${action.projectId}`,
          `models.view.metadataCols.${action.projectId}`
        ];
      case actions.setColsOrderForProject.type:
        return [`models.view.colsOrder.${action.projectId}`];
      case actions.addColumn.type:
      case actions.setExtraColumns.type:
        return [`models.view.metadataCols.${action.projectId}`];
    }
    return [];
  }

  setUserPreferences = createEffect(() => this.actions$.pipe(
    ofType(actions.setTableSort, actions.removeMetricCol, actions.setTableFilters, actions.setColumnWidth, actions.toggleColHidden, actions.removeCol,
      actions.setColsOrderForProject, actions.addColumn, actions.setExtraColumns),
    concatLatestFrom(() => this.store.select(selectModelsView)),
    map(([action, state]) => {
      const paths = this.getPathsFromAction(action);
      paths.forEach(path => this.userPreferences.setPreferences(path, get(state, path.split('.').slice(2).join('.'))));
    })), {dispatch: false});

  tableSortChange = createEffect(() => this.actions$.pipe(
    ofType(actions.tableSortChanged),
    concatLatestFrom(() => this.store.select(selectTableSortFields)),
    map(([action, oldOrders]) => {
      const orders = addMultipleSortColumns(oldOrders, action.colId, action.isShift);
      return setURLParams({orders, update: true});
    })
  ));

  tableFilterChange = createEffect(() => this.actions$.pipe(
    ofType(actions.tableFilterChanged),
    concatLatestFrom(() => this.store.select(selectTableFilters)),
    map(([action, oldFilters]) =>
      setURLParams({
        filters: {
          ...oldFilters,
          ...action.filters.reduce((acc, updatedFilter) => {
            acc[updatedFilter.col] = {value: updatedFilter.value, matchMode: updatedFilter.filterMatchMode};
            return acc;
          }, {} as Record<string, FilterMetadata>)
        }, update: true
      })
    )
  ));

  getModelsMetadataValuesForKey = createEffect(() => this.actions$.pipe(
    ofType(actions.getModelsMetadataValuesForKey),
    concatLatestFrom(() => [
      this.store.select(selectIsDeepMode),
      this.store.select(selectSelectedProject)
    ]),
    switchMap(([action, isDeep, selectedProject]) => {
      const projectId = action.col.projectId || selectedProject.id;
      return this.projectsApi.projectsGetModelMetadataValues({
        include_subprojects: isDeep,
        key: action.col.key,
        ...(projectId !== '*' && {projects: [projectId]})
      }).pipe(
        map((data: ProjectsGetModelMetadataValuesResponse) => {
          const values = data.values.filter(x => hasValue(x) && x !== '');
          return actions.setMetadataColValuesOptions({col: action.col, values});
        })
      );
    })
  ));

  reFetchModels = createEffect(() => this.actions$.pipe(
    ofType(
      actions.fetchModelsRequested, actions.getNextModelsWithPageSize, actions.globalFilterChanged, actions.showSelectedOnly
    ),
    switchMap((action) => this.store.select(selectActiveWorkspaceReady).pipe(
      filter(ready => ready),
      map(() => action))),
    auditTime(100),
    switchMap((action) => this.fetchModels$(null, false, (action as any).pageSize as number)
      .pipe(
        mergeMap(res => [
          actions.setNoMoreModels({payload: (res.models.length < MODELS_PAGE_SIZE)}),
          actions.setModels({models: res.models}),
          actions.setCurrentScrollId({scrollId: res.scroll_id}),
          deactivateLoader('Fetch Models')
        ]),
        catchError(error => [
          requestFailed(error),
          deactivateLoader('Fetch Models'),
          addMessage('warn', 'Fetch Models for selection failed', [{
            name: 'More info',
            actions: [setServerError(error, null, 'Fetch Models for selection failed')]
          }])
        ])
      )
    )
  ));

  getFrameworksEffect = createEffect(() => this.actions$.pipe(
    ofType(actions.getFrameworks, actions.getAllProjectsFrameworks),
    concatLatestFrom(() =>
      this.store.select(selectRouterParams).pipe(map(params => params?.projectId ?? '*'))
    ),
    switchMap(([action, projectId]) => this.apiModels.modelsGetFrameworks({projects: projectId !== '*' && action.type !== actions.getAllProjectsFrameworks.type ? [projectId] : []})
      .pipe(
        mergeMap(res => [
          actions.setFrameworks({frameworks: res.frameworks.concat(null)})
        ]),
        catchError(error => [
          requestFailed(error),
          addMessage('warn', 'Fetch frameworks failed', [{
            name: 'More info',
            actions: [setServerError(error, null, 'Fetch frameworks failed')]
          }])]
        )
      )
    )
  ));

  getUsersEffect = createEffect(() => this.actions$.pipe(
    ofType(setProjectUsers),
    concatLatestFrom(() => this.store.select(modelsSelectors.selectTableFilters)),
    map(([action, filters]) => {
      const userFiltersValue = filters?.user?.['name']?.value ?? [];
      const resIds = action.users.map(user => user.id);
      const shouldGetFilteredUsersNames = !(userFiltersValue.every(id => resIds.includes(id)));
      return shouldGetFilteredUsersNames ? getFilteredUsers({filteredUsers: userFiltersValue}) : emptyAction();
    })
  ));

  getTagsEffect = createEffect(() => this.actions$.pipe(
    ofType(actions.getTags, actions.getTagsForAllProjects),
    concatLatestFrom(() => this.store.select(selectRouterParams).pipe(map(params => params?.projectId ?? '*'))),
    switchMap(([action, projectId]) => this.projectsApi.projectsGetModelTags({
      projects: (projectId === '*' || action.type === actions.getTagsForAllProjects.type) ? [] : [projectId]
    }).pipe(
      mergeMap(res => [
        actions.setTags({tags: res.tags.concat(null)}),
        deactivateLoader('Fetch Models')
      ]),
      catchError(error => [
        requestFailed(error),
        deactivateLoader('Fetch Models'),
        addMessage('warn', 'Fetch tags failed', [{
          name: 'More info',
          actions: [setServerError(error, null, 'Fetch tags failed')]
        }])]
      )
    ))
  ));

  getMetadataKeysForProjectEffect = createEffect(() => this.actions$.pipe(
    ofType(actions.getMetadataKeysForProject),
    concatLatestFrom(() => this.store.select(selectRouterParams).pipe(map(params => params?.projectId))),
    switchMap(([action, projectId]) => this.projectsApi.projectsGetModelMetadataKeys({
      project: projectId !== '*' ? projectId : null
    }).pipe(
      mergeMap(res => [
        setMetadataKeys({keys: res.keys}),
        deactivateLoader(action.type)
      ]),
      catchError(error => [
        requestFailed(error),
        deactivateLoader(action.type),
        addMessage('warn', '${action.type}failed', [{
          name: 'More info',
          actions: [setServerError(error, null, '${action.type} failed')]
        }])]
      )
    ))
  ));

  getCustomMetrics = createEffect(() => this.actions$.pipe(
    ofType(actions.getCustomMetrics),
    concatLatestFrom(() => [
      this.store.select(selectRouterParams).pipe(map(params => params?.projectId)),
      this.store.select(selectIsDeepMode)
    ]),
    switchMap(([action, projectId, isDeep]) => this.projectsApi.projectsGetUniqueMetricVariants({
        project: projectId === '*' ? null : projectId,
        model_metrics: true,
        include_subprojects: isDeep
      })
        .pipe(
          mergeMap(res => [
            actions.setCustomMetrics({metrics: sortByField(res.metrics, 'metric')}),
            deactivateLoader(action.type)
          ]),
          catchError(error => [
            requestFailed(error),
            deactivateLoader(action.type),
            addMessage('warn', 'Fetch custom metrics failed', error?.meta && [{
              name: 'More info',
              actions: [setServerError(error, null, 'Fetch custom metrics failed')]
            }])
          ])
        )
    )
  ));

  lockRefresh = false;
  refreshModels = createEffect(() => this.actions$.pipe(
    ofType(actions.refreshModels),
    filter(() => !this.lockRefresh),
    concatLatestFrom(() => [
      this.store.select(modelsSelectors.selectCurrentScrollId),
      this.store.select(modelsSelectors.selectSelectedModel),
      this.store.select(modelsSelectors.selectModelsList),
      this.store.select(selectAppVisible)
    ]),
    filter((values) => values[4]),
    switchMap(([action, scrollId, selectedModel, models]) => {
        this.lockRefresh = !action.autoRefresh;
        return this.fetchModels$(scrollId, true)
          .pipe(
            mergeMap(res => {
              this.lockRefresh = false;
              const resActions: Action[] = [deactivateLoader('Fetch Models')];

              if (selectedModel) {
                if (action.hideLoader || action.autoRefresh) {
                  resActions.push(refreshModelInfo(selectedModel.id));
                } else {
                  resActions.push(getModelInfo({id: selectedModel.id}));
                }
              }
              if (selectedModel && action.autoRefresh && isEqual(models?.map(model => model.id).sort(), res.models.map(model => model.id).sort())) {
                resActions.push(actions.setModelsInPlace({models: res.models}));
              } else {
                resActions.push(actions.setModels({models: res.models}));
              }
              return resActions;
            }),
            catchError(error => {
              this.lockRefresh = false;
              return [
                requestFailed(error),
                deactivateLoader('Fetch Models'),
                addMessage('warn', 'Fetch models failed', [{
                  name: 'More info',
                  actions: [setServerError(error, null, 'Fetch models failed')]
                }])
              ];
            })
          );
      }
    )
  ));

  getModels = createEffect(() => this.actions$.pipe(
    ofType(actions.getNextModels),
    concatLatestFrom(() => [
      this.store.select(modelsSelectors.selectCurrentScrollId),
      this.store.select(modelsSelectors.selectModelsList)
    ]),
    switchMap(([, scrollId, modelsList]) => this.fetchModels$(scrollId)
      .pipe(
        mergeMap(res => {

          const addModelsAction = scrollId === res.scroll_id || !scrollId ?
            [actions.addModels({models: res.models})] :
            [actions.getNextModelsWithPageSize({pageSize: modelsList.length}), addMessage(MESSAGES_SEVERITY.WARN, 'Session expired')];

          return [
            actions.setNoMoreModels({payload: (res.models.length < MODELS_PAGE_SIZE)}),
            ...addModelsAction,
            actions.setCurrentScrollId({scrollId: res.scroll_id}),
            deactivateLoader('Fetch Models')
          ];
        }),
        catchError(error => [
          requestFailed(error),
          deactivateLoader('Fetch Models'),
          addMessage('warn', 'Fetch models failed', [{
            name: 'More info',
            actions: [setServerError(error, null, 'Fetch models failed')]
          }])
        ])
      )
    )
  ));

  selectAll = createEffect(() => this.actions$.pipe(
    ofType(actions.selectAllModels),
    concatLatestFrom(() => [
      this.store.select(selectRouterParams).pipe(map(params => params?.projectId)),
      this.store.select(selectIsArchivedMode),
      this.store.select(modelsSelectors.selectGlobalFilter),
      this.store.select(modelsSelectors.selectTableFilters),
      this.store.select(selectIsDeepMode)
    ]),
    switchMap(([action, projectId, archived, globalSearch, tableFilters, deep]) => {
      const pageSize = 1000;
      const query = this.getGetAllQuery({
        projectId,
        searchQuery: action.filtered && globalSearch,
        archived,
        orderFields: [{order: -1, field: MODELS_TABLE_COL_FIELDS.LAST_UPDATE}],
        filters: action.filtered ? tableFilters : {},
        selectedIds: [],
        deep,
        pageSize
      });
      query.only_fields = [MODELS_TABLE_COL_FIELDS.NAME, MODELS_TABLE_COL_FIELDS.READY, 'company.id', 'system_tags'];
      return this.apiModels.modelsGetAllEx(query).pipe(
        expand((res: ModelsGetAllExResponse) => res.models.length === pageSize ? this.apiModels.modelsGetAllEx({
          ...query,
          scroll_id: res.scroll_id
        }) : EMPTY),
        reduce((acc, res: ModelsGetAllExResponse) => acc.concat(res.models), [])
      );
    }),
    switchMap(models => [actions.setSelectedModels({models}), deactivateLoader('Fetch Models')]),
    catchError(error => [
      requestFailed(error),
      deactivateLoader('Fetch Models'),
      addMessage('warn', 'Fetch models failed', [{
        name: 'More info',
        actions: [setServerError(error, null, 'Fetch models failed')]
      }])
    ])
  ));

  updateModelsUrlParams = createEffect(() => this.actions$.pipe(
    ofType(actions.updateUrlParams, actions.toggleColHidden, actions.addColumn, actions.removeCol),
    concatLatestFrom(() => [
      this.store.select(modelsSelectors.selectTableFilters),
      this.store.select(modelsSelectors.selectTableSortFields),
      this.store.select(modelsSelectors.selectMetadataColsForProject),
      this.store.select(modelsSelectors.selectModelsTableColsOrder),
      this.store.select(modelsSelectors.selectModelsHiddenTableCols),
      this.store.select(selectIsDeepMode)
    ]),
    mergeMap(([, filters, sortFields, metadataCols, colsOrder, hiddenCols, isDeep]) =>
      [setURLParams({
        filters: filters as any,
        orders: sortFields,
        isDeep,
        columns: encodeColumns(MODELS_TABLE_COLS, hiddenCols, metadataCols, colsOrder),
        update: true
      })]
    )
  ));

  modelSelectionChanged = createEffect(() => this.actions$.pipe(
    ofType(actions.modelSelectionChanged),
    tap(action => this.navigateAfterModelSelectionChanged(action.model, action.project)),
    mergeMap(() => [actions.setTableMode({mode: 'info'})])
    // map(action => actions.setSelectedModel({model: action.model}))
  ));
  selectNextModelEffect = createEffect(() => this.actions$.pipe(
    ofType(actions.selectNextModel),
    concatLatestFrom(() => [
      this.store.select(selectModelsList),
      this.store.select(selectRouterParams).pipe(map(params => params?.projectId)),
      this.store.select(selectTableMode)
    ]),
    filter(([, , , tableMode]) => tableMode === 'info'),
    tap(([, models, projectId]) => this.navigateAfterModelSelectionChanged(models[0] as SelectedModel, projectId, true)),
    mergeMap(([, models]) => [actions.setTableMode({mode: models.length > 0 ? 'info' : 'table'})])
  ));

  getReadyFilter(tableFilters) {
    switch (tableFilters?.ready?.value?.length) {
      case 0:
        return null;
      case 1:
        return tableFilters.ready.value[0] === 'true';
      case 2:
        return null;
      default:
        return null;
    }
  }

  prepareTableForDownload = createEffect(() => this.actions$.pipe(
    ofType(actions.prepareTableForDownload),

    concatLatestFrom(() => [
      this.store.select(selectRouterParams).pipe(map(params => params?.projectId)),
      this.store.select(selectIsArchivedMode),
      this.store.select(modelsSelectors.selectMetadataColsForProject),
      this.store.select(modelsSelectors.selectGlobalFilter),
      this.store.select(modelsSelectors.selectTableSortFields),
      this.store.select(modelsSelectors.selectTableFilters),
      this.store.select(modelsSelectors.selectSelectedModels),
      this.store.select(modelsSelectors.selectShowAllSelectedIsActive),
      this.store.select(modelsSelectors.selectModelsTableColsOrder),
      this.store.select(modelsSelectors.selectModelsHiddenTableCols),
      this.store.select(modelsSelectors.selectModelTableColumns),
      this.store.select(selectIsDeepMode)
    ]),
    switchMap(([, projectId, isArchived, metadataCols, gb, orderFields, filters, selectedModels, showAllSelectedIsActive, colsOrder, hiddenCols, cols, deep]) => {
        const selectedIds = showAllSelectedIsActive ? selectedModels.map(exp => exp.id) : [];
        const columns = encodeColumns(MODELS_TABLE_COLS, hiddenCols, metadataCols, colsOrder);
        this.setModelsUrlParams(filters, orderFields, isArchived, columns, deep);
        return this.orgApi.organizationPrepareDownloadForGetAll({
          entity_type: 'model', only_fields: [],
          field_mappings: prepareColsForDownload(cols),
          ...this.getGetAllQuery({
            projectId, searchQuery: gb, archived: isArchived,
            orderFields, filters, selectedIds, deep, cols, metaCols: metadataCols
          })
        }).pipe(
          map((res) => downloadForGetAll({prepareId: res.prepare_id})),
          catchError(error => [requestFailed(error)])
        );
      }
    )
  ));

  getGetAllQuery({
                   refreshScroll = false, scrollId = null, projectId, searchQuery, archived, orderFields,
                   filters, selectedIds = [], deep, pageSize = MODELS_PAGE_SIZE, cols = [], metaCols = []
                 }: {
    refreshScroll?: boolean;
    scrollId?: string;
    projectId: string;
    searchQuery: SearchState['searchQuery'];
    archived: boolean;
    orderFields: SortMeta[];
    filters: Record<string, FilterMetadata>;
    selectedIds: string[];
    deep: boolean;
    pageSize?: number;
    cols?: ISmCol[];
    metaCols?: ISmCol[];
  }): ModelsGetAllExRequest {
    const userFilter = filters?.[MODELS_TABLE_COL_FIELDS.USER]?.value;
    const projectFilter = filters?.[MODELS_TABLE_COL_FIELDS.PROJECT]?.value;
    const tagsFilter = filters?.[MODELS_TABLE_COL_FIELDS.TAGS]?.value;
    const tagsFilterAnd = filters?.[MODELS_TABLE_COL_FIELDS.TAGS]?.matchMode === 'AND';
    const systemTags = filters?.system_tags?.value;
    const frameworkFilter = filters?.[MODELS_TABLE_COL_FIELDS.FRAMEWORK]?.value;
    const ready = this.getReadyFilter(filters);
    const systemTagsFilter = (archived ? [MODEL_TAGS.HIDDEN] : ['-' + MODEL_TAGS.HIDDEN])
      .concat(systemTags ? systemTags : []);
    const colsFilters = flatten(cols.filter(col => col.id !== 'selected' && !col.hidden).map(col => col.getter || col.id));
    const metaColsFilters = metaCols ? flatten(metaCols.map(col => col.getter || col.id)) : [];
    const only_fields = [...new Set([...MODELS_ONLY_FIELDS, ...colsFilters, ...metaColsFilters])];
    const tableFilters = createFiltersFromStore(filters, true);
    delete tableFilters['tags'];
    return {
      id: selectedIds,
      ...tableFilters,
      ...(searchQuery?.query && {
        _any_: {
          pattern: searchQuery.regExp ? searchQuery.query : escapeRegex(searchQuery.query),
          fields: ['id', 'name', 'comment', 'system_tags']
        }
      }),
      project: (filters['project.name'] ? filters['project.name'].value : (!projectId || projectId === '*') ? undefined : [projectId]) as string[],
      scroll_id: scrollId || null, // null to create new scroll (undefined doesn't generate scroll)
      refresh_scroll: refreshScroll,
      size: pageSize,
      include_subprojects: deep && !projectFilter,
      order_by: encodeOrder(orderFields),
      system_tags: (systemTagsFilter && systemTagsFilter.length > 0) ? systemTagsFilter : [],
      only_fields,
      ...(tagsFilter?.length > 0 && {
        filters: {
          tags: getTagsFilters(tagsFilterAnd, tagsFilter)
        }
      }),
      ...(frameworkFilter?.length > 0 && {framework: frameworkFilter}),
      ...(userFilter?.length > 0 && {user: userFilter}),
      ready: ready !== null ? ready : null
    };
  }


  fetchModels$(scrollId1: string, refreshScroll = false, pageSize = MODELS_PAGE_SIZE) {
    return of(scrollId1)
      .pipe(
        concatLatestFrom(() => [
          this.store.select(modelsSelectors.selectProjectId),
          this.store.select(selectIsArchivedMode),
          this.store.select(modelsSelectors.selectMetadataColsForProject),
          this.store.select(modelsSelectors.selectGlobalFilter),
          this.store.select(modelsSelectors.selectTableSortFields),
          this.store.select(modelsSelectors.selectTableFilters),
          this.store.select(modelsSelectors.selectSelectedModels),
          this.store.select(modelsSelectors.selectShowAllSelectedIsActive),
          this.store.select(modelsSelectors.selectModelsTableColsOrder),
          this.store.select(modelsSelectors.selectModelsHiddenTableCols),
          this.store.select(modelsSelectors.selectModelTableColumns),
          this.store.select(selectIsDeepMode)
        ]),
        switchMap(([scrollId, projectId, isArchived, metadataCols, gb, orderFields, filters, selectedModels, showAllSelectedIsActive, colsOrder, hiddenCols, cols, deep]) => {
          const selectedIds = showAllSelectedIsActive ? selectedModels.map(exp => exp.id) : [];
          // const columns = encodeColumns(MODELS_TABLE_COLS, hiddenCols, metadataCols, colsOrder);
          // this.setModelsUrlParams(filters, orderFields, isArchived, columns, deep);
          return this.apiModels.modelsGetAllEx(
            this.getGetAllQuery({
              refreshScroll, scrollId, projectId, searchQuery: gb, archived: isArchived,
              orderFields, filters, selectedIds, deep, pageSize, cols, metaCols: metadataCols
            }));
        })
      );
  }

  setSelectedModels = createEffect(() => this.actions$.pipe(
      ofType(actions.setSelectedModels, actions.updateModel),
      concatLatestFrom(() => this.store.select(selectSelectedModels)),
      switchMap(([action, selectedModels]) => {
        const payload = action.type === actions.setSelectedModels.type ?
          (action as ReturnType<typeof actions.setSelectedModels>).models : selectedModels;
        const selectedModelsDisableAvailable: Record<string, CountAvailableAndIsDisableSelectedFiltered> = {
          [MenuItems.publish]: selectionDisabledPublishModels(payload),
          [MenuItems.archive]: selectionDisabledArchive(payload),
          [MenuItems.moveTo]: selectionDisabledMoveTo(payload),
          [MenuItems.delete]: selectionDisabledDelete(payload),
          [MenuItems.tags]: selectionDisabledTags(payload)
        };
        return [setSelectedModelsDisableAvailable({selectedModelsDisableAvailable})];
      })
    )
  );

  setModelsUrlParams(filters, sortFields, isArchived, columns, isDeep) {
    this.store.dispatch(setURLParams({filters, orders: sortFields, isArchived, columns, isDeep}));
  }

  navigateAfterModelSelectionChanged(selectedModel: SelectedModel, modelProject: string, replaceUrl = false) {
    let activeChild = this.route.snapshot;
    while (activeChild.firstChild) {
      activeChild = activeChild.firstChild;
    }
    let baseUrl = this.route;
    while (baseUrl.snapshot.routeConfig?.path !== 'models') {
      baseUrl = baseUrl.firstChild;
    }
    selectedModel ?
      this.router.navigate([selectedModel.id], {
        queryParamsHandling: 'preserve',
        relativeTo: baseUrl
      }) :
      this.router.navigate(['projects', modelProject, 'models'], {queryParamsHandling: 'preserve', replaceUrl});
  }

  isSelectedModelInCheckedModels(checkedModels, selectedModel) {
    return selectedModel && checkedModels.map(model => model.id).includes(selectedModel.id);
  }
}
