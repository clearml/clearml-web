import {Component, input, output} from '@angular/core';
import {ResultLineComponent} from '@common/shared/ui-components/panel/result-line/result-line.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {ISelectedDataview} from '~/features/dataviews/shared/dataview-info.model';
import {ShortProjectNamePipe} from '@common/shared/pipes/short-project-name.pipe';

@Component({
  selector: 'sm-search-result-dataview',
  imports: [
    ResultLineComponent,
    TimeAgoPipe,
    ShortProjectNamePipe
  ],
  templateUrl: './search-result-dataview.component.html',
  styleUrl: '../search-result-common.component.scss'
})
export class SearchResultDataviewComponent {

  entity = input<ISelectedDataview>()
  statusOptionsLabels = input<Record<string,string>>();
  dataviewSelected = output<ISelectedDataview>();
}
