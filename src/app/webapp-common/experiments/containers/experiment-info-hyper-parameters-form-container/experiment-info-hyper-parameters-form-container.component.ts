import {ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, viewChild} from '@angular/core';
import {Store} from '@ngrx/store';
import {
  selectExperimentHyperParamsSelectedSectionFromRoute,
  selectExperimentHyperParamsSelectedSectionParams,
  selectIsExperimentSaving,
  selectSelectedExperimentReadOnly,
  selectSplitSize,
} from '../../reducers';
import {selectBackdropActive} from '@common/core/reducers/view.reducer';
import {selectIsExperimentEditable, selectSelectedExperiment,} from '~/features/experiments/reducers';
import {selectRouterConfig} from '@common/core/reducers/router-reducer';
import {
  activateEdit,
  cancelExperimentEdit,
  deactivateEdit,
  deleteHyperParamsSection,
  saveHyperParamsSection,
  setExperimentFormErrors,
  updateExperimentAtPath
} from '../../actions/common-experiments-info.actions';
import {Router} from '@angular/router';
import {
  ExperimentExecutionParametersComponent
} from '../../dumb/experiment-execution-parameters/experiment-execution-parameters.component';

@Component({
    selector: 'sm-experiment-info-hyper-parameters-form-container',
    templateUrl: './experiment-info-hyper-parameters-form-container.component.html',
    styleUrls: ['./experiment-info-hyper-parameters-form-container.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ExperimentInfoHyperParametersFormContainerComponent {
  private store = inject(Store);
  protected router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  // parameterSection = viewChild('parameterSection');
  private executionParamsForm = viewChild(ExperimentExecutionParametersComponent);

  sectionReplaceMap = {
    _legacy: 'General',
    properties: 'User Properties',
    design: 'General'
  };

  protected selectedSectionHyperParams$ = this.store.select(selectExperimentHyperParamsSelectedSectionParams);
  protected editable$ = this.store.select(selectIsExperimentEditable);
  protected saving$ = this.store.select(selectIsExperimentSaving);
  protected backdropActive$ = this.store.select(selectBackdropActive);
  protected routerConfig$ = this.store.select(selectRouterConfig);
  protected selectedExperiment$ = this.store.select(selectSelectedExperiment);
  protected size$ = this.store.select(selectSplitSize);
  public isExample$ = this.store.select(selectSelectedExperimentReadOnly);
  protected selectedSection = this.store.selectSignal(selectExperimentHyperParamsSelectedSectionFromRoute);
  protected propSection = computed(() => this.selectedSection() === 'properties');
  public searchedText: string;
  public searchResultsCount: number;
  public scrollIndexCounter: number;

  constructor() {
    this.store.dispatch(setExperimentFormErrors({errors: null}));
  }


  cancelHyperParametersChange() {
    // this.store.dispatch(updateExperimentAtPath({path: ('hyperparams.' + this.selectedSection() ), value: this.executionParamsForm.formData}));
    this.store.dispatch(deactivateEdit());
    this.store.dispatch(cancelExperimentEdit());
  }

  activateEditChanged(sectionName: string) {
    this.store.dispatch(activateEdit(sectionName));
  }

  onFormValuesChanged(event: { field: string; value: any }) {
    this.store.dispatch(updateExperimentAtPath({path: ('hyperparams.' + event.field), value: event.value}));
  }

  sectionSaved() {
    if (this.executionParamsForm().form().length > 0) {
      this.store.dispatch(saveHyperParamsSection({hyperparams: this.executionParamsForm().form()}));
    } else {
      this.store.dispatch(deleteHyperParamsSection({section: this.selectedSection()}));
    }
    this.store.dispatch(deactivateEdit());
  }

  searchTable(value: string) {
    const searchBackward = value === null;
    if (this.searchedText !== value && !searchBackward) {
      this.searchedText = value;
      this.scrollIndexCounter = -1;
      this.searchResultsCount = 0;
      this.executionParamsForm().resetIndex();
      this.cdr.markForCheck();
    }
    this.executionParamsForm().jumpToNextResult(!searchBackward);
  }

  searchCounterChanged(count: number) {
    this.searchResultsCount = count;
    this.cdr.markForCheck();
  }

  scrollIndexCounterReset() {
    this.scrollIndexCounter = -1;
    this.cdr.markForCheck();
  }
}
