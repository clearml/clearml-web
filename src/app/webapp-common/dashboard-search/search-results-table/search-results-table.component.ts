import {Component, computed, effect, ElementRef, inject, input, output, signal, viewChild} from '@angular/core';
import {Project} from '~/business-logic/model/projects/project';
import {Task} from '~/business-logic/model/tasks/task';
import {ITask} from '~/business-logic/model/al-task';
import {Model} from '~/business-logic/model/models/model';
import {activeLinksList, ActiveSearchLink, activeSearchLink} from '~/features/dashboard-search/dashboard-search.consts';
import {IReport} from '@common/reports/reports.consts';
import {MatTab, MatTabGroup, MatTabLabel} from '@angular/material/tabs';
import {KeyValuePipe, NgTemplateOutlet} from '@angular/common';
import {
  GlobalSearchFilterContainerComponent
} from '@common/dashboard-search/global-search-filter-container/global-search-filter-container.component';
import {ActivatedRoute, Params, RouterLink} from '@angular/router';
import {FilterMetadata} from 'primeng/api';
import {toSignal} from '@angular/core/rxjs-interop';
import {convertToViewAllFilter, SEARCH_PAGE_SIZE} from '@common/dashboard-search/dashboard-search.consts';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatIconModule} from '@angular/material/icon';
import {BreakpointObserver} from '@angular/cdk/layout';
import {PushPipe} from '@ngrx/component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {SelectedModel} from '@common/models/shared/models.model';
import {SearchResultProjectComponent} from '@common/dashboard-search/search-result-project/search-result-project.component';
import {SearchResultTaskComponent} from '@common/dashboard-search/search-result-task/search-result-task.component';
import {SearchResultModelComponent} from '@common/dashboard-search/search-result-model/search-result-model.component';
import {SearchResultPipelineRunComponent} from '@common/dashboard-search/search-result-pipeline-run/search-result-pipeline-run.component';
import {SearchResultPipelineComponent} from '@common/dashboard-search/search-result-pipeline/search-result-pipeline.component';
import {SearchResultOpenDatasetComponent} from '@common/dashboard-search/search-result-open-dataset/search-result-open-dataset.component';
import {SearchResultOpenDatasetVersionComponent} from '@common/dashboard-search/search-result-open-dataset-version/search-result-open-dataset-version.component';
import {SearchResultReportComponent} from '@common/dashboard-search/search-result-report/search-result-report.component';
import {SearchResultModelEndpointComponent} from '@common/dashboard-search/search-result-model-endpoint/search-result-model-endpoint.component';
import {ReplaceViaMapPipe} from '@common/shared/pipes/replaceViaMap';
import {ContainerInfo} from '~/business-logic/model/serving/containerInfo';
import {EndpointStats} from '~/business-logic/model/serving/endpointStats';

@Component({
  selector: 'sm-search-results-table',
  templateUrl: './search-results-table.component.html',
  styleUrls: ['./search-results-table.component.scss'],
  imports: [
    MatTabGroup,
    MatTab,
    NgTemplateOutlet,
    MatTabLabel,
    GlobalSearchFilterContainerComponent,
    RouterLink,
    MatSidenavModule,
    MatIconButton,
    MatIconModule,
    PushPipe,
    MatButton,
    MatProgressSpinner,
    TooltipDirective,
    SearchResultProjectComponent,
    SearchResultTaskComponent,
    SearchResultModelComponent,
    SearchResultPipelineRunComponent,
    SearchResultPipelineComponent,
    SearchResultOpenDatasetComponent,
    SearchResultOpenDatasetVersionComponent,
    SearchResultReportComponent,
    SearchResultModelEndpointComponent,
    ReplaceViaMapPipe,
    KeyValuePipe,
  ]
})
export class SearchResultsTableComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private route = inject(ActivatedRoute);

  protected readonly SEARCH_PAGE_SIZE = SEARCH_PAGE_SIZE;
  protected readonly SEMI_TASKS_LISTS = {
    [activeSearchLink.openDatasetVersions]: activeSearchLink.experiments,
    [activeSearchLink.pipelineRuns]: activeSearchLink.experiments,
  };
  protected readonly searchPages = activeSearchLink;
  protected viewAllQueryParams: Params;

  loading = input.required<boolean>();
  pages = input.required<Record<ActiveSearchLink, number>>();
  advanced = input.required<boolean>();
  links = input.required<typeof activeLinksList>();
  userId = input.required<string>();
  projectsList = input<Project[]>([]);
  allFilters = input<Record<string, Record<string, FilterMetadata>>>();
  query = input.required<string>();
  datasetsList = input<Project[]>([]);
  openDatasetVersionsList = input<Task[]>([]);
  tasksList = input<Task[]>([]);
  modelEndpointsList = input<EndpointStats[]>([]);
  loadingEndpointsList = input<EndpointStats[]>([]);
  modelsList = input<Model[]>([]);
  pipelinesList = input<Project[]>([]);
  pipelineRunsList = input<Task[]>([]);
  reportsList = input<IReport[]>([]);
  activeLink = input<ActiveSearchLink>();
  activeLinkConfiguration = computed(() =>
    Object.values(this.links()[this.activeIndex()].relevantSearchItems));
  resultsCount = input<Record<ActiveSearchLink, number>>();

  projectSelected = output<Project>();
  viewAllResults = output<ActiveSearchLink>();
  activeLinkChanged = output<string>();
  openDatasetSelected = output<Project>();
  experimentSelected = output<ITask>();
  openDatasetVersionSelected = output<ITask>();
  modelSelected = output<SelectedModel>();
  modelEndpointSelected = output<EndpointStats>();
  loadingEndpointSelected = output<ContainerInfo>();
  reportSelected = output<IReport>();
  pipelineSelected = output<Project>();
  pipelineRunSelected = output<ITask>();
  loadMoreClicked = output<ActiveSearchLink>();
  closeDialog = output();

  protected filters = computed(() =>
    (!this.advanced() && this.allFilters()[this.activeLink()]) ?? {});
  protected isEmpty = computed(() => !this.query() && !Object.keys(this.filters() || {}).length);
  private listElement = viewChild<ElementRef<HTMLDivElement>>('list');

  protected smallScreen$ = this.breakpointObserver.observe('(max-width: 900px)');
  protected qParams = toSignal(this.route.queryParams);
  protected showFilter = signal<boolean>(true);
  protected getAllResults = computed(() => Object.keys(this.links()[this.activeIndex()]?.relevantSearchItems || {})
    .map((key) => {
      return this[`${key}List`]();
    }));
  protected noData = computed(() => this.getAllResults().flat().length === 0);
  protected isFiltered = computed(() =>
    Object.keys(this.filters() || {}).length > 0
  );
  activeIndex = computed<number>(() => this.links().findIndex(item => item.name === this.activeLink()));
  private userShowFilterPrefernces = true;

  constructor() {
    effect(() => {
      this.viewAllQueryParams = convertToViewAllFilter(this.qParams(), this.activeLink(), this.userId());
    });

    effect(() => {
      if (this.activeLink() === activeSearchLink.modelEndpoints || this.advanced()) {
        this.showFilter.set(false);
      } else {
        this.showFilter.set(this.userShowFilterPrefernces);
      }
    });
  }

  tabChanged(index: number) {
    this.activeLinkChanged.emit(this.links()[index].name);
    this.listElement().nativeElement.scrollTop = 0;
  }

  protected toggleFilter() {
    this.showFilter.update(show => !show);
    this.userShowFilterPrefernces = this.showFilter();
  }
}
