import {Component, OnDestroy, OnInit} from '@angular/core';
import {Observable, Subscription} from 'rxjs';
import {CredentialKeyExt, selectCredentials, selectNewCredential} from '@common/core/reducers/common-auth-reducer';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {filter, take} from 'rxjs/operators';
import {createCredential, credentialRevoked, getAllCredentials, resetCredential, updateCredentialLabel} from '@common/core/actions/common-auth.actions';
import {Store} from '@ngrx/store';
import {GetCurrentUserResponseUserObject} from '~/business-logic/model/users/getCurrentUserResponseUserObject';
import {MatDialog} from '@angular/material/dialog';
import {CreateCredentialDialogComponent} from '~/features/settings/containers/admin/create-credential-dialog/create-credential-dialog.component';

@Component({
  selector: 'sm-user-credentials',
  templateUrl: './user-credentials.component.html',
  styleUrls: ['./user-credentials.component.scss'],
  standalone: false
})
export class UserCredentialsComponent implements OnInit, OnDestroy {

  public credentials$: Observable<Record<string, CredentialKeyExt[]>>;
  private newCredentialSub: Subscription;
  creatingCredentials = false;
  private user: GetCurrentUserResponseUserObject;
  constructor(private store: Store, private dialog: MatDialog) { }

  ngOnInit(): void {
    this.store.select(selectCurrentUser)
      .pipe(filter(user => !!user), take(1))
      .subscribe(user => {
        this.user = user;
        this.store.dispatch(getAllCredentials({userId: ''}));
      });
    this.credentials$ = this.store.select(selectCredentials);

    this.newCredentialSub = this.store.select(selectNewCredential)
      .subscribe(() => {
        this.creatingCredentials = false;
      });
  }

  createCredential() {
    this.creatingCredentials = true;
    this.dialog.open(CreateCredentialDialogComponent, {
        data: {workspace : this.user.company},
        width: '788px'
      }
    ).afterClosed().subscribe(() => {
      this.creatingCredentials = false;
      this.store.dispatch(resetCredential());
    });
    this.store.dispatch(createCredential({workspace: this.user.company, openCredentialsPopup: true}));
  }

  onCredentialRevoked(accessKey) {
    this.store.dispatch(credentialRevoked({accessKey, workspaceId: this.user.company.id}));
  }

  updateLabel({credential, label}) {
    this.store.dispatch(updateCredentialLabel({credential: {...credential, company: this.user.company.id}, label}));
  }

  ngOnDestroy(): void {
    this.newCredentialSub.unsubscribe();
  }
}
