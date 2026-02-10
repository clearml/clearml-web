import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  signal,
  TemplateRef,
  input, computed, model, effect, viewChild, inject, contentChildren, output, Output, EventEmitter
} from '@angular/core';
import {get} from 'lodash-es';
import {MenuItem, PrimeTemplate, ScrollerOptions, SortMeta} from 'primeng/api';
import {FilterMetadata} from 'primeng/api';
import {ContextMenu, ContextMenuModule} from 'primeng/contextmenu';
import {
  Table,
  TableColumnReorderEvent,
  TableContextMenuSelectEvent, TableModule,
  TableRowCollapseEvent,
  TableRowExpandEvent
} from 'primeng/table';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  interval,
  Subject,
  Subscription
} from 'rxjs';
import {debounce, filter, map, take, throttleTime} from 'rxjs/operators';
import {custumFilterFunc, custumSortSingle} from './overrideFilterFunc';
import {ColHeaderTypeEnum, ISmCol, TableSortOrderEnum} from './table.consts';
import {Store} from '@ngrx/store';
import {selectScaleFactor} from '@common/core/reducers/view.reducer';
import {sortCol} from '@common/shared/utils/sortCol';
import {mkConfig, download, generateCsv, asString} from 'export-to-csv';
import {prepareColsForDownload, sanitizeCSVCell} from '@common/shared/utils/download';
import {NgTemplateOutlet} from '@angular/common';
import {ResizableColumnDirective} from '@common/shared/ui-components/data/table/resizable-column.directive';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {DotsLoadMoreComponent} from '@common/shared/ui-components/indicators/dots-load-more/dots-load-more.component';
import {MatButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MultiLineTooltipComponent} from '@common/shared/components/multi-line-tooltip/multi-line-tooltip.component';
import {injectResize} from 'ngxtension/resize';

export interface TableContextMenuSelectEventExt extends Omit<TableContextMenuSelectEvent, 'index'> {
  single?: boolean;
  index?: number;
}

