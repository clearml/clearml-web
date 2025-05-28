import {
  ChangeDetectionStrategy,
  Component, computed, effect, input,
  signal, output, model
} from '@angular/core';
import {FormControl} from '@angular/forms';
import {ColHeaderFilterTypeEnum, ISmCol, TABLE_SORT_ORDER, TableSortOrderEnum} from '../table.consts';
import {addOrRemoveFromArray} from '../../../../utils/shared-utils';
import {
  CheckboxThreeStateListComponent
} from '@common/shared/ui-components/panel/checkbox-three-state-list/checkbox-three-state-list.component';

import {
  TableFilterDurationNumericComponent
} from '@common/shared/ui-components/data/table/table-duration-sort-template/table-filter-duration-numeric/table-filter-duration-numeric.component';
import {
  TableFilterDurationComponent
} from '@common/shared/ui-components/data/table/table-duration-sort-template/table-filter-duration/table-filter-duration.component';
import {MenuComponent} from '@common/shared/ui-components/panel/menu/menu.component';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {
  TableFilterDurationDateTimeComponent
} from '@common/shared/ui-components/data/table/table-duration-sort-template/table-filter-duration-date-time/table-filter-duration-date-time.component';
import {DotsLoadMoreComponent} from '@common/shared/ui-components/indicators/dots-load-more/dots-load-more.component';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';

@Component({
    selector: 'sm-table-filter-sort',
    templateUrl: './table-filter-sort.component.html',
    styleUrls: ['./table-filter-sort.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CheckboxThreeStateListComponent,
        TableFilterDurationNumericComponent,
        TableFilterDurationComponent,
        MenuComponent,
        TooltipDirective,
        MenuItemComponent,
        ClickStopPropagationDirective,
        TableFilterDurationDateTimeComponent,
        DotsLoadMoreComponent,
        MatIcon,
        MatIconButton,
        MatButton
    ]
})
export class TableFilterSortComponent {

  public readonly TABLE_SORT_ORDER = TABLE_SORT_ORDER;

  public formControl = new FormControl();
  searching = true;
  FILTER_TYPE = ColHeaderFilterTypeEnum;
  private pageNumber = signal(1)

  sortOrder = input<{
        index: number;
        field: string;
        order: TableSortOrderEnum;
    }>();
  public previousLength: number | undefined;
  private isOpen: boolean;

  fixedOptionsSubheader = input<string>();
  value = input<string[]>([]);
  subValue = input<string[]>([]);
  andFilter = model<boolean>(null);
  column = input<ISmCol>();
  searchValue = input<string>('');
  options = input<{ label: string; value: string; tooltip?: string}[]>();

  subOptions = input<{
        label: string;
        value: string;
    }[]>();
  tooltip = input(false);
  filterChanged = output<{value; andFilter?: boolean}>();
  subFilterChanged = output<{value}>();
  menuClosed = output();
  menuOpened = output();
  sortOrderChanged = output<boolean>();
  searchValueChanged = output<{
        value: string;
        loadMore?: boolean;
    }>();

  private previousSearchValue = this.searchValue();
  protected paginatedOptions = computed(() => this.column().paginatedFilterPageSize ?
    this.options()?.slice(0, this.column().paginatedFilterPageSize * this.pageNumber()) : this.options()
  );
  protected noMoreOptions = computed(() => this.column().asyncFilter ?
    this.options()?.length < this.column().paginatedFilterPageSize || this.options()?.length === this.previousLength && this.searchValue() === (this.previousSearchValue) :
    this.paginatedOptions()?.length === this.options()?.length
  );
  protected state = computed(() => ({
    value: this.value(),
    loading: signal(false)
  }));
  isFiltered = computed(() => this.value()?.length > 0 || this.subValue()?.length > 0);

  constructor() {
    effect(() => {
      if (this.options() && this.isOpen) {
        this.previousLength = this.options()?.length;
        this.searching = false;
        this.previousSearchValue = this.searchValue();
        if (this.column().asyncFilter) {
          this.state().loading.set(false);
        }
      }
    });

    effect(() => {
      if (this.searchValue() && this.previousSearchValue !== this.searchValue()) {
        this.pageNumber.set(1);
      }
    });
  }

  switchSortOrder($event: MouseEvent) {
    this.sortOrderChanged.emit($event.shiftKey);
  }

  onSubFilterChanged(val) {
    if (val) {
      const newValues = addOrRemoveFromArray(this.subValue(), val.itemValue);
      this.subFilterChanged.emit({value: newValues});
    }
  }

  toggleCombination() {
    this.andFilter.update(filter => !filter);
    this.emitFilterChanged();
  }

  emitFilterChanged(value?: string[]) {
    this.filterChanged.emit({
      value: value || this.value(),
      andFilter: this.andFilter()
    });
  }

  loadMore() {
    this.pageNumber.update(num => num + 1);
    if (!this.column().asyncFilter) {
      window.setTimeout(() => this.state().loading.set(false), 300);
    }
    // If we have next page in store - no need to fetch more
    if (this.options()?.length <= this.column().paginatedFilterPageSize * this.pageNumber()) {
      this.state().loading.set(true);
      this.searchValueChanged.emit({value: this.searchValue() || '', loadMore: true});
    }
  }

  onMenuClose() {
    this.previousLength = 0;
    this.pageNumber.set(1);
    this.menuClosed.emit();
    this.isOpen = false;
  }

  onMenuOpen() {
    this.isOpen = true;
    this.menuOpened.emit();
  }

  searchChanged(value: string) {
    this.searching = true;
    this.searchValueChanged.emit({value});
  }
}
