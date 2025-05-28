import {
  Component,
  input,
  inject,
  forwardRef,
  ChangeDetectionStrategy
} from '@angular/core';
import {ControlValueAccessor, FormBuilder, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {IExecutionForm, sourceTypesEnum} from '~/features/experiments/shared/experiment-execution.model';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {debounceTime, filter, map, startWith} from 'rxjs/operators';
import {pairwise} from 'rxjs';

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
    standalone: false
})
export class ExperimentExecutionSourceCodeComponent implements ControlValueAccessor {
  private formBuilder = inject(FormBuilder);

  editable = input<boolean>();

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

  readonly sourceTypesEnum = sourceTypesEnum;

  scriptTypeOptions = [
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

  scriptPlaceHolders = {
    [sourceTypesEnum.VersionNum]: 'Insert commit id',
    [sourceTypesEnum.Tag]       : 'Insert tag name',
    [sourceTypesEnum.Branch]    : 'Insert branch name',
  };

  flagNameMap = {
    [sourceTypesEnum.VersionNum]: 'COMMIT ID',
    [sourceTypesEnum.Tag]       : 'TAG NAME',
    [sourceTypesEnum.Branch]    : 'BRANCH NAME'
  };

  binaryValidationRegexp = /(^python.*)|(^sh$)|(^bash$)|(^zsh$)/;
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
    this.sourceCodeForm.patchValue(data, {emitEvent: false});
    this.setValidators();
  }

  cancel() {
    this.writeValue(this.originalData)
  }
}
