import {Component, input, output} from '@angular/core';
import {WorkerExt} from '@common/workers-and-queues/actions/workers.actions';

@Component({
    selector: 'sm-worker-info',
    templateUrl: './worker-info.component.html',
    styleUrls: ['./worker-info.component.scss'],
    standalone: false
})
export class WorkerInfoComponent {
  selectedWorker = input<WorkerExt>();
  deselectWorker = output();

  public readonly cols     = [
    {header: 'QUEUE', class: ''},
    {header: 'NEXT TASK', class: ''},
    {header: 'IN QUEUE', class: ''},
  ];
}
