import {Component, input, output } from '@angular/core';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';

@Component({
    selector: 'sm-experiment-info-edit-description',
    templateUrl: './experiment-info-edit-description.component.html',
    styleUrls: ['./experiment-info-edit-description.component.scss'],
})
export class ExperimentInfoEditDescriptionComponent {
  selectedExperiment = input<IExperimentInfo>();
  editDescription = output();
}
