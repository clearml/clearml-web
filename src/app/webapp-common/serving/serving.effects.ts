import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';

import {auditTime, catchError, filter, map, mergeMap, switchMap, tap} from 'rxjs/operators';
import {forkJoin, iif, Observable, of} from 'rxjs';
import {ServingActions} from './serving.actions';
import {concatLatestFrom} from '@ngrx/operators';
import {servingFeature} from '@common/serving/serving.reducer';
import {addMultipleSortColumns} from '@common/shared/utils/shared-utils';
import {setURLParams} from '@common/core/actions/router.actions';
import {FilterMetadata} from 'primeng/api/filtermetadata';
import {selectActiveWorkspaceReady} from '~/core/reducers/view.reducer';
import {activeLoader, addMessage, deactivateLoader, setServerError} from '@common/core/actions/layout.actions';
import {requestFailed} from '@common/core/actions/http.actions';
import {selectRouterConfig} from '@common/core/reducers/router-reducer';
import {getFilteredUsers, setProjectUsers} from '@common/core/actions/projects.actions';
import {emptyAction} from '~/app.constants';
import {selectAppVisible, selectScaleFactor} from '@common/core/reducers/view.reducer';
import {Action, Store} from '@ngrx/store';
import {isEqual} from 'lodash-es';
import {createFiltersFromStore, encodeColumns, encodeOrder} from '@common/shared/utils/tableParamEncode';
import {SearchState} from '@common/common-search/common-search.reducer';
import {SortMeta} from 'primeng/api';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {escapeRegex} from '@common/shared/utils/escape-regex';
import {ActivatedRoute, Router} from '@angular/router';
import {servingLoadingTableCols, servingTableCols} from '@common/serving/serving.consts';
import {selectActiveWorkspace} from '@common/core/reducers/users-reducer';
import {activitySeriesToTopic, Topic} from '@common/shared/utils/statistics';
import {ApiServingService} from '~/business-logic/api-services/serving.service';
import {ServingGetEndpointDetailsResponse} from '~/business-logic/model/serving/servingGetEndpointDetailsResponse';
import {ServingGetEndpointsResponse} from '~/business-logic/model/serving/servingGetEndpointsResponse';
import {ServingGetLoadingInstancesResponse} from '~/business-logic/model/serving/servingGetLoadingInstancesResponse';
import {MESSAGES_SEVERITY} from '@common/constants';
import {ServingGetEndpointMetricsHistoryRequest} from '~/business-logic/model/serving/servingGetEndpointMetricsHistoryRequest';
import {ServingGetEndpointMetricsHistoryResponse} from '~/business-logic/model/serving/servingGetEndpointMetricsHistoryResponse';
import {EndpointStats} from '~/business-logic/model/serving/endpointStats';
import MetricTypeEnum = ServingGetEndpointMetricsHistoryRequest.MetricTypeEnum;
import {v5 as uuidv5} from 'uuid';
import {ContainerInstanceStatsReference} from '~/business-logic/model/serving/containerInstanceStatsReference';
import {ApiModelsService} from '~/business-logic/api-services/models.service';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';

