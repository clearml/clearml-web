import {Component, inject, input} from '@angular/core';
import {
  GlobalSearchFilterComponent
} from '@common/dashboard-search/global-search-filter/global-search-filter.component';
import {selectCompanyTags} from '@common/core/reducers/projects.reducer';
import {Store} from '@ngrx/store';
import {getCompanyTags} from '@common/core/actions/projects.actions';
import {clearSearchResults, searchTableFilterChanged} from '@common/dashboard-search/dashboard-search.actions';
import {selectSearchTableFilters} from '@common/dashboard-search/dashboard-search.reducer';

@Component({
  selector: 'sm-global-search-filter-container',
  imports: [
    GlobalSearchFilterComponent
  ],
  templateUrl: './global-search-filter-container.component.html',
  styleUrl: './global-search-filter-container.component.scss'
})
export class GlobalSearchFilterContainerComponent {
  private store = inject(Store);
  protected tags = this.store.selectSignal(selectCompanyTags);
  protected filters = this.store.selectSignal(selectSearchTableFilters);
  statusOptions= input<string[]>()
  typeOptions= input<string[]>()
  statusOptionsLabels = input<Record<string, string>>();


  constructor() {
    this.store.dispatch(getCompanyTags());


    }
  filterChanged({col, value, matchMode}: { col: string; value: any; matchMode?: string }) {
    this.store.dispatch(clearSearchResults({}));
    this.store.dispatch(searchTableFilterChanged({
      filter: {
        col: col,
        value,
        filterMatchMode: (matchMode ===  'AND' ? 'AND' : undefined)
      }
    }));
  }

}
