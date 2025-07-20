import {Component, effect, input, output, viewChild} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Subscription} from 'rxjs';
import {FilterMetadata} from 'primeng/api/filtermetadata';
import {ReplaceViaMapPipe} from '@common/shared/pipes/replaceViaMap';
import {MatLabel} from '@angular/material/form-field';
import {MatChipListbox, MatChipOption} from '@angular/material/chips';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {TagsMenuComponent} from '@common/shared/ui-components/tags/tags-menu/tags-menu.component';
import {TagListComponent} from '@common/shared/ui-components/tags/tag-list/tag-list.component';
import {MatMenuTrigger} from '@angular/material/menu';
import {EXPERIMENTS_STATUS_LABELS} from '~/shared/constants/non-common-consts';
import {MatIcon} from '@angular/material/icon';
import {StatusIconLabelComponent} from '../../shared/experiment-status-icon-label/status-icon-label.component';

@Component({
  selector: 'sm-global-search-filter',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ReplaceViaMapPipe,
    MatLabel,
    MatChipListbox,
    MatChipOption,
    MatSlideToggle,
    TagsMenuComponent,
    TagListComponent,
    MatMenuTrigger,
    MatIcon,
    StatusIconLabelComponent
],
  templateUrl: './global-search-filter.component.html',
  styleUrl: './global-search-filter.component.scss'
})
export class GlobalSearchFilterComponent {
  protected sub = new Subscription();
  protected filterForm: FormGroup;
  tagMenuTrigger = viewChild<MatMenuTrigger>('tagsMenuTrigger');
  tagMenu = viewChild(TagsMenuComponent);



  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      statusFilter: new FormControl([]),
      typeFilter: new FormControl([]),
      tagsFilter: new FormControl([]),
      myWorkFilter: new FormControl(false),
    });


    effect(() => {
      const currentFilters = this.filters();
      const statusValuesFromFilters = currentFilters['status']?.value; // This should be string[] e.g. ['created']
      const typeValuesFromFilters = currentFilters['type']?.value; // This should be string[] e.g. ['created']

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
      // Update myWorkFilter based on external filters
      if (currentFilters.hasOwnProperty('myWork')) {
        const myWorkValueFromFilters = currentFilters['myWork']?.value; // Expected: string[] e.g., ['true'] or []
        const isSetToTrue = Array.isArray(myWorkValueFromFilters) && myWorkValueFromFilters.includes('true');
        this.myWorkFilter.setValue(isSetToTrue, {emitEvent: false}); // Sets a boolean
      } else {
        this.myWorkFilter.setValue(false, {emitEvent: false});
      }
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

    this.myWorkFilter.valueChanges.subscribe(value => {
      this.filterChanged.emit({col: 'myWork', value: value ? ['true'] : ['false']});
    });
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

  get myWorkFilter(): FormControl {
    return this.filterForm.get('myWorkFilter') as FormControl;
  }


  statusOptions = input(['created', 'in_progress', 'completed']);
  typeOptions = input([]);
  statusOptionsLabels = input<Record<string, string>>();
  tags = input<string[]>([]);
  filters = input<Record<string, FilterMetadata>>({});

  filterChanged = output<{
    col: string;
    value: string[];
    matchMode?: string;
  }>();

  tagsMenuClosed() {

  }
  addTag(tag: string){
    this.tagsFilter.setValue([...this.tagsFilter.value, tag])
  }
  removeTag(removedTag: string){
    this.tagsFilter.setValue(this.tagsFilter.value.filter(tag => tag !== removedTag))
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

  protected readonly EXPERIMENTS_STATUS_LABELS = EXPERIMENTS_STATUS_LABELS;
}
