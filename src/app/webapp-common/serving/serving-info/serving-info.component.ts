import {ChangeDetectionStrategy, Component, inject, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router, RouterOutlet} from '@angular/router';
import {Store} from '@ngrx/store';
import {setBreadcrumbsOptions} from '@common/core/actions/projects.actions';
import {servingFeature} from '@common/serving/serving.reducer';
import {ServingActions} from '@common/serving/serving.actions';
import {Link} from '~/features/experiments/experiments.consts';
import {RouterTabNavBarComponent} from '@common/shared/components/router-tab-nav-bar/router-tab-nav-bar.component';
import {MatIconButton} from '@angular/material/button';
import {PushPipe} from '@ngrx/component';
import {MatIconModule} from '@angular/material/icon';


@Component({
  selector: 'sm-serving-info',
  templateUrl: './serving-info.component.html',
  styleUrls: ['./serving-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterTabNavBarComponent,
    MatIconModule,
    MatIconButton,
    PushPipe
  ]
})
export class ServingInfoComponent implements OnDestroy {
  private router = inject(Router);
  private store = inject(Store);
  private route = inject(ActivatedRoute);

  public minimized: boolean;

  protected splitSize$ = this.store.select(servingFeature.selectSplitSize);
  links = [
    {name: 'details', url: ['general']},
    {name: 'monitor', url: ['monitor']}
  ] as Link[];

  constructor( ) {
    this.setupBreadcrumbsOptions();
  }

  ngOnDestroy(): void {
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
    return this.router.navigate(['..'], {relativeTo: this.route, queryParamsHandling: 'merge'});
  }
}