@Component({
    selector: 'sm-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableModule,
    ResizableColumnDirective,
    MenuComponent,
    MenuItemComponent,
    ContextMenuModule,
    NgTemplateOutlet,
    DotsLoadMoreComponent,
    MatIcon,
    MatButton,
    MultiLineTooltipComponent
  ]
})
export class TableComponent<D extends { id: string }> implements AfterContentInit, OnDestroy {
  private element = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);
  private store = inject(Store);
  private resizeComponent$ = injectResize({emitInitialResult: true, debounce: 5})
    .pipe(
      map(res => res.width),
      distinctUntilChanged()
    );

  public active = false;
  public bodyTemplate: TemplateRef<{ $implicit: ISmCol; rowData: D; rowIndex: number; expanded: boolean }>;
  public cardTemplate: TemplateRef<{ rowData: D; rowNumber: number; selected: boolean }>;
  public footerTemplate: TemplateRef<{ $implicit: ISmCol }>;
  public rowExpansionTemplate: TemplateRef<{ $implicit: D; lastFrame: boolean }>;
  public cardHeaderTemplate: TemplateRef<null>;
  public checkboxTemplate: TemplateRef<{ $implicit: ISmCol }>;
  public sortFilterTemplate: TemplateRef<{ $implicit: ISmCol }>;
  private loadMoreSubscription: Subscription;
  private loadMoreDebouncer: Subject<null>;
  public menuItems = [] as MenuItem[];
  private readonly isChrome = navigator.userAgent.indexOf('Chrome') > -1;
  public lastRowExpanded: boolean;
  public noDataTop: number;
  protected rightClicked: boolean;


  readonly colHeaderTypeEnum = ColHeaderTypeEnum;
  table = viewChild(Table);
  menu = viewChild(ContextMenu);
  templates = contentChildren(PrimeTemplate);
  private scaleFactor: number;
  private waiting: boolean;
  public scrollContainer: HTMLDivElement;
  private resize$ = new BehaviorSubject<number>(null);
  private waitForClick: number;
  search: string;

  scrollHeight = input('flex');
  autoLoadMore = input(false);
  columnResizeMode = input('expand' as 'fit' | 'expand');
  expandableRows = input(false);
  expandRowOnClick = input(true);
  initialColumns = input<ISmCol[]>();
  tableData = input<D[]>();
  columnsOrder = input<string[]>();
  columns = input<ISmCol[]>();
  reorderableColumns = input(false);
  resizableColumns = input(false);
  scrollable = input(false);
  sortOrder = input<TableSortOrderEnum>();
  sortFields = input<SortMeta[]>();
  selection = input<D | D[]>();
  activeContextRow = input<D>();
  contextMenuOpen = input(false);
  first = input(0);
  rowsNumber = model(10);
  selectionMode = input<'multiple' | 'single' | null>('single');
  rowHeight = input(48);
  cardHeight = input(130);
  lazyLoading = input(false);
  keyboardControl = input(false);
  noMoreData = input<boolean>();
  rowHover = input<boolean>();
  noHeader = input(false);
  simple = input(false);
  expandedRowKeys = input<Record<string, boolean>>({});
  rowExpandMode = input<'multiple' | 'single'>('multiple');
  cardsCollapsed = input(false);
  minimizedView = input(false);
  filters = input<Record<string, FilterMetadata>>();
  noDataTemplate = input<TemplateRef<null>>();
  checkedItems = input([]);
  virtualScroll = input<boolean>();
  virtualScrollOptions = input<ScrollerOptions>({});
  globalFilterFields = input<string[]>();
  enableTableSearch = input(false);
  minimizedTableHeader = input<string>();
  hasExperimentUpdate = input<boolean>();

  sortChanged = output<{
        field: ISmCol['id'];
        isShift: boolean;
    }>();
  rowClicked = output<{
        e: MouseEvent;
        data: D;
    }>();
  rowDoubleClicked = output<{
        e: MouseEvent;
        data: D;
    }>();
  rowSelectionChanged = output<{
        data: D;
        originalEvent?: Event;
    }>();
  rowExpanded = output<TableRowExpandEvent>();
  rowCollapsed = output<TableRowCollapseEvent>();
  firstChanged = output<number>();
  loadMoreClicked = output();
  @Output() rowRightClick = new EventEmitter<{ e: MouseEvent; rowData; single?: boolean }>();
  colReordered = output<string[]>();
  columnResized = output<{
        columnId: string;
        widthPx: number;
    }>();
  cardsCollapsedToggle = output();

  protected visibleColumns = computed(() => this.columns().filter(col => !col.hidden));
  protected currRowsNumber = computed(() => this.tableData()?.length ?? this.rowsNumber() ?? 0);
  protected tableSate = computed(() => ({
    table: this.tableData(),
    loading: signal(!this.tableData())
  }))

  constructor() {
    this.tableSate().loading.set(true);

    effect(() => {
      if (this.columnsOrder()) {
        this.orderColumns();
      }
    });

    effect(() => {
      if (this.columns()?.length > 0) {
        this.orderColumns();
        this.resize();
      }
    });

    effect(() => {
      if (!this.minimizedView()) {
        window.setTimeout(() => this.table() && this.updateFilter());
      }
      this.calcResize();
    });

    effect(() => {
      if (!this.minimizedView() && this.table()) {
        this.table().filters = this.filters();
        if (this.active) {
          this.table().first = 0;
          this.firstChanged.emit(0);
        }
      }
    });


    effect(() => {
      if (this.table()) {
        // In order to know if we should reset first to 0 on filter input.
        this.active = true;
        this.gotTable();
      }
    });

    this.loadMoreDebouncer = new Subject();
    this.loadMoreSubscription = this.loadMoreDebouncer
      .pipe(throttleTime(1500))
      .subscribe(
        () => this.loadMoreClicked.emit()
      );

    this.store.select(selectScaleFactor)
      .pipe(filter(s => !!s), take(1))
      .subscribe(scale => this.scaleFactor = scale);

    combineLatest([
      this.resize$,
      this.resizeComponent$
    ])
      .pipe(
        takeUntilDestroyed(),
        debounce(([delay]) => interval(typeof delay === 'number' ? delay : 0))
      )
      .subscribe(() => this.calcResize());
  }

  gotTable = () => {
      this.scrollContainer = this.table().el.nativeElement.getElementsByClassName('p-datatable-table-container')[0] as HTMLDivElement;
      if (this.scrollContainer) {
        this.scrollContainer.onscroll = () => {
          if (!this.waiting) {
            this.waiting = true;
            window.setTimeout(() => {
              this.waiting = false;
            }, 60);
          }
        };
      this.updateFilter();
    }
  };

  resize(delay: number = null) {
    this.resize$.next(delay);
  }

  private calcResize() {
    if (this.table() && this.resizableColumns()) {
      const element = (this.table().el.nativeElement as HTMLDivElement);
      let width = element.getBoundingClientRect().width;
      if (this.scaleFactor) {
        width *= this.scaleFactor / 100;
      }
      let totalWidth = 0;
      this.table().destroyStyleElement();
      if (this.minimizedView()) {
        // if (this.table?.styleElement) {
        //   this.table.styleElement.innerHTML = '';
        // }
        totalWidth = Math.max(width, 300);
        this.table().columnWidthsState = `${totalWidth - (this.isChrome ? 13 : 4)}`;
      } else {
        this.table().createStyleElement();
        this.table().columnWidthsState = this.visibleColumns().map((col, index) => {
          let colWidth: number;
          if (col.style?.width?.endsWith('px')) {
            colWidth = parseInt(col.style.width.slice(0, -2), 10);
            totalWidth += colWidth;
          } else {
            colWidth = element.getElementsByTagName('th')[index]?.getBoundingClientRect().width || 0;
            totalWidth += this.scaleFactor ? colWidth * this.scaleFactor / 100 : colWidth;
          }
          return colWidth;
        }).join(',');
        totalWidth = Math.max(totalWidth, width);
      }

      this.table().tableWidthState = `${totalWidth}`;
      this.table().restoreColumnWidths();
    }
    this.noDataTop = this.table()?.wrapperViewChild.nativeElement.getBoundingClientRect().height / 2 - this.rowHeight() / 2 - 1;
    if (this.noDataTop) {
      this.cdr.detectChanges();
    }
  }

  @HostListener('keydown', ['$event'])
  keyDownHandler(event: KeyboardEvent) {
    if (this.keyboardControl() === false || !['ArrowDown', 'ArrowUp'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    if (event.key == 'ArrowDown') {
      this.incrementIndex(1);
    } else if (event.key == 'ArrowUp') {
      this.incrementIndex((-1));
    }
    setTimeout(() => {
      let selected = this.element.nativeElement.querySelectorAll('.table-card.selected');
      if (selected.length < 1) {
        selected = this.element.nativeElement.querySelectorAll('tr.ui-state-highlight'); // support obsolote scrolling in table
      }
      if (selected && selected.length === 1) {
        selected[0].scrollIntoView({block: 'nearest', inline: 'nearest'});
      }
      selected = null;
    }, 0);

  }

  ngAfterContentInit(): void {
    this.templates().forEach((item) => {
      switch (item.getType()) {
        case 'body':
          this.bodyTemplate = item.template;
          break;
        case 'card':
          this.cardTemplate = item.template;
          break;
        case 'sort-filter':
          this.sortFilterTemplate = item.template;
          break;
        case 'checkbox':
          this.checkboxTemplate = item.template;
          break;
        case 'cardFilter':
          this.cardHeaderTemplate = item.template;
          break;
        case 'footer':
          this.footerTemplate = item.template;
          break;
        case 'rowexpansion':
          this.rowExpansionTemplate = item.template;
          break;
        default:
          this.bodyTemplate = item.template;
          break;
      }
    });
  }

  ngOnDestroy(): void {
    this.loadMoreSubscription.unsubscribe();
    this.loadMoreDebouncer.complete();
    this.loadMoreDebouncer.unsubscribe();
    this.scrollContainer = null;
  }

  onSortChanged(event) {
    this.sortChanged.emit(event);
  }

  onRowSelected(event) {
    if (this.selection() && !Array.isArray(this.selection()) && event.data.id === (this.selection() as D).id) {
      this.rowSelectionChanged.emit({data: null, originalEvent: event.originalEvent});
    } else {
      this.rowSelectionChanged.emit(event);
    }
  }

  onRowDeselected(event) {
    if (this.minimizedView()) {
      this.rowSelectionChanged.emit({data: null, originalEvent: event.originalEvent});
    } else {
      this.rowSelectionChanged.emit({data: this.table()?.selection, originalEvent: event.originalEvent});
    }
  }

  public scrollToIndex(rowIndex) {
    if (rowIndex > -1 && this.table()) {
      if (this.virtualScroll()) {
        const {height} = this.table().el.nativeElement.getBoundingClientRect();
        const rowsInPage = height / this.rowHeight();
        const maxScroll = Math.ceil(this.currRowsNumber() - rowsInPage);
        this.table().scrollToVirtualIndex(Math.min(maxScroll, rowIndex));
      } else {
        const row = this.table().el.nativeElement.getElementsByTagName('tr')[rowIndex] as HTMLTableRowElement;
        if (row) {
          let location = row.offsetTop;
          if (rowIndex + 1 === this.tableData().length) {
            location += row.getBoundingClientRect().height;
          }
          this.table().scrollTo({top: location, behavior: 'smooth'});
        }
      }
    }
  }

  public scrollToElement(data) {
    const rowIndex = this.tableData().findIndex(row => row.id === data.id);
    this.scrollToIndex(rowIndex);
  }

  onFirstChanged(event) {
    this.firstChanged.emit(event);
  }

  openContext({originalEvent, data, single}: TableContextMenuSelectEventExt) {
    if (this.rowRightClick.observed) {
      this.rowRightClick.emit({e: originalEvent as MouseEvent, rowData: data, single});
      if (this.table()) {
        this.rightClicked = !single;
        this.table().contextMenuSelection = null;
      }
      window.setTimeout(() => this.menu().hide());
    }
  }

  trackByFunction(index: number, item) {
    return item?.id || item?.name || index;
  }

  // public locateInTable() {
  //   const selectedTask = this.selection;
  //   const tableData = this.table.filteredValue ? this.table.filteredValue : this.table.value;
  //   const rowIndex = tableData.findIndex((task) => task.id === selectedTask.id);
  //   const first = rowIndex > 0 ? (rowIndex - rowIndex % 10) : 0;
  //   this.first = first;
  //   this.firstChanged.emit(first);
  // }

  getBodyData(rowData, col) {
    return get(rowData, col.id);
  }

  incrementIndex(change: number) {
    const currentIndex = this.getCurrentIndex();
    if (currentIndex == -1) {
      return;
    }
    if (this.tableData().length && this.tableData().length - currentIndex < 3 && !this.noMoreData()) {
      this.loadMore();
    }
    const nextSelected = (this.selection()) ? this.tableData()[currentIndex + change] : this.tableData()[0];
    if (nextSelected) {
      this.rowSelectionChanged.emit({data: nextSelected});
    }
  }

  getCurrentIndex() {
    if (this.selection() && !Array.isArray(this.selection())) {
      return this.tableData().findIndex((row) => row.id === (this.selection() as D).id);
    } else {
      return 0;
    }
  }

  loadMore() {
    this.tableSate().loading.set(true);
    if (this.autoLoadMore()) {
      this.loadMoreClicked.emit();
    } else {
      this.loadMoreDebouncer.next(null);
    }
  }

  onColReorder($event: TableColumnReorderEvent) {
    const columnsList = $event.columns.map(column => column.id);
    this.colReordered.emit(columnsList);
    this.resize();
  }

  orderColumns() {
    if (this.visibleColumns() && this.columnsOrder()) {
      this.visibleColumns().sort((a, b) => sortCol(a.id, b.id, this.columnsOrder())
      );
    }
  }

  isRowSelected(entity: { id: string }) {
    if (!entity) {
      return false;
    }

    return this.checkedItems()?.length > 0 &&
      (this.checkedItems().some((selectedEntity: { id: string }) => selectedEntity?.id === entity.id));
  }

  private updateFilter() {
    if (this.minimizedView()) {
      // Overriding prime ng filter and sort functions so that it wont reset first after data change.
      this.table()._filter = custumFilterFunc.bind(this.table());
      this.table().sortSingle = custumSortSingle.bind(this.table());

      this.table().filters = this.filters();
    }
  }

  focusSelected() {
    this.table()?.el?.nativeElement.getElementsByClassName('selected')[0]?.focus();
  }

  colResize({delta, element}: { delta: number; element: HTMLElement }) {
    if (delta) {
      const columnId = element.attributes['data-col-id']?.value;
      const col = this.columns().find(col => col.id === columnId);
      let colWidth: number;
      if (col.style?.width?.endsWith('px')) {
        colWidth = parseInt(col.style.width.slice(0, -2), 10);
      } else {
        colWidth = element.getBoundingClientRect().width || 0;
      }
      this.columnResized.emit({columnId, widthPx: colWidth + delta});
    }
  }

  updateColumnsWidth(columnId, width: number, delta: number) {
    const columns = this.visibleColumns();
    if (columnId) {
      const colIndex = columns.findIndex(col => col.id === columnId);
      delta = width - parseInt(columns[colIndex].style?.width, 10);
      if (width < 30) {
        width = 30;
      }
      columns[colIndex].style = {...columns[colIndex].style, width: `${width}px`};
      if (columns[colIndex + 1]) {
        const newWidth = parseInt(columns[colIndex + 1]?.style.width, 10) - delta;
        if (newWidth < 30) {
          columns[colIndex + 1].style = {...columns[colIndex + 1].style, width: '30px'};
          columns[colIndex].style = {...columns[colIndex].style, width: `${width - 30 + newWidth}px`};
        } else {
          columns[colIndex + 1].style = {...columns[colIndex + 1].style, width: `${newWidth}px`};
        }
      }
    }
    columns.forEach((col) => {
      this.columnResized.emit({columnId: col.id, widthPx: parseInt(col.style.width, 10)});
    });
  }

  get sortableCols(): ISmCol[] {
    return (this.initialColumns() || this.visibleColumns()).filter(col => col.sortable);
  }

  sortItemClick($event: { event?: MouseEvent; itemValue: string }, colId: string) {
    this.sortChanged.emit({isShift: $event.event.shiftKey, field: colId});
  }

  getOrder(colId: string) {
    return this.sortFields().find(field => field.field === colId)?.order;
  }

  checkClick(param: { data: D; e: MouseEvent }) {
    if (param.e.type === 'dblclick' || this.waitForClick) {
      window.clearTimeout(this.waitForClick);
      this.waitForClick = null;
      this.rowDoubleClicked.emit(param);
    } else {
      this.waitForClick = window.setTimeout(() => {
        this.rowClicked.emit(param);
        this.waitForClick = null;
      }, 250);
    }
  }

  updateNumberOfRows({event, expanded}: { event: TableRowExpandEvent; expanded: boolean }) {
    const expandedIndex = Object.values(this.tableData()).findIndex((row: D) => row.id === event.data.id);
    this.lastRowExpanded = expanded && expandedIndex === this.currRowsNumber() - 1;
  }

  preProcessRows(cols: any[]) {
    return this.tableData().map(row =>
      cols.reduce((acc, dCol) => {
        const val = get(row, (dCol.field).split('.').map(level=> level.replace('%2E', '.')), '') as unknown;
        acc[dCol.name] = Array.isArray(val) ?
          val.toString() :
          typeof val === 'string' ?
            sanitizeCSVCell(val.replace(/\r?\n|\r/g, '')) :
            val;
        return acc;
      }, {})
    );
  }

  getTableCopy() {
    const colsOrder = this.columnsOrder() ?? this.visibleColumns().map(col => col.id);
    const sortedAllColumns = colsOrder.map(sortCol => this.columns().find(col => col.id === sortCol))
    const downloadCols = prepareColsForDownload(sortedAllColumns);
    const rows = this.preProcessRows(downloadCols);
    const csvConfig = mkConfig({useKeysAsHeaders: true});
    return asString(generateCsv(csvConfig)(rows));
  }


  downloadTableAsCSV(tableName?: string) {
    const options = mkConfig({
      filename: `${tableName}${tableName ? '-' : ''}table`,
      showColumnHeaders: true,
    });

    const colsOrder = this.columnsOrder() ?? this.visibleColumns().map(col => col.id);
    const sortedAllColumns = colsOrder.map(sortCol => this.columns().find(col => col.id === sortCol)).filter(col => !!col);
    const rest = this.columns().filter(col => !colsOrder.includes(col.id));
    const downloadCols = prepareColsForDownload([...sortedAllColumns, ...rest]);
    options.columnHeaders = downloadCols.map(dCol => dCol.name);
    const rows = this.preProcessRows(downloadCols);

    const csv = generateCsv(options)(rows);
    download(options)(csv);
  }

  isSelected = (rowData: D) =>
    Array.isArray(this.selection()) ? (this.selection() as D[]).some(s => s.id === rowData.id) : (this.selection() as D)?.id === rowData?.id;
}
