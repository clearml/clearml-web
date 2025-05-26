import {ChangeDetectionStrategy, Component} from '@angular/core';
import {ExperimentMenuComponent} from '@common/experiments/shared/components/experiment-menu/experiment-menu.component';
import {selectionDisabledAbort, selectionDisabledContinue} from '@common/shared/entity-page/items.utils';
import * as commonMenuActions from '@common/experiments/actions/common-experiments-menu.actions';
import {
  RunPipelineControllerDialogComponent,
  RunPipelineResult
} from '../run-pipeline-controller-dialog/run-pipeline-controller-dialog.component';
import {filter} from 'rxjs/operators';
import {abortAllChildren} from '@common/experiments/actions/common-experiments-menu.actions';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {ISelectedExperiment} from '~/features/experiments/shared/experiment-info.model';


@Component({
    selector: 'sm-controller-menu',
    templateUrl: './pipeline-controller-menu.component.html',
    styleUrls: ['./pipeline-controller-menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class PipelineControllerMenuComponent extends ExperimentMenuComponent {
  entityTypeEnum = EntityTypeEnum;

  runPipelineController(runNew = false) {
    this.dialog.open<RunPipelineControllerDialogComponent, {task: ISelectedExperiment}, RunPipelineResult>(RunPipelineControllerDialogComponent, {
      data: {task: runNew ? null : this.experiment()}
    }).afterClosed()
      .pipe(filter(res => !!res.confirmed))
      .subscribe((res) => {
        this.store.dispatch(commonMenuActions.startPipeline({
          task: res.task,
          args: res.args,
          queue: res.queue
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
}
