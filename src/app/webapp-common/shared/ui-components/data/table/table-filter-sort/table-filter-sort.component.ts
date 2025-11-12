import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
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
    MatButton,
  ],
})
export class TableFilterSortComponent {
  // Constants
  public readonly TABLE_SORT_ORDER = TABLE_SORT_ORDER;
  public readonly FILTER_TYPE = ColHeaderFilterTypeEnum;

  // Inputs
  public sortOrder = input<{ index: number; field: string; order: TableSortOrderEnum }>();
  public fixedOptionsSubheader = input<string>();
  public value = input<string[]>([]);
  public subValue = input<string[]>([]);
  public andFilter = model<boolean>(null);
  public column = input.required<ISmCol>();
  public searchValue = input<string>('');
  public options = input<{ label: string; value: string; tooltip?: string }[]>();
  public subOptions = input<{ label: string; value: string }[]>();
  public tooltip = input(false);
  smMenu = viewChild(MenuComponent);


  // Outputs
  public filterChanged = output<{ value: string[]; andFilter?: boolean }>();
  public subFilterChanged = output<{ value: string[] }>();
  public menuClosed = output<void>();
  public menuOpened = output<void>();
  public sortOrderChanged = output<boolean>();
  public searchValueChanged = output<{ value: string; loadMore?: boolean }>();

  // Internal State Signals
  protected pageNumber = signal(1);
  private lengthBeforeLoad = signal<number | null>(null);
  protected loading = signal(false); // For "load more" spinner
  protected searching = signal(false); // For initial search spinner


  // Computed Signals
  protected paginatedOptions = computed(() => {
    // When a new search is happening, return null to trigger the spinner in the child component.
    if (this.searching() && !this.noMoreOptions()) {
      return null;
    }

    const col = this.column();
    if (!col.paginatedFilterPageSize || this.noMoreOptions()) {
      return this.options();
    }
    return this.options()?.slice(0, col.paginatedFilterPageSize * this.pageNumber());
  });

  protected noMoreOptions = computed(() => {
    const col = this.column();
    const options = this.options();

    // Logic for non-async filters (Cycle is removed here)
    if (!col.asyncFilter) {
      if (!options?.length || !col.paginatedFilterPageSize) {
        return true; // No options or no pagination means there are no more to load.
      }
      // Calculate if the number of items that should be displayed exceeds the total available.
      const displayedCount = col.paginatedFilterPageSize * this.pageNumber();
      return displayedCount >= options.length;
    }

    // Logic for async filters (remains the same)
    if (this.loading()) {
      return false;
    }

    const prevLength = this.lengthBeforeLoad();

    if (prevLength === null && options && options.length < col.paginatedFilterPageSize) {
      return true;
    }

    if (prevLength !== null && options && options.length === prevLength) {
      return true;
    }

    return false;
  });

  public isFiltered = computed(() => (this.value()?.length ?? 0) > 0 || (this.subValue()?.length ?? 0) > 0);

  constructor() {
    // Effect to automatically turn off loading indicators when new options arrive.
    effect(() => {
      if (this.options()) {
        this.loading.set(false);
        this.searching.set(false);
      }
    });

    // The problematic effect that reset pageNumber has been removed.
  }

  public switchSortOrder($event: MouseEvent): void {
    this.sortOrderChanged.emit($event.shiftKey);
  }

  public onSubFilterChanged(val: { itemValue: string }): void {
    if (val) {
      const newValues = addOrRemoveFromArray(this.subValue(), val.itemValue);
      this.subFilterChanged.emit({ value: newValues });
    }
  }

  public toggleCombination(): void {
    this.andFilter.update(filter => !filter);
    this.emitFilterChanged();
  }

  public emitFilterChanged(value?: string[]): void {
    this.filterChanged.emit({
      value: value || this.value(),
      andFilter: this.andFilter(),
    });
  }

  public loadMore(): void {
    // Don't do anything if we are already loading or know there are no more options.
    if (this.loading() || this.noMoreOptions()) {
      return;
    }
    // Store the current number of options BEFORE requesting more.
    this.lengthBeforeLoad.set(this.options()?.length ?? 0);
    this.pageNumber.update(num => num + 1);
    this.loading.set(true);
    this.searchValueChanged.emit({ value: this.searchValue() || '', loadMore: true });
  }

  public searchChanged(value: string): void {
    // A new search is starting.
    this.pageNumber.set(1); // Reset page number on new search.
    this.lengthBeforeLoad.set(null); // Reset for a new search.
    this.searching.set(true); // Show initial spinner.
    this.searchValueChanged.emit({ value });
  }

  public onMenuClose(): void {
    // Need to wait until menu actually close, otherwise loadMore because 3dots is visible
    setTimeout(() => this.pageNumber.set(1), 500);
    this.menuClosed.emit();
  }

  public onMenuOpen(): void {
    this.menuOpened.emit();
    // If the menu is opened and there are no options, trigger an initial search.
    if (!this.options()?.length) {
      this.searchChanged(this.searchValue());
    }
  }
}
