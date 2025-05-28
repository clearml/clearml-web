import {ChangeDetectionStrategy, Component, DestroyRef, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {getSelectedWorker, getWorkers, resetWorkers, WorkerExt, workersTableSortChanged} from '../../actions/workers.actions';
import {selectSelectedWorker, selectWorkers, selectWorkersTableSortFields} from '../../reducers/index.reducer';
import {ActivatedRoute, Router} from '@angular/router';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {distinctUntilChanged, filter, take, withLatestFrom} from 'rxjs/operators';
import {interval, combineLatest} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

const REFRESH_INTERVAL = 30000;

@Component({
    selector: 'sm-workers',
    templateUrl: './workers.component.html',
    styleUrls: ['./workers.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class WorkersComponent {

  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy = inject(DestroyRef);


  public workers$ = this.store.select(selectWorkers);
  public selectedWorker$ = this.store.select(selectSelectedWorker);
  public tableSortFields$ = this.store.select(selectWorkersTableSortFields);

  get routerWorkerId() {
    const url = new URL(window.location.href);
    return url.searchParams.get('id');
  }

  constructor() {
    this.store.dispatch(getWorkers())
    combineLatest([interval(REFRESH_INTERVAL),
      this.selectedWorker$.pipe(distinctUntilChanged((a, b) => a?.id === b?.id)),
    ])
      .pipe(
        takeUntilDestroyed()
      )
      .subscribe(() => this.store.dispatch(getWorkers()));

    this.destroy.onDestroy(() => {
      this.store.dispatch(resetWorkers());
    });

    this.workers$.pipe(
      takeUntilDestroyed(),
      withLatestFrom(this.selectedWorker$),
      filter(([workers, selectedWorker]) => workers && selectedWorker?.id !== this.routerWorkerId),
      take(1))
      .subscribe(([workers]) => {
        const selectedWorker = workers.find(worker => worker.id === this.routerWorkerId);
        this.selectWorker(selectedWorker);
      });
  }

  public selectWorker(worker: WorkerExt) {
    this.store.dispatch(getSelectedWorker({worker}));
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
