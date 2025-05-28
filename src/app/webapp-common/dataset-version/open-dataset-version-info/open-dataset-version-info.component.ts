import {Component, inject } from '@angular/core';
import {PipelineControllerInfoComponent, PipelineItem, StatusOption} from '@common/pipelines-controller/pipeline-controller-info/pipeline-controller-info.component';
import {DagManagerUnsortedService} from '@common/shared/services/dag-manager-unsorted.service';
import {experimentDetailsUpdated, getSelectedPipelineStep, setSelectedPipelineStep} from '@common/experiments/actions/common-experiments-info.actions';
import {last} from 'lodash-es';
import {MatDialog} from '@angular/material/dialog';
import {EditJsonComponent, EditJsonData} from '@common/shared/ui-components/overlay/edit-json/edit-json.component';
import {CommonExperimentsInfoEffects} from '@common/experiments/effects/common-experiments-info.effects';
import {tap} from 'rxjs/operators';
import {TaskStatusEnum} from '~/business-logic/model/tasks/taskStatusEnum';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';

@Component({
    selector: 'sm-open-dataset-version-info',
    templateUrl: './open-dataset-version-info.component.html',
    styleUrls: [
        './open-dataset-version-info.component.scss',
        '../../pipelines-controller/pipeline-controller-info/pipeline-controller-info.component.scss'
    ],
    providers: [DagManagerUnsortedService],
    standalone: false
})
export class OpenDatasetVersionInfoComponent extends PipelineControllerInfoComponent {
      private dialog = inject(MatDialog);
      private commonExperimentsInfoEffects = inject(CommonExperimentsInfoEffects);

  constructor(
) {
    super();
    this.detailsPanelMode.set(StatusOption.content);
    this.defaultDetailsMode = StatusOption.content;
  }

  override convertPipelineToDagModel(pipeline): PipelineItem[] {
    const res = super.convertPipelineToDagModel(pipeline);
    if (res?.length > 0) {
      window.setTimeout(() => this.selectStep(last(res)), 1000);
    } else if (this.infoData?.id){
      this.store.dispatch(getSelectedPipelineStep({id: this.infoData.id}));
    }
    return res;
  }

  override getEntityId(params) {
    return params?.versionId;
  }

  protected override getTreeObject(task) {
    return task?.configuration?.['Dataset Struct']?.value;
  }

  override toggleResultSize() {
    this.maximizeResults = ! this.maximizeResults;
    if (this.detailsPanelMode() === StatusOption.content) {
      this.detailsPanelMode.set(null);
      window.setTimeout(() => {
        this.detailsPanelMode.set(StatusOption.content);
      }, 450);
    }
  }

  override selectStep(step?: PipelineItem) {
    if (step) {
      const id = step?.data?.job_id;
      if (id) {
        this.store.dispatch(getSelectedPipelineStep({id}));
      } else {
        this.store.dispatch(setSelectedPipelineStep({step: {id, type: step.data.job_type, status: step.data.status as unknown as TaskStatusEnum, name: step.name}}));
        this.showLog.set(false);
      }
      this.selectedEntity.set(step);
    }
  }

  toggleDetails() {
    this.showLog.update(show => !show);
  }

  protected override getPanelMode() {
    return this.detailsPanelMode();
  }

  protected override resetUninitializedRunningFields() {

  }

  editDescription(dataset: IExperimentInfo) {
    const editJsonComponent = this.dialog.open(EditJsonComponent, {
      data: {
        textData: dataset.comment,
        title: 'EDIT DESCRIPTION',
      } as EditJsonData
    });
    editJsonComponent.afterClosed().subscribe(res => {
      if (res !== undefined) {
        this.store.dispatch(experimentDetailsUpdated({id: dataset.id, changes: {comment: res}}));
        this.commonExperimentsInfoEffects.getExperimentInfo$
          .pipe(tap(() => this.store.dispatch(getSelectedPipelineStep({id: dataset.id}))));
      }
    });
  }
}
