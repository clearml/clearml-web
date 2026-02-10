import {inject, Injectable} from '@angular/core';
import {catchError, filter, map, mergeMap, switchMap} from 'rxjs/operators';
import {Store} from '@ngrx/store';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {concatLatestFrom} from '@ngrx/operators';
import {ApiQueuesService} from '~/business-logic/api-services/queues.service';
import {QueuesGetQueueMetricsResponse} from '~/business-logic/model/queues/queuesGetQueueMetricsResponse';
import {
  selectQueuesStatsTimeFrame,
  selectQueuesTableSortFields,
  selectQueueStats,
  selectSelectedQueue
} from '../reducers/index.reducer';
import {activeLoader, addMessage, deactivateLoader} from '../../core/actions/layout.actions';
import {requestFailed} from '../../core/actions/http.actions';
import {queueActions} from '../actions/queues.actions';
import {QueueMetrics} from '~/business-logic/model/queues/queueMetrics';
import {cloneDeep, escape} from 'lodash-es';
import {addFullRangeMarkers, addStats, removeFullRangeMarkers} from '../../shared/utils/statistics';
import {hideNoStatsNotice, showStatsErrorNotice} from '../actions/stats.actions';
import {addMultipleSortColumns} from '../../shared/utils/shared-utils';
import {calculateQueuesCaption, sortTable} from '@common/workers-and-queues/workers-and-queues.utils';
import {selectActiveWorkspaceReady} from '~/core/reducers/view.reducer';
import {MESSAGES_SEVERITY} from '@common/constants';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {ErrorService} from '@common/shared/services/error.service';

@Injectable()
export class QueuesEffect {
  private actions = inject(Actions);
  private queuesApi = inject(ApiQueuesService);
  private store = inject(Store);
  private dialog = inject(MatDialog);
  private errService = inject(ErrorService);

  activeLoader = createEffect(() => {
    return this.actions.pipe(
      ofType(queueActions.getQueues, queueActions.fetchQueue, queueActions.clearQueue),
      filter(action => !(action as ReturnType<typeof queueActions.fetchQueue>)?.autoRefresh),
      map(action => activeLoader(action.type))
    )
  });

  getQueues = createEffect(() => {
    return this.actions.pipe(
      ofType(queueActions.getQueues),
      switchMap((action) => this.store.select(selectActiveWorkspaceReady).pipe(
        filter(ready => ready),
        map(() => action))),
      concatLatestFrom(
        () => this.store.select(selectQueuesTableSortFields)),
      switchMap(([action, orderFields]) => this.queuesApi.queuesGetAllEx({
        only_fields: ['display_name', 'last_update', 'name', 'tags', 'workers', 'entries'],
        count_task_entries: true,
        max_task_entries: -1
      })
        .pipe(
          mergeMap(res => [
            queueActions.setQueues({queues: sortTable(orderFields, calculateQueuesCaption(res.queues) as any[])}),
            deactivateLoader(action.type)
          ]),
          catchError(err => [deactivateLoader(action.type), requestFailed(err)])
        ))
    )
  });

  fetchSelectedQueue = createEffect(() => {
    return this.actions.pipe(
      ofType(queueActions.fetchQueue),
      switchMap((action) =>
        this.queuesApi.queuesGetAllEx({
          id: [action.id],
          only_fields: ['*', 'entries.task.name']
        }).pipe(
          mergeMap(res => [
            queueActions.fetchQueueSuccess({queue: calculateQueuesCaption(res.queues)[0] ?? null}),
            deactivateLoader(action.type)
          ]),
          catchError(err => [deactivateLoader(action.type), requestFailed(err)])
        ))
    )
  });

  deleteQueues = createEffect(() => {
    return this.actions.pipe(
      ofType(queueActions.deleteQueue),
      switchMap(action => this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(
        ConfirmDialogComponent,
        {
          data: {
            title: 'Delete Queue',
            body: `Are you sure you would like to delete the "<b>${escape(action.queue.caption)}</b>" queue?`,
            centerText: true,
            yes: 'Delete',
            no: 'Cancel',
            iconClass: 'al-ico-trash'
          }
        }).afterClosed().pipe(
        filter(response => response),
        map(() => action)
      )),
      switchMap(action => this.queuesApi.queuesDelete({queue: action.queue.id})),
      map(() => queueActions.getQueues({})),
      catchError(err => [
        deactivateLoader(queueActions.deleteQueue.type),
        requestFailed(err),
        addMessage(MESSAGES_SEVERITY.ERROR, 'Delete Queue failed')
      ])
    );
  });

