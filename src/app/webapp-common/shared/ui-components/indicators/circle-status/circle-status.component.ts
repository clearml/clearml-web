import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {TaskStatusEnum} from '~/business-logic/model/tasks/taskStatusEnum';
import {EXPERIMENTS_TYPE_LABELS} from '~/shared/constants/non-common-consts';
import {TaskTypeEnum} from '~/business-logic/model/tasks/taskTypeEnum';
import {MatIcon} from '@angular/material/icon';



@Component({
    selector: 'sm-circle-status',
    templateUrl: './circle-status.component.html',
    styleUrls: ['./circle-status.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatIcon
    ]
})
export class CircleStatusComponent {
  protected readonly experimentsStatusLabels = EXPERIMENTS_TYPE_LABELS;

  status = input<TaskStatusEnum>();
  type = input<TaskTypeEnum>();
  defaultStatus = input('');
  statusIcon = computed(() => {
    switch (this.status()) {
      case 'created':
        return 'al-ico-status-draft';
      case 'completed':
      case 'stopped':
      case 'closed':
        return 'al-ico-completed';
      case 'in_progress':
        return 'al-ico-running';
      case 'failed':
        return 'al-ico-dialog-x';
      case 'queued':
        return 'al-ico-pending';
      case 'published':
      case 'publishing':
        return 'al-ico-published';
      default:
        return '';
    }
  });
}
