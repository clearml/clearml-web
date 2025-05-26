import {Component, input } from '@angular/core';
import {EXPERIMENTS_STATUS_LABELS} from '~/features/experiments/shared/experiments.const';
import { UpperCasePipe } from '@angular/common';

@Component({
    selector: 'sm-info-header-status-icon-label',
    templateUrl: './info-header-status-icon-label.component.html',
    styleUrls: ['./info-header-status-icon-label.component.scss'],
    imports: [
        UpperCasePipe
    ]
})
export class InfoHeaderStatusIconLabelComponent {
  showLabel = input(true);
  status = input('');

  protected readonly experimentsStatusLabels = EXPERIMENTS_STATUS_LABELS;
}
