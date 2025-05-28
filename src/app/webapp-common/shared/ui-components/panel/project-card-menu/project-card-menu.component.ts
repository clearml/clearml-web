import {Component, input, output } from '@angular/core';
import {Project} from '~/business-logic/model/projects/project';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';


@Component({
    selector: 'sm-project-card-menu',
    templateUrl: './project-card-menu.component.html',
    styleUrls: ['./project-card-menu.component.scss'],
    imports: [
        MenuItemComponent,
        MenuComponent
    ]
})
export class ProjectCardMenuComponent {
  deleteProjectClicked = output<Project>();
  moveToClicked = output<Project>();
  newProjectClicked = output<Project>();
  projectNameInlineActivated = output();
  projectEditClicked = output<Project>();
  projectSettingsClicked = output<Project>();
  project = input<Project>();
}
