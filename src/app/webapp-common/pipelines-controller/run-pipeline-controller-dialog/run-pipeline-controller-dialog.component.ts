import {Component, OnDestroy, inject, computed, effect, untracked, signal, ChangeDetectionStrategy} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogRef} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatFormField} from '@angular/material/form-field';
import {Store} from '@ngrx/store';
import {FormBuilder, FormControl, FormArray, Validators, ValidatorFn, AbstractControl, ValidationErrors, ReactiveFormsModule} from '@angular/forms';
import {
  PaginatedEntitySelectorComponent
} from '../../shared/components/paginated-entity-selector/paginated-entity-selector.component';
import {selectTablesFilterProjectsOptions} from '../../core/reducers/projects.reducer';
import {getTablesFilterProjectsOptions} from '../../core/actions/projects.actions';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {debounceTime, distinctUntilChanged, startWith, switchMap, tap} from 'rxjs/operators';
import {combineLatest, of} from 'rxjs';

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
import {minLengthTrimmed} from '@common/shared/validators/minLengthTrimmed';
import {MatError, MatInput} from '@angular/material/input';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {ShowTooltipIfEllipsisDirective} from '@common/shared/ui-components/indicators/tooltip/show-tooltip-if-ellipsis.directive';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MatAutocomplete, MatAutocompleteTrigger, MatOption} from '@angular/material/autocomplete';
import {SearchTextDirective} from '@common/shared/ui-components/directives/searchText.directive';
import {ApiPipelinesService} from '~/business-logic/api-services/pipelines.service';
import {MatIcon} from "@angular/material/icon";


export interface RunPipelineResult {
  confirmed: boolean;
  queue: Queue;
  args: { name: string; value: string }[];
  task: string;
  createNewPipeline: boolean;
  new_pipeline_name: string;
  new_pipeline_version?: string;
  new_project_name: string;
  existingPipeline: boolean;
}

// PEP 440 version pattern (converted from backend regex, case-insensitive)
const pipelineVersionPattern = /^\s*v?(?:(?:[0-9]+!)?[0-9]+(?:\.[0-9]+)*(?:[-_.]?(?:a|b|c|rc|alpha|beta|pre|preview)[-_.]?[0-9]*)?(?:(?:-[0-9]+)|(?:[-_.]?(?:post|rev|r)[-_.]?[0-9]*))?(?:[-_.]?dev[-_.]?[0-9]*)?)(?:\+[a-z0-9]+(?:[-_.][a-z0-9]+)*)?\s*$/i;

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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    MatError,
    PaginatedEntitySelectorComponent,
    MatIcon
  ]
})
export class RunPipelineControllerDialogComponent implements OnDestroy {
  private dialogRef = inject<MatDialogRef<ConfirmDialogComponent>>(MatDialogRef);
  private store = inject(Store);
  private fb = inject(FormBuilder);
  private pipelineApi = inject(ApiPipelinesService);
  public data = inject<{ task: any; createNewPipeline?: boolean; project?: string }>(MAT_DIALOG_DATA);

  public queues = this.store.selectSignal(selectQueueFeature.selectQueues);
  public baseController = this.store.selectSignal(selectStartPipelineDialogTask);

  // Form Definition
  public form = this.fb.group({
    queue: new FormControl<Queue | string | null>(null, [Validators.required, queueValidator]),
    params: this.fb.array([] as RunPipelineResult['args']),
    createNewPipeline: [this.data?.createNewPipeline ?? false],
    pipelineName: [''],
    pipelineVersion: [''],
    project: [null as string | null]
  });

  protected projects = this.store.selectSignal(selectTablesFilterProjectsOptions);
  protected allProjects = computed(() => this.projects() ?? []);

  // Warning signal: set when check_new_run returns an existing pipeline
  existingPipelineWarning = signal<string | null>(null);

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

