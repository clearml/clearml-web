import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  viewChild
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {DialogModule} from 'primeng/dialog';
import {ButtonModule} from 'primeng/button';
import {CommonModule} from '@angular/common';
import {ModelsViewModesEnum} from '../../models.consts';
import {FilterMetadata} from 'primeng/api';
import {SearchComponent} from '@common/shared/ui-components/inputs/search/search.component';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {
  ClearFiltersButtonComponent
} from '@common/shared/components/clear-filters-button/clear-filters-button.component';

@Component({
  selector: 'sm-select-model-header',
  templateUrl: './select-model-header.component.html',
  styleUrls: ['./select-model-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DialogModule,
    ButtonModule,
    CommonModule,
    SearchComponent,
    MatSlideToggleModule,
    ClearFiltersButtonComponent,
  ],
})
export class SelectModelHeaderComponent {

  searchValue = input<string>();
  isArchived = input<boolean>();
  hideArchiveToggle = input<boolean>();
  hideCreateNewButton = input<boolean>();
  viewMode = input<ModelsViewModesEnum>();
  searchActive = input<boolean>();
  tableFilters = input<Record<string, FilterMetadata>>();
  isShowArchived = input<boolean>();

  searchValueChanged   = output<string>();
  isArchivedChanged    = output<boolean>();
  isAllProjectsChanged = output<boolean>();
  viewModeChanged      = output<ModelsViewModesEnum>();
  addModelClicked      = output<void>();
  clearFilters         = output<void>();

  searchElem = viewChild<ElementRef>('search');

  onSearchValueChanged(value: string) {
    this.searchValueChanged.emit(value);
  }

  onIsArchivedChanged(value: boolean) {
    this.isArchivedChanged.emit(value);
  }

  onAllProjectsChanged(value: boolean) {
    this.isAllProjectsChanged.emit(value);
  }

  onAddModelClicked() {
    this.addModelClicked.emit();
  }

  onSearchFocusOut() {
    if (!this.searchElem().nativeElement.value) {}
  }
}
