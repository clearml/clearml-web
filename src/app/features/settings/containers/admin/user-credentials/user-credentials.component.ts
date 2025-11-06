import {Component, computed, effect, inject, signal} from '@angular/core';
import {selectCredentials, selectNewCredential} from '@common/core/reducers/common-auth-reducer';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {createCredential, credentialRevoked, getAllCredentials, resetCredential, updateCredentialLabel} from '@common/core/actions/common-auth.actions';
import {Store} from '@ngrx/store';
import {MatDialog} from '@angular/material/dialog';
import {CreateCredentialDialogComponent} from '~/features/settings/containers/admin/create-credential-dialog/create-credential-dialog.component';
import {MatIconModule} from '@angular/material/icon';
import {AdminCredentialTableComponent} from '@common/settings/admin/admin-credential-table/admin-credential-table.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatButton} from '@angular/material/button';
import {KeyValuePipe} from '@common/shared/pipes/key-value.pipe';

@Component({
  selector: 'sm-user-credentials',
  templateUrl: './user-credentials.component.html',
  styleUrls: ['./user-credentials.component.scss'],
  imports: [
    MatIconModule,
    AdminCredentialTableComponent,
    TooltipDirective,
    MatButton,
    KeyValuePipe
  ]
})
export class UserCredentialsComponent {
  private store = inject(Store);
  private dialog = inject(MatDialog);

  private newCreds = this.store.selectSignal(selectNewCredential);
  protected currentUser = this.store.selectSignal(selectCurrentUser);

  protected credState = computed(() => ({
    credentials: this.newCreds(),
    creatingCredentials: signal(false)
  }));
  protected credentials = this.store.selectSignal(selectCredentials);

  constructor() {
    effect(() => {
      if (this.currentUser()) {
        this.store.dispatch(getAllCredentials({userId: ''}));
      }
    });
  }

  createCredential() {
    this.credState().creatingCredentials.set( true);
    this.dialog.open(CreateCredentialDialogComponent, {
        data: {workspace : this.currentUser().company},
        width: '788px'
      }
    ).afterClosed().subscribe(() => {
      this.credState().creatingCredentials.set( false);
      this.store.dispatch(resetCredential());
    });
    this.store.dispatch(createCredential({workspace: this.currentUser().company, openCredentialsPopup: true}));
  }

  onCredentialRevoked(accessKey) {
    this.store.dispatch(credentialRevoked({accessKey, workspaceId: this.currentUser().company.id}));
  }

  updateLabel({credential, label}) {
    this.store.dispatch(updateCredentialLabel({credential: {...credential, company: this.currentUser().company.id}, label}));
  }
}
