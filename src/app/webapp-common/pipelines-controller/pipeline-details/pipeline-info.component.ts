import {Component, inject, input, computed} from '@angular/core';
import {Store} from '@ngrx/store';
import {
  PipelineItem,
} from '@common/pipelines-controller/pipeline-controller-info/pipeline-controller-info.component';
import {TaskTypeEnum} from '~/business-logic/model/tasks/taskTypeEnum';
import {addMessage} from '@common/core/actions/layout.actions';
import {fileSizeConfigStorage, FileSizePipe} from '@common/shared/pipes/filesize.pipe';
import {MESSAGES_SEVERITY} from '@common/constants';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {exportTaskInfo, StepStatusEnum} from '@common/experiments/actions/common-experiments-info.actions';
import {IdBadgeComponent} from '@common/shared/components/id-badge/id-badge.component';
import {MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle} from '@angular/material/expansion';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {RouterLink} from '@angular/router';
import {DurationPipe} from '@common/shared/pipes/duration.pipe';
import {RegexPipe} from '@common/shared/pipes/filter-regex.pipe';
import {KeyValuePipe, TitleCasePipe} from '@angular/common';
import {FilterMonitorMetricPipe} from '@common/shared/pipes/filter-monitor-metric.pipe';
import {MatIconModule} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';

@Component({
  selector: 'sm-pipeline-info',
  templateUrl: './pipeline-info.component.html',
  styleUrls: ['./pipeline-info.component.scss'],
  imports: [
    IdBadgeComponent,
    MatIconModule,
    MatExpansionPanelHeader,
    MatExpansionPanel,
    ShowTooltipIfEllipsisDirective,
    TooltipDirective,
    RouterLink,
    FileSizePipe,
    DurationPipe,
    RegexPipe,
    TitleCasePipe,
    FilterMonitorMetricPipe,
    KeyValuePipe,
    MatIconButton,
    MatExpansionPanelTitle
  ]
})
export class PipelineInfoComponent {
      private store = inject(Store);
  public fileSizeConfigStorage = fileSizeConfigStorage;

  project = input<string>();
  entity = input<IExperimentInfo>();
  step = input<PipelineItem>();
  protected stepWithStatus = computed(() => this.step() ?
    {...this.step(), data: {...this.step().data, status: this.step().data?.status || StepStatusEnum.pending}} :
    null
  );
  protected controller = computed(() => this.entity()?.type === TaskTypeEnum.Controller);

  copyToClipboard() {
    this.store.dispatch(addMessage(MESSAGES_SEVERITY.SUCCESS, 'ID copied successfully'));
  }

  exportPipelineInfo(): void {
    const entity = this.entity();
    if (entity?.id) {
      this.store.dispatch(exportTaskInfo({taskId: entity.id, exportType: this.controller() ? 'Pipeline' : 'Step'}));
    }
  }
}
