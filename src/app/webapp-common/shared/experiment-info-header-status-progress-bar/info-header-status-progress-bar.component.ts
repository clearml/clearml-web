import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {EXPERIMENTS_STATUS_LABELS} from '~/features/experiments/shared/experiments.const';
import {
  InfoHeaderStatusIconLabelComponent
} from '@common/shared/experiment-info-header-status-icon-label/info-header-status-icon-label.component';

@Component({
  selector: 'sm-info-header-status-progress-bar',
  templateUrl: './info-header-status-progress-bar.component.html',
  styleUrls: ['./info-header-status-progress-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    InfoHeaderStatusIconLabelComponent
  ],
  })
export class InfoHeaderStatusProgressBarComponent {
  status = input<string>();
  editable = input(true);
  development = input(false);
  showMaximize = input<boolean>();
  closeInfoClicked = output();
  maximizedClicked = output();

  readonly EXPERIMENTS_STATUS_LABELS = EXPERIMENTS_STATUS_LABELS;
}
