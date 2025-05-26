import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {Subscription, combineLatest} from 'rxjs';
import {Store} from '@ngrx/store';
import {ActivatedRoute, Router} from '@angular/router';
import {selectCurrentUser, selectShowOnlyUserWork} from '@common/core/reducers/users-reducer';
import {debounceTime, filter, take} from 'rxjs/operators';
import {setDeep} from '@common/core/actions/projects.actions';
import {getRecentProjects, getRecentExperiments, getRecentReports} from '@common/dashboard/common-dashboard.actions';
import {selectFirstLogin} from '@common/core/reducers/view.reducer';
import {MatDialog} from '@angular/material/dialog';
import {WelcomeMessageComponent} from '@common/layout/welcome-message/welcome-message.component';
import {firstLogin} from '@common/core/actions/layout.actions';
import {selectRecentTasks} from '@common/dashboard/common-dashboard.reducer';
import {initSearch} from '@common/common-search/common-search.actions';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {selectActiveSearch} from '@common/common-search/common-search.reducer';


@Component({
    selector: 'sm-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    standalone: false
})
export class DashboardComponent implements OnInit, OnDestroy {
  private store = inject(Store);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  public recentTasks$ = this.store.select(selectRecentTasks);
  public width: number;
  private welcomeSub: Subscription;

  constructor() {
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
       debounceTime(100),
       takeUntilDestroyed(),
       filter(([, user]) => !!user),
     )
     .subscribe(() => {
       this.store.dispatch(getRecentProjects());
       this.store.dispatch(getRecentExperiments());
       this.store.dispatch(getRecentReports());
     });

    this.welcomeSub = this.store.select(selectFirstLogin)
      .pipe(
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

  public ngOnInit(): void {
    this.store.dispatch(setDeep({deep: false}));
  }

  ngOnDestroy(): void {
    this.welcomeSub?.unsubscribe();
  }

  private showWelcome() {
    this.dialog.open(WelcomeMessageComponent).afterClosed()
      .subscribe(() => this.store.dispatch(firstLogin({first: false})));
  }

  setWidth(width: number) {
    this.width = width;
  }
}
