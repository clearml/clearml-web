import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {getWorkers, resetWorkers, WorkerExt, workersTableSortChanged} from '../../actions/workers.actions';
import {selectWorkers, selectWorkersTableSortFields} from '../../reducers/index.reducer';
import {ActivatedRoute, Router} from '@angular/router';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {interval, combineLatest} from 'rxjs';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {injectQueryParams} from 'ngxtension/inject-query-params';
import {SplitAreaComponent, SplitComponent} from 'angular-split';
import {WorkersStatsComponent} from '@common/workers-and-queues/containers/workers-stats/workers-stats.component';
import {WorkersTableComponent} from '@common/workers-and-queues/dumb/workers-table/workers-table.component';
import {WorkerInfoComponent} from '@common/workers-and-queues/dumb/worker-info/worker-info.component';
import {distinctUntilChanged} from "rxjs/operators";

const REFRESH_INTERVAL = 30000;

@Component({
  selector: 'sm-workers',
  templateUrl: './workers.component.html',
  styleUrls: ['./workers.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SplitAreaComponent,
    SplitComponent,
    SplitAreaComponent,
    WorkersStatsComponent,
    WorkersTableComponent,
    WorkerInfoComponent
  ]
})
export class WorkersComponent {
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy = inject(DestroyRef);
  private activeWorkerId = injectQueryParams('id');


  protected workers = this.store.selectSignal(selectWorkers);
  protected tableSortFields = this.store.selectSignal(selectWorkersTableSortFields);

  protected activeWorker = computed(() => this.workers()?.find(worker => worker.id === this.activeWorkerId()));

  constructor() {
    this.store.dispatch(getWorkers())
    combineLatest([
      interval(REFRESH_INTERVAL),
      toObservable(this.activeWorker).pipe(distinctUntilChanged((OW, NW )=> OW?.id=== NW?.id)),
    ])
      .pipe(
        takeUntilDestroyed()
      )
      .subscribe(() => this.store.dispatch(getWorkers()));

    this.destroy.onDestroy(() => {
      this.store.dispatch(resetWorkers());
    });
  }

  public selectWorker(worker: WorkerExt) {
    return this.router.navigate(
      [],
      {
        relativeTo: this.route,
        queryParams: {id: worker?.id},
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
  }

  sortedChanged(sort: { isShift: boolean; colId: ISmCol['id'] }) {
    this.store.dispatch(workersTableSortChanged({colId: sort.colId, isShift: sort.isShift}));
  }
}
