import {Component, inject} from '@angular/core';
import {setFilterByUser} from '@common/core/actions/users.actions';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {selectShowOnlyUserWork} from '@common/core/reducers/users-reducer';
import {selectProjectType} from '@common/core/reducers/view.reducer';
import {PushPipe} from '@ngrx/component';
import {
  ShowOnlyUserWorkMenuComponent
} from '@common/shared/components/show-only-user-work/show-only-user-work-menu/show-only-user-work-menu.component';
import {Router} from '@angular/router';
import {debounceTime, filter, map} from 'rxjs/operators';
import {selectRouterQueryParams} from '@common/core/reducers/router-reducer';
import {decodeFilter} from '@common/shared/utils/tableParamEncode';
import {concatLatestFrom} from '@ngrx/operators';
import {selectActiveSearch} from '@common/dashboard-search/dashboard-search.reducer';

@Component({
  selector: 'sm-show-only-user-work',
  templateUrl: './show-only-user-work.component.html',
  styleUrls: ['./show-only-user-work.component.scss'],
  imports: [
    PushPipe,
    ShowOnlyUserWorkMenuComponent
  ]
})
export class ShowOnlyUserWorkComponent {
  private router = inject(Router);


  protected qParams$ = this.store.select(selectRouterQueryParams);

  public showOnlyUserWork$: Observable<boolean>;
  currentFeature$ = this.store.selectSignal(selectProjectType);

  constructor(private store: Store) {
    this.qParams$.pipe(
      filter((params)=> !!params?.filter),
      debounceTime(100),
      concatLatestFrom(() => [this.store.select(selectActiveSearch)]),
      filter(([, activeSearch]) => !activeSearch),
      map(([params,])=> params),
    ).subscribe(params => {
      const filters= decodeFilter(params.filter);
      const myWorkFilter= filters.find(filter => filter.col==='myWork')
      if (myWorkFilter) {
        this.router.navigate([], {queryParams: {filter: undefined}, queryParamsHandling: 'merge', replaceUrl: true});
        this.store.dispatch(setFilterByUser({showOnlyUserWork: myWorkFilter.value.includes('true'), feature: this.currentFeature$()}));
      }
    });
    this.showOnlyUserWork$ = this.store.select(selectShowOnlyUserWork);
  }

  userFilterChanged(userFiltered: boolean) {
    this.store.dispatch(setFilterByUser({showOnlyUserWork: userFiltered, feature: this.currentFeature$()}));
  }

}
