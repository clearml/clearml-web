import {Component, inject, input} from '@angular/core';
import {
  GlobalSearchFilterComponent
} from '@common/dashboard-search/global-search-filter/global-search-filter.component';
import {selectAllProjectsUsers, selectCompanyTags} from '@common/core/reducers/projects.reducer';
import {Store} from '@ngrx/store';
import {getCompanyTags, getProjectUsers} from '@common/core/actions/projects.actions';
import {clearSearchResults, searchTableFilterChanged} from '@common/dashboard-search/dashboard-search.actions';
import {selectSearchTableFilters} from '@common/dashboard-search/dashboard-search.reducer';
import {Router} from '@angular/router';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';

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
  protected router = inject(Router);
  protected tags = this.store.selectSignal(selectCompanyTags);
  protected userOptions = this.store.selectSignal(selectAllProjectsUsers);
  protected currentUser = this.store.selectSignal(selectCurrentUser);
  protected filters = this.store.selectSignal(selectSearchTableFilters);
  statusOptions= input<string[]>()
  typeOptions= input<string[]>()
  showUserFilter= input<boolean>()
  statusOptionsLabels = input<Record<string, string>>();
  isFiltered = input<boolean>()


  constructor() {
    this.store.dispatch(getCompanyTags());
    this.store.dispatch(getProjectUsers({projectId: '*'}));
  }
  filterChanged({col, value, matchMode}: { col: string; value: any; matchMode?: string }) {
    this.store.dispatch(clearSearchResults());
    this.store.dispatch(searchTableFilterChanged({
      filter: {
        col: col,
        value,
        filterMatchMode: (matchMode ===  'AND' ? 'AND' : undefined)
      }
    }));
  }
  resetFilters() {
    this.router.navigate([], {
      queryParams: { gsfilter: ''},
      queryParamsHandling: 'merge'
    });
  }

}
