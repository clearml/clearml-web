import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {Store} from '@ngrx/store';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {ApiEventsService} from '~/business-logic/api-services/events.service';
import {catchError, expand, filter, map, mergeMap, reduce, switchMap, withLatestFrom} from 'rxjs/operators';
import {activeLoader, deactivateLoader, setServerError} from '../../core/actions/layout.actions';
import {requestFailed} from '../../core/actions/http.actions';
import * as outputActions from '../actions/common-experiment-output.actions';
import {
  Log,
  setExperimentMetricsVariantValues,
  setExperimentScalarSingleValue
} from '../actions/common-experiment-output.actions';
import {LOG_BATCH_SIZE} from '../shared/common-experiments.const';
import {
  selectExperimentHistogramCacheAxisType,
  selectPipelineSelectedStep,
  selectSelectedSettingsxAxisType
} from '../reducers';
import {refreshExperiments} from '../actions/common-experiments-view.actions';
import {EventsGetTaskLogResponse} from '~/business-logic/model/events/eventsGetTaskLogResponse';
import {ScalarKeyEnum} from '~/business-logic/model/events/scalarKeyEnum';
import {EMPTY} from 'rxjs';
import {experimentOutput, selectSelectedExperiment} from '~/features/experiments/reducers';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {EventsGetTaskPlotsResponse} from '~/business-logic/model/events/eventsGetTaskPlotsResponse';
import {ApiModelsService} from '~/business-logic/api-services/models.service';
import {UserPreferences} from '@common/user-preferences';
import {get} from 'lodash-es';
import * as actions from '@common/experiments/actions/common-experiment-output.actions';


@Injectable()
export class CommonExperimentOutputEffects {

  constructor(
    private actions$: Actions, private store: Store, private userPreferences: UserPreferences, private apiTasks: ApiTasksService,
    private modelsApi: ApiModelsService, private eventsApi: ApiEventsService
  ) {
  }

  activeLoader = createEffect(() => this.actions$.pipe(
    ofType(outputActions.experimentScalarRequested, outputActions.experimentPlotsRequested),
    filter(action => !action?.['refresh']),
    map(action => activeLoader(action.type))
  ));

  private getPathsFromAction(action): string[][] {
    switch (action.type) {
      case outputActions.toggleMetricValuesView.type:
        return [['experiments','output','metricValuesView']];
      case outputActions.setExperimentSettings.type:
        return [['experiments','output','settingsList',action.id]];
      case outputActions.removeExperimentSettings.type:
        return [['experiments','output','settingsList']];
      case outputActions.setChartSettings.type:
        return [['experiments','output','chartSettingsPerProject', action.projectId, action.id]];
    }
    return [];
  }

  setUserPreferences = createEffect(() => this.actions$.pipe(
    ofType(outputActions.toggleMetricValuesView, outputActions.setExperimentSettings, actions.setChartSettings, outputActions.removeExperimentSettings),
    concatLatestFrom(() => this.store.select(experimentOutput)),
    map(([action, state]) => {
      const paths = this.getPathsFromAction(action);
      paths.forEach(path => this.userPreferences.setPreferences(path, get(state, path.slice(2))));
    })), {dispatch: false});


  getLog$ = createEffect(() => this.actions$.pipe(
    ofType(outputActions.getExperimentLog),
    switchMap((action) =>
      this.eventsApi.eventsGetTaskLog({
        /* eslint-disable @typescript-eslint/naming-convention */
        task: action.id,
        batch_size: LOG_BATCH_SIZE,
        navigate_earlier: action.direction !== 'next',
        from_timestamp: action.refresh ? null : action.from,
        /* eslint-enable @typescript-eslint/naming-convention */
      }).pipe(
        withLatestFrom(
          this.store.select(selectSelectedExperiment),
          this.store.select(selectPipelineSelectedStep)),
        mergeMap(([res, selectedTask, pipeStep]: [EventsGetTaskLogResponse, IExperimentInfo, IExperimentInfo]) => [
          ...([pipeStep?.id, selectedTask?.id].includes(action.id) || selectedTask === null ?
              [
                outputActions.setExperimentLog({
                  events: res.events.map((e: Log) => ({...e, msg: e.msg?.replace(/\0/g, '')})),
                  total: res.total,
                  direction: action.direction,
                  refresh: action.refresh
                }),
                ...(!(action.refresh || action.from) ? [outputActions.setExperimentLogAtStart({atStart: true})] : [])
              ] :
              action.direction === 'prev' && res.total > 0 && res.events?.length === 0 ?
                [outputActions.setExperimentLogAtStart({atStart: true})] :
                [outputActions.setExperimentLogLoading({loading: false})]
          ),
          deactivateLoader(action.type),
          deactivateLoader(refreshExperiments.type)
        ]),
        catchError(error => [
          requestFailed(error),
          deactivateLoader(action.type),
          deactivateLoader(refreshExperiments.type),
          ...(action.refresh || action.from || action.autoRefresh
            // hide weird missing id error
          || error.error.meta.result_subcode === 101 ? (action.id === '*' ? [outputActions.setExperimentLog({
            events: [],
            total: 0,
            direction: action.direction,
            refresh: action.refresh
          })] : []) : [setServerError(error, null, 'Failed to fetch log')]),
          outputActions.setExperimentLogLoading({loading: false})
        ])
      )
    )
  ));

