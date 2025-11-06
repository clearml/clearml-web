import {Component, computed} from '@angular/core';
import {DashboardSearchBaseComponent} from '@common/dashboard/dashboard-search.component.base';
import {activeLinksList} from '~/features/dashboard-search/dashboard-search.consts';
import {EndpointStats} from '~/business-logic/model/serving/endpointStats';
import {ContainerInfo} from '~/business-logic/model/serving/containerInfo';

@Component({
  selector: 'sm-dashboard-search',
  templateUrl: './dashboard-search.component.html',
  styleUrls: ['./dashboard-search.component.scss'],
  standalone: false
})
export class DashboardSearchComponent extends DashboardSearchBaseComponent {
  protected links = computed(() => activeLinksList);
  modelEndpointSelected(endpoint: EndpointStats) {
    this.router.navigate(['/endpoints', 'active', endpoint.id]);
    this.itemSelected.emit();
  }

  loadingModelEndpointSelected(endpoint: ContainerInfo) {
    this.router.navigate(['/endpoints', 'loading']);
    this.itemSelected.emit();
  }
}
