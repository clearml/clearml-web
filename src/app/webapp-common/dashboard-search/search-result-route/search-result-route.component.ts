import {Component, input, output} from '@angular/core';
import {ResultLineComponent} from '@common/shared/ui-components/panel/result-line/result-line.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {RoutersGetRoutesResponseRoutes} from '~/business-logic/model/routers/routersGetRoutesResponseRoutes';

interface Route extends Omit<RoutersGetRoutesResponseRoutes, 'updated_by'> {
  updated_by: { name: string };
}

@Component({
  selector: 'sm-search-result-route',
  imports: [
    ResultLineComponent,
    TimeAgoPipe
  ],
  templateUrl: './search-result-route.component.html',
  styleUrl: '../search-result-common.component.scss'
})
export class SearchResultRouteComponent {

  entity = input<Route>()
  statusOptionsLabels = input<Record<string,string>>();
  routeSelected = output<Route>();
}
