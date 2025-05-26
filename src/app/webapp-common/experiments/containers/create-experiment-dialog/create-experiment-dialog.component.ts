import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild
} from '@angular/core';
import {
  MatStep,
  MatStepper,
  MatStepperIcon,
  MatStepperNext,
  MatStepperPrevious
} from '@angular/material/stepper';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS, MatError,
  MatFormField,
  MatFormFieldDefaultOptions,
  MatLabel, MatSuffix
} from '@angular/material/form-field';
import {FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {DialogTemplateComponent} from '@common/shared/ui-components/overlay/dialog-template/dialog-template.component';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatRadioButton, MatRadioGroup} from '@angular/material/radio';
import {IOption} from '@common/constants';
import {
  PaginatedEntitySelectorComponent
} from '@common/shared/components/paginated-entity-selector/paginated-entity-selector.component';
import {Store} from '@ngrx/store';
import {selectQueuesList} from '@common/experiments/shared/components/select-queue/select-queue.reducer';
import {NgTemplateOutlet} from '@angular/common';
import {MatDialogRef} from '@angular/material/dialog';
import {getQueuesForEnqueue} from '@common/experiments/shared/components/select-queue/select-queue.actions';
import {toSignal} from '@angular/core/rxjs-interop';
import {Queue} from '~/business-logic/model/queues/queue';
import {MAT_RIPPLE_GLOBAL_OPTIONS, RippleGlobalOptions} from '@angular/material/core';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';
import {debounceTime, distinctUntilChanged, map} from 'rxjs/operators';
import {CodeEditorComponent} from '@common/shared/ui-components/data/code-editor/code-editor.component';
import {shellBinaryValidator} from '@common/shared/validators/shell-binary.validator';
import {MatExpansionPanel, MatExpansionPanelHeader} from '@angular/material/expansion';
import {ButtonToggleComponent} from '@common/shared/ui-components/inputs/button-toggle/button-toggle.component';
import {Ace} from 'ace-builds';

const venvOptions = [
  {label: 'Discover', value: 'discover'},
  {label: 'manual', value: 'Specify'},
];

type VenvOption = typeof venvOptions[number]['value'];

export interface createExperimentDialogResult {
  id?: string;
  action: 'save' | 'run';
  name: string;
  repo: string;
  type: 'branch' | 'commit' | 'tag';
  branch: string;
  commit: string;
  tag: string;
  directory: string;
  script: string;
  uncommited?: string;
  taskInit: boolean;
  args: {key: string; value: string}[];
  poetry: boolean;
  binary: string;
  venvType: VenvOption;
  venv: string;
  requirements: 'skip' | 'text' | 'manual';
  pip: string;
  vars: {key: string; value: string}[];
  docker : {
    image?: string;
    args?: string;
    script?: string;
  }
  queue?: Queue;
  output?: string;
}

const scriptTypes = ['script', 'module', 'custom_code'] as const;
type ScriptType = typeof scriptTypes[number];


