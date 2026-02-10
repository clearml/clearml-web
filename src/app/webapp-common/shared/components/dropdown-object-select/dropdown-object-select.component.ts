import {ChangeDetectionStrategy, Component, computed, effect, forwardRef, input, output, signal} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  Validators
} from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule, MatLabel} from '@angular/material/input';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {SearchTextDirective} from '@common/shared/ui-components/directives/searchText.directive';
import {DotsLoadMoreComponent} from '@common/shared/ui-components/indicators/dots-load-more/dots-load-more.component';
import {rootProjectsPageSize} from '@common/constants';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {uniqueNameValidator} from '@common/shared/ui-components/template-forms-ui/unique-name-validator.directive';
import {MatIconButton} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {minLengthTrimmed} from '@common/shared/validators/minLengthTrimmed';
import {NgComponentOutlet} from '@angular/common';
import {MultiLineTooltipComponent} from '@common/shared/components/multi-line-tooltip/multi-line-tooltip.component';
import {SaferPipe} from '@common/shared/pipes/safe.pipe';
import {explicitEffect} from 'ngxtension/explicit-effect';
import {ClipboardModule} from 'ngx-clipboard';
import {CopyClipboardComponent} from "@common/shared/ui-components/indicators/copy-clipboard/copy-clipboard.component";

export interface baseEntity {
  value?: string;
  label?: string;
}

@Component({
  selector: 'sm-dropdown-object-select',
  templateUrl: './dropdown-object-select.component.html',
  styleUrls: ['./dropdown-object-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DropdownObjectSelectComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DropdownObjectSelectComponent),
      multi: true
    }
  ],
  imports: [
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    SearchTextDirective,
    MatProgressSpinner,
    DotsLoadMoreComponent,
    MatIconButton,
    MatIconModule,
    MatLabel,
    NgComponentOutlet,
    MultiLineTooltipComponent,
    SaferPipe,
    ClipboardModule,
    CopyClipboardComponent
  ]
})
export class DropdownObjectSelectComponent implements ControlValueAccessor, Validator {
  public control = new FormControl<baseEntity>(null);
  protected noMoreOptions: boolean;
  protected error: string = null;
  protected previousLength: number;
  private firstTimeData = true;
  data = input<any[]>(null);
  displayField = input<string | string[]>('label');
  valueField = input<string>('name');
  label = input<string>();
  info = input<string>();
  configurationInfo = input<string>();
  placeHolder = input('');
  createNewSuffix = input<boolean>(false);
  isRequired = input<boolean>(false);
  minLength = input<number>();
  emptyNameValidator = input<boolean>();
  embeddedErrors = input<boolean>(false);
  pageSize = input<number>(rootProjectsPageSize);
  compRef = input<any>();
  panelWidth = input<string>('auto');

  getEntities = output<baseEntity>();
  loadMore = output<baseEntity>();
  createNewSelected = output<baseEntity>();
  autocompleteOpened = output();
  autocompleteClosed = output();
  copied = output();
  protected onTouched: () => void;
  private onChange: (value) => void;
  private onValidation: (value) => void;
  protected state = computed(() => ({
    data: this.data(),
    loading: signal(false)
  }));

  constructor() {
    this.control.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(value => {
        let displayField;
        if (typeof value !== 'string') {
          displayField = typeof this.displayField() === 'string' ? (this.displayField() as string) : (this.displayField() as string[]).find(field => value?.[field] !== undefined);
        }
        this.onChange && this.onChange(typeof value === 'string' ? {label: value} : value);
        this.onValidation && this.onValidation(typeof value === 'string' ? value : value?.[displayField]);
      });


    explicitEffect([this.data], ([data]) => {
      if (data) {
        const length = data.length;
        this.noMoreOptions = length === this.previousLength || length < this.pageSize();
        this.previousLength = length;

        this.onValidation('check if string in options');

        if (this.firstTimeData && this.control.value && data[0] && data[0][this.valueField()] === this.control.value.value) {
          this.firstTimeData = false;
          this.writeValue(data[0]);
          this.onChange(data[0]);
        }
      }
    })

    effect(() => {
      if (this.isRequired()) {
        this.control.addValidators([Validators.required]);
      } else {
        this.control.removeValidators([Validators.required]);
      }
      if (this.minLength()) {
        this.control.addValidators([minLengthTrimmed(this.minLength())]);
      } else {
        this.control.removeValidators([minLengthTrimmed(this.minLength())]);
      }
      if (this.emptyNameValidator()) {
        this.control.addValidators([uniqueNameValidator([])]);
      } else {
        this.control.removeValidators([uniqueNameValidator([])]);
      }
      this.control.updateValueAndValidity();
    });
  }

  displayFn(item: string | baseEntity): string {
    const displayField = typeof this.displayField() === 'string' ? (this.displayField() as string) : (this.displayField() as string[]).find(field => item?.[field]);
    return typeof item === 'string' ? item : item?.[displayField] !== undefined ? item[displayField] : item?.label;
  }

  getEntitiesFn(value: baseEntity) {
    this.state().loading.set(true);
    this.previousLength = 0;
    this.getEntities.emit(value);
  }

  loadMoreEntities(value: baseEntity) {
    if (!this.state().loading()) {
      this.state().loading.set(true);
      this.loadMore.emit(value);
    }
  }

  writeValue(value: baseEntity) {
    this.control.patchValue(typeof value === 'string' ? {label: value, value} : value, {emitEvent: false});
  }

  registerOnChange(fn: () => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean) {
    if (isDisabled) {
      this.control.disable();
    } else {
      this.control.enable();
    }
  }

  validate(/*control: AbstractControl*/): ValidationErrors | null {
    const displayField = typeof this.displayField() === 'string' ? (this.displayField() as string) : (this.displayField() as string[]).find(field => this.control.value?.[field] !== undefined);

    const valueIsInNotOptions = !this.createNewSuffix() && typeof this.control.value === 'string' && !this.data()?.find(option => option[this.valueField()] === this.control.value);
    if (valueIsInNotOptions) {
      this.control.setErrors({invalid: valueIsInNotOptions});
    } else if (typeof this.control.value === 'string' && (this.control.value as string).length > 0){
      this.control.setErrors(null);
    }

    return this.isRequired() && !this.control.value ? {required: true} :
      (this.minLength() && this.control.value?.[displayField]?.length < this.minLength() ? {minlength: true} :
        (this.emptyNameValidator() && this.control.value?.[displayField]?.length > 0 && this.control.value?.[displayField]?.trim().length === 0 ? {emptyName: true} :
          (valueIsInNotOptions ?
            {invalid: true} : null)));
  }

  registerOnValidatorChange(fn) {
    this.onValidation = fn;
  }

  opened() {
    setTimeout(() => this.autocompleteOpened.emit(), 100);
  }

}
