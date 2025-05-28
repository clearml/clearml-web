import {Component, input, output } from '@angular/core';
import { ICONS } from '@common/constants';
import {Project} from '~/business-logic/model/projects/project';

@Component({
    selector: 'sm-pipeline-card-menu',
    templateUrl: './pipeline-card-menu.component.html',
    styleUrls: ['./pipeline-card-menu.component.scss'],
    standalone: false
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
