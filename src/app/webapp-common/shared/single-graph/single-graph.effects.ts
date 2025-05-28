import { Injectable } from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {
  getGraphDisplayFullDetailsScalars, getNextPlotSample, getPlotSample, mergeGraphDisplayFullDetailsScalars, setCurrentPlot, setPlotIterations, setPlotViewerScrollId, setViewerBeginningOfTime,
  setViewerEndOfTime,
  setXtypeGraphDisplayFullDetailsScalars
} from '@common/shared/single-graph/single-graph.actions';
import {catchError, expand, map, mergeMap, reduce, switchMap, withLatestFrom} from 'rxjs/operators';
import {EMPTY} from 'rxjs';
import {deactivateLoader, setServerError} from '@common/core/actions/layout.actions';
import {requestFailed} from '@common/core/actions/http.actions';
import {Store} from '@ngrx/store';
import {selectFullScreenChart, selectFullScreenChartIsOpen, selectFullScreenChartXtype, selectPlotViewerScrollId, SingleGraphState} from '@common/shared/single-graph/single-graph.reducer';
import {ApiEventsService} from '~/business-logic/api-services/events.service';
import {PlotSampleResponse} from '~/business-logic/model/events/plotSampleResponse';
import {selectRouterConfig} from '@common/core/reducers/router-reducer';
import {concatLatestFrom} from '@ngrx/operators';



@Injectable()
export class SingleGraphEffects {


  constructor(private actions$: Actions, private store: Store, private eventsApi: ApiEventsService) {}

  fetchPlotsForIter$ = createEffect(() => this.actions$.pipe(
    ofType(getPlotSample),
    withLatestFrom(
      this.store.select(selectPlotViewerScrollId),
      this.store.select(selectRouterConfig).pipe(map(config => !!config?.includes('models')))
    ),
    switchMap(([action, scrollId, model]) =>
      this.eventsApi.eventsGetPlotSample({
        /* eslint-disable @typescript-eslint/naming-convention */
        task: action.task,
        iteration: action.iteration,
        metric: action.metric,
        scroll_id: scrollId,
        navigate_current_metric: false,
        ...(model && {model_events: true})
        /* eslint-enable @typescript-eslint/naming-convention */
      })
        .pipe(
          mergeMap((res: PlotSampleResponse) => [
            // eslint-disable-next-line @typescript-eslint/naming-convention
            setPlotIterations({min_iteration: res.min_iteration, max_iteration: res.max_iteration}),
            setCurrentPlot({event: res.events}), deactivateLoader(action.type),
            setPlotViewerScrollId({scrollId: res.scroll_id}),
          ]),
          catchError(error => [requestFailed(error), deactivateLoader(action.type)])
        )
    )
  ));


  getNextPlotsForIter$ = createEffect(() => this.actions$.pipe(
    ofType(getNextPlotSample),
    concatLatestFrom(()=> [this.store.select(selectPlotViewerScrollId),
      this.store.select(selectRouterConfig).pipe(map(config => !!config?.includes('models')))
    ]),
    switchMap(([action, scrollId, model]) =>
      this.eventsApi.eventsNextPlotSample({
        /* eslint-disable @typescript-eslint/naming-convention */
        task: action.task,
        scroll_id: scrollId,
        navigate_earlier: action.navigateEarlier,
        ...(action.iteration && {next_iteration: true}),
        ...(model && {model_events: true})
        /* eslint-enable @typescript-eslint/naming-convention */
      })
        .pipe(
          mergeMap(res => {
            if (res.events.length === 0) {
              return [action.navigateEarlier ? setViewerBeginningOfTime({beginningOfTime: true}) : setViewerEndOfTime({endOfTime: true})];
            } else {
              return [
                // eslint-disable-next-line @typescript-eslint/naming-convention
                setPlotIterations({min_iteration: res.min_iteration, max_iteration: res.max_iteration}),
                setCurrentPlot({event: res.events}), deactivateLoader(action.type),
                setPlotViewerScrollId({scrollId: res.scroll_id}),
                !action.navigateEarlier ? setViewerBeginningOfTime({beginningOfTime: false}) : setViewerEndOfTime({endOfTime: false})
              ];
            }
          }),
          catchError(error => [requestFailed(error), deactivateLoader(action.type)])
        )
    )
  ));


  fetchExperimentScalarFullDetails$ = createEffect(() => this.actions$.pipe(
    ofType(getGraphDisplayFullDetailsScalars),
    withLatestFrom(
      this.store.select(selectFullScreenChart),
      this.store.select(selectFullScreenChartXtype),
      this.store.select(selectRouterConfig).pipe(map(config => !!config?.includes('models')))
    ),
    switchMap(([action, fullScreenData, chartType, model]) => this.eventsApi.eventsScalarMetricsIterRaw({
      task: action.task,
      metric: action.metric,
      key: action.key ? action.key : chartType,
      /* eslint-disable @typescript-eslint/naming-convention */
      count_total: true,
      ...(model && {model_events: true}),
      batch_size: 200000,
    })
      .pipe(
        withLatestFrom(this.store.select(selectFullScreenChartIsOpen)),
        map(([res, isOpen]) => [res.returned, res, isOpen]),
        expand(([returnedTillNow, data, isOpen]) => (returnedTillNow < data.total) && isOpen ? this.eventsApi.eventsScalarMetricsIterRaw({
              task: action.task,
              metric: action.metric,
              scroll_id: data.scroll_id,
              key: action.key ? action.key : chartType,
              count_total: true,
            ...(model && {model_events: true}),
              batch_size: 200000,
              /* eslint-enable @typescript-eslint/naming-convention */
            }).pipe(
              withLatestFrom(this.store.select(selectFullScreenChartIsOpen)),
              map(([res, isOpen2]) => [returnedTillNow + res.returned, res, isOpen2])
            )
            : EMPTY
        ),
        reduce((acc, [, data]) => {
          const graphData = acc ? acc : fullScreenData.data;
          return graphData.map((item) => ({
            ...item,
            y: (acc ? item.y : []).concat(data?.variants?.[item.name]?.y || []),
            x: (acc ? item.x : []).concat(data?.variants?.[item.name]?.[action.key || chartType] || [])
          }));
        }, null),
        mergeMap(data => [
          ...action.key ? [setXtypeGraphDisplayFullDetailsScalars({xAxisType: action.key})] : [],
          mergeGraphDisplayFullDetailsScalars({data}),
          deactivateLoader(getGraphDisplayFullDetailsScalars.type),
        ]),
        catchError(error => [
          requestFailed(error),
          deactivateLoader(getGraphDisplayFullDetailsScalars.type),
          setServerError(error, null, 'Failed to get full detailed Chart')
        ])))
  ));

}
