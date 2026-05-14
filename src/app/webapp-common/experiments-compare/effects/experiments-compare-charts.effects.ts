import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {Store} from '@ngrx/store';
import * as chartActions from '../actions/experiments-compare-charts.actions';
import {activeLoader, deactivateLoader, setServerError} from '../../core/actions/layout.actions';
import {
  catchError,
  debounceTime,
  mergeMap,
  map,
  filter,
  switchMap,
  expand,
  reduce
} from 'rxjs/operators';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {ApiEventsService} from '~/business-logic/api-services/events.service';
import {requestFailed} from '../../core/actions/http.actions';
import {selectCompareHistogramCacheAxisType} from '../reducers';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {selectActiveWorkspaceReady} from '~/core/reducers/view.reducer';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {EMPTY, iif, of} from 'rxjs';
import {merge} from 'lodash-es';
import {ApiModelsService} from '~/business-logic/api-services/models.service';
import {getGlobalLegendData, setAxisCache, setGlobalLegendData} from '../actions/experiments-compare-charts.actions';
import {EventsGetTaskPlotsResponse} from '~/business-logic/model/events/eventsGetTaskPlotsResponse';
import {EventsGetMultiTaskPlotsResponse} from '~/business-logic/model/events/eventsGetMultiTaskPlotsResponse';
import {experimentUpdatedSuccessfully} from '@common/experiments/actions/common-experiments-info.actions';
import {modelUpdatedSuccessfully} from '@common/models/actions/models-info.actions';
import {selectRouterData, selectRouterParams} from '@common/core/reducers/router-reducer';
import {RefreshService} from '@common/core/services/refresh.service';


@Injectable()
export class ExperimentsCompareChartsEffects {

  private readonly actions$ =  inject(Actions);
  private readonly store =  inject(Store);
  private readonly tasksApi =  inject(ApiTasksService);
  private readonly eventsApi =  inject(ApiEventsService);
  private readonly modelsApi =  inject(ApiModelsService)
  private readonly refresh = inject(RefreshService);


  activeLoader = createEffect(() => this.actions$.pipe(
    ofType(chartActions.getMultiScalarCharts, chartActions.getMultiPlotCharts),
    filter(action => !(action as any).payload?.autoRefresh),
    map(action => activeLoader(action.type))
  ));

  updateGlobalLegendAfterRename$ = createEffect(() => this.actions$.pipe(
    ofType(experimentUpdatedSuccessfully, modelUpdatedSuccessfully),
    concatLatestFrom(() => [
        this.store.select(selectRouterParams).pipe(
          map(params => params?.ids?.split(',') ?? [])),
        this.store.select(selectRouterData).pipe(map(data => data?.entityType))
      ]
    ),
    filter(([, ids]) => ids.length > 0),
    map(([, ids, entityType]) => {
      this.refresh.tick.next(true)
      return getGlobalLegendData({ids, entity: entityType})
    })
  ));

  getGlobalLegendData$ = createEffect(() => this.actions$.pipe(
    ofType(chartActions.getGlobalLegendData),
    switchMap(action => iif(() => action.entity === EntityTypeEnum.model,
        this.modelsApi.modelsGetAllEx({
          id: action.ids,
          only_fields: ['name', 'tags', 'project', 'system_tags', 'last_update', 'created']
        }),
        this.tasksApi.tasksGetAllEx({
          id: action.ids,
          only_fields: ['name', 'tags', 'project', 'system_tags', 'last_update', 'created']
        })).pipe(
        map(res => {
          const data = Object.values(res)[0] as {
            id: string,
            tags: string[],
            system_tags: string[],
            name: string,
            project: { id: string },
            last_update?: Date,
            created?: string
          }[];
          const ordered = action.ids.map(id => data.find(exp => exp.id === id)).filter(exp => exp)
            .map(exp => ({...exp, systemTags: exp.system_tags}));
          return setGlobalLegendData({data: ordered});
        })
      )
    )
  ));

