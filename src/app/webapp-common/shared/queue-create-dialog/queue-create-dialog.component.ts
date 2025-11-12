import * as createNewQueueActions from './queue-create-dialog.actions';
import * as createQueueSelectors from './queue-create-dialog.reducer';

import {ChangeDetectionStrategy, Component, DestroyRef, inject} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {CREATION_STATUS} from './queue-create-dialog.reducer';
import {Queue} from '@common/workers-and-queues/actions/queues.actions';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {
  CreateNewQueueFormComponent
} from '@common/shared/queue-create-dialog/create-new-queue-form/create-new-queue-form.component';

@Component({
  selector: 'sm-queue-create-dialog',
  templateUrl: './queue-create-dialog.component.html',
  styleUrls: ['./queue-create-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DialogTemplateComponent,
    CreateNewQueueFormComponent
  ]
})
export class QueueCreateDialogComponent {
  private readonly store = inject(Store);
  private readonly matDialogRef = inject(MatDialogRef<QueueCreateDialogComponent>);
  private readonly data = inject(MAT_DIALOG_DATA);
  private readonly destroy = inject(DestroyRef);

  queues = this.store.selectSignal(createQueueSelectors.selectQueues);
  public queue     = {name: null, id: null, display_name: null} as Queue;

  constructor() {
    if (this.data) {
      this.queue = {...this.data};
    }

    this.store.dispatch(createNewQueueActions.getQueues());

    this.store.select(createQueueSelectors.selectCreationStatus)
      .pipe(takeUntilDestroyed())
      .subscribe(status => {
        if (status === CREATION_STATUS.SUCCESS) {
          return this.matDialogRef.close(true);
        }
      });

    this.destroy.onDestroy(() => {
      this.store.dispatch(createNewQueueActions.resetState());
    })
  }

  public createQueue(queue) {
    if (this.queue.id) {
      this.store.dispatch(createNewQueueActions.updateQueue({queue: {queue: this.queue.id, name: queue.name, display_name: queue.display_name}}));
    } else {
      this.store.dispatch(createNewQueueActions.createNewQueue(queue));
    }
  }
}
