import {
  ChangeDetectionStrategy,
  Component, computed, input,
  signal, output, model
} from '@angular/core';
import {ISmCol} from '../table.consts';
import {addOrRemoveFromArray} from '../../../../utils/shared-utils';
import {MatMenuModule} from '@angular/material/menu';
import {MatInputModule} from '@angular/material/input';
import {
  CheckboxThreeStateListComponent
} from '@common/shared/ui-components/panel/checkbox-three-state-list/checkbox-three-state-list.component';
import {MatListModule} from '@angular/material/list';
import {MenuItemComponent} from '@common/shared/ui-components/panel/menu-item/menu-item.component';
import {FilterPipe} from '@common/shared/pipes/filter.pipe';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {DotsLoadMoreComponent} from '@common/shared/ui-components/indicators/dots-load-more/dots-load-more.component';
import {IOption} from '@common/constants';
import {FormsModule} from '@angular/forms';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
    selector: 'sm-table-card-filter',
    templateUrl: './table-card-filter.component.html',
    styleUrls: ['./table-card-filter.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatMenuModule,
        MatInputModule,
        CheckboxThreeStateListComponent,
        MatListModule,
        MenuItemComponent,
        FilterPipe,
        ClickStopPropagationDirective,
        DotsLoadMoreComponent,
        FormsModule,
        MatIconButton,
        MatIcon,
    MatButton,
  ]
})
export class TableCardFilterComponent {

  protected searchTerms = {};
  protected pageNumber = signal(1);
  protected loading = signal<boolean>(false);


  value = input<Record<string, string[]>>({});
  fixedOptionsSubheader = input<string>();
  subValue = input<string[]>( []);
  subOptions = input<IOption[]>([]);
  columns = input.required<ISmCol[]>();
  andFilter = model<boolean>(null);
  options = input.required<Record<string, IOption[]>>();
  filterMatch = input<Record<string, string>>();
  protected isFiltering = computed(() =>
    (this.value() && Object.values(this.value()).some(options => options?.length > 0)) ||
    this.subValue()?.length > 0
  );
  protected optionsFiltered = computed(() => {
    if (this.options() && this.columns()) {
      return this.columns()
        .filter(column => column.showInCardFilters && this.options()[column.id])
        .map(column => ({key: column.id, value: this.options()[column.id]}));
    }
    return [];
  });

  subFilterChanged = output<{col: ISmCol; value}>();
  filterChanged = output<{
        col: string;
        value: unknown;
        andFilter?: boolean;
    }>();
  menuClosed = output<ISmCol>();
  menuOpened = output<ISmCol>();
  clearAll = output();

  emitFilterChangedCheckBox(colId: string, values: string[]) {
    this.filterChanged.emit({col: colId, value: values, andFilter: this.andFilter()});
  }

  onSubFilterChanged(col: ISmCol, val) {
    if (val) {
      const newValues = addOrRemoveFromArray(this.subValue(), val.itemValue);
      this.subFilterChanged.emit({col, value: newValues});
    }
  }

  setSearchTerm($event, key: string) {
    this.searchTerms[key] = $event.target.value;
    this.startLoadingIndication();
    this.pageNumber.set(1);
  }

  closeMenu(col: ISmCol) {
    this.searchTerms = {};
    this.pageNumber.set(1);
    this.menuClosed.emit(col);
  }

  clearSearch(key: string) {
    this.searchTerms[key] = '';
    this.startLoadingIndication();
    this.pageNumber.set(1);
    this.setSearchTerm({target: {value: ''}}, key);
  }

  toggleCombination(colId: string) {
    this.andFilter.update(filter => !filter);
    this.filterChanged.emit({col: colId, value: this.value()[colId], andFilter: this.andFilter()});
  }

  getColumnByOption(option: {key: string}) {
    return this.columns().find(col => col.id === option.key);
  }

  loadMore() {
    window.setTimeout(() => this.pageNumber.update(num => num + 1), 300);
  }

  startLoadingIndication() {
    this.loading.set(true);
    window.setTimeout(() => this.loading.set(false), 300)
  }
}
