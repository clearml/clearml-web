import {ChangeDetectionStrategy, Component, effect, input, output, viewChild} from '@angular/core';
import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {get} from 'lodash-es';
import {WORKERS_TABLE_COL_FIELDS} from '../../workers-and-queues.consts';
import {BaseTableView} from '@common/shared/ui-components/data/table/base-table-view';
import {WorkerExt} from '@common/workers-and-queues/actions/workers.actions';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {PrimeTemplate} from 'primeng/api';
import {DurationFormaterPipe} from '@common/shared/pipes/duration-formater.pipe';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {
  TableFilterSortComponent
} from '@common/shared/ui-components/data/table/table-filter-sort/table-filter-sort.component';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';


@Component({
  selector: 'sm-workers-table',
  templateUrl: './workers-table.component.html',
  styleUrls: ['./workers-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableComponent,
    PrimeTemplate,
    DurationFormaterPipe,
    TooltipDirective,
    TableFilterSortComponent,
    ShowTooltipIfEllipsisDirective,
  ]
})
export class WorkersTableComponent extends BaseTableView {
  override entitiesKey = 'workers';
  override selectedEntitiesKey = 'selectedWorker';

  protected cols = [
    {
      id: WORKERS_TABLE_COL_FIELDS.ID,
      headerType: ColHeaderTypeEnum.sortFilter,
      header: 'AVAILABLE WORKERS',
      style: {width: '30%', maxWidth: '700px'},
      sortable: true,
    },
    {
      id: WORKERS_TABLE_COL_FIELDS.TASK,
      headerType: ColHeaderTypeEnum.sortFilter,
      header: 'CURRENTLY RUNNING TASK',
      style: {width: '30%', maxWidth: '700px'},
      sortable: true,
    },
    {
      id: WORKERS_TABLE_COL_FIELDS.TASK_RUNNING_TIME,
      headerType: ColHeaderTypeEnum.sortFilter,
      header: 'TASK RUNNING TIME',
      style: {width: '160px', minWidth: '180px', maxWidth: '200px'},
      sortable: true,
    },
    {
      id: WORKERS_TABLE_COL_FIELDS.TASK_ITERATIONS,
      headerType: ColHeaderTypeEnum.sortFilter,
      header: 'ITERATION',
      style: {width: '100px', maxWidth: '150px'},
      sortable: true,
    },
  ] as ISmCol[];
  protected readonly WORKERS_TABLE_COL_FIELDS = WORKERS_TABLE_COL_FIELDS;

  workers = input<WorkerExt[]>();
  selectedWorker = input<WorkerExt>();
  workerSelected = output<WorkerExt>();
  sortedChanged = output<{
        isShift: boolean;
        colId: ISmCol['id'];
    }>();

  tableContainer = viewChild<HTMLDivElement>('tableContainer');

  constructor() {
    super();
    effect(() => {
      if (this.workers() && this.selectedWorker()) {
        this.table()?.focusSelected();
        const index = this.workers().findIndex(w => w.id === this.selectedWorker().id)
        if (index > -1) {
          this.table().scrollToIndex(index);
        }
      }
    });
  }

  getBodyData(rowData: any, col: ISmCol): any {
    return get(rowData, col.id);
  }

  onRowClicked(event) {
    this.workerSelected.emit(event.data);
  }

  override scrollTableToTop() {
    this.tableContainer().scroll({top: 0});
  }

  onSortChanged(isShift: boolean, colId: ISmCol['id']) {
    this.sortedChanged.emit({isShift, colId});
    this.scrollTableToTop();
  }


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  emitSelection(selection: any[]) {}

  openContextMenu(data: { e: Event; rowData; single?: boolean; backdrop?: boolean }) {}
}
