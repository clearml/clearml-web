import {debounceTime, distinctUntilChanged, distinctUntilKeyChanged, filter} from 'rxjs/operators';
import {
  clearSearchFilters,
  clearSearchResults,
  currentPageLoadMoreResults,
  getCurrentPageResults,
  searchClear,
  searchStart
} from '../dashboard-search/dashboard-search.actions';
import {IRecentTask} from './common-dashboard.reducer';
import {ITask} from '~/business-logic/model/al-task';
import {Observable} from 'rxjs';
import {Store} from '@ngrx/store';
import {
  selectDatasetsResults,
  selectExperimentsResults,
  selectModelsResults,
  selectPipelinesResults,
  selectProjectsResults,
  selectReportsResults,
  selectResultsCount,
  selectSearchScrollIds,
  selectSearchTableFilters,
  selectSearchTerm
} from '../dashboard-search/dashboard-search.reducer';
import {Project} from '~/business-logic/model/projects/project';
import {setSelectedProjectId} from '../core/actions/projects.actions';
import {isExample} from '../shared/utils/shared-utils';
import {activeLinksList, activeSearchLink, ActiveSearchLink} from '~/features/dashboard-search/dashboard-search.consts';
import {Component, inject, OnDestroy, OnInit, output, signal} from '@angular/core';
import {ActivatedRoute, ActivatedRouteSnapshot, Router} from '@angular/router';
import {IReport} from '@common/reports/reports.consts';
import {selectCurrentUser} from '@common/core/reducers/users-reducer';
import {isEqual} from 'lodash-es';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {SelectedModel} from '@common/models/shared/models.model';

@Component({
  selector: 'sm-dashboard-search-base',
  template: '',
  standalone: false
})
export abstract class DashboardSearchBaseComponent implements OnInit, OnDestroy {
  protected store = inject(Store);
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  readonly navigationOptions: {
    replaceUrl: true,
    queryParamsHandling: 'merge',
    queryParams: {
      gq: undefined,
      gqreg: undefined,
      tab: undefined
    }
  };

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
  protected pipelinesResults$ = this.store.select(selectPipelinesResults);
  protected openDatasetsResults$ = this.store.select(selectDatasetsResults);
  protected projectsResults$ = this.store.select(selectProjectsResults);
  protected experimentsResults$ = this.store.select(selectExperimentsResults);
  protected searchTerm$ = this.store.select(selectSearchTerm);
  protected searchTerm = this.store.selectSignal(selectSearchTerm);
  protected resultsCount$ = this.store.select(selectResultsCount);
  protected gsFilter = this.store.selectSignal(selectSearchTableFilters);
  protected currentUser = this.store.selectSignal(selectCurrentUser);
  protected activeLink = signal<ActiveSearchLink>('projects');
  private scrollIds = this.store.selectSignal(selectSearchScrollIds);
  searchStarted: boolean;
  private firstSearch = true;


  constructor() {
    this.syncAppSearch();

    this.resultsCount$
      .pipe(
        takeUntilDestroyed(),
        filter(resultsCount => !!resultsCount),
        distinctUntilChanged()
      )
      .subscribe((resultsCount) => {
        this.setFirstActiveLink(resultsCount);
      });

    this.route.queryParams
      .pipe(
        takeUntilDestroyed(),
        distinctUntilKeyChanged('tab')
      )
      .subscribe(params => {
        if (params.tab && activeLinksList.find(link => link.name === params.tab)) {
          this.activeLink.set(params.tab);
          window.setTimeout(() => this.activeLinkChanged(this.activeLink()));
        }
      });
  }

  public ngOnInit(): void {
    const autoSearchTab = this.route.snapshot.queryParams.tab || this.findAutoSearchTabData(this.route.snapshot) || 'projects';
    const gsfilter = this.route.snapshot.queryParams.gsfilter || 'myWork:false';
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
    this.searchTerm$
      .pipe(
        takeUntilDestroyed(),
        distinctUntilChanged((pre, next) => (isEqual(pre, next))),
        debounceTime(400))
      .subscribe(query => this.searchTermChanged(query?.query, query?.regExp));
  }

