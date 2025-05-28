import {Component, Input, EventEmitter, Output} from '@angular/core';
import {IRecentTask} from '../../common-dashboard.reducer';
import {RECENT_EXPERIMENTS_TABLE_COLS, RECENT_TASKS_TABLE_COL_FIELDS} from '../../common-dashboard.const';
import {ISmCol} from '../../../shared/ui-components/data/table/table.consts';
import {TIME_FORMAT_STRING} from '../../../constants';

@Component({
    selector: 'sm-recent-tasks-table',
    templateUrl: './recent-experiment-table.component.html',
    styleUrls: ['./recent-experiment-table.component.scss'],
    standalone: false
})
export class RecentExperimentTableComponent {

  public readonly RECENT_TASKS_TABLE_COL_FIELDS = RECENT_TASKS_TABLE_COL_FIELDS;

  @Input() tasks: Array<IRecentTask> = [];
  @Output() taskSelected = new EventEmitter();
  public cols: Array<ISmCol>;
  TIME_FORMAT_STRING = TIME_FORMAT_STRING;

  constructor() {
    this.cols = RECENT_EXPERIMENTS_TABLE_COLS;
  }

  onExperimentSelected(event) {
    this.taskSelected.emit(event.data);
  }

  // TODO: move to utils file or pipe.

  public getElapsedTime(started = null, completed = null) {
    const now = new Date();
    const startTime = new Date(started);
    const completedTime = new Date(completed);
    const todayAtMidn = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayAtMidn = new Date(todayAtMidn);
    yesterdayAtMidn.setDate(yesterdayAtMidn.getDate() - 1);

    const hours = this.convertMinsToHrsMins(completedTime.getTime() - startTime.getTime());
    let elapsedTimeString = hours;
    if (completedTime.getTime() > todayAtMidn.getTime()) {
      elapsedTimeString += ` Hrs (${completedTime.toLocaleTimeString()})`;
    } else if (completedTime.getTime() > yesterdayAtMidn.getTime()) {
      elapsedTimeString += ` Hrs (Yesterday)`;
    } else {
      elapsedTimeString += ` (${completedTime.toLocaleDateString('en-GB')})`;
    }
    return elapsedTimeString;
  }

  private convertMinsToHrsMins(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const H = h < 10 ? '0' + h : h;
    const M = m < 10 ? '0' + m : m;
    return `${H}:${M}`;
  }

}
