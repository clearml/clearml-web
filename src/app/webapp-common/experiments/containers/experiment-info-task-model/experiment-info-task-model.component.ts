import {Component, inject, viewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {
  selectExperimentConfigObj,
  selectExperimentSelectedConfigObjectFromRoute,
  selectIsExperimentSaving
} from '../../reducers';
import {selectIsExperimentEditable} from '~/features/experiments/reducers';
import {
  activateEdit,
  cancelExperimentEdit,
  deactivateEdit,
  getExperimentConfigurationObj,
  saveExperimentConfigObj,
  setExperimentErrors,
  setExperimentFormErrors
} from '../../actions/common-experiments-info.actions';
import {ConfigurationItem} from '~/business-logic/model/tasks/configurationItem';
import {EditJsonComponent, EditJsonData} from '@common/shared/ui-components/overlay/edit-json/edit-json.component';
import {take} from 'rxjs/operators';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {EditableSectionComponent} from '@common/shared/ui-components/panel/editable-section/editable-section.component';
import {SectionHeaderComponent} from '@common/shared/components/section-header/section-header.component';
import {ScrollTextareaComponent} from '@common/shared/components/scroll-textarea/scroll-textarea.component';
import {LabeledRowComponent} from '@common/shared/ui-components/data/labeled-row/labeled-row.component';
import {PushPipe} from '@ngrx/component';
import {MatButton} from '@angular/material/button';
import {UpperCasePipe} from '@angular/common';
import {ReplaceViaMapPipe} from '@common/shared/pipes/replaceViaMap';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'sm-experiment-info-task-model',
  templateUrl: './experiment-info-task-model.component.html',
  styleUrls: ['./experiment-info-task-model.component.scss'],
  imports: [
    EditableSectionComponent,
    ScrollTextareaComponent,
    SectionHeaderComponent,
    LabeledRowComponent,
    PushPipe,
    MatButton,
    UpperCasePipe,
    ReplaceViaMapPipe
  ]
})
export class ExperimentInfoTaskModelComponent {
  private store = inject(Store);
  private dialog = inject(MatDialog);

  protected prototext = viewChild<EditableSectionComponent>('prototext');

  protected formData: ConfigurationItem;
  protected sectionReplaceMap = {
    _legacy: 'General',
    properties: 'User Properties',
    design: 'General'
  };
  protected configInfo$ = this.store.select(selectExperimentConfigObj);
  protected selectedConfigObj$ = this.store.select(selectExperimentSelectedConfigObjectFromRoute);
  protected editable$ = this.store.select(selectIsExperimentEditable);
  protected saving$ = this.store.select(selectIsExperimentSaving);

  constructor() {
    this.configInfo$
      .pipe(takeUntilDestroyed())
      .subscribe(formData => {
        this.formData = formData;
      });

    this.selectedConfigObj$
      .pipe(takeUntilDestroyed())
      .subscribe((confObjName) => {
        if (confObjName) {
          this.store.dispatch(getExperimentConfigurationObj());
        }
      });
    this.store.dispatch(setExperimentFormErrors({errors: null}));
  }

  onFormErrorsChanged(event: { field: string; errors: any }) {
    this.store.dispatch(setExperimentErrors({[event.field]: event.errors}));
  }

  saveModelData(configuration: ConfigurationItem[]) {
    this.store.dispatch(saveExperimentConfigObj({configuration}));
    this.store.dispatch(deactivateEdit());
  }

  cancelModelChange() {
    this.store.dispatch(deactivateEdit());
    this.store.dispatch(cancelExperimentEdit());
  }

  activateEditChanged(sectionName: string) {
    this.store.dispatch(activateEdit(sectionName));
  }

  editPrototext() {
    const editPrototextDialog = this.dialog.open(EditJsonComponent, {
      data: {textData: this.formData?.value, readOnly: false, title: 'EDIT CONFIGURATION'} as EditJsonData
    });

    editPrototextDialog.afterClosed().pipe(take(1)).subscribe((data) => {
      if (data === undefined) {
        this.prototext().cancelClickedEvent();
      } else {
        this.saveModelData([{
          name: this.formData.name,
          type: this.formData.type,
          value: data,
          description: this.formData.description
        }]);
        this.store.dispatch(deactivateEdit());
      }
    });
  }

  clearPrototext() {
    const confirmDialogRef: MatDialogRef<any, boolean> = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Clear model configuration',
        body: 'Are you sure you want to clear the entire contents of Model Configuration?',
        yes: 'Clear',
        no: 'Keep',
        iconClass: 'al-ico-trash',
        centerText: true,
      }
    });

    confirmDialogRef.afterClosed().pipe(take(1)).subscribe((confirmed) => {
      if (confirmed) {
        this.activateEditChanged('prototext');
        this.saveModelData([{
          name: this.formData.name,
          type: this.formData.type,
          value: '',
          description: this.formData.description
        }]);
        this.store.dispatch(deactivateEdit());
      }
    });
  }
}
