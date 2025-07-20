import {
  ChangeDetectionStrategy,
  Component, computed, effect,
  ElementRef,
  EventEmitter,
  forwardRef, input,
  Output, signal, viewChild
} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule} from '@angular/forms';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {fromEvent, switchMap} from 'rxjs';
import {filter} from 'rxjs/operators';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger, MatOption
} from '@angular/material/autocomplete';
import {MatChipGrid, MatChipInput, MatChipInputEvent} from '@angular/material/chips';
import {MatFormField, MatSuffix} from '@angular/material/form-field';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {ChipsComponent} from '@common/shared/ui-components/buttons/chips/chips.component';
import {takeUntilDestroyed, toObservable, toSignal} from '@angular/core/rxjs-interop';
import {MatOptionSelectionChange} from '@angular/material/core';
import {computedPrevious} from 'ngxtension/computed-previous';
import {isEqual} from 'lodash-es';


export interface IOption {
  label: string;
  value: string;
}

@Component({
  selector: 'sm-select-autocomplete-with-chips',
  templateUrl: './select-autocomplete-with-chips.component.html',
  styleUrls: ['./select-autocomplete-with-chips.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectAutocompleteWithChipsComponent),
      multi: true
    }
  ],
  imports: [
    ClickStopPropagationDirective,
    ChipsComponent,
    ReactiveFormsModule,
    MatAutocompleteTrigger,
    MatAutocomplete,
    MatChipGrid,
    MatChipInput,
    MatOption,
    MatFormField,
    MatSuffix
  ]
})

export class SelectAutocompleteWithChipsComponent implements ControlValueAccessor {

  onChange: (any) => void;
  onTouched: () => void;

  separatorKeysCodes: number[] = [ENTER, COMMA];
  public chipCtrl = new FormControl<string | null>(null);
  protected selected = signal<IOption[]>(null);
  private prevSelected = computedPrevious(this.selected);


  multiple = input(true);
  appearance = input<'outline' | 'fill'>('outline');
  name = input<string>();
  formFieldClass = input<string>();
  disabled = input(false);
  clearable = input(true);
  placeholder = input('');
  allowAddingOptions = input(false);
  autofocus = input(false);
  items = input<IOption[]>([]);
  focusIt = input<boolean>();

  protected autocompleteInput = viewChild<ElementRef<HTMLInputElement>>('autocompleteInput');
  autocomplete = viewChild(MatAutocompleteTrigger);

  protected valueChanged = toSignal(this.chipCtrl.valueChanges);
  protected safeItems = computed(() => this.items() ? Array.isArray(this.items()) ? this.items() : [this.items()] as unknown as IOption[] : []);
  protected loading = computed(() => !this.items());
  protected isNewName$ = computed(() => {
    if (this.valueChanged() && typeof this.valueChanged() !== 'object') {
      const value = this.valueChanged();
      const itemsLabels = this.safeItems()?.map(item => item.label) as string[] ?? [];
      const selectedLabels = this.selected()?.map(item => item.label) as string[] ?? [];
      return !itemsLabels.includes(value) && !selectedLabels.includes(value);
    } else {
      return false;
    }
  });

  protected filteredItems = computed(() => {
    const value = this.valueChanged();
    const currLabels = this.selected()?.map(item => item.label) as string[] || [];
    if (this.valueChanged() && typeof this.valueChanged() !== 'object') {
      const filterValue = value?.toLowerCase();
      return this.safeItems().filter(item =>
        item.label?.toLowerCase().includes(filterValue) && !currLabels.includes(item.label)
      );
    } else {
      return this.safeItems().filter(item => !currLabels.includes(item.label));
    }
  });
  private init = false;

  constructor() {
    effect(() => {
      const selection = this.selected();
      if (this.init && !isEqual(this.selected(), this.prevSelected())) {
        if (this.onChange) {
          this.onChange(selection);
        }
        if (this.onTouched) {
          this.onTouched();
        }
      }
    });

    effect(() => {
      if (this.items()) {
        this.chipCtrl.setValue(null);
      }
    });

    effect(() => {
      if (this.disabled()) {
        this.chipCtrl.disable();
      } else {
        this.chipCtrl.enable();
      }
    });

    effect(() => {
      if (this.focusIt() && this.autofocus() && this.autocompleteInput()) {
        setTimeout(() => this.autocompleteInput().nativeElement.focus(), 50);
      }
    });

    toObservable(this.autocompleteInput)
      .pipe(
        takeUntilDestroyed(),
        filter(comp => !!comp?.nativeElement),
        switchMap(comp => fromEvent(comp.nativeElement, 'keydown'))
      )
      .subscribe((keyDown: KeyboardEvent) => {
        if (keyDown.key === 'Backspace' && (keyDown.target as HTMLInputElement).value === '') {
          this.removeLastChip();
        }

        if (this.autocomplete().panelOpen) {
          keyDown.stopPropagation();
        }
      });
  }

  @Output() customOptionAdded = new EventEmitter<IOption>();

  displayFn(item: { label: string } | string): string {
    return typeof item === 'string' ? item : item?.label;
  }

  remove(item: IOption) {
    this.selected.update(selected => selected.filter(chip => chip.value !== item.value));
    this.chipCtrl.setValue(null);
    this.autocompleteInput().nativeElement.value = '';
  }

  clear() {
    this.chipCtrl.setValue(null);
    this.selected.set(null);
    this.autocompleteInput().nativeElement.value = '';
  }


  add(event: MatChipInputEvent) {
    const value = (event.value || '').trim();
    const selectedOption = this.selected()?.find(option => option.value === value);
    if (!this.allowAddingOptions() || this.multiple() && selectedOption) {
      return;
    }
    if (value) {
      let option = this.safeItems().find(option => option.value === value);
      if (!option) {
        option = {value, label: value};
        this.customOptionAdded.emit(option);
      }
      this.selected.update(selected => this.multiple() ? (selected ?? []).concat(option) : [option]);
      this.chipCtrl.setValue(null);
    }
    if (event.chipInput) {
      event.chipInput!.clear();
    }
    this.autocompleteInput().nativeElement.value = '';
  }

  optionSelected(event: MatAutocompleteSelectedEvent) {
    const value = event.option.value;
    // this.value = this.multiple ? this.val.concat([value]) : [value];
    const option = this.safeItems().find(option => option.value === value);
    if (option) {
      this.selected.update(selected => this.multiple() ? (selected ?? []).concat(option) : [option]);
    }
    this.chipCtrl.setValue(null);
    this.autocompleteInput().nativeElement.value = '';
  }

  removeLastChip() {
    this.selected.update(selected => selected.slice(0, selected.length - 1));
  }

  openDropdown() {
    if (this.autocomplete().panelOpen) {
      this.autocomplete().closePanel();
    } else {
      this.autocomplete().openPanel();
    }
  }

  writeValue(val: IOption[] | IOption) {
    if (val) {
      this.init = false;
      this.selected.set(Array.isArray(val) ? val : [val]);
    }
    window.setTimeout(() => this.init = true, 50);
  }

  registerOnChange(fn: () => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean) {
    if (isDisabled) {
      this.chipCtrl.disable();
    } else {
      this.chipCtrl.enable();
    }
  }

  addOption($event: MatOptionSelectionChange<string>) {
    this.add({
      input: undefined,
      value: $event.source.value,
      chipInput: undefined
    });
  }
}
