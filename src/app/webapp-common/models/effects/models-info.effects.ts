import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {Action, Store} from '@ngrx/store';
import {
  catchError,
  debounceTime,
  expand,
  filter,
  map,
  mergeMap,
  reduce,
  shareReplay,
  switchMap,
} from 'rxjs/operators';
import {ApiModelsService} from '~/business-logic/api-services/models.service';
import {ModelsGetAllResponse} from '~/business-logic/model/models/modelsGetAllResponse';
import {requestFailed} from '../../core/actions/http.actions';
import {activeLoader, deactivateLoader, setBackdrop, setServerError} from '../../core/actions/layout.actions';
import {selectAppVisible} from '../../core/reducers/view.reducer';
import * as infoActions from '../actions/models-info.actions';
import {resetActiveSection} from '../actions/models-info.actions';
import * as viewActions from '../actions/models-view.actions';
import {MODELS_INFO_ONLY_FIELDS} from '../shared/models.const';
import {selectModelsList, selectSelectedModel, selectSelectedTableModel} from '../reducers';
import {SelectedModel} from '../shared/models.model';
import {selectActiveWorkspace} from '../../core/reducers/users-reducer';
import {isExample} from '../../shared/utils/shared-utils';
import {isSharedAndNotOwner} from '@common/shared/utils/is-shared-and-not-owner';
import {ApiEventsService} from '~/business-logic/api-services/events.service';
import {EMPTY, of} from 'rxjs';
import {RefreshService} from '@common/core/services/refresh.service';
import {ModelsUpdateRequest} from '~/business-logic/model/models/modelsUpdateRequest';

@Injectable()
export class ModelsInfoEffects {
  public previousSelectedLastUpdate: Date = null;
  public previousSelectedId: string;

  constructor(
    private actions$: Actions,
    private store: Store,
    private apiModels: ApiModelsService,
    private eventsService: ApiEventsService,
    private refreshService: RefreshService
) {
  }

  activeLoader = createEffect(() => this.actions$.pipe(
    ofType(infoActions.getModelInfo, infoActions.getModel, infoActions.getPlots),
    filter(action => !action?.['autoRefresh']),
    map(action => activeLoader(action.type))));

  getModel = createEffect(() => this.actions$.pipe(
    ofType(infoActions.getModel),
    concatLatestFrom(() => [
      this.store.select(selectActiveWorkspace),
      this.store.select(selectAppVisible)
    ]),
    filter(([, , visible]) => visible),
    switchMap(([action, activeWorkspace]) =>

      this.apiModels.modelsGetByIdEx({id: [action.modelId], only_fields: MODELS_INFO_ONLY_FIELDS})
        .pipe(
          mergeMap((res: ModelsGetAllResponse) => {
            const model = res.models[0] as SelectedModel;
            this.previousSelectedLastUpdate = model.last_change;
            const actions = [deactivateLoader(action.type)] as Action[];
            if (model) {
              model.readOnly = isExample(model) || isSharedAndNotOwner(model, activeWorkspace);
              actions.push(infoActions.setModelInfo({model}));
            }
            return actions;
          }),
          catchError(error => [
            requestFailed(error),
            deactivateLoader(action.type),
            setServerError(error, null, 'Fetch Model failed')
          ])
        )
    )
  ));

  getModelInfo$ = createEffect(() => this.actions$.pipe(
    ofType(infoActions.getModelInfo, infoActions.refreshModelInfo),
    concatLatestFrom(() => [
      this.store.select(selectSelectedTableModel),
      this.store.select(selectSelectedModel),
      this.store.select(selectModelsList),
      this.store.select(selectActiveWorkspace),
      this.store.select(selectAppVisible)
    ]),
    // filter(([,, , visible]) => visible),
    switchMap(([action, tableSelected, selected, models, , visible]) => {
        const currentSelected = tableSelected || selected;
        if (this.previousSelectedId && currentSelected?.id != this.previousSelectedId) {
          this.previousSelectedLastUpdate = null;
        }
        this.previousSelectedId = currentSelected?.id ?? action.id;
        if (!currentSelected || !visible) {
          return of([action, null, tableSelected, selected]);
        }

        const listed = models?.find(e => e.id === currentSelected?.id);
        return (listed ? of(listed) :

            this.apiModels.modelsGetByIdEx({id: [selected?.id ?? action.id], only_fields: ['last_change']}).pipe(map(res => res.models[0]))
        ).pipe(map(model => [action, model?.last_change ?? model?.last_update, model, selected]));
      }
    ),
    filter(([action, , tableSelected, selected]) => (action.type !== infoActions.refreshModelInfo.type || (!tableSelected) || (tableSelected?.id === selected?.id))),
    switchMap(([action, updateTime]) => {
      // else will deactivate loader
      if (
        !updateTime ||
        (new Date(this.previousSelectedLastUpdate) < new Date(updateTime)) ||
        action.type === infoActions.modelDetailsUpdated.type
      ) {
        const autoRefresh = action.type === infoActions.refreshModelInfo.type;
        if (autoRefresh) {
          this.refreshService.trigger(true);
        }
        return [
          deactivateLoader(action.type),
          infoActions.getModel({modelId: action.id, autoRefresh}),
        ];
      } else {
        return [deactivateLoader(action.type)];
      }
    })
  ));

