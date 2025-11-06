import {Component, input, output} from '@angular/core';
import {ResultLineComponent} from '@common/shared/ui-components/panel/result-line/result-line.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {ITask} from '~/business-logic/model/al-task';
import {IReport} from '@common/reports/reports.consts';
import {CleanProjectPathPipe} from '@common/shared/pipes/clean-project-path.pipe';

@Component({
  selector: 'sm-search-result-report',
  imports: [
    ResultLineComponent,
    TimeAgoPipe,
    CleanProjectPathPipe
  ],
  templateUrl: './search-result-report.component.html',
  styleUrl: '../search-result-common.component.scss'
})
export class SearchResultReportComponent {

  entity = input<IReport>()
  statusOptionsLabels = input<Record<string,string>>();
  reportSelected = output<IReport>();
}
