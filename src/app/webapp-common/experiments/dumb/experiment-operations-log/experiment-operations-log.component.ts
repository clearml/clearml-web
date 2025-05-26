import {Component, input, viewChild, output } from '@angular/core';
import {DatePipe, TitleCasePipe} from '@angular/common';
import {FilterOutPipe} from '@common/shared/pipes/filterOut.pipe';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {PrimeTemplate} from 'primeng/api';
import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {trackById} from '@common/shared/utils/forms-track-by';
import {
  TasksGetOperationsLogResponseOperations
} from '~/business-logic/model/tasks/tasksGetOperationsLogResponseOperations';
import {EXPERIMENTS_STATUS_LABELS} from '~/features/experiments/shared/experiments.const';


@Component({
  selector: 'sm-experiment-operations-log',
  templateUrl: './experiment-operations-log.component.html',
  styleUrls: ['./experiment-operations-log.component.scss'],
  imports: [
    DatePipe,
    TitleCasePipe,
    TableComponent,
    PrimeTemplate,
    ShowTooltipIfEllipsisDirective,
    TooltipDirective,
    FilterOutPipe,
  ]
})
export class ExperimentOperationsLogComponent {
  OPERATIONS = {...EXPERIMENTS_STATUS_LABELS, archived: 'Archived'};

  columns: ISmCol[] = [
    {
      id: 'icon',
      headerType: ColHeaderTypeEnum.checkBox,
      header: '',
      frozen: true,
      style: {width: '60px'},
      sortable: false,
      filterable: false,
      bodyStyleClass: 'selected-col-body type-col',
      headerStyleClass: 'selected-col-header',
      disableDrag: true,
      disablePointerEvents: true,
      includeInDownload: false,
    },
    {
      id: 'operation',
      header: 'New status',
      key: 'operation',
      bodyStyleClass: '',
    },
    {
      id: 'reason',
      header: 'Reason',
      key: 'reason',
      style: {maxWidth: '360px'}
    },
    {
      id: 'created',
      header: 'Timestamp',
      key: 'created',
    }, {
      id: 'user',
      header: 'User',
      key: 'user',
      getter: 'user.name',
    },
    {
      id: 'ip',
      header: 'ip',
      key: 'ip',
      hidden: true,
      includeInDownload: true,
      style: {maxWidth: '80px'}
    }, {
      id: 'originator',
      header: 'Source',
      key: 'originator',
    }, {
      id: 'originator_version',
      header: 'Source version',
      key: 'originator_version',
    }, {
      id: 'info',
      header: 'Info',
      key: 'info',
      style: {maxWidth: '360px'}
    },
  ];

  lines = input<TasksGetOperationsLogResponseOperations[]>([]);
  downloadFullLog = output();
  openFullLog = output();
  table = viewChild(TableComponent<{ id: string }>);

  protected readonly trackById = trackById;
  expandedRowKeys: Record<string, boolean> = {};
}