@Injectable()
export class ServingEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private servingApi = inject(ApiServingService);
  private modelsApi = inject(ApiModelsService);
  private tasksApi = inject(ApiTasksService);

  activeLoader = createEffect(() => this.actions$.pipe(
    ofType(ServingActions.getNextServingEndpoints, ServingActions.fetchServingEndpoints, ServingActions.fetchLoadingEndpoints),
    filter((action) => !(action as unknown as ReturnType<typeof ServingActions.refreshEndpoints>).hideLoader),
    map(() => activeLoader('Fetch Endpoint'))
  ));

  tableSortChange = createEffect(() => this.actions$.pipe(
    ofType(ServingActions.tableSortChanged, ServingActions.loadingTableSortChanged),
    concatLatestFrom((action) => iif(() => action.type === ServingActions.tableSortChanged.type,
      this.store.select(servingFeature.selectTableSortFields), this.store.select(servingFeature.selectLoadingTableSortFields))),
    switchMap(([action, oldOrders]) => {
      const orders = addMultipleSortColumns(oldOrders, action.colId, action.isShift);
      return [setURLParams({orders, update: true})];
    })
  ));

  tableFilterChange = createEffect(() => this.actions$.pipe(
    ofType(ServingActions.tableFiltersChanged, ServingActions.loadingTableFiltersChanged),
    concatLatestFrom((action) => iif(() => action.type === ServingActions.tableFiltersChanged.type,
      this.store.select(servingFeature.selectColumnFilters), this.store.select(servingFeature.selectLoadingColumnFilters))),
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


  reFetchEndpoint = createEffect(() => this.actions$.pipe(
    ofType(
      ServingActions.fetchServingEndpoints, ServingActions.fetchLoadingEndpoints
    ),
    switchMap((action) => this.store.select(selectActiveWorkspaceReady).pipe(
      filter(ready => ready),
      map(() => action))),
    auditTime(100),
    switchMap(action => iif(() => action.type === ServingActions.fetchServingEndpoints.type,
      this.fetchEndpoint$(), this.fetchLoadingEndpoint$())
      .pipe(
        mergeMap(res => [
          action.type === ServingActions.fetchServingEndpoints.type ?
            ServingActions.setServingEndpoints({servingEndpoints: res.endpoints}) : ServingActions.setLoadingEndpoints({servingEndpoints: res.endpoints}),
          deactivateLoader('Fetch Endpoint')
        ]),
        catchError(error => [
          requestFailed(error),
          deactivateLoader('Fetch Endpoint'),
          addMessage(MESSAGES_SEVERITY.WARN, 'Fetch Endpoint for selection failed', [{
            name: 'More info',
            actions: [setServerError(error, null, 'Fetch Endpoint for selection failed')]
          }])
        ])
      )
    )
  ));

  getUsersEffect = createEffect(() => this.actions$.pipe(
    ofType(setProjectUsers),
    concatLatestFrom(() => this.store.select(servingFeature.selectColumnFilters)),
    map(([action, filters]) => {
      const userFiltersValue = filters?.user?.['name']?.value ?? [];
      const resIds = action.users.map(user => user.id);
      const shouldGetFilteredUsersNames = !(userFiltersValue.every(id => resIds.includes(id)));
      return shouldGetFilteredUsersNames ? getFilteredUsers({filteredUsers: userFiltersValue}) : emptyAction();
    })
  ));

  lockRefresh = false;
  refreshEndpoints = createEffect(() => this.actions$.pipe(
    ofType(ServingActions.refreshEndpoints, ServingActions.refreshLoadingEndpoints),
    filter(() => !this.lockRefresh),
    concatLatestFrom(() => [
      this.store.select(servingFeature.selectSelectedEndpoint),
      this.store.select(servingFeature.selectEndpoints),
      this.store.select(selectAppVisible),
      this.store.select(selectRouterConfig)
    ]),
    filter(([, , , isVisible]) => isVisible),
    //TODO: replace with exhaust map instead of lock mechanism
    switchMap(([action, selectedEndpoint, endpoints, , routerConfig]) => {
        this.lockRefresh = !action.autoRefresh;
        return iif(() => action.type === ServingActions.refreshEndpoints.type,
          this.fetchEndpoint$(), this.fetchLoadingEndpoint$())
          .pipe(
            mergeMap(res => {
              this.lockRefresh = false;
              const resActions: Action[] = [deactivateLoader('Fetch Endpoint')];

              if (selectedEndpoint && routerConfig.at(-1) === 'general') {
                if (action.hideLoader || action.autoRefresh) {
                  resActions.push(ServingActions.refreshEndpointInfo({id: selectedEndpoint.id}));
                } else {
                  resActions.push(ServingActions.getEndpointInfo({id: selectedEndpoint.id}));
                }
              }
              if (selectedEndpoint && action.autoRefresh && isEqual(endpoints.map(endpoint => endpoint.id).sort(), res.endpoints.map(model => model.id).sort())) {
                resActions.push(ServingActions.setServingEndpointsInPlace({servingEndpoints: res.endpoints}));
              } else {
                if (action.type === ServingActions.refreshEndpoints.type) {
                  resActions.push(ServingActions.setServingEndpoints({servingEndpoints: res.endpoints}));
                } else {
                  resActions.push(ServingActions.setLoadingEndpoints({servingEndpoints: res.endpoints}));
                }
              }
              return resActions;
            }),
            catchError(error => {
              this.lockRefresh = false;
              return [
                requestFailed(error),
                deactivateLoader('Fetch Endpoint')
                // addMessage(MESSAGES_SEVERITY.WARN, 'Fetch endpoints failed', [{
                //   name: 'More info',
                //   actions: [setServerError(error, null, 'Fetch endpoints failed')]
                // }])
              ];
            })
          );
      }
    )
  ));

  updateEndpointUrlParamsLoading = createEffect(() => this.actions$.pipe(
    ofType(ServingActions.updateUrlParamsFromLoadingState),
    concatLatestFrom(() => [
      this.store.select(servingFeature.selectLoadingColumnFilters),
      this.store.select(servingFeature.selectLoadingTableSortFields),
      this.store.select(servingFeature.selectLoadingColsOrder)
    ]),
    mergeMap(([, filters, sortFields, colsOrder]) =>
      [setURLParams({
        filters: filters as any,
        orders: sortFields,
        columns: encodeColumns(servingLoadingTableCols, [], [], colsOrder)
      })]
    )
  ));

  updateEndpointUrlParams = createEffect(() => this.actions$.pipe(
    ofType(ServingActions.updateUrlParamsFromState, ServingActions.toggleColHidden, ServingActions.addColumn, ServingActions.removeColumn),
    concatLatestFrom(() => [
      this.store.select(servingFeature.selectColumnFilters),
      this.store.select(servingFeature.selectTableSortFields),
      this.store.select(servingFeature.selectMetricsCols),
      this.store.select(servingFeature.selectColsOrder),
      this.store.select(servingFeature.selectHiddenTableCols)
    ]),
    mergeMap(([, filters, sortFields, metadataCols, colsOrder, hiddenCols]) =>
      [setURLParams({
        filters: filters as any,
        orders: sortFields,
        columns: encodeColumns(servingTableCols, hiddenCols, metadataCols, colsOrder)
      })]
    )
  ));

  endpointSelectionChanged = createEffect(() => this.actions$.pipe(
    ofType(ServingActions.servingEndpointSelectionChanged),
    tap(action => this.navigateAfterEndpointSelectionChanged(action.servingEndpoint)),
    mergeMap(() => [ServingActions.setTableViewMode({mode: 'info'})])
  ));

  selectNextEndpointEffect = createEffect(() => this.actions$.pipe(
    ofType(ServingActions.getNextServingEndpoints),
    concatLatestFrom(() => [
      this.store.select(servingFeature.selectSortedFilteredEndpoints),
      this.store.select(servingFeature.selectTableMode)
    ]),
    filter(([, , tableMode]) => tableMode === 'info'),
    tap(([, endpoints]) => this.navigateAfterEndpointSelectionChanged(endpoints[0] as EndpointStats, true)),
    mergeMap(([, endpoints]) => [ServingActions.setTableViewMode({mode: endpoints.length > 0 ? 'info' : 'table'})])
  ));

  private previousSelectedId: string;
  private previousSelectedLastUpdate: Date;

  getGetAllQuery({searchQuery, orderFields, filters, selectedIds = [], cols = [], metaCols = []}: {
    searchQuery: SearchState['searchQuery'];
    orderFields: SortMeta[];
    filters: Record<string, FilterMetadata>;
    selectedIds: string[];
    cols?: ISmCol[];
    metaCols?: ISmCol[];
  }): any {
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
      order_by: encodeOrder(orderFields)
    };
  }


  fetchEndpoint$(): Observable<ServingGetEndpointsResponse> {
    return of(null)
      .pipe(
        switchMap(() => this.servingApi.servingGetEndpoints({}).pipe(
            map((res: ServingGetEndpointsResponse) => ({
              endpoints: res.endpoints.map(endpoint => ({
                ...endpoint,
                id: uuidv5(endpoint.url, uuidv5.URL)
              }))
            }))
          )
        )
      );
  }

  fetchLoadingEndpoint$(): Observable<ServingGetEndpointsResponse> {
    return of(null)
      .pipe(
        switchMap(() => this.servingApi.servingGetLoadingInstances({}).pipe(
            map((res: ServingGetLoadingInstancesResponse) => ({endpoints: res.instances as EndpointStats[]}))
          )
        )
      );
  }

  setEndpointUrlParams(filters, sortFields, columns) {
    this.store.dispatch(setURLParams({filters, orders: sortFields, columns}));
  }

  navigateAfterEndpointSelectionChanged(selectedEndpoint: EndpointStats, replaceUrl = false) {
    let activeChild = this.route.snapshot;
    while (activeChild && !['general', 'monitor'].includes(activeChild?.firstChild?.url[0]?.path)) {
      activeChild = activeChild.firstChild;
    }
    activeChild = activeChild?.firstChild;
    const activeChildUrl = activeChild?.url?.[0]?.path ?? 'general';
    let baseUrl = this.route;
    while (!['active', 'loading'].includes(baseUrl.snapshot.routeConfig?.path)) {
      baseUrl = baseUrl.firstChild;
    }
    // baseUrl = baseUrl.firstChild.firstChild;

    if (selectedEndpoint) {
      this.router.navigate(baseUrl.snapshot.url[0].path === 'loading' ? [] : [selectedEndpoint.id, activeChildUrl], {
        queryParamsHandling: 'preserve',
        relativeTo: baseUrl
      });
    } else {
      this.router.navigate(['endpoints', 'active'], {queryParamsHandling: 'preserve', replaceUrl});
    }
  }

  getEndpointInfo$ = createEffect(() => this.actions$.pipe(
    ofType(ServingActions.getEndpointInfo, ServingActions.refreshEndpointInfo),
    concatLatestFrom(() => [
      this.store.select(servingFeature.selectSelectedEndpoint),
      this.store.select(servingFeature.selectSelectedEndpoint),
      this.store.select(servingFeature.selectEndpoints),
      this.store.select(selectActiveWorkspace),
      this.store.select(selectAppVisible)
    ]),
    filter(([, , , , , visible]) => visible),
    switchMap(([action, tableSelected, selected, endpoints, , visible]) => {
        const currentSelected = tableSelected || selected;
        if (this.previousSelectedId && currentSelected?.id != this.previousSelectedId) {
          this.previousSelectedLastUpdate = null;
        }
        this.previousSelectedId = currentSelected?.id ?? action.id;
        if (!currentSelected || !visible) {
          return of({action, updateTime: null, tableSelected, selected});
        }

        const listed = endpoints?.find(e => e.id === currentSelected?.id);
        return of({action, updateTime: null, tableSelected: listed, selected});
      }
    ),
    filter(({action, tableSelected, selected}) =>
      (action.type !== ServingActions.refreshEndpointInfo.type || (!tableSelected) || (tableSelected?.url === selected?.url))),
    switchMap(({action, updateTime}) => {
      // else will deactivate loader
      if (
        !updateTime ||
        (new Date(this.previousSelectedLastUpdate) < new Date(updateTime))) {
        const autoRefresh = action.type === ServingActions.refreshEndpointInfo.type;
        return [
          deactivateLoader(action.type),
          ServingActions.getEndpoint({id: action.id, autoRefresh})
        ];
      } else {
        return [deactivateLoader(action.type)];
      }
    })
  ));

  getEndpoint = createEffect(() => this.actions$.pipe(
    ofType(ServingActions.getEndpoint),
    concatLatestFrom(() => [
      this.store.select(servingFeature.selectEndpoints),
      this.store.select(selectAppVisible)
    ]),
    filter(([, , visible]) => visible),
    switchMap(([action, endpoints]) => {
        const selectedEndpoint = endpoints.find(endpoint => endpoint.id === action.id);
        if (!selectedEndpoint) {
          // this.router.navigateByUrl(['.'], {queryParamsHandling: 'preserve', relativeTo: this.route});
          this.navigateAfterEndpointSelectionChanged(null);
          return [emptyAction()];
        }
        return this.servingApi.servingGetEndpointDetails({endpoint_url: selectedEndpoint.url})
          .pipe(
            mergeMap((endpointDetails: ServingGetEndpointDetailsResponse) => {
              const endpoint = endpointDetails;
              this.previousSelectedLastUpdate = endpoint.last_update;
              const actions = [deactivateLoader(action.type)] as Action[];
              if (endpoint) {
                actions.push(ServingActions.setServingEndpointDetails({endpoint}));
                actions.push(ServingActions.getModelsSourceLinks({
                  instances: endpoint.instances,
                  insideModel: endpoint.model_source === 'ClearML'}));
              }
              return actions;
            }),
            catchError(error => [
              ServingActions.setServingEndpointDetails({endpoint: null}),
              requestFailed(error),
              deactivateLoader(action.type),
              addMessage(MESSAGES_SEVERITY.ERROR, 'Fetch Endpoint for selection failed', [{
                name: 'More info',
                actions: [setServerError(error, null, 'Fetch Endpoint for selection failed')]
              }])
            ])
          );
      }
    )
  ));

  fetchGraphData$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ServingActions.getStats),
      concatLatestFrom((action) => [
        this.store.select(servingFeature.selectStatsFormMetric(action.metricType)),
        this.store.select(servingFeature.selectStatsTimeFrame),
        this.store.select(servingFeature.selectSelectedEndpoint),
        this.store.select(selectScaleFactor).pipe(map(factor => 100 / factor))
      ]),
      mergeMap(([action, currentStats, rangeInput, endpoint, scale]) => {
        const now = Math.floor((new Date()).getTime() / 1000);
        const range = parseInt(rangeInput, 10);
        const maxPoints = window.innerWidth * scale;
        const granularity = Math.max(Math.floor(range / maxPoints * 2), 10);
        const refresh = action.refresh && currentStats;
        let fromDate: number;

        if (refresh) {
          fromDate = currentStats.find(topic => topic.dates.length > 0).dates.at(-1).originalDate / 1000 + granularity;
        } else {
          fromDate = now - range;
        }
        return this.servingApi.servingGetEndpointMetricsHistory({

          endpoint_url: endpoint.url,
          metric_type: action.metricType,
          from_date: fromDate,
          to_date: now,
          interval: granularity

        }).pipe(
          map((res: ServingGetEndpointMetricsHistoryResponse) => {
            let result = [];
            const averageOrTotal = [MetricTypeEnum.CpuUtil, MetricTypeEnum.GpuUtil, MetricTypeEnum.LatencyMs].includes(action.metricType) ? 'Mean' : 'Total';
            // For count charts show only total.
            if (['cpu_count', 'gpu_count'].includes(action.metricType)) {
              result.push(activitySeriesToTopic(res.total, 0, averageOrTotal));
            } else {
              result = result.concat(Object.keys(res.instances || {}).length > 1 ? [activitySeriesToTopic(res.total, 0, averageOrTotal)] : []);
              result = result.concat(...Object.keys(res.instances).map((series, index) => activitySeriesToTopic(res.instances[series], index + 1)));
            }


            const newTopics = result.map(topic => topic.topicID);
            const oldTopics = currentStats?.filter(topic => !newTopics.includes(topic.topicID)) ?? [];

            if (refresh) {
              const rangeStartFrom = (now - range) * 1000;
              result = result.map(topic => ({
                ...topic,
                dates: [
                  ...(currentStats?.find(t => t.topicName === topic.topicName)?.dates.filter(date => date.originalDate > rangeStartFrom) ?? []),
                  ...topic.dates
                ].sort((a, b) => a.originalDate - b.originalDate)
              })).concat(oldTopics);
            }
            return ServingActions.setStats({data: {[action.metricType]: result} as Record<MetricTypeEnum, Topic[]>});
          }),
          catchError(error => action.refresh ?
            of(requestFailed(error)) :
            of(addMessage(MESSAGES_SEVERITY.WARN, 'Failed to fetch history \n' + JSON.stringify(error)))
          )
        );
      })
    );
  });

  buildModelReference = createEffect(() => this.actions$.pipe(
    ofType(ServingActions.getModelsSourceLinks),
    switchMap(action => {
      return forkJoin([...action.instances.map(instance => {
        const instanceId = instance.reference.find(ref => ref.type === ContainerInstanceStatsReference.TypeEnum.AppInstance);
        const modelId = instance.reference.find(ref => ref.type === ContainerInstanceStatsReference.TypeEnum.Model);
        const taskId = instance.reference.find(ref => ref.type === ContainerInstanceStatsReference.TypeEnum.Task);
        const url = instance.reference.find(ref => ref.type === ContainerInstanceStatsReference.TypeEnum.Url);
        if (instanceId) {
          return this.tasksApi.tasksGetAllEx({id: [instanceId.value], only_fields: ['application.app_id', 'name']})
            .pipe(
              map(res => ({appId: res.tasks[0].application?.app_id?.id, name: res.tasks[0].name})),
              map(({name, appId}) => ({name, link: `/applications/${appId}/info;experimentId=${instanceId.value}?instancesFilter=All`}))
            );
        } else if (modelId && action.insideModel) {
          return this.modelsApi.modelsGetAllEx({id: [modelId.value], only_fields: ['project', 'name']})
            .pipe(
              map(res => ({name: res.models[0].name, projectId: res.models[0].project.id})),
              map(({name, projectId}) => ({name, link: `/projects/${projectId}/models/${modelId.value}/output/general`}))
            );
        } else if (taskId) {
          return this.tasksApi.tasksGetAllEx({id: [taskId.value], only_fields: ['project', 'name']})
            .pipe(
              map(res => ({name: res.tasks[0].name, projectId: res.tasks[0].project.id})),
              map(({name, projectId}) => ({name, link: `/projects/${projectId}/experiments/${taskId.value}/output/execution`}))
            );
        } else {
          return of({name: url?.value, link: url?.value});
        }
      })]);
    }),
    map((links) => ServingActions.setModelsSourceLinks({modelsLinks: links}))
  ));

}
