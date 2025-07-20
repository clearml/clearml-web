import {Component, computed} from '@angular/core';
import {DashboardSearchBaseComponent} from '@common/dashboard/dashboard-search.component.base';
import {selectFeatures} from '~/core/reducers/users.reducer';
import {activeLinksList} from '~/features/dashboard-search/dashboard-search.consts';
import {selectLoadMoreActive, selectSearchTableFilters} from '@common/dashboard-search/dashboard-search.reducer';

@Component({
  selector: 'sm-dashboard-search',
  templateUrl: './dashboard-search.component.html',
  styleUrls: ['./dashboard-search.component.scss'],
  standalone: false
})
export class DashboardSearchComponent extends DashboardSearchBaseComponent {

  private features = this.store.selectSignal(selectFeatures);
  public loadMoreActive = this.store.selectSignal(selectLoadMoreActive);
  protected filters = this.store.selectSignal(selectSearchTableFilters);
  protected links = computed(() => activeLinksList.filter(link => !link.feature || this.features().includes(link.feature)));

}
