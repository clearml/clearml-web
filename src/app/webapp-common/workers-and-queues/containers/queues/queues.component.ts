import {ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject} from '@angular/core';
import {Task} from '~/business-logic/model/tasks/task';
import {Store} from '@ngrx/store';
import {ActivatedRoute, Router} from '@angular/router';
import {queueActions, Queue} from '../../actions/queues.actions';
import {
  selectQueuesTableSortFields,
  selectSelectedQueue, selectSortedQueues
} from '../../reducers/index.reducer';
import {filter, map, take} from 'rxjs/operators';
import {MatDialog} from '@angular/material/dialog';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {QueueCreateDialogComponent} from '@common/shared/queue-create-dialog/queue-create-dialog.component';
import {BreakpointObserver} from '@angular/cdk/layout';
import {interval} from 'rxjs';
import {selectSearchQuery} from '@common/common-search/common-search.reducer';
import {escapeRegExp, get} from 'lodash-es';
import {initSearch} from '@common/common-search/common-search.actions';
import {addMessage} from '@common/core/actions/layout.actions';
import {MESSAGES_SEVERITY} from '@common/constants';
import {QueueStatsComponent} from '@common/workers-and-queues/containers/queue-stats/queue-stats.component';
import {CommonSearchComponent} from '@common/common-search/containers/common-search/common-search.component';
import {MatIconModule} from '@angular/material/icon';
import {SplitAreaComponent, SplitComponent} from 'angular-split';
import {MatButton} from '@angular/material/button';
import {QueuesTableComponent} from '@common/workers-and-queues/dumb/queues-table/queues-table.component';
import {PushPipe} from '@ngrx/component';
import {QueueInfoComponent} from '@common/workers-and-queues/dumb/queue-info/queue-info.component';
import {QueueCreateDialogModule} from '@common/shared/queue-create-dialog/queue-create-dialog.module';
import {injectQueryParams} from 'ngxtension/inject-query-params';

const REFRESH_INTERVAL = 30000;

@Component({
  selector: 'sm-queues',
  templateUrl: './queues.component.html',
  styleUrls: ['./queues.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    QueueStatsComponent,
    CommonSearchComponent,
    MatIconModule,
    SplitAreaComponent,
    SplitAreaComponent,
    SplitComponent,
    MatButton,
    QueuesTableComponent,
    PushPipe,
    QueueCreateDialogModule,
    QueueInfoComponent
  ]
})
export class QueuesComponent {
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private breakpointObserver = inject(BreakpointObserver);
  private destroy = inject(DestroyRef);
  protected queueId = injectQueryParams('id');

  protected queues = this.store.selectSignal(selectSortedQueues);
  protected selectedQueue = this.store.selectSignal(selectSelectedQueue);
  protected tableSortFields = this.store.selectSignal(selectQueuesTableSortFields);
  private searchQuery = this.store.selectSignal(selectSearchQuery);
  protected filteredData = computed(() => !this.searchQuery()?.query ? this.queues() : this.filteredQueues());

  protected shortScreen$ = this.breakpointObserver.observe(['(max-height: 750px)'])
    .pipe(map(res => res.matches));
  protected queuesManager = this.route.snapshot.data.queuesManager;

  constructor() {
    this.store.dispatch(initSearch({payload: 'Search for queues'}));
    this.store.dispatch(queueActions.getQueues({}));

    effect(() => {
      const selectedQueue = this.queueId();
      this.store.dispatch(queueActions.fetchQueue({id: selectedQueue}));
    });

    interval(REFRESH_INTERVAL)
      .pipe(
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.store.dispatch(queueActions.getQueues({autoRefresh: true}));
        if (this.queueId()) {
          this.store.dispatch(queueActions.fetchQueue({id: this.queueId(), autoRefresh: true}));
        }
      });

    this.destroy.onDestroy(() => {
      this.store.dispatch(queueActions.resetQueues());
    });
  }

  sortedChanged(sort: { isShift: boolean; colId: ISmCol['id'] }) {
    this.store.dispatch(queueActions.queuesTableSortChanged({colId: sort.colId, isShift: sort.isShift}));
  }

  public selectQueue(id: string) {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {id},
      queryParamsHandling: 'merge'
    });
  }

  deleteQueue(queue: Queue) {
    this.store.dispatch(queueActions.deleteQueue({queue}));
  }

  clearQueue(queue: Queue) {
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data: {
        title: 'Clear all pending tasks',
        body: `Are you sure you want to dequeue the ${queue.entries_count} task${queue.entries_count > 1 ? 's' : ''} currently pending on the ${queue.caption} queue?`,
        yes: 'Clear Queue',
        no: 'Cancel',
        iconClass: 'al-ico-alert',
        iconColor: 'var(--color-warning)'
      }
    }).afterClosed()
      .pipe(filter(res => res))
      .subscribe(() => this.store.dispatch(queueActions.clearQueue({queue})));
  }


  renameQueue(queue: Queue) {
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

  moveExperimentToOtherQueue({queue, task}: { queue: Queue, task: Task }) {
    this.store.dispatch(queueActions.moveExperimentToOtherQueue({task: task.id, queueId: queue.id, queueName: queue.name}));
  }

  moveExperimentInQueue({task, current, previous}) {
    this.store.dispatch(queueActions.moveExperimentInQueue({queueId: this.queueId(), task, current, previous}));
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

  private compareCols = ['id', 'name', 'display_name'];

  filteredQueues() {
    let query = this.searchQuery().query.toLowerCase();
    if (!this.searchQuery().regExp) {
      query = escapeRegExp(query);
    }
    const exp = new RegExp(query, 'ig');
    return this.queues()?.filter(queue =>
      this.compareCols.some(col => exp.test(get(queue, col) as unknown as string))
    );
  }

  copySuccess(key: string) {
    this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, `Queue ${key} copied to clipboard`));
  }
}
