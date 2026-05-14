import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {filter, map, switchMap} from 'rxjs/operators';
import {ApiTasksService} from '~/business-logic/api-services/tasks.service';
import {
  refreshIfNeeded,
  setExperimentsUpdateTime,
} from '../actions/compare-header.actions';
import { Store} from '@ngrx/store';
import {isEmpty} from 'lodash-es';
import {selectExperimentsUpdateTime} from '../reducers';
import {selectRouterParams} from '../../core/reducers/router-reducer';
import {selectAppVisible} from '../../core/reducers/view.reducer';
import {RefreshService} from '@common/core/services/refresh.service';
import {LIMITED_VIEW_LIMIT} from '@common/experiments-compare/experiments-compare.constants';
import {ActivatedRoute} from '@angular/router';
import {ApiModelsService} from '~/business-logic/api-services/models.service';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';

@Injectable()
export class CompareHeaderEffects {
  private actions = inject(Actions);
  public experimentsApi = inject(ApiTasksService);
  public modelsApi = inject(ApiModelsService);
  private store = inject(Store);
  private refresh = inject(RefreshService);
  private route = inject(ActivatedRoute)

  refreshIfNeeded = createEffect(() => this.actions.pipe(
    ofType(refreshIfNeeded),
    concatLatestFrom(() => [
      this.store.select(selectAppVisible),
      this.store.select(selectRouterParams).pipe(map(params => params?.ids?.split(','))),
      this.store.select((selectExperimentsUpdateTime)),
    ]),
    filter(([, isAppVisible, ,]) => isAppVisible),
    map(([...args]) => {
      let route = this.route.snapshot;
      let limit = false;
      while (route.firstChild) {
        route = route.firstChild;
        if (route.data.limit !== undefined) {
          limit = route.data.limit;
        }
      }
      return [...args, limit];
    }),
    switchMap(([action, , experimentsIds, experimentsUpdateTime, isLimitedView]) =>
      (action.entityType === EntityTypeEnum.model ? this.modelsApi.modelsGetAllEx({
        id: isLimitedView ? experimentsIds.slice(0, LIMITED_VIEW_LIMIT) : experimentsIds,
        only_fields: ['last_update']
      }) : this.experimentsApi.tasksGetAllEx({
        id: isLimitedView ? experimentsIds.slice(0, LIMITED_VIEW_LIMIT) : experimentsIds,
        only_fields: ['last_change']
      })).pipe(
        map((res) => {
          const updatedExperimentsUpdateTime: Record<string, Date> = {};
          res[action.entityType === EntityTypeEnum.model ? 'models' : 'tasks'].forEach(task => {
            updatedExperimentsUpdateTime[task.id] = task.last_change;
          });
          const experimentsWhereUpdated = experimentsIds.some(id =>
            new Date(experimentsUpdateTime[id]) < new Date(updatedExperimentsUpdateTime[id])
          );
          if (((!action.payload) || (!action.autoRefresh) || experimentsWhereUpdated) && !(isEmpty(experimentsUpdateTime))) {
            this.refresh.trigger(true);
          }
          return setExperimentsUpdateTime({payload: updatedExperimentsUpdateTime});
        }))
    )
  ));
}
