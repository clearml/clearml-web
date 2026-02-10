import {ChangeDetectionStrategy, Component, input, output} from '@angular/core';
import {IRecentTask} from '../../common-dashboard.reducer';
import {RECENT_EXPERIMENTS_TABLE_COLS, RECENT_TASKS_TABLE_COL_FIELDS} from '../../common-dashboard.const';
import {TIME_FORMAT_STRING} from '@common/constants';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {ExperimentTypeIconLabelComponent} from '@common/shared/experiment-type-icon-label/experiment-type-icon-label.component';
import {StatusIconLabelComponent} from '@common/shared/experiment-status-icon-label/status-icon-label.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {PrimeTemplate} from 'primeng/api';
import {DatePipe} from '@angular/common';

@Component({
  selector: 'sm-recent-tasks-table',
  templateUrl: './recent-experiment-table.component.html',
  styleUrls: ['./recent-experiment-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableComponent,
    ShowTooltipIfEllipsisDirective,
    ShowTooltipIfEllipsisDirective,
    ExperimentTypeIconLabelComponent,
    StatusIconLabelComponent,
    TooltipDirective,
    TooltipDirective,
    PrimeTemplate,
    DatePipe,
    DatePipe
  ]
})
export class RecentExperimentTableComponent {

  public readonly RECENT_TASKS_TABLE_COL_FIELDS = RECENT_TASKS_TABLE_COL_FIELDS;

  tasks = input<IRecentTask[]>([]);
  taskSelected = output<IRecentTask>();
  protected readonly TIME_FORMAT_STRING = TIME_FORMAT_STRING;
  protected cols = RECENT_EXPERIMENTS_TABLE_COLS;
}
