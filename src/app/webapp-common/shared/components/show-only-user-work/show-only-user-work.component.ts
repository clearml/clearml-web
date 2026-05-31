import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {setFilterByUser} from '@common/core/actions/users.actions';
import {Store} from '@ngrx/store';
import {selectShowOnlyUserWork} from '@common/core/reducers/users-reducer';
import {selectProjectType} from '@common/core/reducers/view.reducer';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ShowOnlyUserWorkMenuComponent
  ]
})
export class ShowOnlyUserWorkComponent {
  private router = inject(Router);
  private store = inject(Store);

  protected showOnlyUserWork = this.store.selectSignal(selectShowOnlyUserWork);
  protected currentFeature = this.store.selectSignal(selectProjectType);

  constructor() {
    this.store.select(selectRouterQueryParams).pipe(
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
        this.store.dispatch(setFilterByUser({showOnlyUserWork: myWorkFilter.value.includes('true'), feature: this.currentFeature()}));
      }
    });
  }

  userFilterChanged(userFiltered: boolean) {
    this.store.dispatch(setFilterByUser({showOnlyUserWork: userFiltered, feature: this.currentFeature()}));
  }

}
