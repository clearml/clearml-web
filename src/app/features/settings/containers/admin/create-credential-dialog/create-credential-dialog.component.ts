import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {Store} from '@ngrx/store';
import {updateCredentialLabel} from '@common/core/actions/common-auth.actions';
import {OrganizationGetUserCompaniesResponseCompanies} from '~/business-logic/model/organization/organizationGetUserCompaniesResponseCompanies';
import {selectNewCredential} from '@common/core/reducers/common-auth-reducer';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {AdminDialogTemplateComponent} from '@common/settings/admin/admin-dialog-template/admin-dialog-template.component';

@Component({
    selector: 'sm-create-credential-dialog',
    templateUrl: './create-credential-dialog.component.html',
    styleUrls: ['./create-credential-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        DialogTemplateComponent,
        AdminDialogTemplateComponent
    ]
})
  export class CreateCredentialDialogComponent {
  private store = inject(Store);
  public data = inject<{
    credentials: any;
    workspace?: OrganizationGetUserCompaniesResponseCompanies
  }>(MAT_DIALOG_DATA);


  protected newCredential = this.store.selectSignal(selectNewCredential);

  updateLabel({credential, label}) {
    this.store.dispatch(updateCredentialLabel({credential, label}));
  }
}
