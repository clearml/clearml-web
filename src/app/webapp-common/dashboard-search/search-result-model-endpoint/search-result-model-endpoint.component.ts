import {Component, input, output} from '@angular/core';
import {ResultLineComponent} from '@common/shared/ui-components/panel/result-line/result-line.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {EndpointStats} from '~/business-logic/model/serving/endpointStats';
import {ContainerInfo} from '~/business-logic/model/serving/containerInfo';

@Component({
  selector: 'sm-search-result-model-endpoint',
  imports: [
    ResultLineComponent,
    TimeAgoPipe
  ],
  templateUrl: './search-result-model-endpoint.component.html',
  styleUrl: '../search-result-common.component.scss'
})
export class SearchResultModelEndpointComponent {

  entity = input<EndpointStats | ContainerInfo>()
  modelEndpointSelected = output<EndpointStats | ContainerInfo>();
}
