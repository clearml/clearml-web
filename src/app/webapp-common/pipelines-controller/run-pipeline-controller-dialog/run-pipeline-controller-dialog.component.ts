import {Component, OnDestroy, inject, computed, effect, untracked} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogRef} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatFormField} from '@angular/material/form-field';
import {Store} from '@ngrx/store';
import {FormBuilder, FormControl, FormArray, Validators, ValidatorFn, AbstractControl, ValidationErrors, ReactiveFormsModule} from '@angular/forms';
import {toSignal} from '@angular/core/rxjs-interop';
import {startWith} from 'rxjs/operators';

// Actions & Selectors
import {selectQueueFeature} from '../../experiments/shared/components/select-queue/select-queue.reducer';
import {getQueuesForEnqueue} from '@common/experiments/shared/components/select-queue/select-queue.actions';
import {
  getControllerForStartPipelineDialog,
  setControllerForStartPipelineDialog
} from '../../experiments/actions/common-experiments-menu.actions';
import {selectStartPipelineDialogTask} from '../../experiments/reducers';

// Models & Utils
import {ConfirmDialogComponent} from '../../shared/ui-components/overlay/confirm-dialog/confirm-dialog.component';
import {IExperimentInfo} from '~/features/experiments/shared/experiment-info.model';
import {Queue} from '@common/workers-and-queues/actions/queues.actions';
import {integerPattern} from '@common/shared/utils/validation-utils';
import {MatError, MatInput} from '@angular/material/input';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from '@angular/material/autocomplete';
import {SearchTextDirective} from '@common/shared/ui-components/directives/searchText.directive';


export interface RunPipelineResult {
  confirmed: boolean;
  queue: Queue;
  args: { name: string; value: string }[];
  task: string;
}

const queueValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;

  if (value === null || value === '') {
    return null;
  }

  if (typeof value === 'string') {
    return {requireMatch: true};
  }

  return null;
};

@Component({
  selector: 'sm-run-pipeline-controller-dialog',
  templateUrl: './run-pipeline-controller-dialog.component.html',
  styleUrls: ['./run-pipeline-controller-dialog.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    TooltipDirective,
    ShowTooltipIfEllipsisDirective,
    DialogTemplateComponent,
    MatAutocompleteTrigger,
    MatAutocomplete,
    MatOption,
    SearchTextDirective,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    MatError
  ]
})
export class RunPipelineControllerDialogComponent implements OnDestroy {
  private dialogRef = inject<MatDialogRef<ConfirmDialogComponent>>(MatDialogRef);
  private store = inject(Store);
  private fb = inject(FormBuilder);
  public data = inject<{ task: any }>(MAT_DIALOG_DATA);

  public queues = this.store.selectSignal(selectQueueFeature.selectQueues);
  public baseController = this.store.selectSignal(selectStartPipelineDialogTask);

  // Form Definition
  public form = this.fb.group({
    queue: new FormControl<Queue | string | null>(null, [Validators.required, queueValidator]),
    params: this.fb.array([] as RunPipelineResult['args'])
  });

  // Signal for Queue Input Value (to drive filtering)
  private queueInputValue = toSignal(
    this.form.controls.queue.valueChanges.pipe(
      startWith('')),
    {initialValue: ''}
  );

  // Computed: Filtered Queues
  public filteredQueues = computed(() => {
    const allQueues = this.queues();
    const value = this.queueInputValue();

    if (!allQueues) {
      return [];
    }

    const searchTerm = (typeof value === 'string' ? value : value?.name)?.toLowerCase();

    if (!searchTerm) {
      return allQueues;
    }

    return allQueues.filter(q =>
      q.name.toLowerCase().includes(searchTerm) ||
      q.display_name?.toLowerCase().includes(searchTerm)
    );
  });

  constructor() {
    this.loadInitialData();

    // Effect: Synchronize Form with Store Data
    effect(() => {
      const task = this.baseController();
      const queues = this.queues();

      // Ensure we don't create loops, though populating form is a side effect
      if (task) {
        // 1. Build Dynamic Params (only if task changes)
        untracked(() => this.rebuildParamsForm(task));

        // 2. Set Initial Queue (if queues are loaded and task has a preference)
        if (queues?.length > 0) {
          const preSelectedQueue = queues.find(q => task.execution?.queue?.id === q?.id);
          if (preSelectedQueue) {
            // Check if different to avoid cycle
            untracked(() => {
              if (this.form.controls.queue.value !== preSelectedQueue) {
                this.form.controls.queue.setValue(preSelectedQueue);
              }
            });
          }
        }
      }
    });
  }

  private loadInitialData() {
    this.store.dispatch(getQueuesForEnqueue());

    if (this.data?.task?.hyperparams?.Args) {
      this.store.dispatch(setControllerForStartPipelineDialog({task: this.data.task}));
    } else {
      this.store.dispatch(getControllerForStartPipelineDialog({task: this.data.task?.id}));
    }
  }

  // --- Form Helpers ---

  get paramsArray(): FormArray {
    return this.form.controls.params as FormArray;
  }

  private rebuildParamsForm(task: IExperimentInfo) {
    this.paramsArray.clear();
    const args = task?.hyperparams?.Args;

    if (!args) {
      return;
    }

    const sortedArgs = Object.values(args).filter((param: any) => !param?.name?.startsWith('_'));

    sortedArgs.forEach(param => {
      const validators = [];
      if (param.type === 'int' || param.type === 'float') {
        validators.push(Validators.pattern(integerPattern));
      }

      this.paramsArray.push(this.fb.group({
        name: [param.name],
        value: [param.value, validators],
        type: [param.type]
      }));
    });
  }

  // --- UI Helpers ---

  getTitle(): string {
    const task = this.baseController();
    if (!task) {
      return '';
    }

    const version = task.hyperparams?.properties?.version?.value;
    return version ? `${task.name} v${version}` : task.name;
  }

  displayFn(item: any): string {
    return typeof item === 'string' ? item : item?.caption || item?.name;
  }

  clearQueue() {
    this.form.controls.queue.setValue(null);
  }

  // --- Actions ---

  closeDialog(confirmed: boolean) {
    if (confirmed && this.form.invalid) {
      return;
    }

    const formValue = this.form.getRawValue();
    // Validate autocomplete selection (must be object)
    const queue = typeof formValue.queue === 'string' ? null : formValue.queue;

    this.dialogRef.close({
      confirmed,
      queue: queue,
      args: formValue.params.map(p => ({name: p.name, value: p.value})),
      task: this.baseController()?.id
    } as RunPipelineResult);
  }

  ngOnDestroy(): void {
    this.store.dispatch(setControllerForStartPipelineDialog({task: null}));
  }
}
