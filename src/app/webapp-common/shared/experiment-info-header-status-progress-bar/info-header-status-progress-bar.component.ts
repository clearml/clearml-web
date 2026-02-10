import {Component, EventEmitter, Input, Output} from '@angular/core';
import {EXPERIMENTS_STATUS_LABELS} from '~/features/experiments/shared/experiments.const';
import {
  InfoHeaderStatusIconLabelComponent
} from '@common/shared/experiment-info-header-status-icon-label/info-header-status-icon-label.component';

@Component({
  selector: 'sm-info-header-status-progress-bar',
  templateUrl: './info-header-status-progress-bar.component.html',
  styleUrls: ['./info-header-status-progress-bar.component.scss'],
  imports: [
    InfoHeaderStatusIconLabelComponent
  ],
  })
export class InfoHeaderStatusProgressBarComponent {
  @Input() status;
  @Input() editable          = true;
  @Input() development        = false;
  @Input() showMaximize: boolean;
  @Output() closeInfoClicked = new EventEmitter();
  @Output() maximizedClicked = new EventEmitter();

  readonly EXPERIMENTS_STATUS_LABELS = EXPERIMENTS_STATUS_LABELS;
}
