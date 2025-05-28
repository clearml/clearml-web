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
import {MatInputModule} from '@angular/material/input';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {ClickStopPropagationDirective} from '@common/shared/ui-components/directives/click-stop-propagation.directive';
import {SearchTextDirective} from '@common/shared/ui-components/directives/searchText.directive';
import {DotsLoadMoreComponent} from '@common/shared/ui-components/indicators/dots-load-more/dots-load-more.component';
import {rootProjectsPageSize} from '@common/constants';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {uniqueNameValidator} from '@common/shared/ui-components/template-forms-ui/unique-name-validator.directive';

export interface baseEntity {
  id?: string;
  name?: string;
}

@Component({
    selector: 'sm-paginated-entity-selector',
    templateUrl: './paginated-entity-selector.component.html',
    styleUrls: ['./paginated-entity-selector.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => PaginatedEntitySelectorComponent),
            multi: true
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => PaginatedEntitySelectorComponent),
            multi: true
        }
    ],
    imports: [
        MatInputModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
        ClickStopPropagationDirective,
        SearchTextDirective,
        MatProgressSpinner,
        DotsLoadMoreComponent,
    ]
})
export class PaginatedEntitySelectorComponent implements ControlValueAccessor, Validator {
  protected control = new FormControl<string>(null);
  protected noMoreOptions: boolean;
  protected disabled: boolean;
  protected error: string = null;
  private previousLength: number;
  data = input<baseEntity[]>([]);
  displayField = input('name');
  label = input();
  placeHolder = input('');
  createNewSuffix = input<boolean>(false);
  isRequired = input<boolean>(false);
  minLength = input<number>();
  emptyNameValidator = input<boolean>();
  embeddedErrors = input<boolean>(false);


  getEntities = output<string>();
  loadMore = output<string>();
  createNewSelected = output<string>();
  protected onTouched: () => void;
  private onChange: (value) => void;
  private onValidation: (value) => void;
  protected state = computed(() => ({
    data: this.data(),
    loading: signal(false),
  }))

  constructor() {
    this.control.valueChanges.pipe(takeUntilDestroyed()).subscribe(value => {
      this.onChange && this.onChange(value);
      this.onValidation && this.onValidation(value);
    });

    effect(() => {
      if (this.data()) {
        const length = this.data().length;
        this.noMoreOptions = length === this.previousLength || length < rootProjectsPageSize;
        this.previousLength = length;
      }
    });

    effect(() => {
      if(this.isRequired()) {
        this.control.addValidators([Validators.required]);
      } else {
        this.control.removeValidators([Validators.required]);
      }
      if(this.minLength()) {
        this.control.addValidators([Validators.minLength(this.minLength())]);
      } else {
        this.control.removeValidators([Validators.minLength(this.minLength())]);
      }
      if(this.emptyNameValidator()) {
        this.control.addValidators([uniqueNameValidator([])]);
      } else {
        this.control.removeValidators([uniqueNameValidator([])]);
      }
      this.control.updateValueAndValidity();
    });
  }

  displayFn(item: string | baseEntity): string {
    if (this.displayField() !== 'name') {
      return this.data()?.find(i => i.name === item)?.[this.displayField()] ?? item;
    }
    return typeof item === 'string' ? item : item?.name;
  }

  getEntitiesFn(value: string) {
    this.state().loading.set(true);
    this.getEntities.emit(value);
  }

  loadMoreEntities(value: string) {
    this.state().loading.set(true);
    this.loadMore.emit(value);
  }

  writeValue(value: string) {
    this.control.patchValue(value, {emitEvent: false});
  }

  registerOnChange(fn: () => void) {
    this.onChange = fn
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean) {
    if (isDisabled) {
      this.control.disable()
    } else {
      this.control.enable();
    }
  }

  validate(/*control: AbstractControl*/): ValidationErrors | null {
    return this.isRequired() && !this.control.value ? {required: true} :
      (this.minLength() && this.control.value.length< this.minLength() ? { minlength: true} :
      (this.emptyNameValidator() && this.control.value?.length > 0 && this.control.value.trim().length === 0 ? { emptyName: true}
        : null));
  }

  registerOnValidatorChange(fn) {
    this.onValidation = fn
  }
}
