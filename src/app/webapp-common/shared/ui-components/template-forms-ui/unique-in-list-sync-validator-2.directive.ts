import {Directive, Input} from '@angular/core';
import {AbstractControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn} from '@angular/forms';

@Directive({
  selector : '[smUniqueInListSyncValidator2]',
  providers: [{provide: NG_VALIDATORS, useExisting: UniqueInListSync2ValidatorDirective, multi: true}],
  })
export class UniqueInListSync2ValidatorDirective implements Validator {
  @Input() prefix2: string;

  validate(control: AbstractControl): ValidationErrors | null {
    const existingNames = Object.keys(control.value).filter(key => key.startsWith(this.prefix2)).map(key => control.value[key]);
    return existingNames ? uniqueNameValidator(existingNames)(control) : null;
  }
}

export function uniqueNameValidator(existingNames): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const forbidden = hasDuplicates(existingNames);
    return forbidden ? {'uniqueName2': duplicatesMap(existingNames)} : null;
  };
}

export function hasDuplicates(array) {
  return (new Set(array)).size !== array.length;
}

export function duplicatesMap(existingNames) {
  return existingNames.map(name => (name || name === 0) && existingNames.filter(value => value === name).length > 1);
}
