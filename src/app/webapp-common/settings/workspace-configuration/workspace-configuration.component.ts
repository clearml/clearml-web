import {Component, inject} from '@angular/core';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {Store} from '@ngrx/store';

@Component({
    selector: 'sm-workspace-configuration',
    templateUrl: './workspace-configuration.component.html',
    styleUrls: ['./workspace-configuration.component.scss'],
    standalone: false
})
export class WorkspaceConfigurationComponent {

  private store = inject(Store);
  protected currentUser = this.store.selectSignal(selectCurrentUser);

}
