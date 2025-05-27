import {ChangeDetectionStrategy, Component, DestroyRef, effect, inject, untracked} from '@angular/core';
import {Task} from '~/business-logic/model/tasks/task';
import {Store} from '@ngrx/store';
import {ActivatedRoute, Router} from '@angular/router';
import {queueActions, Queue} from '../../actions/queues.actions';
import {
  selectQueuesTableSortFields,
  selectSelectedQueue, selectSelectedQueueId, selectSortedQueues
} from '../../reducers/index.reducer';
import {distinctUntilChanged, filter, map, take} from 'rxjs/operators';
import {MatDialog} from '@angular/material/dialog';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {QueueCreateDialogComponent} from '@common/shared/queue-create-dialog/queue-create-dialog.component';
import {BreakpointObserver} from '@angular/cdk/layout';
import {combineLatest, interval} from 'rxjs';

const REFRESH_INTERVAL = 30000;

@Component({
    selector: 'sm-queues',
    templateUrl: './queues.component.html',
    styleUrls: ['./queues.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class QueuesComponent {
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private breakpointObserver = inject(BreakpointObserver);
  private destroy = inject(DestroyRef);

  queues = this.store.selectSignal(selectSortedQueues);
  selectedQueueId = this.store.selectSignal(selectSelectedQueueId);
  selectedQueue = this.store.selectSignal(selectSelectedQueue);
  tableSortFields = this.store.selectSignal(selectQueuesTableSortFields);

  protected shortScreen$ = this.breakpointObserver.observe(['(max-height: 750px)'])
    .pipe(map(res => res.matches));
  public queuesManager: boolean;

  constructor() {
    this.queuesManager = this.route.snapshot.data.queuesManager;
    this.store.dispatch(queueActions.getQueues({}));

    combineLatest([interval(REFRESH_INTERVAL),
      toObservable(this.selectedQueue).pipe(distinctUntilChanged((a, b) => a?.id === b?.id))
    ])
      .pipe(
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.store.dispatch(queueActions.getQueues({autoRefresh: true}));
        this.store.dispatch(queueActions.refreshSelectedQueue({autoRefresh: true}));
      });

    this.destroy.onDestroy(() => {
      this.store.dispatch(queueActions.resetQueues());
    });

    effect(() => {
      if (this.selectedQueueId() !== this.selectedQueue()?.id) {
        const queue = this.queues()?.find(queue => queue.id === this.selectedQueueId());
        untracked(() => this.store.dispatch(queueActions.setSelectedQueue({queue})));
      }
    });
  }

  sortedChanged(sort: { isShift: boolean; colId: ISmCol['id'] }) {
    this.store.dispatch(queueActions.queuesTableSortChanged({colId: sort.colId, isShift: sort.isShift}));
  }

  public selectQueue(queue) {
    this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: {id: queue?.id},
        queryParamsHandling: 'merge'
      });
  }

  deleteQueue(queue: Queue) {
    this.store.dispatch(queueActions.deleteQueue({queue}));
  }

  clearQueue(queue: Queue) {
      this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
        data: {
          title    : 'Clear all pending tasks',
          body     : `Are you sure you want to dequeue the ${queue.entries.length} task${queue.entries.length>1?'s':''} currently pending on the ${queue.caption} queue?`,
          yes      : 'Clear Queue',
          no       : 'Cancel',
          iconClass: 'al-ico-alert',
          iconColor: 'var(--color-warning)'
        }
      }).afterClosed()
        .pipe(filter(res => res))
        .subscribe(() => this.store.dispatch(queueActions.clearQueue({queue})));
    }



  renameQueue(queue) {
    this.dialog.open<QueueCreateDialogComponent, Queue, boolean>(QueueCreateDialogComponent, {data: queue}).afterClosed()
      .pipe(
        filter(q => !!q),
        take(1)
      )
      .subscribe(() => this.store.dispatch(queueActions.getQueues({})));
  }

  moveExperimentToBottomOfQueue(task: Task) {
    this.store.dispatch(queueActions.moveExperimentToBottomOfQueue({task: task.id}));
  }

  moveExperimentToTopOfQueue(task: Task) {
    this.store.dispatch(queueActions.moveExperimentToTopOfQueue({task: task.id}));
  }

  removeExperimentFromQueue(task: Task) {
    this.store.dispatch(queueActions.removeExperimentFromQueue({task: task.id}));
  }

  moveExperimentToOtherQueue($event) {
    this.store.dispatch(queueActions.moveExperimentToOtherQueue({task: $event.task.id, queueId: $event.queue.id, queueName: $event.queue.name}));
  }

  moveExperimentInQueue({task, count}) {
    this.store.dispatch(queueActions.moveExperimentInQueue({task, count}));
  }

  addQueue() {
    this.dialog.open<QueueCreateDialogComponent, unknown, boolean>(QueueCreateDialogComponent).afterClosed()
      .pipe(
        filter(queue => !!queue),
        take(1)
      )
      .subscribe(() => {
        this.store.dispatch(queueActions.getQueues({}));
      });
  }

}
