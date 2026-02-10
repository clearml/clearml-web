import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal, viewChild} from '@angular/core';
import {getModelDesign, getModelDesignKey} from '@common/tasks/tasks.utils';
import {EditJsonComponent, EditJsonData} from '@common/shared/ui-components/overlay/edit-json/edit-json.component';
import {filter, take} from 'rxjs/operators';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {EditableSectionComponent} from '@common/shared/ui-components/panel/editable-section/editable-section.component';
import {ConfirmDialogConfig} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.model';
import {SelectedModel} from '@common/models/shared/models.model';
import {SectionHeaderComponent} from '@common/shared/components/section-header/section-header.component';
import {ScrollTextareaComponent} from '@common/shared/components/scroll-textarea/scroll-textarea.component';
import {MatButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'sm-model-view-network',
  templateUrl: './model-view-network.component.html',
  styleUrls: ['./model-view-network.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EditableSectionComponent,
    SectionHeaderComponent,
    ScrollTextareaComponent,
    MatIconModule,
    MatButton
  ]
})
export class ModelViewNetworkComponent {
  private dialog = inject(MatDialog);

  private unsavedValue: string;
  public inEditMode = signal(false);

  model = input<SelectedModel>();
  isSharedAndNotOwner = input(false);
  saving = input<boolean>();
  openNetworkDesignClicked = output<any>();
  saveFormData = output<SelectedModel>();
  cancelClicked = output();
  activateEditClicked = output();
  protoTextSection = viewChild(EditableSectionComponent);

  protected designKey = computed(() => getModelDesignKey(this.model().design));
  protected design = computed(() => {
    const design = getModelDesign(this.model()?.design);
    return typeof design.value === 'string' ? design.value : '';
  });

  fieldValueChanged(value: any) {
    this.unsavedValue = value;
  }

  activateEdit() {
    this.inEditMode.set(true);
    this.activateEditClicked.emit();
  }

  saveClicked() {
    this.inEditMode.set(false);
    this.saveFormData.emit({...this.model(), design: this.designKey() ? {[this.designKey()]: this.unsavedValue} : this.unsavedValue});
  }

  cancelEdit() {
    this.inEditMode.set(false);
    this.cancelClicked.emit();
  }

  editProtoText() {
    this.dialog.open<EditJsonComponent, EditJsonData, string>(EditJsonComponent, {
      data: {textData: this.design(), readOnly: false, title: 'EDIT MODEL CONFIGURATION'} as EditJsonData
    }).afterClosed()
      .pipe(take(1))
      .subscribe((data) => {
        if (data === undefined) {
          this.protoTextSection().cancelClickedEvent();
        } else {
          this.fieldValueChanged(data);
          this.saveClicked();
        }
      });
  }

  clearProtoText() {
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogConfig, boolean>(ConfirmDialogComponent, {
      data: {
        title    : 'Clear model configuration',
        body     : 'Are you sure you want to clear the entire contents of Model Configuration?',
        yes      : 'Clear',
        no       : 'Keep',
        iconClass: 'al-ico-trash',
        centerText: true,
      }
    }).afterClosed()
      .pipe(
        take(1),
        filter(result => result)
      )
      .subscribe(() => {
        this.activateEdit();
        this.fieldValueChanged('');
        this.saveClicked();
    });
  }
}

