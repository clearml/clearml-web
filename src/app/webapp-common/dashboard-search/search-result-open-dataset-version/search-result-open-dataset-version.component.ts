import {Component, input, output} from '@angular/core';
import {ResultLineComponent} from '@common/shared/ui-components/panel/result-line/result-line.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {ITask} from '~/business-logic/model/al-task';
import {ShortProjectNamePipe} from '@common/shared/pipes/short-project-name.pipe';

@Component({
  selector: 'sm-search-result-open-dataset-version',
  imports: [
    ResultLineComponent,
    TimeAgoPipe,
    ShortProjectNamePipe
  ],
  templateUrl: './search-result-open-dataset-version.component.html',
  styleUrl: '../search-result-common.component.scss'
})
export class SearchResultOpenDatasetVersionComponent {

  entity = input<ITask>()
  statusOptionsLabels = input<Record<string,string>>();
  openDatasetVersionSelected = output<ITask>();
}
