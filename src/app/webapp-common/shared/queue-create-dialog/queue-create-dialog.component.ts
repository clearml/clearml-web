import * as createNewQueueActions from './queue-create-dialog.actions';
import * as createQueueSelectors from './queue-create-dialog.reducer';

import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {CREATION_STATUS} from './queue-create-dialog.reducer';
import {Observable, Subscription} from 'rxjs';
import {Queue} from '@common/workers-and-queues/actions/queues.actions';

@Component({
    selector: 'sm-queue-create-dialog',
    templateUrl: './queue-create-dialog.component.html',
    styleUrls: ['./queue-create-dialog.component.scss'],
    standalone: false
})
export class QueueCreateDialogComponent implements OnInit, OnDestroy {
  public queues$: Observable<any>;
  private creationStatusSubscription: Subscription;
  private editMode = false;
  public queue     = {name: null, id: null, display_name: null} as Queue;

  constructor(private store: Store, private matDialogRef: MatDialogRef<QueueCreateDialogComponent>, @Inject(MAT_DIALOG_DATA) public data) {
    if (data) {
      this.queue    = {...data};
      this.editMode = true;
    }
    this.queues$ = this.store.select(createQueueSelectors.selectQueues);
  }

  ngOnInit(): void {
    this.store.dispatch(createNewQueueActions.getQueues());
    this.creationStatusSubscription = this.store.select(createQueueSelectors.selectCreationStatus).subscribe(status => {
      if (status === CREATION_STATUS.SUCCESS) {
        return this.matDialogRef.close(true);
      }
    });
  }

  ngOnDestroy(): void {
    this.store.dispatch(createNewQueueActions.resetState());
    this.creationStatusSubscription.unsubscribe();
  }

  public createQueue(queue) {
    if (this.queue.id) {
      this.store.dispatch(createNewQueueActions.updateQueue({queue: {queue: this.queue.id, name: queue.name, display_name: queue.display_name}}));
    } else {
      this.store.dispatch(createNewQueueActions.createNewQueue(queue));
    }
  }

}
