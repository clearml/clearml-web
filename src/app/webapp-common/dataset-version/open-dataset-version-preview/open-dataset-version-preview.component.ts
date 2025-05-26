import {ChangeDetectionStrategy, Component, input } from '@angular/core';
import {DebugImagesModule} from '@common/debug-images/debug-images.module';
import {ExperimentSharedModule} from '~/features/experiments/shared/experiment-shared.module';

@Component({
    selector: 'sm-open-dataset-version-preview',
    templateUrl: './open-dataset-version-preview.component.html',
    styleUrls: ['./open-dataset-version-preview.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ExperimentSharedModule,
        DebugImagesModule
    ]
})
export class OpenDatasetVersionPreviewComponent {
  selected = input.required<{id: string}>();
}
