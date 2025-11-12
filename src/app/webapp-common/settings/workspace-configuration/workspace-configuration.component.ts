import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {Store} from '@ngrx/store';
import {SettingsModule} from '~/features/settings/settings.module';
import {UserDataComponent} from '~/features/settings/containers/admin/user-data/user-data.component';
import {
  UserCredentialsComponent
} from '~/features/settings/containers/admin/user-credentials/user-credentials.component';

@Component({
  selector: 'sm-workspace-configuration',
  templateUrl: './workspace-configuration.component.html',
  styleUrls: ['./workspace-configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SettingsModule,
    UserDataComponent,
    UserCredentialsComponent
  ]
})
export class WorkspaceConfigurationComponent {

  private store = inject(Store);
  protected currentUser = this.store.selectSignal(selectCurrentUser);

}
