import {Component, computed, effect, input, output, signal, viewChild} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Subscription} from 'rxjs';
import {FilterMetadata} from 'primeng/api';
import {ReplaceViaMapPipe} from '@common/shared/pipes/replaceViaMap';
import {MatChipListbox, MatChipOption, MatChipRemove, MatChipRow} from '@angular/material/chips';
import {TagsMenuComponent} from '@common/shared/ui-components/tags/tags-menu/tags-menu.component';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {MatMenuTrigger} from '@angular/material/menu';
import {EXPERIMENTS_TYPE_LABELS} from '~/shared/constants/non-common-consts';
import {MatIcon} from '@angular/material/icon';
import {StatusIconLabelComponent} from '../../shared/experiment-status-icon-label/status-icon-label.component';
import {User} from '~/business-logic/model/users/user';
import {FilterPipe} from '@common/shared/pipes/filter.pipe';
import {
  TableFilterSortComponent
} from '@common/shared/ui-components/data/table/table-filter-sort/table-filter-sort.component';
import {
  IOption
} from '@common/shared/ui-components/inputs/select-autocomplete-for-template-forms/select-autocomplete-for-template-forms.component';
import {sortByArr} from '@common/shared/pipes/show-selected-first.pipe';
import {ColHeaderTypeEnum, ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import {EXPERIMENTS_TABLE_COL_FIELDS} from '~/features/experiments/shared/experiments.const';
import {MatIconButton} from '@angular/material/button';

@Component({
  selector: 'sm-global-search-filter',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ReplaceViaMapPipe,
    MatChipListbox,
    MatChipOption,
    TagsMenuComponent,
    TagListComponent,
    MatMenuTrigger,
    MatIcon,
    StatusIconLabelComponent,
    FilterPipe,
    TableFilterSortComponent,
    MatIconButton,
    MatChipRow,
    MatChipRemove,

  ],
  templateUrl: './global-search-filter.component.html',
  styleUrl: './global-search-filter.component.scss'
})
export class GlobalSearchFilterComponent {
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
  fb = new FormBuilder();
  public searchTerm: string;
  protected sub = new Subscription();
  protected filterForm: FormGroup;
  tagMenuTrigger = viewChild<MatMenuTrigger>('tagsMenuTrigger');
  tagMenu = viewChild(TagsMenuComponent);
  sortOptionsList(list: IOption[], values) {
    return list.toSorted((a, b) =>
      sortByArr(a.value, b.value, [null,  ...(values || [])]));
  }

  constructor() {
    this.filterForm = this.fb.group({
      statusFilter: new FormControl([]),
      typeFilter: new FormControl([]),
      tagsFilter: new FormControl([]),
      userFilter: new FormControl([]),
    });



    effect(() => {
      const currentFilters = this.filters();
      const statusValuesFromFilters = currentFilters['status']?.value;
      const typeValuesFromFilters = currentFilters['type']?.value;
      const usersValuesFromFilters = currentFilters['users']?.value;

      // Update statusFilter (which is now a FormControl)
      if (currentFilters.hasOwnProperty('status')) { // Check if the key exists
        if (Array.isArray(statusValuesFromFilters)) {
          this.statusFilter.setValue(statusValuesFromFilters, {emitEvent: false});
        } else {
          // If 'status' key exists but value is not an array (e.g. null/undefined), clear the filter
          this.statusFilter.setValue([], {emitEvent: false});
        }
      } else {
        this.statusFilter.setValue([], {emitEvent: false});
      }
      if (currentFilters.hasOwnProperty('users')) { // Check if the key exists
        if (Array.isArray(usersValuesFromFilters)) {
          this.userFilter.setValue(usersValuesFromFilters, {emitEvent: false});
        } else {
          // If 'user' key exists but value is not an array (e.g. null/undefined), clear the filter
          this.userFilter.setValue([], {emitEvent: false});
        }
      } else {
        this.userFilter.setValue([], {emitEvent: false});
      }

      if (currentFilters.hasOwnProperty('type')) { // Check if the key exists
        if (Array.isArray(typeValuesFromFilters)) {
          this.typeFilter.setValue(typeValuesFromFilters, {emitEvent: false});
        } else {
          // If 'status' key exists but value is not an array (e.g. null/undefined), clear the filter
          this.typeFilter.setValue([], {emitEvent: false});
        }
      } else {
        this.typeFilter.setValue([], {emitEvent: false});
      }


      // Update tagsFilter based on external filters
      const tagsFromFilters = currentFilters['tags']?.value; // These are expected to be string[]
      if (Array.isArray(tagsFromFilters)) {
        // const newTagObjects = (tagsFromFilters as string[]).map(tag => ({name: tag, id: tag}));
        this.tagsFilter.setValue(tagsFromFilters, {emitEvent: false});
      } else {
        // If 'tags' key exists but value is null/undefined/empty, clear the filter
        this.tagsFilter.setValue([], {emitEvent: false});
      }
      // If 'tags' key doesn't exist in currentFilters, tagsFilter remains unchanged by this part.

    });


    this.statusFilter.valueChanges.subscribe(value => {
      this.filterChanged.emit({col: 'status', value: value});
    });

    this.typeFilter.valueChanges.subscribe(value => {
      this.filterChanged.emit({col: 'type', value: value});
    });

    this.tagsFilter.valueChanges.subscribe(value => {
      this.filterChanged.emit({col: 'tags', value: value});
    });

    this.userFilter.valueChanges.subscribe(value => {
      this.filterChanged.emit({col: 'users', value: value});
    });
  }

