import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {find, get} from 'lodash-es';
import {QUEUES_TABLE_COL_FIELDS} from '../../workers-and-queues.consts';
import {BaseTableView} from '@common/shared/ui-components/data/table/base-table-view';
import {Queue} from '@common/workers-and-queues/actions/queues.actions';


@Component({
    selector: 'sm-queues-table',
    templateUrl: './queues-table.component.html',
    styleUrls: ['./queues-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class QueuesTableComponent extends BaseTableView {
  private changeDetector = inject(ChangeDetectorRef);

  protected cols = computed(() => {
    const columns = [
      {
        id: QUEUES_TABLE_COL_FIELDS.NAME,
        headerType: ColHeaderTypeEnum.sortFilter,
        header: 'QUEUE',
        style:  {width: '250px', minWidth: this.selectedQueue() ? '250px' : '600px'},
        sortable: true,
      },
      {
        id: QUEUES_TABLE_COL_FIELDS.WORKERS,
        headerType: ColHeaderTypeEnum.sortFilter,
        header: 'WORKERS',
        style: {width: '100px'},
        sortable: true,
      },
      {
        id: QUEUES_TABLE_COL_FIELDS.TASK,
        headerType: ColHeaderTypeEnum.sortFilter,
        header: 'NEXT TASK',
        style: {width: '250px' ,minWidth: this.selectedQueue() ? '250px' : '500px'},
        sortable: true,
      },
      {
        id: QUEUES_TABLE_COL_FIELDS.LAST_UPDATED,
        headerType: ColHeaderTypeEnum.sortFilter,
        header: 'LAST UPDATED',
        style: {width: '180px', minWidth: '180px'},
        sortable: true,
      },
      {
        id: QUEUES_TABLE_COL_FIELDS.IN_QUEUE,
        headerType: ColHeaderTypeEnum.sortFilter,
        header: 'IN QUEUE',
        style: {width: '150px', minWidth: '150px'},
        sortable: true,
      }
    ]
    return this.selectedQueue() ? columns : [...columns, {
      id: 'last',
      headerType: ColHeaderTypeEnum.title,
      header: '',
      style: {width: '600px'}
    }];
  })

  protected readonly QUEUES_TABLE_COL_FIELDS = QUEUES_TABLE_COL_FIELDS;
  protected menuOpen = signal(false);
  contextQueue: Queue;

  queues = input<Queue[]>();
  selectedQueue = input<Queue>();
  short = input(true);
  queueSelected = output<Queue>();
  deleteQueue = output<Queue>();
  renameQueue = output<Queue>();
  clearQueue = output<Queue>();
  sortedChanged = output<{
        isShift: boolean;
        colId: ISmCol['id'];
    }>();
  copySuccess = output<string>();


  public menuPosition = signal<{ x: number; y: number }>(null);

  getBodyData(rowData: any, col: ISmCol) {
    return get(rowData, col.id);
  }

  getQNames(queues) {
    return queues.map(queue => this.getQName(queue));
  }

  getQName(queue) {
    const queueIns: any = find(this.queues(), {id: queue});
    return queueIns ? queueIns.name : queue;
  }

  onRowClicked(event) {
    this.queueSelected.emit(event.data);
  }

  openContextMenu(data: {e: MouseEvent; rowData: Queue}) {
    data.e.preventDefault();
    this.table.menu().hide()
    this.contextQueue = data.rowData;
    this.menuOpen.set(false);
    setTimeout(() => {
      this.menuPosition.set({x: data.e.clientX, y: data.e.clientY});
      this.menuOpen.set(true);
      this.changeDetector.detectChanges();
    }, 0);

  }


  onSortChanged(isShift: boolean, colId: ISmCol['id']) {
    this.sortedChanged.emit({isShift, colId});
    this.scrollTableToTop();
  }


  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  emitSelection(selection: any[]) {
  }

}
