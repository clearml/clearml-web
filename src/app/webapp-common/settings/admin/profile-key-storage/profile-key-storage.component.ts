import {Component, input} from '@angular/core';
import {Store} from '@ngrx/store';
import {Credentials, selectS3BucketCredentials} from '@common/core/reducers/common-auth-reducer';
import {updateS3Credential} from '@common/core/actions/common-auth.actions';
import {AdminService} from '~/shared/services/admin.service';
import {S3AccessComponent} from '@common/settings/admin/s3-access/s3-access.component';
import {FormsModule} from '@angular/forms';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';

@Component({
    selector: 'sm-profile-key-storage',
    templateUrl: './profile-key-storage.component.html',
    styleUrls: ['./profile-key-storage.component.scss'],
    imports: [
        S3AccessComponent,
        FormsModule,
        TooltipDirective
    ]
})
export class ProfileKeyStorageComponent {
  externalCredentials = input<Credentials[]>([]);
  protected s3BucketCredentials = this.store.selectSignal(selectS3BucketCredentials);

  constructor(private store: Store,
              private adminService: AdminService) { }

  onS3BucketCredentialsChanged(formData: {bucketCredentials: Credentials[]}) {
    this.adminService.resetS3Services();
    this.store.dispatch(updateS3Credential({s3BucketCredentials: formData}));
  }
}
