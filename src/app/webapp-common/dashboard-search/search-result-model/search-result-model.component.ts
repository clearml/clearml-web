import {Component, input, output} from '@angular/core';
import {ResultLineComponent} from '@common/shared/ui-components/panel/result-line/result-line.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {ShortProjectNamePipe} from '@common/shared/pipes/short-project-name.pipe';
import {SelectedModel} from '@common/models/shared/models.model';

@Component({
  selector: 'sm-search-result-model',
  imports: [
    ResultLineComponent,
    TimeAgoPipe,
    ShortProjectNamePipe
  ],
  templateUrl: './search-result-model.component.html',
  styleUrl: '../search-result-common.component.scss'
})
export class SearchResultModelComponent {

  entity = input<SelectedModel>()
  statusOptionsLabels = input<Record<string,string>>();
  modelSelected = output<SelectedModel>();
}
