import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {GroupedList} from '@common/tasks/tasks.model';
import {MetricVariantResult} from '~/business-logic/model/projects/metricVariantResult';
import {SearchComponent} from '@common/shared/ui-components/inputs/search/search.component';
import {
  GroupedSelectableListComponent
} from '@common/shared/ui-components/data/grouped-selectable-list/grouped-selectable-list.component';
import {PlotData} from 'plotly.js';


export const buildMetricsListFlat = (metrics: MetricVariantResult[]): GroupedList => {
  return metrics.reduce((acc, curr) => {
    acc[`${curr.metric} - ${curr.variant}`] = {};
    return acc;
  }, {} as Record<string, Record<string, PlotData>>);
};

export const buildMetricsList = (metrics: MetricVariantResult[]): GroupedList => {
  return metrics.reduce((acc, curr) => {
    const currMetric = curr.metric;
    if (acc[currMetric]) {
      acc[currMetric][curr.variant] = {} as PlotData;
    } else {
      acc[currMetric] = {[curr.variant]: {} as PlotData};
    }
    return acc;
  }, {} as Record<string, Record<string, PlotData>>);
};

@Component({
  selector: 'sm-selectable-grouped-filter-list',
  templateUrl: './selectable-grouped-filter-list.component.html',
  styleUrls: ['./selectable-grouped-filter-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SearchComponent,
    GroupedSelectableListComponent
  ]
})
export class SelectableGroupedFilterListComponent {

  list = input<GroupedList>();
  nested = input<boolean>();
  listNested = computed(() => this.nested() ? this.list() ?? {} : Object.keys(this.list() ?? {})
    .reduce((acc, metric) => {
      acc[metric] = {};
      return acc;
    }, {} as GroupedList));
  searchTerm = input<string>();
  checkedList = input<string[]>([]);
  titleLabel = input<string>();
  placeHolder = input<string>('Find scalars');

  itemSelect = output<string>();
  selectedChanged = output<string[]>();
  searchTermChanged = output<string>();

  filteredList = computed(() => this.filterList(this.listNested(), this.searchTerm()));


  listStrings = computed(() => {
    const allValues = [];
    Object.keys(this.listNested()).forEach(key => {
      allValues.push(key);
      Object.keys(this.list()[key]).forEach(itemKey => {
        allValues.push(key + itemKey);
      });
    });
    return allValues;
  });

  filteredListStrings = computed(() => {
    const allValues = [];
    Object.keys(this.filteredList() || {}).forEach(key => {
      allValues.push(key);
      Object.keys(this.list()[key]).forEach(itemKey => {
        if ((key.toLowerCase().includes(this.searchTerm().toLowerCase()) ||
          itemKey.toLowerCase().includes(this.searchTerm().toLowerCase()))
        ) {
          allValues.push(key + itemKey);
        }
      });
    });
    return allValues;
  });

  allFilteredSelected = computed(() => this.filteredListStrings().every(filteredItem => this.checkedList().includes(filteredItem)));
  allSelected = computed(() => this.listStrings().every(item => this.checkedList().includes(item)));

  filterList(list: GroupedList, searchTerm: string) {
    if (!searchTerm || searchTerm === '') {
      return list;
    } else {
      const filtered = {};
      Object.keys(list).forEach(key => {
        if (key.toLowerCase().includes(searchTerm.toLowerCase())) {
          filtered[key] = list[key];
        } else {
          const subFiltered = {};
          Object.keys(list[key]).forEach(subKey => {
            if (subKey.toLowerCase().includes((searchTerm).toLowerCase())) {
              subFiltered[subKey] = list[key][subKey];
            }
          });
          if (Object.keys(subFiltered).length > 0) {
            filtered[key] = subFiltered;
          }
        }
      });
      return filtered;
    }
  }

  onSearchTermChanged(value: string) {
    this.searchTermChanged.emit(value);
  }

  public toggleHide({pathString, parent}) {
    let newCheckedList = this.checkedList()?.includes(pathString) ? this.checkedList()?.filter(i => i !== pathString) : [...this.checkedList(), pathString];
    if (this.shouldHidePrent(parent, newCheckedList)) {
      newCheckedList = newCheckedList.filter(i => i !== parent);
    } else {
      if (!newCheckedList.includes(parent)) {
        newCheckedList = [...newCheckedList, parent];
      }
    }
    this.selectedChanged.emit(newCheckedList);
  }

  private shouldHidePrent(parent: string, checkedList: string[]) {
    return !Object.keys(this.list()[parent]).some(item => checkedList.includes(parent + item));
  }

  toggleHideAll() {
    if (this.allSelected()) {
      this.selectedChanged.emit([]);
    } else {
      this.selectedChanged.emit(this.listStrings());
    }
  }

  toggleHideMatching() {
    if (this.allFilteredSelected()) {
      if (this.nested()) {
        const newList = Object.entries(this.filteredList()).map(([parent, childrenTemp]) => {
          const children = Object.keys(childrenTemp);
          const toRemove = children.map(child => parent + child);
          const removeFromCheckedList = this.checkedList().filter(checkedItem => toRemove.includes(checkedItem));
          if (this.shouldHidePrent(parent, this.checkedList().filter(checkedItem => !toRemove.includes(checkedItem)))) {
            removeFromCheckedList.push(parent);
          }
          return removeFromCheckedList;
        }).flat();
        this.selectedChanged.emit(this.checkedList().filter(checkedItem => !newList.includes(checkedItem)));
      } else {
        this.selectedChanged.emit(this.checkedList().filter(allItem => !this.filteredListStrings().some(filteredItem => allItem.startsWith(filteredItem))));
      }
    } else {
      this.selectedChanged.emit(Array.from(new Set([...this.checkedList(), ...this.filteredListStrings()])));
    }
  }

  toggleHideGroup(event) {
    const key = event.key;
    let newCheckedList = [...this.checkedList() ?? []];
    if (event.hide) {
      newCheckedList = !newCheckedList.includes(key) ? [...newCheckedList, key] : newCheckedList;
      Object.keys(this.list()[key]).forEach(itemKey => {
        const keyItemKey = key + itemKey;
        if (!newCheckedList.includes(keyItemKey)) {
          newCheckedList.push(keyItemKey);
        }
      });
    } else {
      const parentKey = `${key}`;
      const currentVariants = Object.keys(this.list()[parentKey]).map(child => parentKey + child);
      newCheckedList = newCheckedList.filter(i => !currentVariants.includes(i)).filter(i => i !== parentKey);
      Object.keys(this.listNested()[key]).forEach(itemKey => {
        const keyItemKey = key + itemKey;
        if (newCheckedList.includes(keyItemKey)) {
          newCheckedList = newCheckedList.filter(longKey => longKey !== (keyItemKey));
        }
      });
    }
    this.selectedChanged.emit(newCheckedList);
  }
}
