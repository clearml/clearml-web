import {Component, input, output, effect, viewChild} from '@angular/core';
import {trackById} from '@common/shared/utils/forms-track-by';
import {Model} from '~/business-logic/model/models/model';
import {FormsModule, NgForm} from '@angular/forms';
import {SelectedModel} from '../../shared/models.model';
import {ISmCol} from '@common/shared/ui-components/data/table/table.consts';
import { toObservable } from '@angular/core/rxjs-interop';
import {EditableSectionComponent} from '@common/shared/ui-components/panel/editable-section/editable-section.component';
import {SectionHeaderComponent} from '@common/shared/components/section-header/section-header.component';
import {MatError, MatFormField} from '@angular/material/form-field';
import {UuidPipe} from '@common/shared/pipes/uuid.pipe';
import {
  UniqueInListSync2ValidatorDirective
} from '@common/shared/ui-components/template-forms-ui/unique-in-list-sync-validator-2.directive';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatInput} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'sm-model-info-labels-view',
  templateUrl: './model-info-labels-view.component.html',
  styleUrls: ['./model-info-labels-view.component.scss'],
  imports: [
    EditableSectionComponent,
    SectionHeaderComponent,
    MatError,
    MatIconModule,
    MatFormField,
    FormsModule,
    UuidPipe,
    UniqueInListSync2ValidatorDirective,
    CdkVirtualScrollViewport,
    CdkVirtualForOf,
    CdkFixedSizeVirtualScroll,
    MatButton,
    MatIconButton,
    MatInput
  ]
})
export class ModelInfoLabelsViewComponent {
  public formData: { label: string; id: number }[] = [];
  public editable = false;
  public columns: ISmCol[] = [
    {id: 'label', header: 'Label'},
    {id: 'id', header: 'ID'}
  ];

  private unsavedValue: { label: string; id: number }[];
  labelsFormList = viewChild(NgForm);
  model = input<SelectedModel>();
  saving = input(false);
  isSharedAndNotOwner = input(false);
  saveFormData = output<SelectedModel>();
  cancelClicked = output();
  activateEditClicked = output();

  constructor() {
    effect(() => {
      if (this.model()) {
        this.formData = this.revertParameters(this.model().labels);
      }
    });
    effect(() => {
      if (this.labelsFormList() && this.editable) {
        this.unsavedValue = this.formData;
      }
    });
  }

  activateEdit() {
    this.editable = true;
    this.activateEditClicked.emit();
  }

  addRow() {
    this.formData.push({
      id: this.formData.length + 1,
      label: null,
    });
  }

  removeRow(index) {
    this.formData.splice(index, 1);
  }

  saveClicked() {
    this.editable = false;
    this.saveFormData.emit({...this.model(), labels: this.unsavedValue ? this.convertParameters(this.unsavedValue) : this.model().labels});
  }

  cancelEdit() {
    this.editable = false;
    this.cancelClicked.emit();
  }

  // TODO: move to utils.
  revertParameters(labels: Model['labels']): { id: number, label: string }[] {
    return labels ? Object.entries(labels).map(([key, val]) => ({id: val, label: key})).sort((labelA, labelB) => labelA.id - labelB.id) : [];
  }

  convertParameters(labels: { id: number, label: string }[]): Model['labels'] {
    const obj = {};
    labels?.forEach(l => {
      obj[l.label] = l.id;
    });
    return obj;
  }

  protected readonly trackById = trackById;
    protected readonly labelsFormListChanges = toObservable(this.labelsFormList);
}
