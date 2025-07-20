import {Directive, Input} from '@angular/core';
import {AbstractControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn} from '@angular/forms';

@Directive({
  selector : '[smForceInvalidValidator]',
  providers: [{provide: NG_VALIDATORS, useExisting: ForceInvalidValidatorDirective, multi: true}],
})
export class ForceInvalidValidatorDirective implements Validator {
  @Input() forceInvalid: boolean;

  validate(control: AbstractControl): ValidationErrors | null {
    return this.forceInvalid ? forceInvalidValidator(this.forceInvalid)(control) : null;
  }
}


export function forceInvalidValidator(forceInvalid): ValidatorFn {
  return (control: AbstractControl): Record<string, any> | null => {
    const forbidden = forceInvalid;
    return forbidden ? {'forceInvalid': {value: control.value}} : null;
  };
}



