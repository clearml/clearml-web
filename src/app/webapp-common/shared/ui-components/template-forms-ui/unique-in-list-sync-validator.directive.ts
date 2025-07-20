import {Directive, Input} from '@angular/core';
import {AbstractControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn} from '@angular/forms';

@Directive({
  selector : '[smUniqueInListSyncValidator]',
  providers: [{provide: NG_VALIDATORS, useExisting: UniqueInListSyncValidatorDirective, multi: true}],
})
export class UniqueInListSyncValidatorDirective implements Validator {
  @Input() prefix: string;

  validate(control: AbstractControl): ValidationErrors | null {
    return uniqueInListValidator(this.prefix)(control);
  }
}

export function uniqueInListValidator(prefix: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const existingNames = control.value.map(c => c[prefix]?.value ?? c[prefix]).filter(c => c);
    const forbidden = hasDuplicates(existingNames);
    return existingNames && forbidden ? {[`uniqueName-${prefix}`]: duplicatesMap(existingNames)} : null;
  };
}

export function hasDuplicates(array) {
  return (new Set(array)).size !== array.length;
}

export function duplicatesMap(existingNames) {
  return existingNames.map(name => (name || name === 0) && existingNames.filter(value => value === name).length > 1);
}
