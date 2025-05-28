import {Component} from '@angular/core';
import {BaseExperimentOutputComponent} from '@common/experiments/containers/experiment-ouptut/base-experiment-output.component';

@Component({
  selector: 'sm-experiment-output',
  templateUrl: './experiment-output.component.html',
  styleUrls: ['../../../../webapp-common/experiments/containers/experiment-ouptut/base-experiment-output.component.scss'],
  standalone: false
})
export class ExperimentOutputComponent extends BaseExperimentOutputComponent {
  public overflow: boolean;
}
