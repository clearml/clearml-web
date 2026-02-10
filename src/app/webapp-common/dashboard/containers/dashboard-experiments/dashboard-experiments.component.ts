import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {Router} from '@angular/router';
import {IRecentTask} from '../../common-dashboard.reducer';
import {ITask} from '~/business-logic/model/al-task';
import {RecentExperimentTableComponent} from '@common/dashboard/dumb/recent-experiment-table/recent-experiment-table.component';

@Component({
  selector: 'sm-dashboard-experiments',
  templateUrl: './dashboard-experiments.component.html',
  styleUrls: ['./dashboard-experiments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RecentExperimentTableComponent
  ]
})
export class DashboardExperimentsComponent {
  private router = inject(Router);
  recentTasks = input<IRecentTask[]>();

  public taskSelected(task: IRecentTask | ITask) {
    const projectId = task.project ? task.project.id : '*';
    return this.router.navigate(['projects', projectId, 'tasks', task.id]);
  }
}