@Component({
    selector: 'sm-create-experiment-dialog',
    templateUrl: './create-experiment-dialog.component.html',
    styleUrl: './create-experiment-dialog.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatStepper,
        MatStep,
        MatFormField,
        ReactiveFormsModule,
        DialogTemplateComponent,
        MatStepperPrevious,
        MatStepperNext,
        MatInput,
        MatLabel,
        MatSelect,
        MatOption,
        MatCheckbox,
        MatRadioGroup,
        MatRadioButton,
        PaginatedEntitySelectorComponent,
        MatStepperIcon,
        NgTemplateOutlet,
        MatError,
        MatButton,
        MatIconButton,
        MatIcon,
        CodeEditorComponent,
        MatSuffix,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        ButtonToggleComponent,
    ],
    providers: [
        {
            provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
            useValue: { subscriptSizing: 'dynamic', appearance: 'outline', floatLabel: 'always' } as MatFormFieldDefaultOptions
        },
        { provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: { disabled: true } as RippleGlobalOptions }
    ]
})
export class CreateExperimentDialogComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialogRef);
  protected readonly venvOptions = venvOptions;

  private codeForm = viewChild<ElementRef<HTMLFormElement>>('codeForm');
  private codeEditor = viewChild(CodeEditorComponent);

  protected queues = this.store.selectSignal(selectQueuesList);
  protected filteredQueues = computed(() => this.queueVal() ?
      this.queues()
        .filter(queue => queue.name.toLowerCase().includes(this.queueVal().toLowerCase()) || queue.display_name?.toLowerCase().includes(this.queueVal().toLowerCase())) :
      this.queues()
  );

  protected gitTypes = ['branch', 'commit', 'tag'];
  protected requirementOptions: IOption[] = [
    {label: 'Skip', value: 'skip'},
    {label: 'requirements.txt', value: 'text'},
    {label: 'Manual', value: 'manual'}
  ];

  codeFormGroup = this.formBuilder.group({
    name: [null, [Validators.required, Validators.minLength(3)]],
    repo: [null as string],
    type: ['branch'],
    branch: ['master'],
    commit: [null],
    tag: [null],
    directory: ['.', Validators.required],
    binaryType: ['python', Validators.required],
    binary: [null as string, Validators.required],
    scriptType: ['script' as ScriptType],
    script: [null as string, Validators.required],
    uncommited: [null as string],
    module: [null],
    existing: [false],
    taskInit: [true],
  });
  argsFormGroup = this.formBuilder.group({
    args: this.formBuilder.array([])
  })
  envFormGroup = this.formBuilder.group({
    poetry: [false],
    venvType: ['discover'],
    venv: [null],
    requirements: ['text'],
    pip: [''],
    vars: this.formBuilder.array([])
  });
  dockerFormGroup = this.formBuilder.group({
    image: [null],
    args: [''],
    script: ['']
  });
  queueFormGroup = this.formBuilder.group({
    queue: [null, Validators.required],
    output: ['']
  })

  protected queueVal = toSignal<string>(this.queueFormGroup.controls.queue.valueChanges);
  shell = toSignal(this.codeFormGroup.controls.binaryType.valueChanges
    .pipe(
      debounceTime(300),
      map(value => value === 'shell'),
      distinctUntilChanged(),
    ));
  protected scriptTypes = computed(() => this.shell() ? scriptTypes.filter((e, index) => index !== 1) : scriptTypes);
  protected editMode = signal(false);
  protected cursorPosition: Ace.Point;

  constructor() {
    this.store.dispatch(getQueuesForEnqueue());

    effect(() => {
      if(this.shell()) {
        this.codeFormGroup.controls.binary.setValue('/bin/bash');
        this.codeFormGroup.controls.binary.setValidators([Validators.required, shellBinaryValidator]);
      } else {
        this.codeFormGroup.controls.binary.setValue('python3');
        this.codeFormGroup.controls.binary.setValidators([Validators.required]);
      }
      this.codeFormGroup.controls.binary.updateValueAndValidity();
    });
  }

  get args() {
    return this.argsFormGroup.get('args') as FormArray;
  }

  get vars() {
    return this.envFormGroup.get('vars') as FormArray;
  }

  addArg() {
    this.args.push(this.formBuilder.group({
      key: ['', Validators.required],
      value: [''],
    }))
  }

  removeArg(index: number) {
    this.args.removeAt(index);
  }

  close(action: 'save' | 'run') {
    this.dialog.close({
      action,
      ...this.codeFormGroup.value,
      ...(this.codeFormGroup.controls.scriptType.value === 'module' && {script: `-m ${this.codeFormGroup.value.script}`}),
      ...(this.shell() && this.codeFormGroup.controls.scriptType.value === 'script' && {script: `-c ${this.codeFormGroup.value.script}`}),
      ...(this.codeFormGroup.controls.scriptType.value === 'custom_code' && this.codeFormGroup.controls.repo.value &&
        {uncommited: this.createDiff(this.codeFormGroup.controls.uncommited.value)}
      ),
      ...this.argsFormGroup.value,
      ...this.envFormGroup.value,
      ...(this.envFormGroup.controls.requirements.value === 'manual' && {pip: this.envFormGroup.controls.pip.value}),
      docker: this.dockerFormGroup.value,
      ...this.queueFormGroup.value,
      ...(this.queueFormGroup.controls.queue.value ? {queue: this.queues()?.find(queue => queue.name === this.queueFormGroup.controls.queue.value)} : null),
    } as createExperimentDialogResult)
  }

  createDiff(file: string) {
    const fileName = this.codeFormGroup.controls.script.value;
    const len = (file?.split('\n').length ?? 0) + 1;

    return `diff --git a/${fileName} b/${fileName}
new file mode 100644
index 000000000..ff86f39a4
--- /dev/null
+++ b/${fileName}
@@ -0,0 +1,${len - 1} @@\n` + (file?.split('\n').map(line => '+' + line).join('\n') ?? '');
  }

  typeChange(value: string) {
    this.gitTypes.forEach(type => {
      if (this.codeFormGroup.controls.repo.value && type === value) {
        this.codeFormGroup.controls[type].setValidators(Validators.required);
      } else {
        this.codeFormGroup.controls[type].clearValidators();
      }
      this.codeFormGroup.controls[type].updateValueAndValidity({onlySelf: true});
    });
    this.codeFormGroup.updateValueAndValidity();
  }

  togglePoetry(usePoetry: boolean) {
    if (usePoetry) {
      Object.keys(this.envFormGroup.controls)
        .filter(name => name !== 'poetry')
        .map(name => this.envFormGroup.controls[name] as FormControl)
        .forEach((control) => control.disable());
    } else {
      Object.keys(this.envFormGroup.controls)
        .filter(name => name !== 'poetry')
        .map(name => this.envFormGroup.controls[name] as FormControl)
        .forEach((control) => control.enable());
    }
  }

  loadMoreQueues() {
    this.store.dispatch(getQueuesForEnqueue());
  }

  addVar() {
    this.vars.push(this.formBuilder.group({
      key: ['', Validators.required],
      value: [''],
    }))
  }

  updateEntryFromFile($event: Event) {
    const file = ($event.target as HTMLInputElement)?.files[0];
    const reader = new FileReader();
    reader.onload = (evt) => {
      this.codeFormGroup.controls.uncommited.setValue(evt.target.result as string);
      if (!this.codeFormGroup.controls.script.value)
      this.codeFormGroup.controls.script.setValue(file.name ?? 'main.py');
    };
    reader.readAsText(file);
    ($event.target as HTMLInputElement).value = '';
  }

  editScript() {
    this.editMode.set(true);
  }

  updateScript(code: string) {
    this.codeFormGroup.controls.uncommited.setValue(code);
    this.cursorPosition = this.codeEditor().position;
    if (!this.codeFormGroup.controls.script.value) {
      this.codeFormGroup.controls.script.setValue(`custom_code.${this.shell() ? 'sh' : 'py'}`)
    }
    this.closeScript();
  }

  closeScript () {
    this.editMode.set(false)
    window.setTimeout(() => this.codeForm().nativeElement.scrollTo({top: 1000, behavior: 'instant'}));
  }

  clearFile() {
    this.codeFormGroup.controls.script.setValue(null);
    this.codeFormGroup.controls.uncommited.setValue(null);
  }

  binaryChanged(value: string) {
    if(value === 'shell' && this.codeFormGroup.controls.scriptType.value === 'module') {
      this.codeFormGroup.controls.scriptType.setValue('script');
    }
  }

  venevTypeChange(value: VenvOption) {
    this.envFormGroup.controls.venvType.setValue(value);
  }
}
