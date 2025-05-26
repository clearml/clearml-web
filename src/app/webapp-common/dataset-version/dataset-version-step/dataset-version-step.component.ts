import {Component, computed, Input, input, output} from '@angular/core';
import {DagModelItem} from '@ngneat/dag';
import {fileSizeConfigStorage} from '@common/shared/pipes/filesize.pipe';
import {StepStatusEnum} from '@common/experiments/actions/common-experiments-info.actions';

export interface TreeVersion {
  name: string;
  version: string;
  job_id: string;
  status: StepStatusEnum,
  last_update: number,
  parents: string[],
  job_size: number
}

export interface VersionItem extends DagModelItem {
  name: string;
  id: string;
  data: TreeVersion;
}

@Component({
    selector: 'sm-dataset-version-step',
    templateUrl: './dataset-version-step.component.html',
    styleUrls: ['../../pipelines-controller/pipeline-controller-step/pipeline-controller-step.component.scss', './dataset-version-step.component.scss'],
    standalone: false
})
export class DatasetVersionStepComponent {
  protected readonly fileSizeConfigStorage = fileSizeConfigStorage;

  step = input<VersionItem>();
  selected = input<boolean>();
  openConsole = output();
  protected stepData = computed(() => (({...this.step(), data: {...this.step().data, status: this.step().data?.status || StepStatusEnum.pending}})));
}
