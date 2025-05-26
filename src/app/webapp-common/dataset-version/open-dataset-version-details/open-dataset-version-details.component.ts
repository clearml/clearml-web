import {Component, output } from '@angular/core';
import {PipelineInfoComponent} from '@common/pipelines-controller/pipeline-details/pipeline-info.component';
import { fileSizeConfigStorage } from '@common/shared/pipes/filesize.pipe';
import {DATASETS_STATUS_LABEL, EXPERIMENTS_STATUS_LABELS} from '~/features/experiments/shared/experiments.const';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';

@Component({
    selector: 'sm-open-dataset-version-details',
    templateUrl: './open-dataset-version-details.component.html',
    styleUrls: ['./open-dataset-version-details.component.scss', '../../pipelines-controller/pipeline-details/pipeline-info.component.scss'],
    standalone: false
})
export class OpenDatasetVersionDetailsComponent extends PipelineInfoComponent {
  public override fileSizeConfigStorage = fileSizeConfigStorage;

  protected readonly convertStatusMap = DATASETS_STATUS_LABEL;
  protected readonly convertStatusMapBase = EXPERIMENTS_STATUS_LABELS;

  editDescription = output<IExperimentInfo>();
}
