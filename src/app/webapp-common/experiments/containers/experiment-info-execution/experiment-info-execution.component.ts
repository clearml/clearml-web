import {Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable, Subscription} from 'rxjs';
import {IExecutionForm, sourceTypesEnum} from '~/features/experiments/shared/experiment-execution.model';
import {selectIsExperimentEditable, selectShowExtraDataSpinner} from '~/features/experiments/reducers';
import * as commonInfoActions from '../../actions/common-experiments-info.actions';
import {
  selectExperimentExecutionInfoData,
  selectIsExperimentSaving,
  selectIsSelectedExperimentInDev
} from '../../reducers';
import {selectBackdropActive, selectHideRedactedArguments} from '@common/core/reducers/view.reducer';
import {EditJsonComponent, EditJsonData} from '@common/shared/ui-components/overlay/edit-json/edit-json.component';
import {filter, take} from 'rxjs/operators';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {ConfirmDialogComponent} from '@common/shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {EditableSectionComponent} from '@common/shared/ui-components/panel/editable-section/editable-section.component';
import {
  ExperimentExecutionSourceCodeComponent
} from '../../dumb/experiment-execution-source-code/experiment-execution-source-code.component';
import {isUndefined} from 'lodash-es';
import {ActivatedRoute} from '@angular/router';
import {Container} from '~/business-logic/model/tasks/container';
import {
  IOption
} from '@common/shared/ui-components/inputs/select-autocomplete-with-chips/select-autocomplete-with-chips.component';
import {
  CommonExperimentConverterService
} from '@common/experiments/shared/services/common-experiment-converter.service';
import {
  ClearInstalledPackagesDialogComponent
} from '@common/experiments/dumb/clear-installed-packges-dialog/clear-installed-packages-dialog.component';

@Component({
    selector: 'sm-experiment-info-execution',
    templateUrl: './experiment-info-execution.component.html',
    styleUrls: ['./experiment-info-execution.component.scss'],
    standalone: false
})
export class ExperimentInfoExecutionComponent implements OnInit, OnDestroy {

  private store = inject(Store);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private element = inject(ElementRef);
  private converter = inject(CommonExperimentConverterService);
  private formDataSubscription: Subscription;
  public minimized = this.route.snapshot.routeConfig?.data?.minimized ?? false;
  public executionInfo$ = this.store.select(selectExperimentExecutionInfoData);
  public showExtraDataSpinner = this.store.selectSignal(selectShowExtraDataSpinner);
  public editable = this.store.selectSignal(selectIsExperimentEditable);
  public isInDev = this.store.selectSignal(selectIsSelectedExperimentInDev);
  public saving = this.store.selectSignal(selectIsExperimentSaving);
  public backdropActive = this.store.selectSignal(selectBackdropActive);
  public redactedArguments$ = this.store.select(selectHideRedactedArguments);
  public formData: IExecutionForm;
  links = ['details', 'uncommitted changes', 'python packages', 'container'];
  currentLink = 'details';
  public selectedRequirement = 'pip';
  public editableRequirements = false;
  private requirementLabels: IExecutionForm['requirements'] = {
    pip: 'PIP',
    orgPip: 'Original PIP',
    conda: 'Conda',
    orgConda: 'Original Conda'
  };
  public requirementsOptions: IOption[];

  @ViewChild('outputDestination') outputDestination: ElementRef;
  @ViewChild('orchestration') orchestration: ElementRef;
  @ViewChild('sourceCode') sourceCode: ExperimentExecutionSourceCodeComponent;

  @ViewChild('diffSection') diffSection: EditableSectionComponent;
  @ViewChild('requirementsSection') requirementsSection: EditableSectionComponent;

  @ViewChild('containerImage') containerImage: ElementRef;
  @ViewChild('containerArguments') containerArguments: ElementRef;
  resetRequirementToolTip: string;

  ngOnInit() {
    this.store.dispatch(commonInfoActions.setExperimentFormErrors({errors: null}));

    this.formDataSubscription = this.executionInfo$.subscribe(formData => {
      this.formData = formData;
      if (formData) {
        this.requirementsOptions = Object.keys(this.requirementLabels)
          .filter(key => Object.hasOwn(formData?.requirements ?? {}, key))
          .map(key => ({
            value: key,
            label: this.requirementLabels[key]
          } as IOption));
        if (!Object.hasOwn(formData?.requirements ?? {}, this.selectedRequirement)) {
          this.selectedRequirement = 'pip';
        }
        this.editableRequirements = this.selectedRequirement === 'pip';
        this.resetRequirementToolTip = `Set packages to originally recorded values (${formData.requirements?.orgPip ? 'original-pip' : ''}${formData.requirements?.orgPip && formData.requirements?.orgConda ? ' / ' : ''}${formData.requirements?.orgConda ? 'original-conda' : ''})`;
      }
    });
  }

