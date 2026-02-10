import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {Store} from '@ngrx/store';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {updateCurrentUser} from '@common/core/actions/users.actions';
import {GetCurrentUserResponseUserObject} from '~/business-logic/model/users/getCurrentUserResponseUserObject';
import {addMessage} from '@common/core/actions/layout.actions';
import {ConfigurationService} from '@common/shared/services/configuration.service';
import {InlineEditComponent} from '@common/shared/ui-components/inputs/inline-edit/inline-edit.component';
import {IdBadgeComponent} from '@common/shared/components/id-badge/id-badge.component';
import {setAllProjectUsers} from '@common/core/actions/projects.actions';

@Component({
  selector: 'sm-profile-name',
  templateUrl: './profile-name.component.html',
  styleUrls: ['./profile-name.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    InlineEditComponent,
    IdBadgeComponent
  ]
})
export class ProfileNameComponent {
  private store = inject(Store);
  protected readonly config = inject(ConfigurationService);

  currentUser = this.store.selectSignal(selectCurrentUser);
  active = signal(false);


  nameChange(updatedUserName: string, currentUser: GetCurrentUserResponseUserObject) {
    const user = {name: updatedUserName, user: currentUser.id};
    this.store.dispatch(updateCurrentUser({user}));
    this.store.dispatch(setAllProjectUsers({users: []}));
  }
  copyToClipboard() {
    this.store.dispatch(addMessage('success', 'Copied to clipboard'));
  }
}
