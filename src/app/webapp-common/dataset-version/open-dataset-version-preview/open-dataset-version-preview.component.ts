import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {
  ExperimentOutputPlotsComponent
} from '@common/experiments/containers/experiment-output-plots/experiment-output-plots.component';
import {DebugImagesComponent} from '@common/debug-images/debug-images.component';

@Component({
    selector: 'sm-open-dataset-version-preview',
    templateUrl: './open-dataset-version-preview.component.html',
    styleUrls: ['./open-dataset-version-preview.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ExperimentOutputPlotsComponent,
    DebugImagesComponent
  ]
})
export class OpenDatasetVersionPreviewComponent {
  selected = input.required<{id: string}>();
}
