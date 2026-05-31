import {ChangeDetectionStrategy, Component} from '@angular/core';
import {ExperimentMenuComponent} from '@common/experiments/shared/components/experiment-menu/experiment-menu.component';
import {selectionDisabledAbort, selectionDisabledContinue} from '@common/shared/entity-page/items.utils';
import * as commonMenuActions from '@common/experiments/actions/common-experiments-menu.actions';
import {abortAllChildren} from '@common/experiments/actions/common-experiments-menu.actions';
import {
  RunPipelineControllerDialogComponent,
  RunPipelineResult
} from '../run-pipeline-controller-dialog/run-pipeline-controller-dialog.component';
import {filter} from 'rxjs/operators';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {ISelectedExperiment} from '~/features/experiments/shared/experiment-info.model';
import {TagsMenuComponent} from '@common/shared/ui-components/tags/tags-menu/tags-menu.component';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MenuItemTextPipe} from '@common/shared/pipes/menu-item-text.pipe';
import {MatIconModule} from '@angular/material/icon';
import {exportTaskInfo} from '@common/experiments/actions/common-experiments-info.actions';


@Component({
  selector: 'sm-controller-menu',
  templateUrl: './pipeline-controller-menu.component.html',
  styleUrls: ['./pipeline-controller-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TagsMenuComponent,
    MatIconModule,
    MatMenuItem,
    MatMenuTrigger,
    MatMenu,
    MenuItemTextPipe
  ]
})
export class PipelineControllerMenuComponent extends ExperimentMenuComponent {
  entityTypeEnum = EntityTypeEnum;

  runPipelineController(runNew = false, createNewPipeline = false) {
    this.dialog.open<RunPipelineControllerDialogComponent,
      {task: ISelectedExperiment; createNewPipeline?: boolean}, RunPipelineResult>
    (RunPipelineControllerDialogComponent, {
      panelClass: 'dialog-md',
      data: {task: runNew ? null : this.experiment(), createNewPipeline}
    }).afterClosed()
      .pipe(filter(res => !!res?.confirmed))
      .subscribe((res) => {
        this.store.dispatch(commonMenuActions.startPipeline({
          task: res.task,
          args: res.args,
          queue: res.queue,
          createNewPipeline: res.createNewPipeline,
          new_project_name: res.new_project_name,
          new_pipeline_name: res.new_pipeline_name,
          new_pipeline_version: res.new_pipeline_version,
          existingPipeline: res.existingPipeline
        }));
      });
  }

  continueController() {
    const selectedExperiments = this.selectedExperiments() ? selectionDisabledContinue(this.selectedExperiments()).selectedFiltered : [this.experiment()];

    this.store.dispatch(commonMenuActions.enqueueClicked({
      selectedEntities: selectedExperiments,
      queue: this.experiment().execution?.queue,
      verifyWatchers: false
    }));
  }

  abortControllerPopup() {
    const selectedExperiments = this.selectedExperiments() ? selectionDisabledAbort(this.selectedExperiments()).selectedFiltered : [this.experiment()];
    this.store.dispatch(abortAllChildren({experiments: selectedExperiments}));
  }

  exportPipeline() {
    const pipeline = this.experiment();
    if (pipeline?.id) {
      this.store.dispatch(exportTaskInfo({taskId: pipeline.id, exportType: 'Pipeline'}));
    }
  }
}
