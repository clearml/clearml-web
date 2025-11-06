import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {ModelsViewModesEnum} from '../../models.consts';
import {FilterMetadata} from 'primeng/api';

@Component({
    selector: 'sm-select-model-header',
    templateUrl: './select-model-header.component.html',
    styleUrls: ['./select-model-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class SelectModelHeaderComponent {

  @Input() searchValue: string;
  @Input() isArchived: boolean;
  @Input() hideArchiveToggle: boolean;
  @Input() hideCreateNewButton: boolean;
  @Input() viewMode: ModelsViewModesEnum;
  @Input() searchActive: boolean;
  @Input() tableFilters: Record<string, FilterMetadata>;
  @Input() isShowArchived: boolean;

  @Output() searchValueChanged   = new EventEmitter<string>();
  @Output() isArchivedChanged    = new EventEmitter<boolean>();
  @Output() isAllProjectsChanged = new EventEmitter<boolean>();
  @Output() viewModeChanged      = new EventEmitter<ModelsViewModesEnum>();
  @Output() addModelClicked      = new EventEmitter();
  @Output() clearFilters      = new EventEmitter();

  @ViewChild('search') searchElem;

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

  // searchClicked() {
  //   this.searchElem.searchBarInput.nativeElement.focus();
  // }

  onSearchFocusOut() {
    if (!this.searchElem.searchBarInput().nativeElement.value) {}
  }
}
