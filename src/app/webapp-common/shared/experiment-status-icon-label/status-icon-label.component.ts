import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {EXPERIMENTS_STATUS_LABELS} from '~/features/experiments/shared/experiments.const';
import {TASKS_STATUS} from '@common/tasks/tasks.constants';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'sm-status-icon-label',
    templateUrl: './status-icon-label.component.html',
    styleUrls: ['./status-icon-label.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatProgressSpinnerModule,
        MatIcon
    ]
})
export class StatusIconLabelComponent {
  protected readonly experimentsStatusLabels = EXPERIMENTS_STATUS_LABELS;

  showLabel = input(true);
  showIcon = input(true);
  enableSpinner = input(false);
  status = input<string>();
  type = input();
  progress = input();
  inline = input(true);

  protected showSpinner = computed(() => [
    TASKS_STATUS.IN_PROGRESS,
    TASKS_STATUS.FAILED,
    TASKS_STATUS.STOPPED
  ].includes(this.status()));

  statusIcon = computed(() => {
    switch (this.status()) {
      case 'created':
      case 'Draft':
        return 'al-ico-status-draft';
      case 'completed':
      case 'stopped':
      case 'closed':
      case 'Final':
      case 'Ready':
        return 'al-ico-completed';
      case 'in_progress':
      case 'Uploading':
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
