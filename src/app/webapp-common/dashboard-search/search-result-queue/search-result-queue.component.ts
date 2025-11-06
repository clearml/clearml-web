import {Component, input, output} from '@angular/core';
import {ResultLineComponent} from '@common/shared/ui-components/panel/result-line/result-line.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {Queue} from '~/business-logic/model/queues/queue';

@Component({
  selector: 'sm-search-result-queue',
  imports: [
    ResultLineComponent,
    TimeAgoPipe,
  ],
  templateUrl: './search-result-queue.component.html',
  styleUrl: '../search-result-common.component.scss'
})
export class SearchResultQueueComponent {

  entity = input<Queue>()
  statusOptionsLabels = input<Record<string,string>>();
  queueSelected = output<Queue>();
}