  public modelSelected(model: SelectedModel) {
    const projectId = model.project?.id ? model.project.id : '*';
    this.router.navigateByUrl('projects/' + projectId + '/models/' + model.id, this.navigationOptions);
    this.itemSelected.emit();
  }

  public searchTermChanged(term: string, regExp?: boolean) {
    this.searchStarted = true;
    if (term && term.length > 0) {
      this.store.dispatch(clearSearchResults({}));
      this.store.dispatch(searchStart({query: term, regExp}));
    } else {
      this.store.dispatch(clearSearchResults({}));
    }
  }

  public projectCardClicked(project: Project) {
    this.router.navigateByUrl(`projects/${project.id}`, this.navigationOptions);
    this.store.dispatch(setSelectedProjectId({projectId: project.id, example: isExample(project)}));
    this.itemSelected.emit();

  }

  pipelineSelected(project: Project) {
    this.router.navigateByUrl(`pipelines/${project.id}/tasks`, this.navigationOptions);
    this.store.dispatch(setSelectedProjectId({projectId: project.id, example: isExample(project)}));
    this.itemSelected.emit();
  }

  pipelineRunSelected(pipelineRun: ITask) {
    this.router.navigateByUrl(`pipelines/${pipelineRun.project.id || '*'}/tasks/` + pipelineRun.id, this.navigationOptions);
    this.store.dispatch(setSelectedProjectId({
      projectId: pipelineRun.project.id || '*',
      example: isExample(pipelineRun)
    }));
    this.itemSelected.emit();
  }

  reportSelected(report: IReport) {
    this.router.navigate(['reports', report.project.id, report.id]);
    this.itemSelected.emit();
  }

  public openDatasetCardClicked(project: Project) {
    this.router.navigateByUrl(`datasets/simple/${project.id}/tasks`, this.navigationOptions);
    this.store.dispatch(setSelectedProjectId({projectId: project.id, example: isExample(project)}));
    this.itemSelected.emit();
  }

  public taskSelected(task: IRecentTask | ITask) {
    const projectId = task.project ? task.project.id : '*';
    this.router.navigateByUrl('projects/' + projectId + '/tasks/' + task.id, this.navigationOptions);
    this.itemSelected.emit();
  }

  public openDatasetVersionSelected(task: IRecentTask | ITask) {
    const projectId = task.project ? task.project.id : '*';
    this.router.navigateByUrl('datasets/simple/' + projectId + '/tasks/' + task.id, this.navigationOptions);
    this.itemSelected.emit();
  }


  public activeLinkChanged(activeLink: ActiveSearchLink) {
    if (this.searchStarted === false && !this.scrollIds()?.[activeLink]) {
      this.store.dispatch(clearSearchResults({dontClearCount: true}));
      this.store.dispatch(getCurrentPageResults({activeLink}));
    }

  }

  setFirstActiveLink(resultsCount) {
    this.router.navigate([], {queryParams: {tab: this.activeLink()}, queryParamsHandling: 'merge', replaceUrl: true});
    if (resultsCount[this.activeLink()] > 0) {
      this.store.dispatch(getCurrentPageResults({activeLink: this.activeLink()}));
    } else {
      const firstTabIndex = activeLinksList.findIndex(activeLink => resultsCount[activeLink.name] > 0);
      if (firstTabIndex > -1 && this.firstSearch) {
        this.router.navigate([], {
          queryParams: {tab: activeLinksList[firstTabIndex].name},
          queryParamsHandling: 'merge'
        });
      } else if (firstTabIndex === -1) {
        this.store.dispatch(clearSearchResults({}));
      }
    }
    this.searchStarted = false;
    this.firstSearch = false;
  }

  loadMore() {
    this.store.dispatch(currentPageLoadMoreResults({activeLink: this.activeLink()}));
  }

  changeActiveLink(tab: string) {
    this.router.navigate([], {queryParams: {tab, gsfilter: 'myWork:false'}, queryParamsHandling: 'merge'});
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
        filter: this.gsFilter()
      }
    };
  }
}
