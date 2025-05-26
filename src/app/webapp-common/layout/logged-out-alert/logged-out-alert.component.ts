import {Component, Input} from '@angular/core';
import {Store} from '@ngrx/store';
import {AlertDialogComponent} from '../../shared/ui-components/overlay/alert-dialog/alert-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import {take} from 'rxjs/operators';
import {logout} from '@common/core/actions/users.actions';

@Component({
    selector: 'sm-logged-out-alert',
    templateUrl: './logged-out-alert.component.html',
    styleUrls: ['./logged-out-alert.component.scss'],
    standalone: false
})
export class LoggedOutAlertComponent {

  @Input() set login(bool) {
    if (!bool) {
      return;
    }
    const alertDialogRef = this.dialog.open(AlertDialogComponent, {
      data: {
        alertMessage   : `Please login again`,
        alertSubMessage: `Your session has expired. Press 'Login' to reload and reauthenticate.`,
        okMessage      : 'LOGIN'
      }
    });

    alertDialogRef.afterClosed()
      .pipe(
        take(1)
      ).subscribe(() => {
        this.store.dispatch(logout({}));
    });
  }

  constructor(private dialog: MatDialog, private store: Store) {
  }

}
