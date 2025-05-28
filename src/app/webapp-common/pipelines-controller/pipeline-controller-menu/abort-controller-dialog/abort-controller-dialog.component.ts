import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose} from '@angular/material/dialog';
import {ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {ISelectedExperiment} from '~/features/experiments/shared/experiment-info.model';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MatButton} from '@angular/material/button';

@Component({
    selector: 'sm-abort-controller-dialog',
    templateUrl: './abort-controller-dialog.component.html',
    styleUrls: ['./abort-controller-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        DialogTemplateComponent,
        MatDialogActions,
        MatButton,
        MatDialogClose
    ]
})
export class AbortControllerDialogComponent {
  protected data = inject<{
    tasks: ISelectedExperiment[];
    shouldBeAbortedTasks: ISelectedExperiment[];
  }>(MAT_DIALOG_DATA);

  public experiments: ISelectedExperiment[];
  shouldBeAbortedTasks: ISelectedExperiment[] = null;

  constructor() {
    this.experiments = this.data.tasks;
    this.shouldBeAbortedTasks = this.data.shouldBeAbortedTasks;

  }
}
