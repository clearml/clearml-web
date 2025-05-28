import {Component} from '@angular/core';
import {ProjectCardMenuComponent} from '@common/shared/ui-components/panel/project-card-menu/project-card-menu.component';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';


@Component({
  selector: 'sm-project-card-menu-extended',
  templateUrl: '../../../../webapp-common/shared/ui-components/panel/project-card-menu/project-card-menu.component.html',
  styleUrls: ['../../../../webapp-common/shared/ui-components/panel/project-card-menu/project-card-menu.component.scss'],
  imports: [
    MenuItemComponent,
    MenuComponent,
  ]
})
export class ProjectCardMenuExtendedComponent extends ProjectCardMenuComponent {
  set contextMenu(data) {}
  get contextMenu() {
    return this;
  }
}
