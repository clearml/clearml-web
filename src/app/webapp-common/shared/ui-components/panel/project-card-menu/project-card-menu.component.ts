import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {Project} from '~/business-logic/model/projects/project';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {MatDivider} from '@angular/material/divider';


@Component({
  selector: 'sm-project-card-menu',
  templateUrl: './project-card-menu.component.html',
  styleUrls: ['./project-card-menu.component.scss'],
  changeDetection :ChangeDetectionStrategy.OnPush,
  imports: [
    MenuItemComponent,
    MenuComponent,
    MatDivider
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
