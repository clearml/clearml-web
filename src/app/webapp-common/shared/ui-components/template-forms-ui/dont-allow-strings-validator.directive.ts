import {Directive, Input} from '@angular/core';
import {AbstractControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn} from '@angular/forms';

@Directive({
  selector : '[smNotAllowedStringsValidator]',
  providers: [{provide: NG_VALIDATORS, useExisting: NotAllowedStringsValidatorValidatorDirective, multi: true}],
})
export class NotAllowedStringsValidatorValidatorDirective implements Validator {
  @Input() smNotAllowedStringsValidator: string[];

  validate(control: AbstractControl): ValidationErrors | null {
    return this.smNotAllowedStringsValidator ? dontAllowStringsValidator(this.smNotAllowedStringsValidator)(control) : null;
  }
}

export function dontAllowStringsValidator(notAllowedStrings): ValidatorFn {
  return (control: AbstractControl): Record<string, any> | null => {
    const forbidden = control.value && notAllowedStrings.some(el => control.value.includes(el));
    return forbidden ? {'smNotAllowedStringsValidator': {value: control.value}} : null;
  };
}
