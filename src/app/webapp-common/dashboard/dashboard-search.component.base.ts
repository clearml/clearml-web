import {debounceTime, distinctUntilChanged, distinctUntilKeyChanged, filter} from 'rxjs/operators';
import {Model} from '~/business-logic/model/models/model';
import {
  clearSearchResults,
  getCurrentPageResults,
  searchClear,
  searchStart
} from '../dashboard-search/dashboard-search.actions';
import {IRecentTask} from './common-dashboard.reducer';
import {ITask} from '~/business-logic/model/al-task';
import {combineLatest, Subscription} from 'rxjs';
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
  selectSearchTerm
} from '../dashboard-search/dashboard-search.reducer';
import {Project} from '~/business-logic/model/projects/project';
import {setSelectedProjectId} from '../core/actions/projects.actions';
import {isExample} from '../shared/utils/shared-utils';
import {activeLinksList, ActiveSearchLink} from '~/features/dashboard-search/dashboard-search.consts';
import {ChangeDetectorRef, Component, inject, OnDestroy, OnInit, output} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {IReport} from '@common/reports/reports.consts';
import {selectShowOnlyUserWork} from '@common/core/reducers/users-reducer';
import {isEqual} from 'lodash-es';

@Component({
    selector: 'sm-dashboard-search-base',
    template: '',
    standalone: false
})
export abstract class DashboardSearchBaseComponent implements OnInit, OnDestroy{
  protected store = inject(Store);
  protected router = inject(Router);
  protected route = inject(ActivatedRoute);
  protected cdr = inject(ChangeDetectorRef);
  readonly navigationOptions: {
    replaceUrl: true,
    queryParamsHandling: 'merge',
    queryParams: {
      gq: undefined,
      gqreg: undefined,
      tab: undefined
    }}

  protected modelsResults$      = this.store.select(selectModelsResults);
  protected reportsResults$      = this.store.select(selectReportsResults);
  protected pipelinesResults$   = this.store.select(selectPipelinesResults);
  protected datasetsResults$   = this.store.select(selectDatasetsResults);
  protected projectsResults$    = this.store.select(selectProjectsResults);
  protected experimentsResults$ = this.store.select(selectExperimentsResults);
  protected searchTerm$         = this.store.select(selectSearchTerm);
  protected resultsCount$ = this.store.select(selectResultsCount);
  public activeLink = 'projects' as ActiveSearchLink;
  private scrollIds: Map<ActiveSearchLink, string>;
  private subs = new Subscription();
  itemSelected = output();
  searchStarted: boolean;
  private firstSearch= true;


  constructor() {
    this.syncAppSearch();
  }

  public ngOnInit(): void {
    this.subs.add(this.resultsCount$.pipe(
      filter(resultsCount => !!resultsCount),
      distinctUntilChanged()
    ).subscribe((resultsCount) => {
      this.setFirstActiveLink(resultsCount)}));

    this.subs.add(this.route.queryParams.pipe(distinctUntilKeyChanged('tab'))
      .subscribe(params => {
      if (params.tab && activeLinksList.find( link => link.name === params.tab)) {
        this.activeLink = params.tab;
        window.setTimeout(() => this.activeLinkChanged(this.activeLink));
        this.cdr.markForCheck();
      }
    }));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.store.dispatch(searchClear());
  }


  syncAppSearch() {
    this.subs.add( combineLatest([
      this.searchTerm$,
      this.store.select(selectShowOnlyUserWork),
    ]).pipe(
      distinctUntilChanged((pre, next)=> (isEqual(pre[0], next[0]) && pre[1]===next[1])),
      debounceTime(400))
      .subscribe(([query]) => {
        this.searchTermChanged(query?.query, query?.regExp)}));
    this.subs.add(this.store.select(selectSearchScrollIds).subscribe(scrollIds => this.scrollIds = scrollIds));
  }

  public modelSelected(model: Model) {
    // TODO ADD task.id to route
    const projectId = model.project ? model.project : '*';
    this.router.navigateByUrl('projects/' + projectId + '/models/' + model.id, this.navigationOptions);
    this.itemSelected.emit()
  }

  public searchTermChanged(term: string, regExp?: boolean) {
    this.searchStarted = true;
    if (term && term.length > 0) {
      this.store.dispatch(clearSearchResults());
      this.store.dispatch(searchStart({query: term, regExp}));
    } else {
      this.store.dispatch(searchClear())
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

  reportSelected(report: IReport) {
    this.router.navigate(['reports',(report.project as any).id, report.id]);
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


  public activeLinkChanged(activeLink) {
    if (this.searchStarted===false && !this.scrollIds?.[activeLink]) {
      this.store.dispatch(getCurrentPageResults({activeLink}));
    }

  }

  setFirstActiveLink(resultsCount) {
    this.router.navigate([], {queryParams: {tab: this.activeLink}, queryParamsHandling: 'merge', replaceUrl: true})
    if (resultsCount[this.activeLink] > 0) {
      this.store.dispatch(getCurrentPageResults({activeLink: this.activeLink}));
    } else  {
      const firstTabIndex = activeLinksList.findIndex(activeLink => resultsCount[activeLink.name] > 0);
      if (firstTabIndex > -1 && this.firstSearch) {
        this.router.navigate([], {queryParams: {tab: activeLinksList[firstTabIndex].name}, queryParamsHandling: 'merge'})
      } else {
      this.store.dispatch(clearSearchResults());
    }}
    this.searchStarted = false;
    this.firstSearch = false;
  }

  loadMore() {
    this.store.dispatch(getCurrentPageResults({activeLink: this.activeLink}));
  }

  changeActiveLink(tab: string) {
    this.router.navigate([], {queryParams: {tab}, queryParamsHandling: 'merge'})
  }

}