  ngOnDestroy(): void {
    this.formDataSubscription.unsubscribe();
  }

  saveSourceData() {
    const source = this.sourceCode.sourceCodeForm.value as IExecutionForm['source'];
    this.store.dispatch(commonInfoActions.saveExperimentSection({
      script: {
        repository: source.repository,
        entry_point: source.entry_point,
        working_dir: source.working_dir,
        binary: source.binary?.trim(),

        ...this.convertScriptType(source)
      }
    }));
  }

  saveContainerData(container: Container) {
    this.store.dispatch(commonInfoActions.saveExperimentSection({container: {...this.formData.container, ...container}}));
  }

  saveOutputData() {
    const outputDestination = this.outputDestination.nativeElement.value;

    // why BE can't get output.destination as task.edit?

    this.store.dispatch(commonInfoActions.saveExperimentSection({output_dest: outputDestination} as any));
  }

  cancelFormChange() {
    this.store.dispatch(commonInfoActions.deactivateEdit());
  }

  activateEditChanged(sectionName: string, section?: EditableSectionComponent) {
    const element = section?.elementRef?.nativeElement;
    if (element) {
      window.setTimeout(() => {
        const bounding = element.getBoundingClientRect();
        const containerRect = this.element.nativeElement.getBoundingClientRect();
        if (bounding.bottom > window.innerHeight && bounding.top > containerRect.top) {
          this.element.nativeElement.scroll({top: element.offsetTop, behavior: 'smooth'} as ScrollToOptions);
        }
      });
    }
    this.store.dispatch(commonInfoActions.activateEdit(sectionName));
  }

