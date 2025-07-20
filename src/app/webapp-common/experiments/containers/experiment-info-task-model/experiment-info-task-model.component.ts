import {Component, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
import {Store} from '@ngrx/store';
import {selectExperimentConfigObj, selectExperimentInfoErrors, selectExperimentSelectedConfigObjectFromRoute, selectIsExperimentSaving} from '../../reducers';
import {Model} from '~/business-logic/model/models/model';
import {Observable, Subscription} from 'rxjs';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {ExperimentInfoState} from '~/features/experiments/reducers/experiment-info.reducer';
import {experimentSectionsEnum} from '~/features/experiments/shared/experiments.const';
import {selectIsExperimentEditable, selectSelectedExperiment} from '~/features/experiments/reducers';
import {activateEdit, cancelExperimentEdit, deactivateEdit, getExperimentConfigurationObj, saveExperimentConfigObj, setExperimentErrors, setExperimentFormErrors} from '../../actions/common-experiments-info.actions';
import {ConfigurationItem} from '~/business-logic/model/tasks/configurationItem';
import {EditJsonComponent, EditJsonData} from '@common/shared/ui-components/overlay/edit-json/edit-json.component';
import {take} from 'rxjs/operators';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {EditableSectionComponent} from '@common/shared/ui-components/panel/editable-section/editable-section.component';

@Component({
    selector: 'sm-experiment-info-task-model',
    templateUrl: './experiment-info-task-model.component.html',
    styleUrls: ['./experiment-info-task-model.component.scss'],
    standalone: false
})
export class ExperimentInfoTaskModelComponent implements OnInit, OnDestroy {
      private store = inject(Store);
      private dialog = inject(MatDialog);
  public selectedExperimentSubscription: Subscription;
  private selectedExperiment: IExperimentInfo;
  public editable$: Observable<boolean>;
  public errors$: Observable<ExperimentInfoState['errors']>;
  public modelLabels$: Observable<Model['labels']>;
  public saving$: Observable<boolean>;
  private configInfo$: Observable<ConfigurationItem>;
  public selectedConfigObj$: Observable<string>;
  private selectedConfigObjSubscription: Subscription;
  private formDataSubscription: Subscription;
  public formData: ConfigurationItem;

  public sectionReplaceMap = {
    _legacy: 'General',
    properties: 'User Properties',
    design: 'General'
  };

  prototext = viewChild<EditableSectionComponent>('prototext');

  constructor() {
    this.configInfo$ = this.store.select(selectExperimentConfigObj);
    this.selectedConfigObj$ = this.store.select(selectExperimentSelectedConfigObjectFromRoute);
    this.editable$ = this.store.select(selectIsExperimentEditable);
    this.errors$ = this.store.select(selectExperimentInfoErrors);
    this.saving$ = this.store.select(selectIsExperimentSaving);
  }

  ngOnInit() {
    this.formDataSubscription = this.configInfo$.subscribe(formData => {
      this.formData = formData;
    });
    this.selectedExperimentSubscription = this.store.select(selectSelectedExperiment)
      .subscribe(selectedExperiment => {
        this.selectedExperiment = selectedExperiment;
      });
    this.selectedConfigObjSubscription = this.selectedConfigObj$.subscribe((confObjName) => {
      if (confObjName) {
        this.store.dispatch(getExperimentConfigurationObj());
      }
    });
    this.store.dispatch(setExperimentFormErrors({errors: null}));
  }

  ngOnDestroy(): void {
    this.selectedExperimentSubscription.unsubscribe();
    this.selectedConfigObjSubscription.unsubscribe();
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
        this.saveModelData([{name: this.formData.name, type: this.formData.type, value: data, description: this.formData.description}]);
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
        this.saveModelData([{name: this.formData.name, type: this.formData.type, value: '', description: this.formData.description}]);
        this.store.dispatch(deactivateEdit());
      }
    });
  }
}
