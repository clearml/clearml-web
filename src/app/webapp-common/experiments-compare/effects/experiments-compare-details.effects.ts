import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {select, Store} from '@ngrx/store';
import {activeLoader, deactivateLoader, setServerError} from '../../core/actions/layout.actions';
import {catchError, mergeMap, map, switchMap, withLatestFrom, filter} from 'rxjs/operators';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {ExperimentDetailsReverterService} from '../services/experiment-details-reverter.service';
import {requestFailed} from '../../core/actions/http.actions';
import {selectExperimentIdsDetails, selectExperimentsDetails, selectModelIdsDetails} from '../reducers';
import {forkJoin, Observable, of} from 'rxjs';
import {IExperimentDetail} from '~/features/experiments-compare/experiments-compare-models';
import {REFETCH_EXPERIMENT_REQUESTED, refetchExperimentRequested} from '../actions/compare-header.actions';
import {experimentListUpdated, setExperiments, setModels} from '../actions/experiments-compare-details.actions';
import {getCompareDetailsOnlyFields} from '~/features/experiments-compare/experiments-compare-consts';
import {selectHasDataFeature} from '~/core/reducers/users.reducer';
import {selectActiveWorkspaceReady} from '~/core/reducers/view.reducer';
import {ApiModelsService} from '~/business-logic/api-services/models.service';
import {ModelDetailsReverterService} from '@common/experiments-compare/services/model-details-reverter.service';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {ModelDetail} from '@common/experiments-compare/shared/experiments-compare-details.model';

@Injectable()
export class ExperimentsCompareDetailsEffects {

  constructor(private actions$: Actions,
              private tasksApi: ApiTasksService,
              private modelsApi: ApiModelsService,
              private store: Store,
              private experimentDetailsReverter: ExperimentDetailsReverterService,
              private modelDetailsReverter: ModelDetailsReverterService,
  ) {
  }


  activeLoader$ = createEffect(() => this.actions$.pipe(
    ofType(experimentListUpdated, REFETCH_EXPERIMENT_REQUESTED),
    map(action => activeLoader(action.type))
  ));

  updateExperimentsDetail$ = createEffect(() => this.actions$.pipe(
    ofType(experimentListUpdated),
    switchMap((action) => this.store.select(selectActiveWorkspaceReady).pipe(
      filter(ready => ready),
      map(() => action))),
    withLatestFrom(
      this.store.pipe(select(selectExperimentIdsDetails)),
      this.store.select(selectHasDataFeature)
    ),
    switchMap(([action, oldExperimentIds, hasDataFeature]) => {
      const newExperimentIds = action.ids.filter(id => !oldExperimentIds.includes(id));
      return this.fetchEntity$(newExperimentIds, action.entity, hasDataFeature)
        .pipe(
          withLatestFrom(this.store.pipe(select(selectExperimentsDetails))),
          // get only the relevant experiments
          map(([experiments, oldExperiments]) => oldExperiments.filter(exp => action.ids.includes(exp.id)).concat(experiments)),
          map(experiments => action.ids.map(id => experiments.find(experiment => experiment.id === id))),
          mergeMap((experiments: IExperimentDetail[] | ModelDetail[]) => [
            deactivateLoader(action.type),
            this.setEntities(action, experiments)
          ]),
          catchError(error => [
            requestFailed(error),
            deactivateLoader(action.type),
            setServerError(error, null, 'The attempt to retrieve your data failed. Refresh your browser and try again.')
          ])
        );
    })
  ));

  refetchExperimentEffect$ = createEffect(() => this.actions$.pipe(
    ofType(refetchExperimentRequested),
    withLatestFrom(this.store.select(selectExperimentIdsDetails), this.store.select(selectModelIdsDetails), this.store.select(selectHasDataFeature)),
    map(([action, expIds, modelIds, hasDataFeature]: [any, string[], string[], boolean]) => [action, action.entity === EntityTypeEnum.experiment ? expIds : modelIds, hasDataFeature]),
    switchMap(([action, newExperimentIds, hasDataFeature]) => this.fetchEntity$(newExperimentIds, action.entity, hasDataFeature).pipe(
      mergeMap(experiments => [
        deactivateLoader(action.type),
        this.setEntities(action, experiments)
      ]),
      catchError(error => [
        requestFailed(error),
        deactivateLoader(action.type),
        setServerError(
          error, null,
          'The attempt to retrieve your data failed. Refresh your browser and try again.',
          action.autoRefresh
        )
      ])
    )),
  ));

  fetchEntity$(ids, entity, hasDataFeature) {
    return entity === EntityTypeEnum.model ? this.fetchModelDetails$(ids) : this.fetchExperimentDetails$(ids, hasDataFeature);
  }

  fetchExperimentDetails$(ids, hasDataFeature: boolean): Observable<IExperimentDetail[]> {
    return ids.length > 0 ?
      this.tasksApi.tasksGetAllEx({
        id: ids,

        only_fields: getCompareDetailsOnlyFields(hasDataFeature)
      }).pipe(
        map(res => this.experimentDetailsReverter.revertExperiments(ids, res.tasks))
      )
      : of([]);
  }

  fetchModelDetails$(ids: string[]): Observable<{id?: string}[]> {
    return ids.length > 0 ?
      forkJoin([
        this.modelsApi.modelsGetAllEx({
        id: ids,

        only_fields: ['company', 'created', 'last_update', 'last_iteration', 'framework', 'id', 'labels', 'name', 'ready', 'tags', 'system_tags', 'task.name', 'task.project', 'uri', 'user.name', 'parent', 'project.name', 'metadata']
      }),
        this.tasksApi.tasksGetAllEx({
          'models.input.model': ids,
          only_fields: ['name', 'models.input.model']} as any)
      ]).pipe(
        map(([modelsRes, tasksRes]) => this.modelDetailsReverter.revertModels(ids, modelsRes.models, tasksRes.tasks))
      )
      : of([]);
  }

  private setEntities(action, experiments: IExperimentDetail[] | ModelDetail[]) {
    return action.entity === EntityTypeEnum.model ?
      setModels({models: experiments as ModelDetail[]}) : setExperiments({experiments: experiments as IExperimentDetail[]});
  }
}

