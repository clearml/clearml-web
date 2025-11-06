import {Component, input, output} from '@angular/core';
import {ResultLineComponent} from '@common/shared/ui-components/panel/result-line/result-line.component';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {CleanProjectPathPipe} from '@common/shared/pipes/clean-project-path.pipe';
import {ProjectLocationPipe} from '@common/shared/pipes/project-location.pipe';
import {Project} from '~/business-logic/model/projects/project';

@Component({
  selector: 'sm-search-result-pipeline',
  imports: [
    ResultLineComponent,
    TimeAgoPipe,
    CleanProjectPathPipe,
    ProjectLocationPipe
  ],
  templateUrl: './search-result-pipeline.component.html',
  styleUrl: '../search-result-common.component.scss'
})
export class SearchResultPipelineComponent {

  entity = input<Project>()
  statusOptionsLabels = input<Record<string,string>>();
  pipelineSelected = output<Project>();
}
