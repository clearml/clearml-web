import {TableSelectionState} from '@common/constants';
import {allItemsAreSelected} from '../../../utils/shared-utils';
import {unionBy} from 'lodash-es';
import {AfterViewInit, Directive, EventEmitter, Input, OnDestroy, Output, QueryList, ViewChildren} from '@angular/core';
import {ISmCol, TABLE_SORT_ORDER, TableSortOrderEnum} from './table.consts';
import {filter, take} from 'rxjs/operators';
import {TableComponent} from './table.component';
import {SortMeta} from 'primeng/api';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {sortByArr} from '../../../pipes/show-selected-first.pipe';
import {IOption} from '../../inputs/select-autocomplete-for-template-forms/select-autocomplete-for-template-forms.component';
import {DATASETS_STATUS_LABEL} from '~/features/experiments/shared/experiments.const';
import {cleanTag} from '@common/shared/utils/helpers.util';
import {FormControl} from '@angular/forms';

@Directive()
export abstract class BaseTableView implements AfterViewInit, OnDestroy {
  public entityTypes = EntityTypeEnum;
  public selectionState: TableSelectionState;
  protected entitiesKey: string;
  public selectedEntitiesKey: string;
  public table: TableComponent<{id: string}>;
  public menuBackdrop: boolean;
  public searchValues: Record<string, string> = {};
  public filtersOptions: Record<string, IOption[]> = {};
  public filtersValues: Record<string, any> = {};
  public tableSortFieldsObject: Record<string, { index: number; field: string; order: TableSortOrderEnum }> = {};
  protected prevSelected: string;
  protected prevDeselect: string;
  private _entityType: EntityTypeEnum;
  public convertStatusMap: Record<string, string>;

  @Input() contextMenuActive: boolean;
  @Input() selectionMode: 'multiple' | 'single' | null = 'single';
  public selectionIndeterminate: boolean;
  public selectionChecked = new FormControl<boolean>(false);

  @Input() set entityType(entityType: EntityTypeEnum) {
    this._entityType = entityType;
    if (entityType === EntityTypeEnum.dataset) {
      this.convertStatusMap = DATASETS_STATUS_LABEL;
    }
  }

  get entityType() {
    return this._entityType;
  }

  @Input() hasExperimentUpdate: boolean;
  @Input() colsOrder: string[] = [];
  private _tableSortFields: SortMeta[];
  @Input() set tableSortFields(tableSortFields: SortMeta[]) {
    this._tableSortFields = tableSortFields;
    this.tableSortFieldsObject = tableSortFields.reduce((acc, sortField, i) => {
      acc[sortField.field] = {
        index: i,
        field: sortField.field,
        order: sortField.order > 0 ? TABLE_SORT_ORDER.ASC : TABLE_SORT_ORDER.DESC
      };
      return acc;
    }, {});
  }

  get tableSortFields() {
    return this._tableSortFields;
  }

  @Input() tableSortOrder: TableSortOrderEnum;
  @Input() minimizedView: boolean;
  @Input() hideSelectAll: boolean;
  @Input() cardsCollapsed: boolean;
  @Input() set split(size: number) {
    this.table?.resize();
  }


  @Output() filterSearchChanged = new EventEmitter() as EventEmitter<{ colId: string; value: {value: string; loadMore?: boolean} }>;
  @Output() filterChanged = new EventEmitter() as EventEmitter<{ col: ISmCol; value: any; andFilter?: boolean }>;
  @Output() columnsReordered = new EventEmitter<string[]>();
  @Output() cardsCollapsedChanged = new EventEmitter();
  @Output() closePanel = new EventEmitter();
  @Output() resetFilterOptions = new EventEmitter();
  @ViewChildren(TableComponent) tables: QueryList<TableComponent<{id: string}>>;

  ngAfterViewInit(): void {
    this.tables.changes
      .pipe(filter((comps: QueryList<TableComponent<{id: string}>>) => !!comps.first), take(1))
      .subscribe((comps: QueryList<TableComponent<{id: string}>>) => {
        this.table = comps.first;
        window.setTimeout(() => this.table?.focusSelected());
        this.afterTableInit();
      });
    this.tables.forEach(item => this.table = item);
  }

  updateSelectionState() {
    this.selectionState = allItemsAreSelected(this[this.entitiesKey], this[this.selectedEntitiesKey]) ? 'All' : this[this.selectedEntitiesKey].length > 0 ? 'Partial' : 'None';
    this.selectionIndeterminate = this.selectionState === 'Partial';
    this.selectionChecked.setValue(this.selectionState !== 'None');
  }

