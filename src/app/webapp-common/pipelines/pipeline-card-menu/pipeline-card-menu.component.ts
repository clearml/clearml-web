import {Component, input, output } from '@angular/core';
import { ICONS } from '@common/constants';
import {Project} from '~/business-logic/model/projects/project';
import {TagsMenuComponent} from '@common/shared/ui-components/tags/tags-menu/tags-menu.component';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'sm-pipeline-card-menu',
  templateUrl: './pipeline-card-menu.component.html',
  styleUrls: ['./pipeline-card-menu.component.scss'],
  imports: [
    TagsMenuComponent,
    ClickStopPropagationDirective,
    MatIconModule,
    MatIconButton,
    MatMenuItem,
    MatMenuTrigger,
    MatMenu
  ]
})
export class PipelineCardMenuComponent {
  readonly icons = ICONS;

  project = input<Project>();
  allTags = input<string[]>();
  run = output();
  addTag = output<string>();
  rename = output();
  delete = output();
}
