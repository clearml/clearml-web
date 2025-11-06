import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {Action, Store} from '@ngrx/store';
import {castArray, cloneDeep} from 'lodash-es';
import {catchError, map, mergeMap, switchMap} from 'rxjs/operators';
import {ApiWorkersService} from '~/business-logic/api-services/workers.service';
import {WORKER_STATS_PARAM_INFO} from '../workers-and-queues.consts';
import {WorkersGetActivityReportRequest} from '~/business-logic/model/workers/workersGetActivityReportRequest';
import {WorkersGetActivityReportResponse} from '~/business-logic/model/workers/workersGetActivityReportResponse';
import {WorkersGetStatsRequest} from '~/business-logic/model/workers/workersGetStatsRequest';
import {requestFailed} from '../../core/actions/http.actions';
import {addMessage, deactivateLoader} from '../../core/actions/layout.actions';
import * as workersActions from '../actions/workers.actions';
import {selectSelectedWorker, selectStats, selectStatsParams, selectStatsTimeFrame, selectWorkers, selectWorkersTableSortFields} from '../reducers/index.reducer';
import {addStats, getLastTimestamp} from '../../shared/utils/statistics';
import {showStatsErrorNotice, hideNoStatsNotice} from '../actions/stats.actions';
import {addMultipleSortColumns} from '../../shared/utils/shared-utils';
import {transformAndSortWorkers} from '@common/workers-and-queues/workers-and-queues.utils';
import {MESSAGES_SEVERITY} from '@common/constants';

const prepareStatsQuery = (entitie: string, keys: { key: string }[], range: number, granularity: number): WorkersGetStatsRequest => {
  const now = Math.floor((new Date()).getTime() / 1000);
  const typeKeys = castArray(keys);
  const keyList = typeKeys.map(key => key.key);
  const requiresSplit = keyList.some(key => key === 'cpu_usage' || key === 'gpu_memory_used');
  return {
    from_date: now - range,
    to_date: now,
    worker_ids: entitie ? [entitie] : null,
    items: typeKeys,
    interval: granularity,
    ...(requiresSplit && { split_by_resource: true })
  };
};

@Injectable()
export class WorkersEffects {
  private actions = inject(Actions);
  private workersApi = inject(ApiWorkersService);
  private store = inject(Store);

  getWorkers$ = createEffect(() => this.actions.pipe(
    ofType(workersActions.getWorkers),
    concatLatestFrom(() => [
      this.store.select(selectSelectedWorker),
      this.store.select(selectWorkersTableSortFields),
    ]),
    switchMap(([action, selectedWorker, sortFields]) => this.workersApi.workersGetAll({}).pipe(
      mergeMap(res => {
        const workers = transformAndSortWorkers(sortFields, res.workers);
        const actionsToFire = [
          workersActions.setWorkers({workers}),
          deactivateLoader(action.type)] as Action[];
        if (selectedWorker) {
          actionsToFire.push(
            workersActions.setSelectedWorker({
              worker: workers.find(worker => worker.id === selectedWorker.id)
            }));
        }
        return actionsToFire;
      }),
      catchError(err => [requestFailed(err), deactivateLoader(action.type)])
      )
    )
  ));

  sortWorkers$ = createEffect(() => this.actions.pipe(
    ofType(workersActions.workersTableSetSort),
    concatLatestFrom(() => [
      this.store.select(selectWorkersTableSortFields),
      this.store.select(selectWorkers)
    ]),
    map(([, sortFields, workers]) =>
      workersActions.setWorkers({workers: transformAndSortWorkers(sortFields, workers)})
    ),
  ));

  getStats$ = createEffect(() => this.actions.pipe(
    ofType(workersActions.getWorkerStats),
    concatLatestFrom(() => [
      this.store.select(selectStats),
      this.store.select(selectStatsTimeFrame),
      this.store.select(selectStatsParams),
      this.store.select(selectSelectedWorker)
    ]),
    switchMap(([action, currentStats, selectedRange, params, worker]) => {
      const now = Math.floor((new Date()).getTime() / 1000);
      const keys = params.split(';').map(val => ({key: val}));
      const range = parseInt(selectedRange, 10);
      const granularity = Math.max(Math.floor(range / action.maxPoints), worker ? 10 : 40);
      let timeFrame: number;

      currentStats = cloneDeep(currentStats);
      if (Array.isArray(currentStats) && currentStats.some(topic => topic.dates.length > 1)) {
        timeFrame = now - getLastTimestamp(currentStats) + granularity;
      } else {
        timeFrame = range;
      }
      if (worker) {
        const req = prepareStatsQuery(worker.id, keys, timeFrame, granularity);
        return this.workersApi.workersGetStats(req).pipe(
          map(res => {
            if (res) {
              res = addStats(currentStats, res.workers, action.maxPoints, keys, 'worker', WORKER_STATS_PARAM_INFO);
            }
            return workersActions.setStats({data: res});
          }),
          catchError(err => [requestFailed(err),
            workersActions.setStats({data: []}),
            addMessage(MESSAGES_SEVERITY.WARN, 'Failed to fetching activity worker statistics')])
        );
      } else {
        const req: WorkersGetActivityReportRequest = {

          from_date: now - timeFrame,
          to_date: now,
          interval: granularity

        };

        return this.workersApi.workersGetActivityReport(req).pipe(
          mergeMap((res: WorkersGetActivityReportResponse) => {
            let result = null;
            if (res) {
              const statsData = [{
                activity: '',
                metrics: [{
                  metric: 'total',
                  dates: res.total.dates,
                  stats: [{
                    aggregation: 'count',
                    values: res.total.counts
                  }]
                }, {
                  metric: 'active',
                  dates: res.active.dates,
                  stats: [{
                    aggregation: 'count',
                    values: res.active.counts
                  }]
                }]
              }];
              result = addStats(currentStats, statsData, action.maxPoints,
                [{key: 'active'}, {key: 'total'}], 'activity',
                {
                  total: {title: 'Total Workers', multiply: 1},
                  active: {title: 'Active Workers', multiply: 1}
                });
            }
            return [workersActions.setStats({data: result}), hideNoStatsNotice()];
          }),
          catchError(err => [requestFailed(err),
            workersActions.setStats({data: []}),
            showStatsErrorNotice()])
        );
      }
    })
  ));

  tableSortChange = createEffect(() => this.actions.pipe(
    ofType(workersActions.workersTableSortChanged),
    concatLatestFrom(() => [this.store.select(selectWorkersTableSortFields)]),
    map(([action, oldOrders]) => {
      const orders = addMultipleSortColumns(oldOrders, action.colId, action.isShift);
      return workersActions.workersTableSetSort({orders});
    })
  ));
}
