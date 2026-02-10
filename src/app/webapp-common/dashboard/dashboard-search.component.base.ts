import {debounceTime, distinctUntilChanged, distinctUntilKeyChanged} from 'rxjs/operators';
import {
  clearSearchFilters,
  clearSearchResults,
  currentPageLoadMoreResults,
  getCurrentPageResults,
  getEndpoints,
  searchClear,
  searchStart
} from '../dashboard-search/dashboard-search.actions';
import {IRecentTask} from './common-dashboard.reducer';
import {ITask} from '~/business-logic/model/al-task';
import {Store} from '@ngrx/store';
import {
  selectDatasetsResults,
  selectExperimentsResults,
  selectFilteredEndpointsResults,
  selectFilteredLoadingEndpointsResults,
  selectLoadMoreActive,
  selectModelsResults,
  selectPipelinesResults,
  selectProjectsResults,
  selectReportsResults,
  selectResultsCount,
  selectAdvancedSearch,
  selectSearchPages,
  selectSearchScrollIds,
  selectTabFilters,
  selectSearchTerm, selectFilters
} from '../dashboard-search/dashboard-search.reducer';
import {Project} from '~/business-logic/model/projects/project';
import {setSelectedProjectId} from '../core/actions/projects.actions';
import {isExample} from '../shared/utils/shared-utils';
import {activeLinksList, ActiveSearchLink} from '~/features/dashboard-search/dashboard-search.consts';
import {Component, computed, inject, OnDestroy, OnInit, output, signal} from '@angular/core';
import {ActivatedRoute, ActivatedRouteSnapshot, Router} from '@angular/router';
import {IReport} from '@common/reports/reports.consts';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {isEqual} from 'lodash-es';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {SelectedModel} from '@common/models/shared/models.model';
import {convertToViewAllFilter} from '@common/dashboard-search/dashboard-search.consts';
import {setFilterByUser} from '@common/core/actions/users.actions';
import {explicitEffect} from 'ngxtension/explicit-effect';
import {encodeFilters} from '@common/shared/utils/tableParamEncode';

@Component({
  selector: 'sm-dashboard-search-base',
  template: '',
})
export abstract class DashboardSearchBaseComponent implements OnInit, OnDestroy {
  protected store = inject(Store);
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  protected qParams = toSignal(this.route.queryParams);

  itemSelected = output();

  private findAutoSearchTabData(route: ActivatedRouteSnapshot): string | undefined {
    let autoSearchTab: string;
    let currentRoute: ActivatedRouteSnapshot | null = route;
    while (currentRoute) {
      const tabData = currentRoute.data?.['autoSearchTab'];
      if (tabData) {
        autoSearchTab = tabData;
      }
      currentRoute = currentRoute.firstChild;
    }
    return autoSearchTab;
  }

  protected modelsResults$ = this.store.select(selectModelsResults);
  protected reportsResults$ = this.store.select(selectReportsResults);
  protected endpointsResults$ = this.store.select(selectFilteredEndpointsResults);
  protected loadingEndpointsResults$ = this.store.select(selectFilteredLoadingEndpointsResults);
  protected loadMoreActive = this.store.selectSignal(selectLoadMoreActive);
  protected pages = this.store.selectSignal(selectSearchPages);
  protected isAdvancedSearch = this.store.selectSignal(selectAdvancedSearch);
  protected filters = this.store.selectSignal(selectTabFilters);
  protected allFilters = this.store.selectSignal(selectFilters);
  protected pipelinesResults$ = this.store.select(selectPipelinesResults);
  protected openDatasetsResults$ = this.store.select(selectDatasetsResults);
  protected projectsResults$ = this.store.select(selectProjectsResults);
  protected experimentsResults$ = this.store.select(selectExperimentsResults);
  protected searchTerm$ = this.store.select(selectSearchTerm);
  protected searchTerm = this.store.selectSignal(selectSearchTerm);
  protected resultsCount = this.store.selectSignal(selectResultsCount);
  protected currentUser = this.store.selectSignal(selectCurrentUser);
  protected activeLink = signal<ActiveSearchLink>(null);
  private scrollIds = this.store.selectSignal(selectSearchScrollIds);
  protected $navigationOptions = computed(() => {
    return ({
      replaceUrl: false,
      queryParamsHandling: 'replace',
      queryParams: {
        gq: undefined,
        gqreg: undefined,
        tab: undefined,
        gsfilter: undefined,
        advanced: undefined,
        filter: convertToViewAllFilter(this.qParams(), this.activeLink(), this.currentUser()?.id)?.filter
      }
    } as const);
  });
  searchStarted: boolean;

  public setUserFilterIfNeeded(feature) {
    this.store.dispatch(setFilterByUser({showOnlyUserWork: false, feature}));
  }


