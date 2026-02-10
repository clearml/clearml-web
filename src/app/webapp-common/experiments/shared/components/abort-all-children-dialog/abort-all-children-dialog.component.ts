import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose} from '@angular/material/dialog';
import {Component, inject} from '@angular/core';
import {ISelectedExperiment} from '~/features/experiments/shared/experiment-info.model';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {NgPlural} from '@angular/common';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'sm-abort-all-children-dialog',
  templateUrl: './abort-all-children-dialog.component.html',
  styleUrls: ['./abort-all-children-dialog.component.scss'],
  imports: [
    DialogTemplateComponent,
    MatDialogClose,
    MatDialogActions,
    NgPlural,
    MatButton
  ]
})
export class AbortAllChildrenDialogComponent {
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
