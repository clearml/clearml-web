import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {selectNotification} from '../../core/reducers/view.reducer';
import {filter, take} from 'rxjs/operators';
import {setNotificationDialog} from '../../core/actions/layout.actions';
import {Subscription} from 'rxjs';
import {ConfirmDialogComponent} from '../../shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'sm-server-notification-dialog-container',
    templateUrl: './server-notification-dialog-container.component.html',
    styleUrls: ['./server-notification-dialog-container.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ServerNotificationDialogContainerComponent implements OnInit, OnDestroy {
  private notificationSubscription: Subscription;
  private dialogRef: MatDialogRef<ConfirmDialogComponent, any>;

  constructor(private store: Store, private dialog: MatDialog) {
  }

  ngOnInit() {
    this.notificationSubscription = this.store.pipe(
      select(selectNotification),
      filter((notification) => !!notification),
    )
      .subscribe((notification) => {
        this.dialogRef = this.dialog.open(ConfirmDialogComponent, {
          data: {
            title    : notification.title,
            body     : notification.message,
            yes      : 'Ok',
            iconClass: 'i-completed',
          }
        });

        this.dialogRef.afterClosed().pipe(take(1)).subscribe(() => {
          this.store.dispatch(setNotificationDialog({notification: null}));
        });
      });
  }

  ngOnDestroy(): void {
    this.notificationSubscription.unsubscribe();
  }
}
