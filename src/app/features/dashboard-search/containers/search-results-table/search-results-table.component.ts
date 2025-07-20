import {Component, computed, effect, ElementRef, inject, input, output, signal, viewChild} from '@angular/core';
import {Project} from '~/business-logic/model/projects/project';
import {Task} from '~/business-logic/model/tasks/task';
import {ITask} from '~/business-logic/model/al-task';
import {Model} from '~/business-logic/model/models/model';
import {FeaturesEnum} from '~/business-logic/model/users/featuresEnum';
import {activeLinksList, ActiveSearchLink, activeSearchLink} from '~/features/dashboard-search/dashboard-search.consts';
import {IReport} from '@common/reports/reports.consts';
import {MatTab, MatTabGroup, MatTabLabel} from '@angular/material/tabs';
import {NgTemplateOutlet, UpperCasePipe} from '@angular/common';
import {ResultLineComponent} from '@common/shared/ui-components/panel/result-line/result-line.component';
import {DatasetsSharedModule} from '~/features/datasets/shared/datasets-shared.module';
import {
  GlobalSearchFilterContainerComponent
} from '@common/dashboard-search/global-search-filter-container/global-search-filter-container.component';
import {ActivatedRoute, Params, RouterLink} from '@angular/router';
import {FilterMetadata} from 'primeng/api/filtermetadata';
import {toSignal} from '@angular/core/rxjs-interop';
import {convertToViewAllFilter, SEARCH_PAGE_SIZE} from '@common/dashboard-search/dashboard-search.consts';
import {ShortProjectNamePipe} from '@common/shared/pipes/short-project-name.pipe';
import {TimeAgoPipe} from '@common/shared/pipes/timeAgo';
import {CleanProjectPathPipe} from '@common/shared/pipes/clean-project-path.pipe';
import {ProjectLocationPipe} from '@common/shared/pipes/project-location.pipe';
import {EXPERIMENTS_STATUS_LABELS} from '~/features/experiments/shared/experiments.const';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatIconModule} from '@angular/material/icon';
import {BreakpointObserver} from '@angular/cdk/layout';
import {PushPipe} from '@ngrx/component';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {SelectedModel} from '@common/models/shared/models.model';

@Component({
  selector: 'sm-search-results-table',
  templateUrl: './search-results-table.component.html',
  styleUrls: ['./search-results-table.component.scss'],
  imports: [
    MatTabGroup,
    MatTab,
    NgTemplateOutlet,
    ResultLineComponent,
    DatasetsSharedModule,
    MatTabLabel,
    GlobalSearchFilterContainerComponent,
    RouterLink,
    ShortProjectNamePipe,
    TimeAgoPipe,
    UpperCasePipe,
    CleanProjectPathPipe,
    ProjectLocationPipe,
    MatSidenavModule,
    MatIconButton,
    MatIconModule,
    PushPipe,
    MatButton,
    MatProgressSpinner,
    TooltipDirective,
  ],
})
export class SearchResultsTableComponent {
  private breakpointObserver = inject(BreakpointObserver)
  private route = inject(ActivatedRoute);

  protected readonly SEARCH_PAGE_SIZE = SEARCH_PAGE_SIZE;
  protected readonly EXPERIMENTS_STATUS_LABELS = EXPERIMENTS_STATUS_LABELS;
  protected readonly featuresEnum = FeaturesEnum;
  protected readonly searchPages = activeSearchLink;
  protected viewAllQueryParams: Params;

  loading = input.required<boolean>()
  links = input.required<typeof activeLinksList>();
  userId = input.required<string>();
  projectsList = input<Project[]>([]);
  filters = input<Record<string, FilterMetadata>>();
  datasetsList = input<Project[]>([]);
  openDatasetVersionsList = input<Task[]>([]);
  tasksList = input<Task[]>([]);
  modelsList = input<Model[]>([]);
  pipelinesList = input<Project[]>([]);
  pipelineRunsList = input<Task[]>([]);
  reportsList = input<IReport[]>([]);
  activeLink = input<ActiveSearchLink>();
  activeLinkConfiguration = computed(() =>
    Object.values(this.links()[this.activeIndex()].relevantSearchItems));
  resultsCount = input<Map<ActiveSearchLink, number>>();

  projectSelected = output<Project>();
  viewAllResults = output<ActiveSearchLink>();
  activeLinkChanged = output<string>();
  openDatasetSelected = output<Project>();
  experimentSelected = output<ITask>();
  openDatasetVersionSelected = output<ITask>();
  modelSelected = output<SelectedModel>();
  reportSelected = output<IReport>();
  pipelineSelected = output<Project>();
  pipelineRunSelected = output<ITask>();
  loadMoreClicked = output();
  closeDialog = output();

  private listElement = viewChild<ElementRef<HTMLDivElement>>('list')

  protected smallScreen$ = this.breakpointObserver.observe('(max-width: 900px)');
  protected qParams = toSignal(this.route.queryParams);
  protected showFilter = signal<boolean>(true);
  // protected loading = computed<boolean>(() => [null, undefined].includes(this.resultsCount()?.[this.activeLink()]));
  protected getAllResults = computed(() => Object.keys(this.links()[this.activeIndex()].relevantSearchItems)
    .map((key) => {
      return this[`${key}List`]();
    }));
  protected noData = computed(() => this.getAllResults().flat().length === 0);
  protected filterActivated = computed(() => {
    return Object.keys(this.filters()).length > 0;
  });
  activeIndex = computed<number>(() => this.links().findIndex(item => item.name === this.activeLink()));

  constructor() {
    effect(() => {
      this.viewAllQueryParams = convertToViewAllFilter(this.qParams(), this.activeLink(), this.userId());
    });
  }

  loadMore() {
    this.loadMoreClicked.emit()
  }

  trackByCategory(index: number, itemsList: any[]): string {
    // Assuming activeLinkConfiguration provides a stable, unique property like 'name' or 'title'
    return this.activeLinkConfiguration()[index]?.name;
  }

  tabChanged(index: number) {
    this.activeLinkChanged.emit(this.links()[index].name);
    this.listElement().nativeElement.scrollTop = 0;
  }
}