  clearQueue = createEffect(() => {
    return this.actions.pipe(
    ofType(queueActions.clearQueue),
    switchMap(action => this.queuesApi.queuesClearQueue({
      queue: action.queue.id
    }).pipe(
      concatLatestFrom(() => [this.store.select(selectSelectedQueue)]),
      mergeMap(([, selectedQueue]) => [
        queueActions.getQueues({}),
          ...(selectedQueue ? [queueActions.fetchQueue({id: selectedQueue.id, autoRefresh: true})] : []),
          deactivateLoader(action.type)
        ]),
        catchError(err => [
          deactivateLoader(action.type),
          requestFailed(err),
          addMessage(MESSAGES_SEVERITY.ERROR, 'Clear queue failed')])
      ))
    );
  });

  moveExperimentToTopOfQueue = createEffect(() => {
    return this.actions.pipe(
      ofType(queueActions.moveExperimentToTopOfQueue),
      concatLatestFrom(() => this.store.select(selectSelectedQueue)),
      switchMap(([action, queue]) => this.queuesApi.queuesMoveTaskToFront({
        queue: queue.id,
        task: action.task
      }).pipe(
        map(() => queueActions.fetchQueue({id: queue.id, autoRefresh: true})),
        catchError(err => [
          deactivateLoader(action.type),
          requestFailed(err),
          addMessage(MESSAGES_SEVERITY.ERROR, 'Move Task failed')])
      ))
    )
  });

  moveExperimentToBottomOfQueue = createEffect(() => this.actions.pipe(
    ofType(queueActions.moveExperimentToBottomOfQueue),
    concatLatestFrom(() => this.store.select(selectSelectedQueue)),
    switchMap(([action, queue]) => this.queuesApi.queuesMoveTaskToBack({
      queue: queue.id,
      task: action.task
    }).pipe(
      map(() => queueActions.fetchQueue({id: queue.id, autoRefresh: true})),
      catchError(err => [deactivateLoader(action.type),
        requestFailed(err),
        addMessage(MESSAGES_SEVERITY.ERROR, 'Move Task failed')])
    ))
  ));

  moveExperimentInQueue = createEffect(() => this.actions.pipe(
    ofType(queueActions.moveExperimentInQueue),
    concatLatestFrom(() => this.store.select(selectSelectedQueue)),
    switchMap(([action, queue]) =>
      this.queuesApi.queuesMoveTaskBackward({
        queue: queue.id,
        task: action.task,
        count: (action.current - action.previous)
      }).pipe(
        map(() => queueActions.fetchQueue({id: queue.id, autoRefresh: true})),
        catchError(err => [
          queueActions.fetchQueue({id: queue.id}),
          deactivateLoader(action.type),
          requestFailed(err),
          addMessage(MESSAGES_SEVERITY.ERROR, 'Move Queue failed')])
      )
    ),
  ));

  removeExperimentFromQueue = createEffect(() => this.actions.pipe(
    ofType(queueActions.removeExperimentFromQueue),
    concatLatestFrom(() => this.store.select(selectSelectedQueue)),
    switchMap(([action, queue]) => this.queuesApi.queuesRemoveTask({
      task: action.task,
      queue: queue.id,
      update_task_status: true
    }).pipe(
      mergeMap(() => [
        queueActions.fetchQueue({id: queue.id, autoRefresh: true}),
        queueActions.getQueues({})
      ]),
      catchError(err => [deactivateLoader(action.type), requestFailed(err),
        addMessage(MESSAGES_SEVERITY.ERROR, 'Remove Queue failed')])
    ))
  ));

