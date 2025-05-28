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
}

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
}

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
  searchTerm = input<string>();
  checkedList = input<string[]>([]);
  titleLabel = input<string>();
  placeHolder = input<string>('Find scalars');

  itemSelect = output<string>();
  hiddenChanged = output<string[]>();
  searchTermChanged = output<string>();

  filteredList = computed(() => this.filterList(this.list(), this.searchTerm()));

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

  // private hideChildrenForHiddenParent(list: GroupedList) {
  //   let newCheckList = this.checkedList() ? [...this.checkedList()] : [];
  //   let hiddenListChanged = false;
  //   Object.entries(list).forEach(([parent, children]) => {
  //     if (!this.checkedList()?.includes(parent)) {
  //       hiddenListChanged = true;
  //       const remove = Object.keys(children).map(child => parent + child)
  //       newCheckList = newCheckList.filter(item => !remove.includes(item))
  //     }
  //   });
  //   if (hiddenListChanged) {
  //     this.hiddenChanged.emit(Array.from(new Set(newCheckList)));
  //   }
  // }

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
    this.hiddenChanged.emit(newCheckedList);
  }

  private shouldHidePrent(parent: string, checkedList: string[]) {
    return !Object.keys(this.list()[parent]).some(item => checkedList.includes(parent + item));
  }

  toggleHideAll() {
    if (Object.keys(this.checkedList() ?? {}).length > 0) {
      this.hiddenChanged.emit([]);
    } else {
      const allValues = [];
      Object.keys(this.list()).forEach(key => {
        allValues.push(key);
        Object.keys(this.list()[key]).forEach(itemKey => {
          if (itemKey !== '__displayName') {
            allValues.push(key + itemKey);
          }
        });
      });
      this.hiddenChanged.emit(allValues);
    }
  }

  toggleHideGroup(event) {
    const key = event.key;
    let allValues = [...this.checkedList() ?? []];
    if (event.hide) {
      allValues = !allValues.includes(key) ? [...allValues, key] : allValues;
      Object.keys(this.list()[key]).forEach(itemKey => {
        const keyItemKey = key + itemKey;
        if (!allValues.includes(keyItemKey) && itemKey !== '__displayName') {
          allValues.push(keyItemKey);
        }
      });
    } else {
      const parentKey = `${key}`
      allValues = allValues.filter(i => !i.startsWith(parentKey) && i !== key);
      Object.keys(this.list()[key]).forEach(itemKey => {
        const keyItemKey = key + itemKey;
        if (allValues.includes(keyItemKey)) {
          allValues = allValues.filter(longKey => longKey !== (keyItemKey));
        }
      });
    }
    this.hiddenChanged.emit(allValues);
  }
}
