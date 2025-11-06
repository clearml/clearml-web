import {Component, input, output} from '@angular/core';
import {ResultLineComponent} from '@common/shared/ui-components/panel/result-line/result-line.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {Project} from '~/business-logic/model/projects/project';

@Component({
  selector: 'sm-search-result-project',
  imports: [
    ResultLineComponent,
    TimeAgoPipe
  ],
  templateUrl: './search-result-project.component.html',
  styleUrl: '../search-result-common.component.scss'
})
export class SearchResultProjectComponent {

  entity = input<Project>()
  statusOptionsLabels = input<Record<string,string>>();
  projectSelected = output<Project>();
}
