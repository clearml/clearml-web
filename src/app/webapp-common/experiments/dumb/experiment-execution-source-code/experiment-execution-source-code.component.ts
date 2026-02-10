import {
  Component,
  input,
  inject,
  forwardRef,
  ChangeDetectionStrategy,
  linkedSignal
} from '@angular/core';
import {ControlValueAccessor, FormBuilder, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators} from '@angular/forms';
import {IExecutionForm, sourceTypesEnum} from '~/features/experiments/shared/experiment-execution.model';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {debounceTime, filter, map, startWith} from 'rxjs/operators';
import {pairwise} from 'rxjs';
import {buildGitRepoUrl} from '@common/experiments/shared/common-experiments.utils';
import {TooltipDirective} from '@common/shared/ui-components/indicators/tooltip/tooltip.directive';
import {LabeledRowComponent} from '@common/shared/ui-components/data/labeled-row/labeled-row.component';
import {MatInput, MatLabel} from '@angular/material/input';
import {ReplaceViaMapPipe} from '@common/shared/pipes/replaceViaMap';
import {MatError, MatFormField} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'sm-experiment-execution-source-code',
  templateUrl: './experiment-execution-source-code.component.html',
  styleUrls: ['./experiment-execution-source-code.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ExperimentExecutionSourceCodeComponent),
      multi: true
    }
  ],
  imports: [
    TooltipDirective,
    LabeledRowComponent,
    ReactiveFormsModule,
    MatFormField,
    MatOption,
    MatSelect,
    MatInput,
    MatIconModule,
    ReplaceViaMapPipe,
    MatError,
    MatLabel
  ]
})
export class ExperimentExecutionSourceCodeComponent implements ControlValueAccessor {
  private formBuilder = inject(FormBuilder);

  editable = input<boolean>();
  protected readonly sourceTypesEnum = sourceTypesEnum;
  sourceCodeForm = this.formBuilder.group({
    repository: [''],
    scriptType: [sourceTypesEnum.Branch, Validators.required],
    version_num: [''],
    branch: [''],
    tag: [''],
    entry_point: [''],
    working_dir: [''],
    binary: [''],
  });

  private formData = toSignal(this.sourceCodeForm.valueChanges
    .pipe(startWith(this.sourceCodeForm.value))
  );
  protected repoData = linkedSignal(() =>
    buildGitRepoUrl(this.formData().repository, this.formData().branch, this.formData().scriptType === sourceTypesEnum.Tag ?
      this.formData().tag :
      this.formData().scriptType === sourceTypesEnum.VersionNum ?
        this.formData().version_num :
        undefined
    )
  );


  protected scriptTypeOptions = [
    {
      value: sourceTypesEnum.VersionNum,
      label: 'Commit Id'
    },
    {
      value: sourceTypesEnum.Tag,
      label: 'Tag name'
    },
    {
      value: sourceTypesEnum.Branch,
      label: 'Last Commit In Branch'
    },
  ];

  protected readonly scriptPlaceHolders = {
    [sourceTypesEnum.VersionNum]: 'Insert commit id',
    [sourceTypesEnum.Tag]       : 'Insert tag name',
    [sourceTypesEnum.Branch]    : 'Insert branch name',
  };

  protected readonly flagNameMap = {
    [sourceTypesEnum.VersionNum]: 'COMMIT ID',
    [sourceTypesEnum.Tag]       : 'TAG NAME',
    [sourceTypesEnum.Branch]    : 'BRANCH NAME'
  };

  protected readonly binaryValidationRegexp = /(^python.*)|(^sh$)|(^bash$)|(^zsh$)/;
  private onChange: (val: Partial<IExecutionForm['source']>) => void;
  private onTouched: () => void;
  private originalData: IExecutionForm['source'];

  constructor() {
    this.sourceCodeForm.valueChanges
      .pipe(
        takeUntilDestroyed(),
        debounceTime(300)
      )
      .subscribe(() => {
        if (this.editable()) {
          this.onChange?.(this.sourceCodeForm.value);
          this.onTouched?.();
        }
      });

    this.sourceCodeForm.controls.repository.valueChanges
      .pipe(
        takeUntilDestroyed(),
        startWith(this.sourceCodeForm.controls.repository.value),
        map(value => value.length > 0),
        pairwise(),
        filter(([hasRepo, hadRepo]) => hasRepo !== hadRepo)
      )
      .subscribe(() => {
        this.setValidators();
      });

    this.sourceCodeForm.controls.scriptType.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.setValidators();
      });
  }

  private setValidators() {
    const selected = this.sourceCodeForm.controls.scriptType.value;
    const repo = this.sourceCodeForm.controls.repository.value;
    [sourceTypesEnum.Tag, sourceTypesEnum.Branch, sourceTypesEnum.VersionNum]
      .forEach(type => {
        if (repo?.length > 0 && type === selected) {
          this.sourceCodeForm.controls[type].setValidators([Validators.required]);
        } else {
          this.sourceCodeForm.controls[type].setValidators([]);
        }
        this.sourceCodeForm.controls[type].updateValueAndValidity();
      });
  }

  resetOtherScriptParameters(sourceType: sourceTypesEnum) {
    [sourceTypesEnum.Tag, sourceTypesEnum.Branch, sourceTypesEnum.VersionNum]
      .filter(type => type !== sourceType)
      .forEach(type => {
        this.sourceCodeForm.controls[type].setValue('');
      });

    this.setValidators();
  }

  registerOnChange(fn: () => void) {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  writeValue(data: IExecutionForm['source']) {
    this.originalData = data;
    if (data) {
      this.sourceCodeForm.patchValue(data, {emitEvent: false});
      this.repoData.set(buildGitRepoUrl(data.repository, data.branch, data.scriptType === sourceTypesEnum.Tag ?
        data.tag :
        data.scriptType === sourceTypesEnum.VersionNum ?
          data.version_num :
          undefined
      ));
    }
    this.setValidators();
  }

  cancel() {
    this.writeValue(this.originalData)
  }
}