  constructor() {
    this.syncAppSearch();

    explicitEffect([this.resultsCount], ([resultsCount]) => {
      if (resultsCount) {
        this.searchStarted = false;
        this.store.dispatch(getCurrentPageResults({activeLink: this.activeLink()}));
      }
    });

    this.route.queryParams
      .pipe(
        takeUntilDestroyed(),
        distinctUntilKeyChanged('tab')
      )
      .subscribe(params => {
        if (params.tab && activeLinksList.find(link => link.name === params.tab)) {
          const preActiveLink = this.activeLink();
          this.activeLink.set(params.tab);
          if(preActiveLink){
            window.setTimeout(() => this.activeLinkChanged(this.activeLink()));
          }
        }
      });
  }

  public ngOnInit(): void {
    const autoSearchTab = this.route.snapshot.queryParams.tab || this.findAutoSearchTabData(this.route.snapshot) || 'projects';
    const gsfilter = this.route.snapshot.queryParams.gsfilter || undefined;
    this.router.navigate([], {
      queryParams: {
        tab: autoSearchTab,
        gsfilter
      },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  ngOnDestroy(): void {
    this.store.dispatch(searchClear());
    this.store.dispatch(clearSearchFilters());
  }


  syncAppSearch() {
    this.store.dispatch(getEndpoints());
    this.searchTerm$
      .pipe(
        takeUntilDestroyed(),
        distinctUntilChanged((pre, next) => (isEqual(pre, next))),
        debounceTime(400))
      .subscribe(query => this.searchTermChanged(query?.query, query?.regExp));
  }

  public modelSelected(model: SelectedModel) {
    this.setUserFilterIfNeeded('projects');
    this.router.navigate(['projects', '*', 'models', model.id], this.$navigationOptions());
    this.itemSelected.emit();
  }

  public searchTermChanged(term: string, regExp?: boolean) {
    this.searchStarted = true;
    this.store.dispatch(searchStart({query: term, regExp}));
  }

  public projectCardClicked(project: Project) {
    this.setUserFilterIfNeeded('projects');
    this.store.dispatch(setFilterByUser({showOnlyUserWork: false, feature: 'projects'}));
    this.router.navigate(['projects', project.id, 'projects'], this.$navigationOptions());
    this.store.dispatch(setSelectedProjectId({projectId: project.id, example: isExample(project)}));
    this.itemSelected.emit();
  }

  pipelineSelected(project: Project) {
    this.setUserFilterIfNeeded('pipelines');
    this.router.navigate(['pipelines', project.id, 'tasks'], this.$navigationOptions());
    this.store.dispatch(setSelectedProjectId({projectId: project.id, example: isExample(project)}));
    this.itemSelected.emit();
  }

  pipelineRunSelected(pipelineRun: ITask) {
    this.setUserFilterIfNeeded('pipelines');
    this.router.navigate(['pipelines', '*', 'tasks', pipelineRun.id], this.$navigationOptions());
    this.store.dispatch(setSelectedProjectId({
      projectId: '*',
      example: isExample(pipelineRun)
    }));
    this.itemSelected.emit();
  }

  reportSelected(report: IReport) {
    this.setUserFilterIfNeeded('reports');
    this.router.navigate(['reports', '*', report.id]);
    this.itemSelected.emit();
  }

  public openDatasetCardClicked(project: Project) {
    this.setUserFilterIfNeeded('datasets');
    this.router.navigate(['datasets', 'simple', project.id, 'tasks'], this.$navigationOptions());
    this.store.dispatch(setSelectedProjectId({projectId: project.id, example: isExample(project)}));
    this.itemSelected.emit();
  }

  public taskSelected(task: IRecentTask | ITask) {
    this.setUserFilterIfNeeded('projects');
    this.router.navigate(['projects', '*', 'tasks', task.id], this.$navigationOptions());
    this.itemSelected.emit();
  }

  public openDatasetVersionSelected(task: IRecentTask | ITask) {
    this.setUserFilterIfNeeded('datasets');
    this.router.navigate(['datasets', 'simple', '*', 'tasks', task.id], this.$navigationOptions());
    this.itemSelected.emit();
  }

  public activeLinkChanged(activeLink: ActiveSearchLink) {
    if (!this.searchStarted && !this.scrollIds()?.[activeLink]) {
      this.store.dispatch(clearSearchResults());
      this.store.dispatch(getCurrentPageResults({activeLink}));
    }
  }

  loadMore(name: ActiveSearchLink) {
    this.store.dispatch(currentPageLoadMoreResults({activeLink: name}));
  }

  changeActiveLink(tab: string) {
    this.router.navigate([], {
      queryParams: {
        tab,
      ...(!this.isAdvancedSearch() && {gsfilter: encodeFilters(this.allFilters()[tab])})
      },
      queryParamsHandling: 'merge'
    });
  }

  closeDialog() {
    this.itemSelected.emit();
  }

  private viewAllNavigationOptions() {
    return {
      replaceUrl: true,
      queryParamsHandling: 'merge',
      queryParams: {
        gq: undefined,
        gqreg: undefined,
        gsfilter: undefined,
        tab: undefined,
        filter: this.filters()
      }
    } as const;
  }
}
