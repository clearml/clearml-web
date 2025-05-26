import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {Observable, Subscription} from 'rxjs';
import {filter} from 'rxjs/operators';
import {Link} from '@common/shared/components/router-tab-nav-bar/router-tab-nav-bar.component';
import {selectIsSharedAndNotOwner} from '~/features/experiments/reducers';
import {getCompanyTags, setBreadcrumbsOptions, setSelectedProject} from '@common/core/actions/projects.actions';
import {ALL_PROJECTS_OBJECT} from '@common/core/effects/projects.effects';
import {servingFeature} from '@common/serving/serving.reducer';
import {EndpointStats} from '~/business-logic/model/serving/endpointStats';
import {ServingActions} from '@common/serving/serving.actions';


@Component({
    selector: 'sm-serving-info',
    templateUrl: './serving-info.component.html',
    styleUrls: ['./serving-info.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ServingInfoComponent implements OnInit, OnDestroy {
  public minimized: boolean;

  public selectedModel: EndpointStats;
  private sub = new Subscription();
  public selectedModel$: Observable<EndpointStats | null>;
  public splitSize$: Observable<number>;
  links = [
    {name: 'details', url: ['general']},
    {name: 'monitor', url: ['monitor']}
  ] as Link[];
  public isSharedAndNotOwner$: Observable<boolean>;
  private modelsFeature: boolean;

  constructor(
    private router: Router,
    private store: Store,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.splitSize$ = this.store.select(servingFeature.selectSplitSize);
    this.isSharedAndNotOwner$ = this.store.select((selectIsSharedAndNotOwner));
    this.modelsFeature = this.route.snapshot.data?.setAllProject;
    if (this.modelsFeature) {
      this.store.dispatch(setSelectedProject({project: ALL_PROJECTS_OBJECT}));
      this.store.dispatch(getCompanyTags());
    }
    this.minimized = this.route.snapshot.firstChild?.data.minimized;
    if (!this.minimized) {
      this.setupBreadcrumbsOptions();
    }
  }

  ngOnInit() {
    this.sub.add(this.store.select(servingFeature.selectSelectedEndpoint)
      .subscribe(model => {
        this.selectedModel = model;
        this.cdr.detectChanges();
      })
    );

    this.selectedModel$ = this.store.select(servingFeature.selectSelectedEndpoint)
      .pipe(filter(endpoint => !!endpoint));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.store.dispatch(ServingActions.setSelectedServingEndpoint({endpoint: null}));
    this.store.dispatch(ServingActions.setTableViewMode({mode: 'table'}));
  }

  setupBreadcrumbsOptions() {
    this.store.dispatch(setBreadcrumbsOptions({
      breadcrumbOptions: {
        showProjects: false,
        featureBreadcrumb: {name: 'Model Endpoints'}
      }
    }));
  }

  closePanel() {
    this.router.navigate(['..'], {relativeTo: this.route, queryParamsHandling: 'merge'});
  }
}