    this.form.controls.createNewPipeline.valueChanges
      .pipe(
        takeUntilDestroyed(),
        startWith(this.form.controls.createNewPipeline.value)
      )
      .subscribe(createNew => {
        if (createNew) {
          this.form.controls.pipelineName.setValidators([Validators.required, minLengthTrimmed(3), Validators.pattern(/^[^\/]*$/)]);
          this.form.controls.project.setValidators([Validators.required, minLengthTrimmed(1)]);
          this.form.controls.pipelineVersion.setValidators([Validators.pattern(pipelineVersionPattern)]);
        } else {
          this.form.controls.pipelineName.clearValidators();
          this.form.controls.project.clearValidators();
          this.form.controls.pipelineVersion.clearValidators();
        }
        this.form.controls.pipelineName.updateValueAndValidity();
        this.form.controls.project.updateValueAndValidity();
        this.form.controls.pipelineVersion.updateValueAndValidity();
      });

    // Debounced check_new_run when pipelineName or project changes
    combineLatest([
      this.form.controls.pipelineName.valueChanges.pipe(startWith(this.form.controls.pipelineName.value)),
      this.form.controls.project.valueChanges.pipe(startWith(this.form.controls.project.value)),
    ]).pipe(
      takeUntilDestroyed(),
      debounceTime(400),
      distinctUntilChanged((a, b) => a[0] === b[0] && a[1] === b[1]),
      tap(() => this.existingPipelineWarning.set(null)),
      switchMap(([pipelineName, projectName]) => {
        const taskId = this.baseController()?.id;
        if (!this.form.controls.createNewPipeline.value || !taskId || !projectName || !pipelineName) {
          return of(null);
        }
        return this.pipelineApi.pipelinesCheckNewRun({
          task: taskId,
          new_project_name: projectName,
          new_pipeline_name: pipelineName
        });
      }),
    ).subscribe(res => {
      if (res?.existing_project) {
        this.existingPipelineWarning.set(res.existing_project.name);
      }
    });

    // Effect: Synchronize Form with Store Data
    effect(() => {
      const task = this.baseController();
      const queues = this.queues();

      // Ensure we don't create loops, though populating form is a side effect
      if (task) {
        // 1. Build Dynamic Params (only if task changes)
        untracked(() => this.rebuildParamsForm(task));

        // 2. Set default project from the task's parent project
        if (this.form.controls.project.value === null && task.project?.name) {
          untracked(() => {
            const projectName = task.project.name;
            const parentProjectName = projectName.includes('/.pipelines/')
              ? projectName.split('/.pipelines/')[0]
              : projectName;

            this.form.controls.project.setValue(parentProjectName);
            this.searchChanged({value: parentProjectName});
          });
        }

        // 3. Set Initial Queue
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
      this.store.dispatch(getControllerForStartPipelineDialog({task: this.data.task?.id, project: this.data.project}));
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

  protected title = computed(() => {
    const task = this.baseController();
    const version = task?.runtime?.version ?? task?.hyperparams?.properties?.version?.value;
    return version ? `${task.name} v${version}` : (task?.name ?? '');
  });

  displayFn(item: any): string {
    return typeof item === 'string' ? item : item?.caption || item?.name;
  }

  clearQueue() {
    this.form.controls.queue.setValue(null);
  }

  // --- Actions ---

  closeDialog(confirmed: boolean) {
    if (confirmed && this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.getRawValue();
    const queue = typeof formValue.queue === 'string' ? null : formValue.queue;
    this.dialogRef.close({
      confirmed,
      queue,
      args: formValue.params.map(p => ({name: p.name, value: p.value})),
      task: this.baseController()?.id,
      createNewPipeline: formValue.createNewPipeline,
      new_pipeline_name: formValue.pipelineName || undefined,
      new_pipeline_version: formValue.pipelineVersion || undefined,
      new_project_name: formValue.project,
      existingPipeline: !!this.existingPipelineWarning()
    } as RunPipelineResult);
  }

  searchChanged(searchString: {value: string; loadMore?: boolean}) {
    this.store.dispatch(getTablesFilterProjectsOptions({
      searchString: searchString.value ?? '',
      loadMore: searchString.loadMore,
      allowPublic: false
    }));
  }

  loadMore() {
    this.store.dispatch(getTablesFilterProjectsOptions({
      searchString: this.form.controls.project.value ?? '',
      loadMore: true,
      allowPublic: false
    }));
  }

  ngOnDestroy(): void {
    this.store.dispatch(setControllerForStartPipelineDialog({task: null}));
  }
}