  headerCheckboxClicked() {
    let selectionUnion;
    if (this.selectionState === 'None') {
      selectionUnion = unionBy(this[this.entitiesKey], this[this.selectedEntitiesKey], 'id');
    } else {
      selectionUnion = [];
    }
    this.emitSelection(selectionUnion);
  }

  setContextMenuStatus(menuStatus: boolean) {
    this.contextMenuActive = menuStatus;
  }

  protected getSelectionRange<T extends {id?: string}>(change: { value: boolean; event: Event }, entity: T): T[] {
    let addList = [entity];
    if ((change.event as MouseEvent).shiftKey && this.prevSelected) {
      let index1 = this[this.entitiesKey].findIndex(e => e.id === this.prevSelected);
      let index2 = this[this.entitiesKey].findIndex(e => e.id === entity.id);
      if (index1 > index2) {
        [index1, index2] = [index2, index1];
      } else {
        index1++;
        index2++;
      }
      addList = this[this.entitiesKey].slice(index1, index2);
      this.prevDeselect = entity.id;
    }
    this.prevSelected = entity.id;
    return addList;
  }

  protected getDeselectionRange<T extends {id?: string}>(change: { value: boolean; event: Event }, entity: T) {
    let list = [entity.id];
    const prev = this.prevDeselect || this.prevSelected;
    if ((change.event as MouseEvent).shiftKey && prev) {
      let index1 = this[this.entitiesKey].findIndex(e => e.id === prev);
      let index2 = this[this.entitiesKey].findIndex(e => e.id === entity.id);
      if (index1 > index2) {
        [index1, index2] = [index2, index1];
      } else {
        index1++;
      }
      list = this[this.entitiesKey].slice(index1, index2 + 1).map(e => e.id);
      this.prevSelected = entity.id;
    }
    this.prevDeselect = entity.id;
    return list;
  }

  tableFilterChanged(col: ISmCol, event) {
    this.filterChanged.emit({col, value: event.value, andFilter: event.andFilter});
    this.scrollTableToTop();
  }

  sortOptionsList(columnId: string) {
    if (!this.filtersOptions[columnId]) {
      return;
    }
    const cleanFilterValues = columnId ==='tags'? this.filtersValues[columnId]?.map(tag=> cleanTag(tag)): this.filtersValues[columnId];
    this.filtersOptions[columnId].sort((a, b) =>
      sortByArr(a.value, b.value, [null, ...(cleanFilterValues || [])]));
    this.filtersOptions = {...this.filtersOptions, [columnId]: [...this.filtersOptions[columnId]]};
  }

  searchValueChanged($event: {value: string; loadMore?: boolean}, colId: string, asyncFilter?: boolean) {
    this.searchValues[colId] = $event.value;
    if (asyncFilter) {
      this.filterSearchChanged.emit({colId, value: $event});
    } else {
      this.sortOptionsList(colId);
    }
  }

  columnFilterClosed(col: ISmCol) {
    window.setTimeout(() => this.sortOptionsList(col.id));
  }

  tableAllFiltersChanged(event: { col: string; value: unknown; matchMode?: string }) {
    this.filterChanged.emit({col: {id: event.col}, value: event.value, andFilter: event.matchMode === 'AND'});
    this.scrollTableToTop();
  }

  scrollTableToTop() {
    this.table?.table().scrollTo({top: 0});
  }

  afterTableInit() {
    const selectedObject = (this.table.selection() as {id: string });
    if (selectedObject) {
      window.setTimeout(() => this.table?.scrollToElement(selectedObject), 200);
    }
  }

  abstract emitSelection(selection: any[]);

  ngOnDestroy(): void {
    this.resetFilterOptions.emit();
    this.table = null;
  }

  abstract openContextMenu(data: { e: Event; rowData; single?: boolean; backdrop?: boolean });

  private clickDelayHandle: number;
  cardClicked($event: MouseEvent, experiment) {
    if (this.clickDelayHandle) {
      window.clearTimeout(this.clickDelayHandle);
      this.clickDelayHandle = null;
      this.closePanel.emit()
    } else {
      this.clickDelayHandle = window.setTimeout(() => {
        this.openContextMenu({e: $event, rowData: experiment, backdrop: true});
        this.clickDelayHandle = null;
      }, 250)
    }
  }
}
