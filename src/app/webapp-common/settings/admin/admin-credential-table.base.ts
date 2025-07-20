import {EventEmitter, Input, Output, Directive, inject} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '../../shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {ICONS} from '../../constants';
import {CredentialKey} from '~/business-logic/model/auth/credentialKey';
import {EditCredentialLabelDialogComponent} from '@common/shared/ui-components/overlay/edit-credential-label-dialog/edit-credential-label-dialog.component';
import {CredentialKeyExt} from '@common/core/reducers/common-auth-reducer';

@Directive()
export class AdminCredentialTableBaseDirective {
  @Input() credentials: CredentialKey[];
  @Output() credentialRevoked = new EventEmitter();
  @Output() updateCredentialLabel = new EventEmitter<{ credential: CredentialKeyExt; label: string }>();
  public icons = ICONS;
  public dialog: MatDialog;

  constructor() {
    this.dialog = inject(MatDialog);
  }

  confirmPopUp(credential) {
    const confirmDialogRef: MatDialogRef<any, boolean> = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Are you sure?',
        body: `Are you sure you want to revoke the ${credential.label || ''} credentials (${credential.access_key})?<br>\n
              Once revoked, these credentials cannot be recovered.`,
        yes: 'Revoke',
        no: 'Cancel',
        iconClass: 'al-ico-alert',
        iconColor: 'var(--color-warning)'
      }
    });

    confirmDialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.credentialRevoked.emit(credential.access_key);
      }
    });
  }

  editLabel(credential: CredentialKey) {
    this.dialog.open(EditCredentialLabelDialogComponent, {
      data: {
        label: credential.label,
        title: 'EDIT LABEL',
        yes: ' SAVE ',
        no: 'CANCEL',
        iconClass: 'al-ico-access-key',
        width: '200px',

        'max-width': '200px'
      }
    }).afterClosed().subscribe((label) => {
      if (typeof label === 'string') {
        this.updateCredentialLabel.emit({credential, label: label || null});
      }
    });
  }

}
