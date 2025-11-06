import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {selectServerVersions} from '@common/core/reducers/users-reducer';
import {Store} from '@ngrx/store';
import version from '../../../../../version.json';
import {getApiVersion} from '@common/core/actions/users.actions';
import {
  AdminFooterActionsComponent
} from '~/features/settings/containers/admin/admin-footer-actions/admin-footer-actions.component';

@Component({
  selector: 'sm-admin-footer',
  templateUrl: './admin-footer.component.html',
  styleUrls: ['./admin-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AdminFooterActionsComponent
  ]
})
export class AdminFooterComponent {
  private store = inject(Store);
  public serverVersions = this.store.selectSignal(selectServerVersions);
  public version = version;

  constructor() {
    this.store.dispatch(getApiVersion());
  }
}
