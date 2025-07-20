import {inject, Signal} from '@angular/core';
import {CanDeactivateFn} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {map} from 'rxjs/operators';

export interface DirtyState {
  isDirty: Signal<boolean>
}


export const generalLeavingBeforeSaveAlertGuard: CanDeactivateFn<DirtyState> = (component) => {
  const dialog = inject(MatDialog);

  if (!component.isDirty()) {
    return true;
  }

  return dialog.open(ConfirmDialogComponent, {
    data: {
      title: 'Attention',
      body: 'You have unsaved changes. Do you want to stay on this page or leave without saving?',
      yes: 'Leave',
      no: 'Stay',
      iconClass: 'al-ico-alert',
      iconColor: 'var(--color-warning)',
      centerText: true,
      width: 440
    }
  }).afterClosed()
    .pipe(map(leave => !!leave));
};
