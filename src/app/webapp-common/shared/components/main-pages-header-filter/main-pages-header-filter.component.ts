import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';
import {setFilterByUser} from '@common/core/actions/users.actions';
import {Store} from '@ngrx/store';
import {
  getAllSystemProjects,
  setMainPageTagsFilter,
  setMainPageTagsFilterMatchMode,
  setMainPageUsersFilter
} from '@common/core/actions/projects.actions';
import {
  selectAllProjectsUsers,
  selectMainPageTagsFilter,
  selectMainPageTagsFilterMatchMode,
  selectMainPageUsersFilter
} from '@common/core/reducers/projects.reducer';
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
import {selectCurrentUser, selectShowOnlyUserWork} from '@common/core/reducers/users-reducer';
import {selectProjectType} from '@common/core/reducers/view.reducer';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {debounceTime, filter, map} from 'rxjs/operators';
import {selectRouterQueryParams} from '@common/core/reducers/router-reducer';
import {decodeFilter} from '@common/shared/utils/tableParamEncode';
import {concatLatestFrom} from '@ngrx/operators';
import {selectActiveSearch} from '@common/dashboard-search/dashboard-search.reducer';
import {
  TableFilterSortComponent
} from '@common/shared/ui-components/data/table/table-filter-sort/table-filter-sort.component';
import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {EXPERIMENTS_TABLE_COL_FIELDS} from '~/features/experiments/shared/experiments.const';
import {
  IOption
} from '@common/shared/ui-components/inputs/select-autocomplete-for-template-forms/select-autocomplete-for-template-forms.component';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

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
    MatIconModule,
    TableFilterSortComponent,
    MatButton
  ]
})
export class MainPagesHeaderFilterComponent {
  private store = inject(Store);
  public searchTerm: string;
  systemTags: string[];
  protected qParams$ = this.store.select(selectRouterQueryParams);
  currentFeature$ = this.store.selectSignal(selectProjectType);

  constructor() {
    this.qParams$.pipe(
      takeUntilDestroyed(),
      filter((params) => params?.filter !== undefined),
      debounceTime(100),
      concatLatestFrom(() => [this.store.select(selectActiveSearch)]),
      filter(([, activeSearch]) => !activeSearch),
      map(([params,]) => params)
    ).subscribe((params) => {
        const filters = params.filter ? decodeFilter(params.filter) : [];
        const myWorkFilter = filters.find(filter => filter.col === 'myWork');
        this.store.dispatch(setFilterByUser({
          showOnlyUserWork: myWorkFilter?.value.includes('true'),
          feature: this.currentFeature$()
        }));
        const tagsFilter = filters.find(filter => filter.col === 'tags');
        this.store.dispatch(setMainPageTagsFilter({tags: tagsFilter?.value ?? [], feature: this.currentFeature()}));
        const usersFilter = filters.find(filter => filter.col === 'users');
        this.store.dispatch(setMainPageUsersFilter({users: usersFilter?.value ?? [], feature: this.currentFeature()}));
    });
  }

  usersSearchValueChanged(search: { value: string; loadMore?: boolean }) {
    this.usersSearchTerm.set(search.value);
  }

  sortOptionsList(list: IOption[], values) {
    return list.toSorted((a, b) =>
      sortByArr(a.value, b.value, [null, ...(values || [])]));
  }

  usersSearchTerm = signal('');

  allTags = input<string[]>();
  currentUser = this.store.selectSignal(selectCurrentUser);
  users = this.store.selectSignal(selectAllProjectsUsers);
  usersOptions = computed(() => {
    return this.sortOptionsList(this.users()?.map(user => ({
      label: user.name ? user.name : 'Unknown User',
      value: user.id,
      tooltip: ''
    })) ?? [], [this.currentUser().id, ...(this.sortByUsersFilter() ?? [])]);
  });

  protected tagsLabelValue = computed(() => {
    const cleanTags = this.sortByTagsFilter()?.map(tag => cleanTag(tag));
    return this.allTags()
      ?.map(tag => ({label: tag, value: tag}))
      .sort((a, b) =>
        sortByArr(a.value, b.value, [...(cleanTags || [])])
      );
  });
  usersColumn: ISmCol = {
    id: EXPERIMENTS_TABLE_COL_FIELDS.USER,
    getter: 'user.name',
    headerType: ColHeaderTypeEnum.sortFilter,
    searchableFilter: true,
    filterable: true,
    sortable: false,
    header: 'USER',
    style: {width: '115px'},
    showInCardFilters: true
  };


  protected showOnlyUserWork = this.store.selectSignal(selectShowOnlyUserWork);
  protected matchMode = this.store.selectSignal(selectMainPageTagsFilterMatchMode);
  protected tagsFilters = this.store.selectSignal(
    selectMainPageTagsFilter);
  protected sortByTagsFilter = signal< string[]>(this.tagsFilters());

  protected usersFilters = this.store.selectSignal(
    selectMainPageUsersFilter);
  protected sortByUsersFilter = signal< string[]>(this.usersFilters());

  // protected sortByUsersList = computed(() => [this.currentUser().id, ...(this.usersFilters() ?? [])]);
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

  emitUsersFilterChangedCheckBox(filter: { value: string[]; andFilter?: boolean; }) {
    this.store.dispatch(setMainPageUsersFilter({users: filter.value, feature: this.currentFeature()}));
  }

  clearAll() {
    this.store.dispatch(setMainPageTagsFilterMatchMode({matchMode: undefined, feature: this.currentFeature()}));
    this.store.dispatch(setMainPageTagsFilter({tags: [], feature: this.currentFeature()}));
    this.store.dispatch(setMainPageUsersFilter({users: [], feature: this.currentFeature()}));
    this.store.dispatch(setFilterByUser({showOnlyUserWork: false, feature: this.currentFeature()}));
  }

  menuOpen() {
    this.store.dispatch(getAllSystemProjects({}));
  }

  tagsFilterOpened(){
    this.sortByTagsFilter.set(this.tagsFilters());
  }

  usersFilterOpened(){
    this.sortByUsersFilter.set(this.usersFilters());
  }
}
