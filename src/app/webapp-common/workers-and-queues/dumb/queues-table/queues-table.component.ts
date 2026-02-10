import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, computed, effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {get} from 'lodash-es';
import {QUEUES_TABLE_COL_FIELDS} from '../../workers-and-queues.consts';
import {BaseTableView} from '@common/shared/ui-components/data/table/base-table-view';
import {Queue} from '@common/workers-and-queues/actions/queues.actions';
import {
  QueuesMenuExtendedComponent
} from '~/features/workers-and-queues/queues-menu-extended/queues-menu-extended.component';
import {
  TableFilterSortComponent
} from '@common/shared/ui-components/data/table/table-filter-sort/table-filter-sort.component';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {TableComponent} from '@common/shared/ui-components/data/table/table.component';
import {PrimeTemplate} from 'primeng/api';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ClipboardModule} from 'ngx-clipboard';
import {MatMenuItem} from '@angular/material/menu';
import {MatIconModule} from '@angular/material/icon';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';


@Component({
  selector: 'sm-queues-table',
  templateUrl: './queues-table.component.html',
  styleUrls: ['./queues-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    QueuesMenuExtendedComponent,
    TableFilterSortComponent,
    MenuComponent,
    TableComponent,
    MatIconModule,
    PrimeTemplate,
    ShowTooltipIfEllipsisDirective,
    TooltipDirective,
    ClipboardModule,
    MatMenuItem,
    TimeAgoPipe,
  ]
})
export class QueuesTableComponent extends BaseTableView {
  override entitiesKey = 'queues';
  override selectedEntitiesKey = 'selectedQueue';

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
  selectedQueue = input<Queue[]>();
  short = input(true);
  queueSelected = output<string>();
  deleteQueue = output<Queue>();
  renameQueue = output<Queue>();
  clearQueue = output<Queue>();
  sortedChanged = output<{
        isShift: boolean;
        colId: ISmCol['id'];
    }>();
  copySuccess = output<string>();

  constructor() {
    super();
    const effectRef = effect(() => {
      if (this.table() && this.selectedQueue()?.length && this.queues()?.length) {
        window.setTimeout(() => {
          this.table()?.scrollToElement(this.selectedQueue()?.[0]);
        }, 50);
        effectRef.destroy();
      }
    });
  }

  public menuPosition = signal<{ x: number; y: number }>(null);

  getBodyData(rowData: any, col: ISmCol) {
    return get(rowData, col.id);
  }

  openContextMenu(data: {e: MouseEvent; rowData: Queue}) {
    data.e.preventDefault();
    this.table().menu().hide()
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

  emitSelection(selection: any[]) {
  }
}
