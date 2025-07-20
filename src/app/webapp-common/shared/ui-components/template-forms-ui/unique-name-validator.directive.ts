import {Directive, input } from '@angular/core';
import {AbstractControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn} from '@angular/forms';

export const uniqueNameValidator = (names, forbiddenPrefix?, valuePrefix?): ValidatorFn =>
  (control: AbstractControl): { [key: string]: any } | null => {
    const originValue = control.value?.label || control.value?.name || control.value;
    let value = originValue ? originValue.trim() : originValue;
    if (value?.length === 0 && originValue?.length > 0) {
      return {emptyName: value.length === 0};
    }
    if (valuePrefix) {
      value = valuePrefix + value;
    }
    const forbidden = names.includes(forbiddenPrefix ? forbiddenPrefix + value : value);
    return forbidden ? {uniqueName: {value: control.value}} : null;
  };

@Directive({
  selector: '[smUniqueNameValidator]',
  providers: [{provide: NG_VALIDATORS, useExisting: UniqueNameValidatorDirective, multi: true}],
  standalone: true
})
export class UniqueNameValidatorDirective implements Validator {
  existingNames = input<string[]>();
  forbiddenPrefix = input<string>();
  valuePrefix = input<string>();

  validate(control: AbstractControl): ValidationErrors | null {
    return this.existingNames() ? uniqueNameValidator(this.existingNames()!, this.forbiddenPrefix(), this.valuePrefix())(control) : null;
  }
}


