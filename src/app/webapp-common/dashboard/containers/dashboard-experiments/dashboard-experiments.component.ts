import {ChangeDetectionStrategy, Component, inject, Input} from '@angular/core';
import {Router} from '@angular/router';
import {IRecentTask} from '../../common-dashboard.reducer';
import {ITask} from '~/business-logic/model/al-task';

@Component({
    selector: 'sm-dashboard-experiments',
    templateUrl: './dashboard-experiments.component.html',
    styleUrls: ['./dashboard-experiments.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class DashboardExperimentsComponent {
  private router = inject(Router);
  @Input() recentTasks: IRecentTask[];

  public taskSelected(task: IRecentTask | ITask) {
    const projectId = task.project ? task.project.id : '*';
    return this.router.navigate(['projects', projectId, 'tasks', task.id]);
  }

}
