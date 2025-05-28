import {
  ChangeDetectionStrategy,
  Component, computed, effect,
  EventEmitter,
  forwardRef,
  input,
  Output,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule, ValidationErrors, Validator
} from '@angular/forms';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatOptionSelectionChange} from '@angular/material/core';
import {MatInputModule} from '@angular/material/input';
import {toSignal} from '@angular/core/rxjs-interop';


export interface IOption {
  label: string;
  value: string;
  tooltip?: string;
}

@Component({
    selector: 'sm-select-autocomplete-for-template-forms',
    templateUrl: './select-autocomplete-for-template-forms.component.html',
    styleUrls: ['./select-autocomplete-for-template-forms.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatInputModule,
        MatAutocompleteModule,
        ReactiveFormsModule
    ],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => SelectAutocompleteForTemplateFormsComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => SelectAutocompleteForTemplateFormsComponent),
            multi: true
        }
    ]
})

export class SelectAutocompleteForTemplateFormsComponent implements ControlValueAccessor, Validator  {
  public loading = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  filterText = '';
  isNewName = false;
  onChange: (any) => void;
  onTouch: () => void;
  onValidate: (any) => void;

  protected control = new FormControl();

  errorMsg = input<string>();
  multiple = input(true);
  name = input<string>();
  formFieldClass = input<string>();
  appearance = input<'outline' | 'fill'>('outline');
  items = input<{ label: string; value: string }[]>();
  clearable = input(true);
  placeholder = input('');
  optionAddable = input(false);
  autofocus = input(false);
  focusIt = input(false);
  shouldFocus = computed(() => this.autofocus() === true && this.focusIt())
  value = toSignal(this.control.valueChanges);
  filteredItems = computed(() => {
    const value = this.value();
    if (value !== undefined && value !== null) {
      return this._filter(typeof value === 'string' ? value : value.label);
    }
    return this.items();
  });

  constructor() {
    effect(() => {
      if(this.items()) {
        this.loading = false;
      }
    });
    effect(() => {
      const value = this.value();
      this.onChange && this.onChange(this.control.value);
      this.onTouch && this.onTouch();
      this.onValidate && this.onValidate(this.value());
    });
  }

  @Output() customOptionAdded = new EventEmitter();

  private _filter(value: string) {
    this.filterText = value;
    const itemsLabels = this.items().map(item => item.label);
    this.isNewName = !itemsLabels.includes(value);
    const filterValue = value?.toLowerCase();
    return this.items().filter((item: any) => item.label?.toLowerCase().includes(filterValue));
  }

  displayFn(item: any): string {
    return item && item.label ? item.label : item;
  }


  customOptionSelected($event: MatOptionSelectionChange) {
    this.customOptionAdded.emit($event.source.value.label);
  }

  registerOnChange(fn: (any) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouch = fn;
  }

  writeValue(value) {
    this.control.patchValue(value, {emitEvent: false});
  }

  setDisabledState?(isDisabled: boolean) {
    isDisabled ? this.control.disable() : this.control.enable();
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidate = fn;
  }

  validate(): ValidationErrors | null {
    return this.control.errors;
  }
}
