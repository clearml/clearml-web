import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {combineLatest} from 'rxjs';
import {Store} from '@ngrx/store';
import {ActivatedRoute, Router} from '@angular/router';
import {selectCurrentUser, selectShowOnlyUserWork} from '@common/core/reducers/users-reducer';
import {debounceTime, filter, take} from 'rxjs/operators';
import {setDeep} from '@common/core/actions/projects.actions';
import {getRecentExperiments, getRecentProjects, getRecentReports} from '@common/dashboard/common-dashboard.actions';
import {selectFirstLogin} from '@common/core/reducers/view.reducer';
import {MatDialog} from '@angular/material/dialog';
import {WelcomeMessageComponent} from '@common/layout/welcome-message/welcome-message.component';
import {firstLogin} from '@common/core/actions/layout.actions';
import {selectRecentTasks} from '@common/dashboard/common-dashboard.reducer';
import {initSearch} from '@common/common-search/common-search.actions';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {selectActiveSearch} from '@common/common-search/common-search.reducer';
import {CommonDashboardModule} from '@common/dashboard/common-dashboard.module';
import {DashboardReportsComponent} from '@common/dashboard/containers/dashboard-reports/dashboard-reports.component';
import {MatButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {DashboardProjectsComponent} from '@common/dashboard/containers/dashboard-projects/dashboard-projects.component';
import {DashboardExperimentsComponent} from '@common/dashboard/containers/dashboard-experiments/dashboard-experiments.component';


@Component({
  selector: 'sm-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonDashboardModule,
    DashboardReportsComponent,
    MatButton,
    MatIconModule,
    DashboardProjectsComponent,
    DashboardExperimentsComponent
  ]
})
export class DashboardComponent {
  private store = inject(Store);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  protected recentTasks = this.store.selectSignal(selectRecentTasks);
  protected width = signal(0);

  constructor() {
    this.store.dispatch(setDeep({deep: false}));
    this.store.dispatch(initSearch({payload: 'Search for all'}));

    this.store.select(selectActiveSearch)
      .pipe(
        takeUntilDestroyed(),
        filter(active => active)
      )
      .subscribe(() => this.router.navigate(['search'], {relativeTo: this.activatedRoute, queryParamsHandling: 'preserve'}));

   combineLatest([
     this.store.select(selectShowOnlyUserWork),
     this.store.select(selectCurrentUser)
   ])
     .pipe(
       takeUntilDestroyed(),
       debounceTime(100),
       filter(([, user]) => !!user),
     )
     .subscribe(() => {
       this.store.dispatch(getRecentProjects());
       this.store.dispatch(getRecentExperiments());
       this.store.dispatch(getRecentReports());
     });

    this.store.select(selectFirstLogin)
      .pipe(
        takeUntilDestroyed(),
        filter(first => !!first),
        take(1)
      )
      .subscribe(() => {
        this.showWelcome();
      });
  }

  public redirectToWorkers() {
    this.router.navigateByUrl('/workers-and-queues');
  }

  private showWelcome() {
    this.dialog.open(WelcomeMessageComponent).afterClosed()
      .subscribe(() => this.store.dispatch(firstLogin({first: false})));
  }
}
