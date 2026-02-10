import {ChangeDetectionStrategy, Component, output} from '@angular/core';
import {PipelineInfoComponent} from '@common/pipelines-controller/pipeline-details/pipeline-info.component';
import {fileSizeConfigStorage, FileSizePipe} from '@common/shared/pipes/filesize.pipe';
import {DATASETS_STATUS_LABEL, EXPERIMENTS_STATUS_LABELS} from '~/features/experiments/shared/experiments.const';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {IdBadgeComponent} from '@common/shared/components/id-badge/id-badge.component';
import {MatExpansionPanel, MatExpansionPanelHeader} from '@angular/material/expansion';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {MatIconButton} from '@angular/material/button';
import {ReplaceViaMapPipe} from '@common/shared/pipes/replaceViaMap';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'sm-open-dataset-version-details',
  templateUrl: './open-dataset-version-details.component.html',
  styleUrls: ['./open-dataset-version-details.component.scss', '../../pipelines-controller/pipeline-details/pipeline-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IdBadgeComponent,
    MatIconModule,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    TooltipDirective,
    ShowTooltipIfEllipsisDirective,
    MatIconButton,
    FileSizePipe,
    ReplaceViaMapPipe
  ]
})
export class OpenDatasetVersionDetailsComponent extends PipelineInfoComponent {
  public override fileSizeConfigStorage = fileSizeConfigStorage;

  protected readonly convertStatusMap = DATASETS_STATUS_LABEL;
  protected readonly convertStatusMapBase = EXPERIMENTS_STATUS_LABELS;

  editDescription = output<IExperimentInfo>();
}
