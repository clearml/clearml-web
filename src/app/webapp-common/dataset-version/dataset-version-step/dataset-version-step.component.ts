import {Component, computed, input, output} from '@angular/core';
import {DagModelItem} from '@ngneat/dag';
import {fileSizeConfigStorage, FileSizePipe} from '@common/shared/pipes/filesize.pipe';
import {StepStatusEnum} from '@common/experiments/actions/common-experiments-info.actions';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MatIconButton} from '@angular/material/button';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {MatIconModule} from '@angular/material/icon';

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
  imports: [
    TooltipDirective,
    ShowTooltipIfEllipsisDirective,
    MatIconModule,
    MatIconButton,
    FileSizePipe,
    TimeAgoPipe
  ]
})
export class DatasetVersionStepComponent {
  protected readonly fileSizeConfigStorage = fileSizeConfigStorage;

  step = input<VersionItem>();
  selected = input<boolean>();
  openConsole = output();
  protected stepData = computed(() => (({...this.step(), data: {...this.step().data, status: this.step().data?.status || StepStatusEnum.pending}})));
}
