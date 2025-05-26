import {ChangeDetectionStrategy, Component, effect, inject, signal, untracked} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {getAllCredentials} from '@common/core/actions/common-auth.actions';
import {updateCurrentUser} from '@common/core/actions/users.actions';
import {GetCurrentUserResponseUserObject} from '~/business-logic/model/users/getCurrentUserResponseUserObject';
import {addMessage} from '@common/core/actions/layout.actions';
import {ConfigurationService} from '@common/shared/services/configuration.service';

@Component({
    selector: 'sm-profile-name',
    templateUrl: './profile-name.component.html',
    styleUrls: ['./profile-name.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ProfileNameComponent {
  private store = inject(Store);
  protected readonly config = inject(ConfigurationService);

  currentUser = this.store.selectSignal(selectCurrentUser);
  active = signal(false);

  constructor() {
    effect(() => {
      if (this.currentUser()) {
        untracked(() => this.store.dispatch(getAllCredentials({})));
      }
    });
  }

  nameChange(updatedUserName: string, currentUser: GetCurrentUserResponseUserObject) {
    const user = {name: updatedUserName, user: currentUser.id};
    this.store.dispatch(updateCurrentUser({user}));
  }
  copyToClipboard() {
    this.store.dispatch(addMessage('success', 'Copied to clipboard'));
  }
}