  setSearchTerm($event) {
    this.pageNumber.set(1);
    this.searchTerm = $event;
  }

  loadMore() {
    this.loading.set(true);
    window.setTimeout(() => {
      this.pageNumber.update(num => num + 1);
      this.loading.set(false);
    }, 300);
  }

  closeMenu() {
    this.pageNumber.set(1);
    this.searchTerm = '';
  }

  clearSearch() {
    this.pageNumber.set(1);
    this.searchTerm = '';
    this.setSearchTerm({target: {value: ''}});
  }

  get statusFilter(): FormControl {
    return this.filterForm.get('statusFilter') as FormControl;
  }

  get typeFilter(): FormControl {
    return this.filterForm.get('typeFilter') as FormControl;
  }

  get tagsFilter(): FormControl {
    return this.filterForm.get('tagsFilter') as FormControl;
  }

  get userFilter(): FormControl {
    return this.filterForm.get('userFilter') as FormControl;
  }

  protected pageNumber = signal(1);
  usersSearchTerm = signal('');
  currentUserId = input<string>();
  protected sortByUsersList = computed(() => [this.currentUserId(), ...(this.userFilter.value ?? [])]);

  protected loading = signal(false);
  statusOptions = input(['created', 'in_progress', 'completed']);
  isFiltered = input<boolean>()
  typeOptions = input([]);
  showUserFilter = input();
  statusOptionsLabels = input<Record<string, string>>();
  usersOptions = input<User[]>();
  selectedUsers = computed(() => {
    return this.filters()['users']?.value?.map(userId=> this.usersOptions().find(user=> user.id === userId));
  });
  usersOptionsLabels = computed(() => {
    return this.sortOptionsList(this.usersOptions()?.map(user => ({
      label: user.name ? user.name : 'Unknown User',
      value: user.id,
      tooltip: ''
    })) ?? [],this.sortByUsersList() );
  });

  tags = input<string[]>([]);
  filters = input<Record<string, FilterMetadata>>({});

  filterChanged = output<{
    col: string;
    value: string[];
    matchMode?: string;
  }>();

  resetFilters = output();

  tagsMenuClosed() {

  }

  addTag(tag: string) {
    this.tagsFilter.setValue([...this.tagsFilter.value, tag]);
  }

  removeTag(removedTag: string) {
    this.tagsFilter.setValue(this.tagsFilter.value.filter(tag => tag !== removedTag));
  }

  removeSelectedUser(usedId: string){
    this.userFilter.setValue(this.userFilter.value.filter(user => user !== usedId));

  }

  openTagMenu() {
    if (!this.tagMenuTrigger()) {
      return;
    }
    window.setTimeout(() => {
      this.tagMenuTrigger().openMenu();
      this.tagMenu().focus();
    });
  }

  protected readonly EXPERIMENTS_STATUS_LABELS = EXPERIMENTS_TYPE_LABELS;

  usersFilterChanged(filterChangedEvent) {
    this.userFilter.setValue([...filterChangedEvent.value]);
  }
  usersSearchValueChanged(search: { value: string; loadMore?: boolean }) {
    this.usersSearchTerm.set(search.value);
  }

  clearAllFilters() {
    this.resetFilters.emit();
  }

}
