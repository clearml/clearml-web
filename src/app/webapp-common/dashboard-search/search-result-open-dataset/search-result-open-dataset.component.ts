import {Component, input, output} from '@angular/core';
import {ResultLineComponent} from '@common/shared/ui-components/panel/result-line/result-line.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {Project} from '~/business-logic/model/projects/project';
import {ShortProjectNamePipe} from '@common/shared/pipes/short-project-name.pipe';

@Component({
  selector: 'sm-search-result-open-dataset',
  imports: [
    ResultLineComponent,
    TimeAgoPipe,
    ShortProjectNamePipe
  ],
  templateUrl: './search-result-open-dataset.component.html',
  styleUrl: '../search-result-common.component.scss'
})
export class SearchResultOpenDatasetComponent {

  entity = input<Project>()
  statusOptionsLabels = input<Record<string,string>>();
  openDatasetSelected = output<Project>();
}
