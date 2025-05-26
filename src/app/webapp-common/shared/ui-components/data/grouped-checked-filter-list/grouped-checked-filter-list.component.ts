import {ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked} from '@angular/core';
import {compareByFieldFunc} from '@common/tasks/tasks.utils';
import {SearchComponent} from '@common/shared/ui-components/inputs/search/search.component';
import {MatExpansionModule} from '@angular/material/expansion';
import {KeyValuePipe} from '@angular/common';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatRadioModule} from '@angular/material/radio';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {
  ShowTooltipIfEllipsisDirective
} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {FilterOutPipe} from '@common/shared/pipes/filterOut.pipe';
import {decodeURIComponentSafe} from '@common/shared/utils/tableParamEncode';

export type HyperParams<T> = ReadonlyMap<string, T[]>;

@Component({
    selector: 'sm-grouped-checked-filter-list',
    templateUrl: './grouped-checked-filter-list.component.html',
    styleUrls: ['./grouped-checked-filter-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        SearchComponent,
        MatExpansionModule,
        KeyValuePipe,
        TooltipDirective,
        MatCheckboxModule,
        MatRadioModule,
        ClickStopPropagationDirective,
        ShowTooltipIfEllipsisDirective,
        FilterOutPipe
    ]
})
export class GroupedCheckedFilterListComponent {

  renameMap = {_legacy: 'General'};
  private debounceTimer: number;

  public expanded = signal<{ string: boolean }>({} as { string: boolean });
  public searchText = signal('');
  public itemsObjectListFiltered = signal<HyperParams<{ checked: boolean; value: string }>>(null);

  limitSelection = input(9999);
  titleText = input<string>();
  placeholderText = input<string>();
  single = input(false);
  selectedItemsList = input<string[]>(null);
  itemsList = input<Record<string, HyperParams<{ checked: boolean; value: string }>>>(null);
  selectedItemsListMapper = input((data) => decodeURIComponentSafe(data.id));
  selectedItemsListPrefix = input('hyperparams.');
  filterItemsLabel = input<string>();
  selectFilteredItems = input<boolean>();

  selectedItems = output<{
    param: string;
    value: unknown;
  }>();
  clearSelection = output();
  hideFilteredItems = output();

  itemsObjectList = computed(() => {
    if (this.itemsList() && this.selectedItemsList()) {
      return this.getItemsObjectList(this.itemsList());
    }
    return {} as HyperParams<{ checked: boolean; value: string }>;
  });

  selectionLimitReached = computed(() =>
    this.selectedItemsList() && (Object.values(this.selectedItemsList())).flat().length >= this.limitSelection());

  constructor() {
    effect(() => {
      if (this.itemsObjectList()) {
        const text = this.searchText();
        untracked(() => this.searchQ(text, 0));
      }
    });
  }

  private getItemsObjectList = (itemsList: Record<string, HyperParams<{ checked: boolean; value: string }>>) =>
    Object.entries(itemsList).reduce((acc, [section, params]) => {
      acc[section] = Object.entries(params).map(([paramKey]) => {
        const search = `${this.selectedItemsListPrefix()}${section}.${paramKey}`;
        return {
          value: paramKey,
          checked: this.selectedItemsList().map(this.selectedItemsListMapper()).includes(search)
        };
      });
      return acc;

    }, {}) as HyperParams<{ checked: boolean; value: string }>;

  public toggleParamToDisplay(category: string, param: string, value: boolean) {
    this.selectedItems.emit({
      value,
      param: `${category.replaceAll('.', '%2E')}.${param?.replaceAll('.', '%2E')}`
    });
  }

  public searchQ(searchQuery: string, debounceTime = 275) {
    window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      this.itemsObjectListFiltered.set(Object.entries(this.itemsObjectList()).reduce((acc, [key, val]) => {
        const query = searchQuery.toLowerCase();
        const groupFound = key.toLowerCase().includes(query);
        const listFiltered = val.filter(item => item.value.toLowerCase().includes(query));
        if (groupFound && listFiltered.length === 0) {
          acc[key] = val;
        } else if (listFiltered.length > 0) {
          acc[key] = listFiltered;
        }
        return acc;
      }, {} as HyperParams<{ checked: boolean; value: string }>));
      if (searchQuery) {
        this.expanded.set(Object.keys(this.itemsObjectListFiltered()).reduce((acc, group) => {
          acc[group] = true;
          return acc;
        }, {} as { string: boolean }));
      }
      this.searchText.set(searchQuery);
    }, debounceTime);
  }

  onClearSelection() {
    this.clearSelection.emit();
  }

  compareByKey = compareByFieldFunc('key');

  toggleExpand(name) {
    this.expanded.update(exp => ({...exp, name: !this.expanded()[name]}));
  }

  protected readonly Object = Object;
}
