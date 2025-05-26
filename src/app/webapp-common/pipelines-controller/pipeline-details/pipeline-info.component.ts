import {Component, inject, input, computed} from '@angular/core';
import {Store} from '@ngrx/store';
import {
  PipelineItem,
} from '@common/pipelines-controller/pipeline-controller-info/pipeline-controller-info.component';
import {TaskTypeEnum} from '~/business-logic/model/tasks/taskTypeEnum';
import {addMessage} from '@common/core/actions/layout.actions';
import {fileSizeConfigStorage} from '@common/shared/pipes/filesize.pipe';
import {MESSAGES_SEVERITY} from '@common/constants';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {StepStatusEnum} from '@common/experiments/actions/common-experiments-info.actions';

@Component({
    selector: 'sm-pipeline-info',
    templateUrl: './pipeline-info.component.html',
    styleUrls: ['./pipeline-info.component.scss'],
    standalone: false
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
}
