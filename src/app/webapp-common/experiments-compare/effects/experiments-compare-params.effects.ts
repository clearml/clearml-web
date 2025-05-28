import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {Store} from '@ngrx/store';
import {activeLoader, deactivateLoader, setServerError} from '../../core/actions/layout.actions';
import {catchError, filter, map, mergeMap, switchMap} from 'rxjs/operators';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {ExperimentParamsReverterService} from '../services/experiment-params-reverter.service';
import {requestFailed} from '../../core/actions/http.actions';
import {selectExperimentIdsParams, selectExperimentsParams} from '../reducers';
import {Observable, of} from 'rxjs';
import {COMPARE_PARAMS_ONLY_FIELDS} from '~/features/experiments-compare/experiments-compare-consts';
import {IExperimentDetail} from '~/features/experiments-compare/experiments-compare-models';
import {REFETCH_EXPERIMENT_REQUESTED, refetchExperimentRequested} from '../actions/compare-header.actions';
import {paramsActions} from '../actions/experiments-compare-params.actions';
import {ExperimentDetailBase, ExperimentParams} from '../shared/experiments-compare-details.model';
import {selectActiveWorkspaceReady} from '~/core/reducers/view.reducer';
import {ApiModelsService} from '~/business-logic/api-services/models.service';
import {ModelDetailsReverterService} from '@common/experiments-compare/services/model-details-reverter.service';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';

@Injectable()
export class ExperimentsCompareParamsEffects {

  constructor(private actions$: Actions,
              private store: Store,
              private tasksApi: ApiTasksService,
              private modelsApi: ApiModelsService,
              private experimentParamsReverter: ExperimentParamsReverterService,
              private modelDetailsReverter: ModelDetailsReverterService,
  ) {
  }

  activeLoader$ = createEffect(() => this.actions$.pipe(
    ofType(paramsActions.experimentListUpdated, REFETCH_EXPERIMENT_REQUESTED),
    map(action => activeLoader(action.type))
  ));

  updateExperimentsList$ = createEffect(() => this.actions$.pipe(
    ofType(paramsActions.experimentListUpdated),
    switchMap((action) => this.store.select(selectActiveWorkspaceReady)
      .pipe(
        filter(ready => ready),
        map(() => action)
      )
    ),
    concatLatestFrom(() => this.store.select(selectExperimentIdsParams)),
    switchMap(([action, oldExperimentIds]) => {
        const newExperimentIds = action.ids.filter(id => !oldExperimentIds.includes(id));
        return this.fetchEntity$(newExperimentIds, action.entity)
          .pipe(
            concatLatestFrom(() => this.store.select(selectExperimentsParams)),
            // get only the relevant experiments
            map(([experiments, oldExperiments]: [ExperimentDetailBase[], ExperimentParams[]]) =>
              oldExperiments.filter(exp => action.ids.includes(exp.id)).concat(experiments as ExperimentParams[])),
            map(experiments => action.ids.map(id => experiments.find(experiment => experiment.id === id))),
            mergeMap(experiments => [
              deactivateLoader(action.type),
              paramsActions.setExperiments({experiments})
            ]),
            catchError(error => [
                requestFailed(error),
                deactivateLoader(action.type),
                setServerError(error, null, 'The attempt to retrieve your data failed. Refresh your browser and try again.')
              ]
            )
          );
      }
    )
  ));

  refetchExperiment$ = createEffect(() => this.actions$.pipe(
    ofType(refetchExperimentRequested),
    concatLatestFrom(() => this.store.select(selectExperimentIdsParams)),
    switchMap(([action, newExperimentIds]) =>
      this.fetchEntity$(newExperimentIds, action.entity).pipe(
        mergeMap(experiments => [
          deactivateLoader(action.type),
          paramsActions.setExperiments({experiments: experiments as ExperimentParams[]})
        ]),
        catchError(error => [
          requestFailed(error),
          deactivateLoader(action.type),
          setServerError(
            error, null,
            'The attempt to retrieve your experiment data failed. Refresh your browser and try again.',
            action.autoRefresh
          )
        ])
      )),
  ));

  fetchEntity$(ids, entity) {
    return entity === EntityTypeEnum.model ? this.fetchModelParams$(ids) : this.fetchExperimentParams$(ids);
  }

  fetchExperimentParams$(ids): Observable<Array<IExperimentDetail>> {
    return ids.length > 0 ?
      this.tasksApi.tasksGetAllEx({
        id: ids,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        only_fields: COMPARE_PARAMS_ONLY_FIELDS
      })
        .pipe(map(res => this.experimentParamsReverter.revertExperiments(ids, res.tasks)))
      : of([]);
  }

  fetchModelParams$(ids): Observable<Array<IExperimentDetail>> {
    return ids.length > 0 ?
      this.modelsApi.modelsGetAllEx({
        id: ids,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        only_fields: ['company', 'id', 'labels', 'name', 'ready', 'tags', 'system_tags', 'user.name', 'parent', 'project.name', 'design', 'last_iteration', 'last_update']
      })
        .pipe(map(res => {
          try {
            return this.modelDetailsReverter.revertModelsDesign(ids, res.models, false);
          } catch (e) {
            return this.modelDetailsReverter.revertModelsDesign(ids, res.models, true);
          }
        }))
      : of([]);
  }
}

