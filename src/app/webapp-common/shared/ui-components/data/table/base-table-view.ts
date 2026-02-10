import {allItemsAreSelected} from '../../../utils/shared-utils';
import {unionBy} from 'lodash-es';
import {computed, DestroyRef, Directive, effect, inject, input, output, viewChild,} from '@angular/core';
import {ISmCol, TABLE_SORT_ORDER, TableSortOrderEnum} from './table.consts';
import {TableComponent} from './table.component';
import {SortMeta} from 'primeng/api';
import {EntityTypeEnum} from '~/shared/constants/non-common-consts';
import {sortByArr} from '../../../pipes/show-selected-first.pipe';
import {
  IOption
} from '../../inputs/select-autocomplete-for-template-forms/select-autocomplete-for-template-forms.component';
import {DATASETS_STATUS_LABEL} from '~/features/experiments/shared/experiments.const';
import {FormControl} from '@angular/forms';
import {Store} from '@ngrx/store';

@Directive()
export abstract class BaseTableView {
  protected readonly store = inject(Store);
  protected readonly destroy = inject(DestroyRef);

  protected entityTypes = EntityTypeEnum;
  protected entitiesKey: string;
  public selectedEntitiesKey: string;
  public menuBackdrop: boolean;
  public searchValues: Record<string, string> = {};
  protected prevSelected: string;
  protected prevDeselect: string;
  public selectionChecked = new FormControl<boolean>(false);

  contextMenuActive = input<boolean>();
  selectionMode = input<'multiple' | 'single' | null>('single');
  entityType = input<EntityTypeEnum>();
  hasExperimentUpdate = input<boolean>();
  colsOrder = input<string[]>([]);
  tableSortFields = input<SortMeta[]>();
  tableSortOrder = input<TableSortOrderEnum>();
  minimizedView = input<boolean>();
  hideSelectAll = input<boolean>();
  cardsCollapsed = input<boolean>();
  currentUserId = input<string>();


  filterSearchChanged = output<{colId: string; value}>();
  filterChanged = output<{col: ISmCol; value; andFilter?: boolean}>();
  columnsReordered = output<string[]>();
  cardsCollapsedChanged = output();
  closePanel = output();
  resetFilterOptions = output();

  table = viewChild<TableComponent<{ id: string; }>>(TableComponent);

  convertStatusMap = computed<Record<string, string>>(() =>
    this.entityType() === EntityTypeEnum.dataset && DATASETS_STATUS_LABEL
  );
  protected tableSortFieldsObject = computed(() => this.tableSortFields()?.reduce((acc, sortField, i) => {
    acc[sortField.field] = {
      index: i,
      field: sortField.field,
      order: sortField.order > 0 ? TABLE_SORT_ORDER.ASC : TABLE_SORT_ORDER.DESC
    };
    return acc;
  }, {}) ?? {});

  protected selectionState = computed(() => !this.selectedEntitiesKey ? null : allItemsAreSelected(this[this.entitiesKey](), this[this.selectedEntitiesKey]()) ?
    'All' :
    this[this.selectedEntitiesKey]()?.length > 0 ?
      'Partial' :
      'None'
  );
  protected selectionIndeterminate = computed(() => this.selectionState() === 'Partial');

  constructor() {
    const initEffectRef = effect(() => {
      if(this.table()) {
        window.setTimeout(() => this.table()?.focusSelected());
        this.afterTableInit();
        initEffectRef.destroy();
      }
    });

    effect(() => {
      this.selectionChecked.setValue(this.selectionState() !== 'None');
    });

    this.destroy.onDestroy(() => {
      this.resetFilterOptions.emit();
    });
  }

  headerCheckboxClicked() {
    let selectionUnion;
    if (this.selectionState() === 'None') {
      selectionUnion = unionBy(this[this.entitiesKey](), this[this.selectedEntitiesKey](), 'id');
    } else {
      selectionUnion = [];
    }
    this.emitSelection(selectionUnion);
  }

  // setContextMenuStatus(menuStatus: boolean) {
  //   this.contextMenuActive() = menuStatus;
  // }

  protected getSelectionRange<T extends {id?: string}>(change: { value: boolean; event: Event }, entity: T): T[] {
    let addList = [entity];
    if ((change.event as MouseEvent).shiftKey && this.prevSelected) {
      let index1 = this[this.entitiesKey]().findIndex(e => e.id === this.prevSelected);
      let index2 = this[this.entitiesKey]().findIndex(e => e.id === entity.id);
      if (index1 > index2) {
        [index1, index2] = [index2, index1];
      } else {
        index1++;
        index2++;
      }
      addList = this[this.entitiesKey]().slice(index1, index2);
      this.prevDeselect = entity.id;
    }
    this.prevSelected = entity.id;
    return addList;
  }

  protected getDeselectionRange<T extends {id?: string}>(change: { value: boolean; event: Event }, entity: T) {
    let list = [entity.id];
    const prev = this.prevDeselect || this.prevSelected;
    if ((change.event as MouseEvent).shiftKey && prev) {
      let index1 = this[this.entitiesKey]().findIndex(e => e.id === prev);
      let index2 = this[this.entitiesKey]().findIndex(e => e.id === entity.id);
      if (index1 > index2) {
        [index1, index2] = [index2, index1];
      } else {
        index1++;
      }
      list = this[this.entitiesKey]().slice(index1, index2 + 1).map(e => e.id);
      this.prevSelected = entity.id;
    }
    this.prevDeselect = entity.id;
    return list;
  }

  tableFilterChanged(col: ISmCol, event) {
    this.filterChanged.emit({col, value: event.value, andFilter: event.andFilter});
    this.scrollTableToTop();
  }

  sortOptionsList(list: IOption[], values) {
    return list.toSorted((a, b) =>
      sortByArr(a.value, b.value, [null, ...(values || [])]));
  }

  searchValueChanged($event: {value: string; loadMore?: boolean}, colId: string, asyncFilter?: boolean) {
    this.searchValues[colId] = $event.value;
    if (asyncFilter) {
      this.filterSearchChanged.emit({colId, value: $event});
    }
  }

  columnFilterClosed(col: ISmCol) {
    // todo: check if this is needed
    // window.setTimeout(() => this.sortOptionsList(col.id));
  }

  scrollTableToTop() {
    this.table()?.table().scrollTo({top: 0});
  }

  afterTableInit() {
    const selectedObject = (this.table().selection() as {id: string });
    if (selectedObject) {
      window.setTimeout(() => this.table()?.scrollToElement(selectedObject), 200);
    }
  }

  abstract emitSelection(selection: {id: string}[]);

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