  moveExperimentToOtherQueue = createEffect(() => this.actions.pipe(
    ofType(queueActions.moveExperimentToOtherQueue),
    concatLatestFrom(() => this.store.select(selectSelectedQueue)),
    switchMap(([action, queue]) => this.queuesApi.queuesMoveTaskToQueue({queue: queue.id, task: action.task, target_queue: action.queueId}).pipe(
        mergeMap(() => [
          queueActions.getQueues({}),
          queueActions.fetchQueue({id: queue.id, autoRefresh: true}),
          ]
        ),
        catchError(err => [deactivateLoader(action.type), requestFailed(err),
          addMessage(MESSAGES_SEVERITY.ERROR, `Failed to move task, ${this.errService.getErrorMsg(err.error)}`)])
      )
    )
  ));

  getStats$ = createEffect(() => this.actions.pipe(
    ofType(queueActions.getStats, queueActions.setStatsParams),
    concatLatestFrom(() => [this.store.select(selectQueueStats),
      this.store.select(selectSelectedQueue),
      this.store.select(selectQueuesStatsTimeFrame)
    ]),
    switchMap(([action, currentStats, queue, selectedRange]) => {
      const now = Math.floor((new Date()).getTime() / 1000);
      const range = parseInt(selectedRange, 10);
      const granularity = Math.max(Math.floor(range / action.maxPoints), queue ? 10 : 40);

      return this.queuesApi.queuesGetQueueMetrics({
        from_date: now - range,
        to_date: now,
        queue_ids: queue ? [queue.id] : undefined,
        interval: granularity
      }).pipe(
        mergeMap((res: QueuesGetQueueMetricsResponse) => {
          let newStats = {wait: null, length: null};
          currentStats = cloneDeep(currentStats);
          if (res && res.queues) {
            if (Array.isArray(currentStats.wait) && currentStats.wait.some(topic => topic.dates.length > 1)) {
              removeFullRangeMarkers(currentStats.wait);
            }
            if (Array.isArray(currentStats.length) && currentStats.length.some(topic => topic.dates.length > 1)) {
              removeFullRangeMarkers(currentStats.length);
            }
            let newQueue: QueueMetrics;
            if (res.queues.length) {
              newQueue = res.queues[0];
            } else {

              newQueue = {dates: [], avg_waiting_times: [], queue_lengths: []};
            }
            const waitData = [{
              wait: '',
              metrics: [{
                metric: 'queueAvgWait',
                dates: newQueue.dates,
                stats: [{
                  aggregation: 'duration',
                  values: newQueue.avg_waiting_times
                }]
              }]
            }];
            const lenData = [{
              length: '',
              metrics: [{
                metric: 'queueLen',
                dates: newQueue.dates,
                stats: [{
                  aggregation: 'count',
                  values: newQueue.queue_lengths
                }]
              }]
            }];
            newStats = {
              wait: addStats(currentStats.wait, waitData, action.maxPoints,
                [{key: 'queueAvgWait'}], 'wait', {queueAvgWait: {title: 'Queue Average Wait Time', multiply: 1}}),
              length: addStats(currentStats.length, lenData, action.maxPoints,
                [{key: 'queueLen'}], 'length', {queueLen: {title: 'Queues Average Length', multiply: 1}})
            };
            if (Array.isArray(newStats.wait) && newStats.wait.some(topic => topic.dates.length > 0)) {
              addFullRangeMarkers(newStats.wait, now - range, now);
            }
            if (Array.isArray(newStats.length) && newStats.length.some(topic => topic.dates.length > 0)) {
              addFullRangeMarkers(newStats.length, now - range, now);
            }
          }
          return [
            deactivateLoader(action.type),
            queueActions.setStats({data: newStats}),
            hideNoStatsNotice()
          ];
        }),
        catchError(err => [deactivateLoader(action.type),
          queueActions.setStats({data: {wait: [], length: []}}),
          requestFailed(err),
          showStatsErrorNotice()
        ])
      );

    })
  ));

  tableSortChange = createEffect(() => this.actions.pipe(
    ofType(queueActions.queuesTableSortChanged),
    concatLatestFrom(() => this.store.select(selectQueuesTableSortFields)),
    map(([action, oldOrders]) =>
      queueActions.queuesTableSetSort({orders: addMultipleSortColumns(oldOrders, action.colId, action.isShift)})
    )
  ));
}
