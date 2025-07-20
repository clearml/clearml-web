import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {setFilterByUser} from '@common/core/actions/users.actions';
import {Store} from '@ngrx/store';
import {setMainPageTagsFilter, setMainPageTagsFilterMatchMode} from '@common/core/actions/projects.actions';
import {selectMainPageTagsFilter, selectMainPageTagsFilterMatchMode,} from '@common/core/reducers/projects.reducer';
import {sortByArr} from '../../pipes/show-selected-first.pipe';
import {cleanTag} from '@common/shared/utils/helpers.util';
import {MatMenuModule} from '@angular/material/menu';
import {MatInputModule} from '@angular/material/input';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {
  CheckboxThreeStateListComponent
} from '@common/shared/ui-components/panel/checkbox-three-state-list/checkbox-three-state-list.component';
import {FilterPipe} from '@common/shared/pipes/filter.pipe';
import {FormsModule} from '@angular/forms';
import {selectShowOnlyUserWork} from '@common/core/reducers/users-reducer';
import {selectProjectType} from '@common/core/reducers/view.reducer';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {debounceTime, distinctUntilChanged, filter, map} from 'rxjs/operators';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {isEqual} from 'lodash-es';
import {selectRouterQueryParams} from '@common/core/reducers/router-reducer';
import {decodeFilter, encodeFilters} from '@common/shared/utils/tableParamEncode';
import {concatLatestFrom} from '@ngrx/operators';
import {selectActiveSearch} from '@common/dashboard-search/dashboard-search.reducer';
import {setURLParams} from '@common/core/actions/router.actions';

@Component({
  selector: 'sm-main-pages-header-filter',
  templateUrl: './main-pages-header-filter.component.html',
  styleUrls: ['./main-pages-header-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatMenuModule,
    MatInputModule,
    ClickStopPropagationDirective,
    CheckboxThreeStateListComponent,
    FilterPipe,
    FormsModule,
    MatIconButton,
    MatIcon,
    MatButton
  ]
})
export class MainPagesHeaderFilterComponent {
  private store = inject(Store);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  public searchTerm: string;
  systemTags: string[];
  protected qParams$ = this.store.select(selectRouterQueryParams);
  currentFeature$ = this.store.selectSignal(selectProjectType);

  constructor() {
    this.qParams$.pipe(
      filter((params) => !!params?.filter),
      debounceTime(100),
      concatLatestFrom(() => [this.store.select(selectActiveSearch)]),
      filter(([, activeSearch]) => !activeSearch),
      map(([params,])=> params)
    ).subscribe((params) => {
      const filters = params.filter ? decodeFilter(params.filter) : [];
      const myWorkFilter = filters.find(filter => filter.col === 'myWork');
      if (myWorkFilter) {
        this.router.navigate([], {queryParams: {filter: undefined}, queryParamsHandling: 'merge', replaceUrl: true});
        this.store.dispatch(setFilterByUser({showOnlyUserWork: myWorkFilter.value.includes('true'), feature: this.currentFeature$()}));
      }
      const tagsFilter = filters.find(filter => filter.col === 'tags');
      if (tagsFilter) {
        this.store.dispatch(setMainPageTagsFilter({tags: tagsFilter.value, feature: this.currentFeature()}));
      }
    });
  }


  allTags = input<string[]>();
  protected tagsLabelValue = computed(() => {
    const cleanTags = this.tagsFilters()?.map(tag => cleanTag(tag));
    return this.allTags()
      ?.map(tag => ({label: tag, value: tag}))
      .sort((a, b) =>
        sortByArr(a.value, b.value, [...(cleanTags || [])])
      );
  });

  protected showOnlyUserWork = this.store.selectSignal(selectShowOnlyUserWork);
  protected matchMode = this.store.selectSignal(selectMainPageTagsFilterMatchMode);
  protected tagsFilters = this.store.selectSignal(
    selectMainPageTagsFilter);
  protected currentFeature = this.store.selectSignal(selectProjectType);

  switchUserFocus() {
    this.store.dispatch(setFilterByUser({showOnlyUserWork: !this.showOnlyUserWork(), feature: this.currentFeature()}));
  }

  setSearchTerm($event) {
    this.searchTerm = $event.target.value;
  }

  closeMenu() {
    this.searchTerm = '';
  }

  clearSearch() {
    this.searchTerm = '';
    this.setSearchTerm({target: {value: ''}});
  }

  toggleMatch() {
    this.store.dispatch(setMainPageTagsFilterMatchMode({
      matchMode: !this.matchMode() ? 'AND' : undefined,
      feature: this.currentFeature()
    }));
  }

  emitFilterChangedCheckBox(tags: string[]) {
    this.store.dispatch(setMainPageTagsFilter({tags, feature: this.currentFeature()}));
  }

  clearAll() {
    this.store.dispatch(setMainPageTagsFilterMatchMode({matchMode: undefined, feature: this.currentFeature()}));
    this.store.dispatch(setMainPageTagsFilter({tags: [], feature: this.currentFeature()}));
    this.store.dispatch(setFilterByUser({showOnlyUserWork: false, feature: this.currentFeature()}));
  }
}
