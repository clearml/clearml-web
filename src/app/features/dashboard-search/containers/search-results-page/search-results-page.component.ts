import {Component, output, input, computed} from '@angular/core';
import {Project} from '~/business-logic/model/projects/project';
import {Task} from '~/business-logic/model/tasks/task';
import {ITask} from '~/business-logic/model/al-task';
import {Model} from '~/business-logic/model/models/model';
import {activeLinksList, ActiveSearchLink, activeSearchLink} from '~/features/dashboard-search/dashboard-search.consts';
import {IReport} from '@common/reports/reports.consts';

@Component({
    selector: 'sm-search-results-page',
    templateUrl: './search-results-page.component.html',
    styleUrls: ['./search-results-page.component.scss'],
    standalone: false
})
export class SearchResultsPageComponent {
  protected readonly searchPages = activeSearchLink;
  protected readonly activeLinksList = activeLinksList;


  projectsList = input<Project[]>([]);
  datasetsList = input<Project[]>([]);
  tasksList = input<Task[]>([]);
  modelsList = input<Model[]>([]);
  pipelinesList = input<Project[]>([]);
  reportsList = input<IReport[]>([]);
  activeLink = input<ActiveSearchLink>();
  resultsCount = input<Map<ActiveSearchLink, number>>();

  projectSelected = output<Project>();
  activeLinkChanged = output<string>();
  openDatasetSelected = output<Project>();
  experimentSelected = output<ITask>();
  modelSelected = output<Model>();
  reportSelected = output<IReport>();
  pipelineSelected = output<Project>();
  loadMoreClicked = output();

  protected loading = computed<boolean>(() => [null, undefined].includes(this.resultsCount()?.[this.activeLink()]));
  protected getResults = computed(() => this[`${this.activeLink()}List`]());
  activeIndex = computed<number>(() => activeLinksList.findIndex(item => item.name === this.activeLink()));

  public projectClicked(project: Project) {
    this.projectSelected.emit(project);
  }

  public experimentClicked(experiment: ITask) {
    this.experimentSelected.emit(experiment);
  }

  public modelClicked(model: Model) {
    this.modelSelected.emit(model);
  }

  public pipelineClicked(pipeline: Project) {
    this.pipelineSelected.emit(pipeline);
  }

  public openDatasetClicked(project: Project) {
    this.openDatasetSelected.emit(project);
  }

  reportClicked(report: IReport) {
    this.reportSelected.emit(report);
  }


  getCardHeight() {
    switch (this.activeLink()) {
      case activeSearchLink.projects:
        return 246;
      case activeSearchLink.experiments:
      case activeSearchLink.models:
        return 264;
      case activeSearchLink.pipelines:
      case activeSearchLink.reports:
      case activeSearchLink.openDatasets:
        return 226;
      default:
        return 250;
    }
  }
}
