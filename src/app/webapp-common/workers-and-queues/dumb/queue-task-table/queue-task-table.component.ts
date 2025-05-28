import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {Queue} from '@common/workers-and-queues/actions/queues.actions';
import {QUEUES_TABLE_COL_FIELDS} from '../../workers-and-queues.consts';
import {TIME_FORMAT_STRING} from '@common/constants';
import {ITableExperiment} from '@common/experiments/shared/common-experiment-model.model';

@Component({
    selector: 'sm-queue-task-table',
    templateUrl: './queue-task-table.component.html',
    styleUrls: ['./queue-task-table.component.scss'],
    standalone: false
})
export class QueueTaskTableComponent {

  public cols: ISmCol[];
  public readonly QUEUES_TABLE_COL_FIELDS = QUEUES_TABLE_COL_FIELDS;

  @Input() queue: Queue;
  @Input() tasks: ITableExperiment[];
  @Output() taskSelected = new EventEmitter();
  TIME_FORMAT_STRING = TIME_FORMAT_STRING;

  constructor() {
    this.cols = [
      {
        id         : QUEUES_TABLE_COL_FIELDS.NAME,
        header     : 'Task Name',
        style      : {width: '680px'},
        headerType : ColHeaderTypeEnum.title,
        disableDrag: true,
        disablePointerEvents: true
      },
      {
        id         : QUEUES_TABLE_COL_FIELDS.ID,
        header     : 'Task ID',
        style      : {width: '300px'},
        headerType : ColHeaderTypeEnum.title,
        disableDrag: true,
        disablePointerEvents: true
      },
      {
        id         : QUEUES_TABLE_COL_FIELDS.QUEUED,
        header     : 'Queued At',
        style      : {width: '150px'},
        headerType : ColHeaderTypeEnum.title,
        disableDrag: true,
        disablePointerEvents: true
      },
    ];
  }

  onRowClicked(event) {
    this.taskSelected.emit(event.data);
  }
}
