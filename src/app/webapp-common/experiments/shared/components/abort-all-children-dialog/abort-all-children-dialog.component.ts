import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {Component, inject} from '@angular/core';
import {ISelectedExperiment} from '~/features/experiments/shared/experiment-info.model';

@Component({
    selector: 'sm-abort-all-children-dialog',
    templateUrl: './abort-all-children-dialog.component.html',
    styleUrls: ['./abort-all-children-dialog.component.scss'],
    standalone: false
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
