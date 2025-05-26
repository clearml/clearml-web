import {
  ChangeDetectionStrategy,
  Component,
  input,
  inject,
  computed
} from '@angular/core';
import {setFilterByUser} from '@common/core/actions/users.actions';
import {Store} from '@ngrx/store';
import {setMainPageTagsFilter, setMainPageTagsFilterMatchMode} from '@common/core/actions/projects.actions';
import {
  selectMainPageTagsFilter,
  selectMainPageTagsFilterMatchMode,
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
import {selectShowOnlyUserWork} from '@common/core/reducers/users-reducer';
import {selectProjectType} from '@common/core/reducers/view.reducer';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

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
  public searchTerm: string;
  systemTags: string[];

  allTags = input<string[]>();
  protected tagsLabelValue = computed(() => {
    const cleanTags = this.tagsFilters()?.map(tag=> cleanTag(tag));
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
    this.store.dispatch(setMainPageTagsFilterMatchMode({matchMode: !this.matchMode() ? 'AND' : undefined, feature: this.currentFeature()}));
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