  fetchExperimentPlots$ = createEffect(() => this.actions$.pipe(
    ofType(outputActions.experimentPlotsRequested),
    switchMap(action => this.eventsApi.eventsGetTaskPlots({task: action.task, iters: 1}).pipe(
      map((res: EventsGetTaskPlotsResponse) => [res.plots.length, res] as [number, EventsGetTaskPlotsResponse]),
      expand(([plotsLength, data]) => (data.total < 10000 ? (plotsLength < data.total) : (data.plots.length > 0))
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ? this.eventsApi.eventsGetTaskPlots({task: action.task, iters: 1, scroll_id: data.scroll_id}).pipe(
          map((res: EventsGetTaskPlotsResponse) => [plotsLength + res.plots.length, res] as [number, EventsGetTaskPlotsResponse])
        )
        : EMPTY
      ),
      reduce((acc, [, data]) => acc.concat(data.plots), [])
    )),
    mergeMap((allPlots: any) => [
      outputActions.setExperimentPlots({plots: allPlots}),
      deactivateLoader(refreshExperiments.type),
      deactivateLoader(outputActions.experimentPlotsRequested.type),
    ]),
    catchError(error => [
      requestFailed(error),
      deactivateLoader(outputActions.experimentPlotsRequested.type),
      deactivateLoader(refreshExperiments.type),
      setServerError(error, null, 'Failed to get Plot Charts')
    ])
  ));

  fetchExperimentScalarSingleValue$ = createEffect(() => this.actions$.pipe(
    ofType(outputActions.experimentScalarRequested),
    filter(action => !action.skipSingleValue),
    switchMap((action) => this.eventsApi.eventsGetTaskSingleValueMetrics({
      tasks: [action.experimentId],
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ...(action.model && {model_events: true})
    })),
    mergeMap((res) => [setExperimentScalarSingleValue(res?.tasks[0])]
    )
  ));

  fetchExperimentScalarMetricVariantsTableData$ = createEffect(() => this.actions$.pipe(
    ofType(outputActions.experimentScalarRequested),
    filter(action=> !action.model),
    switchMap((action) => this.apiTasks.tasksGetAllEx({
      id: [action.experimentId],
      only_fields: ['last_metrics']
    })),
    mergeMap((res) => [setExperimentMetricsVariantValues({lastMetrics: res?.tasks[0].last_metrics})]
    )
  ));

  fetchModelScalarMetricVariantsTableData$ = createEffect(() => this.actions$.pipe(
    ofType(outputActions.experimentScalarRequested),
    filter(action=> !!action.model),
    switchMap((action) => this.modelsApi.modelsGetAllEx({
      id: [action.experimentId],
      only_fields: ['last_metrics']
    })),
    mergeMap((res) => [setExperimentMetricsVariantValues({lastMetrics: res?.models[0].last_metrics})]
    )
  ));

  fetchExperimentScalar$ = createEffect(() => this.actions$.pipe(
    ofType(outputActions.experimentScalarRequested),
    concatLatestFrom((action) => [
        this.store.select(selectSelectedSettingsxAxisType(action.model)),
        this.store.select(selectExperimentHistogramCacheAxisType)
      ]
    ),
    switchMap(([action, axisType, prevAxisType]) => {
        if (!action.refresh && [ScalarKeyEnum.IsoTime, ScalarKeyEnum.Timestamp].includes(prevAxisType) &&
          [ScalarKeyEnum.IsoTime, ScalarKeyEnum.Timestamp].includes(axisType)) {
          return [
            deactivateLoader(refreshExperiments.type),
            deactivateLoader(action.type)
          ];
        }

        return this.eventsApi.eventsScalarMetricsIterHistogram({
          task: action.experimentId,
          key: axisType === ScalarKeyEnum.IsoTime ? ScalarKeyEnum.Timestamp : axisType,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          ...(action.model && {model_events: true})
        })
          .pipe(
            mergeMap(res => [
              outputActions.setHistogram({histogram: res, axisType}),
              deactivateLoader(refreshExperiments.type),
              deactivateLoader(action.type)
            ]),
            catchError(error => [
              requestFailed(error),
              deactivateLoader(action.type),
              deactivateLoader(refreshExperiments.type),
              setServerError(error, null, 'Failed to get Scalar Charts')
            ])
          );
      }
    )
  ));
}
