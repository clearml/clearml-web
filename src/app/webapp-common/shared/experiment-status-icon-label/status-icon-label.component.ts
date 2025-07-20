import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {EXPERIMENTS_STATUS_LABELS} from '~/features/experiments/shared/experiments.const';
import {TASKS_STATUS} from '@common/tasks/tasks.constants';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatIcon} from '@angular/material/icon';
import {TitleCasePipe} from '@angular/common';

@Component({
    selector: 'sm-status-icon-label',
    templateUrl: './status-icon-label.component.html',
    styleUrls: ['./status-icon-label.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatProgressSpinnerModule,
    MatIcon,
    TitleCasePipe
  ]
})
export class StatusIconLabelComponent {

  showLabel = input(true);
  showIcon = input(true);
  enableSpinner = input(false);
  status = input<string>();
  type = input();
  progress = input();
  inline = input(true);
  externalStatusLabels = input<Record<string, string>>(null);
  protected readonly experimentsStatusLabels = computed(() => this.externalStatusLabels() || EXPERIMENTS_STATUS_LABELS);

  protected showSpinner = computed(() => [
    TASKS_STATUS.IN_PROGRESS,
    TASKS_STATUS.FAILED,
    TASKS_STATUS.STOPPED
  ].includes(this.status()));

  statusIcon = computed(() => {
    switch (this.status()) {
      case 'created':
      case 'draft':
      case 'Draft':
        return 'al-ico-status-draft';
      case 'completed':
      case 'stopped':
      case 'closed':
      case 'Final':
      case 'Ready':
      case 'available':
      case 'committed':
        return 'al-ico-completed';
      case 'committing':
      case 'in_progress':
      case 'Uploading':
      case 'active':
      case 'routing':
        return 'al-ico-running';
      case 'failed':
        return 'al-ico-dialog-x';
      case 'queued':
      case 'pending':
        return 'al-ico-pending';
      case 'published':
      case 'publishing':
        return 'al-ico-published';
      default:
        return '';
    }
  });
}
