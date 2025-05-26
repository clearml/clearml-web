import {Component} from '@angular/core';
import {setFilterByUser} from '@common/core/actions/users.actions';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {selectShowOnlyUserWork} from '@common/core/reducers/users-reducer';
import {selectProjectType} from '@common/core/reducers/view.reducer';
import {PushPipe} from '@ngrx/component';

@Component({
    selector: 'sm-show-only-user-work',
    templateUrl: './show-only-user-work.component.html',
    styleUrls: ['./show-only-user-work.component.scss'],
    imports: [
        MenuComponent,
        MenuItemComponent,
        PushPipe
    ]
})
export class ShowOnlyUserWorkComponent {
  public isUserMenuOpened: boolean;
  public showOnlyUserWork$: Observable<boolean>;
  currentFeature$ = this.store.selectSignal(selectProjectType);

  constructor(private store: Store) {
    this.showOnlyUserWork$ = this.store.select(selectShowOnlyUserWork);
  }

  userFilterChanged(userFiltered: boolean) {
    this.store.dispatch(setFilterByUser({showOnlyUserWork: userFiltered, feature: this.currentFeature$()}));
  }

  userFilterMenuOpened(isUserMenuOpened: boolean) {
    this.isUserMenuOpened = isUserMenuOpened;
  }

}