  fetchExperimentScalarSingleValue$ = createEffect(() => this.actions$.pipe(
    ofType(chartActions.getMultiSingleScalars),
    switchMap((action) => this.eventsApi.eventsGetTaskSingleValueMetrics({
      tasks: action.taskIds,
      metrics: action.metrics,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      model_events: action.entity === EntityTypeEnum.model
    })),
    map((res) => chartActions.setExperimentMultiScalarSingleValue({name: {tasks: res?.tasks}})
    )
  ));

  getMultiScalarCharts = createEffect(() => this.actions$.pipe(
    ofType(chartActions.getMultiScalarCharts),
    switchMap((action) => this.store.select(selectActiveWorkspaceReady).pipe(
      filter(ready => ready),
      map(() => action))),
    debounceTime(200),
    concatLatestFrom(() => this.store.select(selectCompareHistogramCacheAxisType)),
    mergeMap(([action, prevAxisType]) => {
      if ([ScalarKeyEnum.IsoTime, ScalarKeyEnum.Timestamp].includes(prevAxisType) &&
        [ScalarKeyEnum.IsoTime, ScalarKeyEnum.Timestamp].includes(action.xAxisType) &&
        prevAxisType !== action.xAxisType
      ) {
        return [setAxisCache({axis: action.xAxisType}), deactivateLoader(action.type)];
      }
      return this.eventsApi.eventsMultiTaskScalarMetricsIterHistogram({
        tasks: action.taskIds,
        metrics: action.metrics,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        model_events: action.entity === EntityTypeEnum.model,
        key: !action.xAxisType || action.xAxisType === ScalarKeyEnum.IsoTime ? ScalarKeyEnum.Timestamp : action.xAxisType
      }).pipe(
        mergeMap(res => [
          // also here
          chartActions.setExperimentHistogram({payload: res, axisType: action.xAxisType}),
          deactivateLoader(action.type)]
        ),
        catchError(error => [
          requestFailed(error), deactivateLoader(action.type),
          setServerError(error, null, 'Failed to get Scalar Charts', action.autoRefresh)
        ])
      );
    })
  ));

  getMultiPlotCharts = createEffect(() => this.actions$.pipe(
      ofType(chartActions.getMultiPlotCharts),
      switchMap(action => {
        if (action.taskIds.length > 0 && action.metrics?.length > 0) {
          return of(action).pipe(
            debounceTime(200),
            switchMap(a => this.eventsApi.eventsGetMultiTaskPlots({
              tasks: a.taskIds,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              model_events: a.entity === EntityTypeEnum.model,
              metrics: a.metrics,
              last_iters_per_task_metric: true,
              iters: 1
            }).pipe(
              map((res: EventsGetMultiTaskPlotsResponse) => [res.returned, res] as [number, EventsGetMultiTaskPlotsResponse]),
              expand(([plotsLength, data]) => (data.total < 10000 && data.returned > 0)
                // eslint-disable-next-line @typescript-eslint/naming-convention
                ? this.eventsApi.eventsGetMultiTaskPlots({
                  tasks: a.taskIds,
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  model_events: a.entity === EntityTypeEnum.model,
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  scroll_id: data.scroll_id,
                  metrics: a.metrics,
                  last_iters_per_task_metric: true,
                  iters: 1
                }).pipe(
                  map((res: EventsGetMultiTaskPlotsResponse) => [plotsLength + res.returned, res] as [number, EventsGetTaskPlotsResponse])
                )
                : EMPTY
              ),
              reduce((acc, [, data]) => merge(acc, data.plots), {})
            ))
          );
        } else {
          return of({});
        }
      }),
      mergeMap(plots => [
        chartActions.setExperimentPlots({plots}),
        deactivateLoader(chartActions.getMultiPlotCharts.type)]),
      catchError(error => [
        requestFailed(error), deactivateLoader(chartActions.getMultiPlotCharts.type)
        // setServerError(error, null, 'Failed to get Plot Charts', action.autoRefresh)
      ])
    )
  );

}