  discardDiff() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Discard diff',
        body: 'Uncommitted changes will be discarded',
        yes: 'Discard',
        no: 'Cancel',
        iconClass: 'al-ico-trash',
        centerText: true,
      }
    }).afterClosed()
      .pipe(
        take(1),
        filter(res => res)
      )
      .subscribe(() => {
        this.activateEditChanged('diff');
        this.store.dispatch(commonInfoActions.saveExperimentSection({script: {diff: ''}}));
      });
  }

  editContainerSetupShellScript(smEditableSection?: EditableSectionComponent) {
    this.openEditJsonDialog({
      textData: this.formData.container?.setup_shell_script,
      title: 'EDIT SETUP SHELL SCRIPT'
    }, smEditableSection)
      .afterClosed()
      .pipe(filter(bool => !isUndefined(bool)))
      .subscribe(setupShellScript => {
        if (this.formData.container.setup_shell_script !== setupShellScript) {
          smEditableSection.saveSection();

          this.store.dispatch(commonInfoActions.saveExperimentSection({
            container: {
              ...this.formData.container,

              setup_shell_script: setupShellScript
            }
          }));
        } else {
          smEditableSection.cancelClickedEvent();
        }
      });
  }

  editInstallPackages() {
    const editInstallPackagesDialog = this.dialog.open(EditJsonComponent, {
      data: {
        textData: this.formData?.requirements?.pip,
        readOnly: false,
        title: 'EDIT PYTHON PACKAGES',
      } as EditJsonData
    });

    editInstallPackagesDialog.afterClosed().pipe(take(1)).subscribe((data) => {
      if (data === undefined) {
        this.requirementsSection.cancelClickedEvent();
      } else {
        this.requirementsSection.saveSection();
        this.store.dispatch(commonInfoActions.saveExperimentSection({
          script: {
            requirements: {
              ...this.converter.convertRequirements(this.formData.requirements),
              pip: data
            }
          }
        }));
      }
    });
  }

  editDiff() {
    this.openEditJsonDialog({
      textData: this.formData?.diff,
      readOnly: false,
      title: 'EDIT UNCOMMITTED CHANGES',
    }, this.diffSection)
      .afterClosed()
      .pipe(take(1))
      .subscribe((data) => {
        this.diffSection.unsubscribeToEventListener();
        if (!isUndefined(data)) {
          this.store.dispatch(commonInfoActions.saveExperimentSection({script: {diff: data}}));
        }
      });
  }

  clearInstalledPackages() {
    this.dialog.open(ClearInstalledPackagesDialogComponent,
      {data: {showReset: (this.editableRequirements && (this.formData.requirements?.orgPip || this.formData.requirements?.orgConda))}})
      .afterClosed().pipe(take(1)).subscribe((confirmed) => {
      if (confirmed) {
        this.activateEditChanged('requirements');
        if (confirmed.selectedOption === 'reset') {
          this.store.dispatch(commonInfoActions.saveExperimentSection({
            script: {
              requirements: {
                ...this.formData.requirements,
                ...((this.formData.requirements?.pip && this.formData.requirements.orgPip) && {pip: this.formData.requirements.orgPip}),
                ...((this.formData.requirements?.conda && this.formData.requirements.orgConda) && {pip: this.formData.requirements.orgConda}),
              }
            }
          }));
        } else {
          this.store.dispatch(commonInfoActions.saveExperimentSection({script: {requirements: confirmed?.selectedOption === 'dontInstall' ? {[this.selectedRequirement]: ''} : {}}}));
        }
      }
    });
  }

  resetInstalledPackages() {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Reset python packages`,
        body: `Are you sure you want to reset python packages?<br>This will set the packages to originally recorded values.`,
        yes: 'Reset',
        no: 'Keep',
        iconClass: 'al-ico-reset ',
      }
    }).afterClosed().pipe(take(1)).subscribe((confirmed) => {
      if (confirmed) {
        this.activateEditChanged('requirements');
        this.store.dispatch(commonInfoActions.saveExperimentSection({
          script: {
            requirements: {
              ...this.formData.requirements,
              ...((this.formData.requirements?.pip && this.formData.requirements.orgPip) && {pip: this.formData.requirements.orgPip}),
              ...((this.formData.requirements?.conda && this.formData.requirements.orgConda) && {pip: this.formData.requirements.orgConda}),
            }
          }
        }));
      }
    });

  }

  clearSetupShellScript() {
    this.clearConfirmDialog('setup shell script').pipe(take(1)).subscribe((confirmed) => {
      if (confirmed) {

        this.store.dispatch(commonInfoActions.saveExperimentSection({
          container: {
            ...this.formData.container,

            setup_shell_script: null
          }
        }));
      }
    });
  }

  private clearConfirmDialog(title: string): Observable<boolean> {
    return this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: `Clear ${title}`,
        body: `Are you sure you want to clear the entire contents of ${title.charAt(0).toUpperCase() + title.slice(1)}?`,
        yes: 'Clear',
        no: 'Keep',
        iconClass: 'al-ico-trash',
        centerText: true,
      }
    }).afterClosed();

  }

  private openEditJsonDialog(data: {
    textData: string;
    readOnly?: boolean;
    title?: string;
    format?: string
  }, editableSectionComponent?: EditableSectionComponent): MatDialogRef<EditJsonComponent> {
    const editJsonComponent = this.dialog.open(EditJsonComponent, {
      data
    });
    editJsonComponent.afterClosed().subscribe(res => {
      if (isUndefined(res) && !isUndefined(editJsonComponent)) {
        editableSectionComponent.cancelClickedEvent();
      }
    });
    return editJsonComponent;
  }

  private convertScriptType(source: IExecutionForm['source']) {
    switch (source.scriptType) {
      case sourceTypesEnum.Branch:
        return {[sourceTypesEnum.Branch]: source.branch, [sourceTypesEnum.Tag]: '', [sourceTypesEnum.VersionNum]: ''};
      case sourceTypesEnum.Tag:
        return {
          [sourceTypesEnum.Branch]: source.branch,
          [sourceTypesEnum.Tag]: source.tag,
          [sourceTypesEnum.VersionNum]: ''
        };
      case sourceTypesEnum.VersionNum:
        return {
          [sourceTypesEnum.Branch]: source.branch,
          [sourceTypesEnum.Tag]: source.tag,
          [sourceTypesEnum.VersionNum]: source.version_num
        };
    }
  }

  showSection(selection: string) {
    this.currentLink = selection;
  }

  requirementChanged(type: string) {
    this.selectedRequirement = type;
    this.editableRequirements = this.selectedRequirement === 'pip';
  }
}
