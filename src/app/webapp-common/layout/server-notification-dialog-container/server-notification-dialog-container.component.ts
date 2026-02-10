import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {select, Store} from '@ngrx/store';
import { MatDialog} from '@angular/material/dialog';
import {selectNotification} from '../../core/reducers/view.reducer';
import {filter, take} from 'rxjs/operators';
import {setNotificationDialog} from '../../core/actions/layout.actions';
import {ConfirmDialogComponent} from '../../shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
    selector: 'sm-server-notification-dialog-container',
    template: '',
    styleUrls: ['./server-notification-dialog-container.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServerNotificationDialogContainerComponent {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);

  constructor() {
    this.store.pipe(
      takeUntilDestroyed(),
      select(selectNotification),
      filter((notification) => !!notification),
    )
      .subscribe((notification) => {
        this.dialog.open(ConfirmDialogComponent, {
          data: {
            title    : notification.title,
            body     : notification.message,
            yes      : 'Ok',
            iconClass: 'i-completed',
          }
        }).afterClosed()
          .pipe(take(1))
          .subscribe(() => {
            this.store.dispatch(setNotificationDialog({notification: null}));
          });
      });
  }
}
