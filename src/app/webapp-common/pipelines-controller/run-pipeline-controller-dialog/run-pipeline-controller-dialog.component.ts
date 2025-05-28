import {Component, OnDestroy, inject, viewChild, effect} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {combineLatest, filter, Observable} from 'rxjs';
import {selectQueuesList} from '../../experiments/shared/components/select-queue/select-queue.reducer';
import {ConfirmDialogComponent} from '../../shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {getQueuesForEnqueue} from '@common/experiments/shared/components/select-queue/select-queue.actions';
import {cloneDeep} from 'lodash-es';
import {
  getControllerForStartPipelineDialog,
  setControllerForStartPipelineDialog
} from '../../experiments/actions/common-experiments-menu.actions';
import {selectStartPipelineDialogTask} from '../../experiments/reducers';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {map, startWith} from 'rxjs/operators';
import {NgModel} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Queue} from '@common/workers-and-queues/actions/queues.actions';

export interface RunPipelineResult {
  confirmed: boolean;
  queue: Queue;
  args: {name: string; value: string}[];
  task: string;
}

@Component({
    selector: 'sm-run-pipeline-controller-dialog',
    templateUrl: './run-pipeline-controller-dialog.component.html',
    styleUrls: ['./run-pipeline-controller-dialog.component.scss'],
    standalone: false
})
export class RunPipelineControllerDialogComponent implements OnDestroy {
  public dialogRef = inject<MatDialogRef<ConfirmDialogComponent>>(MatDialogRef<ConfirmDialogComponent>);
  private store = inject(Store);
  public data = inject<{ task }>(MAT_DIALOG_DATA);
  public selectedQueue: Queue;
  public queues$ = this.store.select(selectQueuesList);
  public baseController$ = this.store.select(selectStartPipelineDialogTask);
  public title: string;
  public params: any;
  public task: IExperimentInfo;

  private queueModel = viewChild<NgModel>('queueInputModel');
  protected filteredQueues$: Observable<Queue[]>;

  constructor() {
    this.store.dispatch(getQueuesForEnqueue());

    if (this.data?.task?.hyperparams?.Args) {
      this.store.dispatch(setControllerForStartPipelineDialog({task: this.data.task}));
    } else {
      this.store.dispatch(getControllerForStartPipelineDialog({task: this.data.task?.id}));
    }

    effect(() => {
      this.filteredQueues$ = combineLatest([
        this.queueModel().control.valueChanges.pipe(startWith('')),
        this.queues$
      ])
        .pipe(
          map(([value, queues]) => {
            if (!queues) {
              return [];
            }
            const name = (typeof value === 'string' ? value : value?.name)?.toLowerCase();
            if (this.queueModel().control.pristine || !name) {
              return queues;
            }
            return queues.filter(q => q.name.toLowerCase().includes(name) || q.display_name?.toLowerCase().includes(name));
          }),
        );
    });

    combineLatest([this.baseController$, this.queues$])
      .pipe(
        takeUntilDestroyed(),
        filter(([baseController, queues]) => !!baseController && queues?.length > 0)
      )
      .subscribe(([baseController, queues]) => {
        this.selectedQueue = queues.find(queue => baseController.execution?.queue?.id === queue?.id) || null;
      });

    this.baseController$
      .pipe(
        takeUntilDestroyed(),
        filter(task => !!task)
      )
      .subscribe(task => {
        this.task = task;
        this.title = this.getTitle();
        this.params = task?.hyperparams?.Args && cloneDeep(Object.values(task.hyperparams.Args).filter((param: any) => !param?.name?.startsWith('_')));
      });
  }

  closeDialog(confirmed) {
    this.dialogRef.close({
      confirmed,
      queue: this.selectedQueue,
      args: this.params?.map(param => ({name: param.name, value: param.value})),
      task: this.task.id
    } as RunPipelineResult);
  }

  ngOnDestroy(): void {
    this.store.dispatch(setControllerForStartPipelineDialog({task: null}));
  }

  getTitle() {
    const version = this.task?.hyperparams?.properties?.version?.value;
    if (version) {
      return `${this.task.name} v${version}`;
    }
    return this.task.name;
  }

  displayFn = (item: any): string => typeof item === 'string' ? item : item?.caption || item?.name;

  isFocused = (locationRef: HTMLInputElement) => document.activeElement === locationRef;

}
