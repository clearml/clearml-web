import {Component, input, output} from '@angular/core';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';

@Component({
  selector: 'sm-show-only-user-work-menu',
  imports: [
    MenuComponent,
    MenuItemComponent
  ],
  templateUrl: './show-only-user-work-menu.component.html',
  styleUrl: './show-only-user-work-menu.component.scss'
})
export class ShowOnlyUserWorkMenuComponent {
  userFilterChanged = output<boolean>()
  showOnlyUserWork = input<boolean>()
}