  editModel$ = createEffect(() => this.actions$.pipe(
    ofType(infoActions.editModel),
    debounceTime(1000),
    switchMap((action) => {
      const parent = action.model.parent ? (action.model.parent as any).id : undefined;
      return this.apiModels.modelsEdit({
        model: action.model.id, ...action.model,
        project: action.model.project?.id,
        task: action.model.task?.id,
        parent
      })
        .pipe(
          mergeMap(() => [
            infoActions.modelDetailsUpdated({id: action.model.id, changes: action.model as unknown as Partial<ModelsUpdateRequest>}),
            infoActions.setSavingModel(false),
            setBackdrop({active: false})
          ]),
          catchError(err => [
            requestFailed(err),
            setServerError(err, null, 'edit models failed'),
            setBackdrop({active: false}),
            infoActions.getModelInfo({id: action.model.id}),
          ])
        );
    }),
    shareReplay(1)
  ));

  saveModelMetadata$ = createEffect(() => this.actions$.pipe(
    ofType(infoActions.saveMetaData),
    concatLatestFrom(() => this.store.select(selectSelectedModel)),
    mergeMap(([action, selectedModel]) =>
      this.apiModels.modelsEdit({model: selectedModel.id, metadata: action.metadata})
        .pipe(
          mergeMap(() => [
            infoActions.modelDetailsUpdated({id:selectedModel.id, changes:{metadata: action.metadata} as Partial<ModelsUpdateRequest>}),
            infoActions.getModelInfo({id: selectedModel.id}),
            infoActions.setSavingModel(false),
            resetActiveSection(),
            setBackdrop({active: false})
          ]),
          catchError(err => [
            setBackdrop({active: false}),
            requestFailed(err),
            setServerError(err, null, 'Update metadata failed'),
          ])
        )
    ),
    shareReplay(1)
  ));


  updateModelDetails$ = createEffect(() => this.actions$.pipe(
    ofType(infoActions.updateModelDetails),
    concatLatestFrom(() => this.store.select(selectSelectedModel)),
    mergeMap(([action, selectedModel]) =>
      this.apiModels.modelsUpdate({model: action.id, ...action.changes})
        .pipe(
          mergeMap((res) => {
            const changes = res?.fields || action.changes;
            return [
              viewActions.updateModel({id: action.id, changes}),
              ...(selectedModel?.id === action.id ?
                  [infoActions.modelDetailsUpdated({id: action.id, changes})]
                  : []
              ),
              ...(changes.tags ? [viewActions.getTags()] : [])
            ];
          }),
          catchError(err => [
            requestFailed(err),
            setServerError(err, null, 'Update models failed'),
            infoActions.getModelInfo({id: action.id}),
          ])
        )
    ),
    shareReplay(1)
  ));

  fetchExperimentPlots$ = createEffect(() => this.actions$.pipe(
    ofType(infoActions.getPlots),

    switchMap(action => this.eventsService.eventsGetTaskPlots({task: action.id, model_events: true}).pipe(
      map(res => [res.plots.length, res]),
      expand(([plotsLength, data]) => plotsLength < data.total

        ? this.eventsService.eventsGetTaskPlots({task: action.id, iters: 1, scroll_id: data.scroll_id})
          .pipe(map(res => [plotsLength + res.plots.length, res]))
        : EMPTY
      ),
      reduce((acc, [, data]) => acc.concat(data.plots), [])
    )),
    mergeMap((allPlots: any) => [
      infoActions.setPlots({plots: allPlots}),
      deactivateLoader(infoActions.getPlots.type)
    ]),
    catchError(error => [
      requestFailed(error),
      deactivateLoader(infoActions.getPlots.type),
      deactivateLoader(infoActions.refreshModelInfo.type),
      setServerError(error, null, 'Failed to get Plot Charts')
    ])
  ));
}
