import {Component, input, output} from '@angular/core';
import {ResultLineComponent} from '@common/shared/ui-components/panel/result-line/result-line.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {ITask} from '~/business-logic/model/al-task';

@Component({
  selector: 'sm-search-result-task',
  imports: [
    ResultLineComponent,
    TimeAgoPipe,
  ],
  templateUrl: './search-result-task.component.html',
  styleUrl: '../search-result-common.component.scss'
})
export class SearchResultTaskComponent {

  entity = input<ITask>()
  statusOptionsLabels = input<Record<string,string>>();
  taskSelected = output<ITask>();
}
